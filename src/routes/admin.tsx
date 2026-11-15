import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, BookOpen, CheckCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ALL_CATEGORIES, mergeBooksWithCatalog, type CatalogBook } from "@/data/booksCatalog";
import { daysUntil, formatDate, useSession } from "@/lib/session";
import {
  fetchMergedIssues,
  executeReturnBook,
  executeIssueBook,
  normalizeIsbn,
  type IssueRecord,
} from "@/lib/circulationStorage";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Librarian dashboard — Smart-Shelf Library" },
      {
        name: "description",
        content: "Manage the Smart-Shelf inventory: add or remove books, review issued and overdue loans, and see member statistics.",
      },
      { property: "og:title", content: "Librarian dashboard — Smart-Shelf Library" },
      { property: "og:description", content: "Inventory, loans, overdue tracking, and member management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, role, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const isLibrarian = role === "librarian";

  const { data: rawBooks = [] } = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from("books").select("*").order("title");
        if (error) {
          console.warn("Could not load remote books in admin:", error.message);
          return [];
        }
        return data || [];
      } catch (e) {
        console.warn("Books query error in admin:", e);
        return [];
      }
    },
  });

  const books = useMemo(() => mergeBooksWithCatalog(rawBooks), [rawBooks]);

  const { data: issues = [] } = useQuery<IssueRecord[]>({
    queryKey: ["all-issues"],
    enabled: isLibrarian,
    queryFn: async () => {
      try {
        return await fetchMergedIssues(undefined, true);
      } catch (e) {
        console.warn("fetchMergedIssues error in admin:", e);
        return [];
      }
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["members"],
    enabled: isLibrarian,
    queryFn: async () => {
      try {
        const [{ data: profiles, error }, { data: roles }] = await Promise.all([
          supabase.from("profiles").select("id, full_name, email, created_at").order("created_at"),
          supabase.from("user_roles").select("user_id, role"),
        ]);
        if (error) {
          console.warn("Could not fetch members:", error.message);
          return [];
        }
        return (profiles ?? []).map((p) => ({
          ...p,
          role: (roles ?? []).find((r) => r.user_id === p.id)?.role ?? "student",
        }));
      } catch (e) {
        console.warn("Members query error:", e);
        return [];
      }
    },
  });

  const [form, setForm] = useState({
    title: "",
    author: "",
    category: "",
    isbn: "",
    cover_url: "",
    description: "",
    total_copies: "1",
  });

  const [manualIssue, setManualIssue] = useState({
    bookId: "",
    memberId: "",
  });

  const addBook = useMutation({
    mutationFn: async () => {
      const copies = Math.max(1, Number(form.total_copies) || 1);
      const cleanIsbn = normalizeIsbn(form.isbn);
      const autoCover = form.cover_url || (cleanIsbn ? `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg` : null);

      const { error } = await supabase.from("books").insert({
        title: form.title.trim(),
        author: form.author.trim(),
        category: form.category.trim() || "General",
        isbn: cleanIsbn,
        cover_url: autoCover,
        description: form.description ? form.description.trim() : null,
        total_copies: copies,
        available_copies: copies,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Book added to the shelf.");
      setForm({ title: "", author: "", category: "", isbn: "", cover_url: "", description: "", total_copies: "1" });
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const issueToMemberMutation = useMutation({
    mutationFn: async () => {
      if (!manualIssue.bookId || !manualIssue.memberId) {
        throw new Error("Please select both a book and a member.");
      }
      const targetBook = books.find((b) => b.id === manualIssue.bookId);
      if (!targetBook) throw new Error("Selected book not found.");

      const targetMember = members.find((m) => m.id === manualIssue.memberId);
      if (!targetMember) throw new Error("Selected member not found.");

      await executeIssueBook(targetBook, {
        id: targetMember.id,
        email: targetMember.email,
        full_name: targetMember.full_name,
      });
    },
    onSuccess: () => {
      toast.success("Book issued to member successfully.");
      setManualIssue({ bookId: "", memberId: "" });
      queryClient.invalidateQueries({ queryKey: ["all-issues"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeBook = useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith("local-")) return;
      const { error } = await supabase.from("books").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Book removed.");
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["all-issues"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const forceReturn = useMutation({
    mutationFn: async ({ id, bookId }: { id: string; bookId?: string }) => {
      await executeReturnBook(id, bookId);
    },
    onSuccess: () => {
      toast.success("Marked as returned.");
      queryClient.invalidateQueries({ queryKey: ["all-issues"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!loading && user && !isLibrarian) {
    return (
      <div className="min-h-screen">
        <SiteNav />
        <main className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-3xl font-semibold">Librarians only</h1>
          <p className="mt-3 text-muted-foreground">
            This dashboard is restricted to librarian accounts. Register with the librarian role to access it.
          </p>
        </main>
      </div>
    );
  }

  const activeIssues = issues.filter((i) => i.status === "issued");
  const overdueIssues = activeIssues.filter((i) => daysUntil(i.due_date) < 0);
  const totalCopies = books.reduce((s, b) => s + b.total_copies, 0);
  const availableCopies = books.reduce((s, b) => s + b.available_copies, 0);
  const memberName = (id: string) => {
    const m = members.find((x) => x.id === id);
    return m?.full_name || m?.email || "Member";
  };

  const stats = [
    { label: "Titles", value: books.length },
    { label: "Copies on shelf", value: `${availableCopies}/${totalCopies}` },
    { label: "Issued now", value: activeIssues.length },
    { label: "Overdue", value: overdueIssues.length },
    { label: "Members", value: members.length },
  ];

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-semibold md:text-4xl">Librarian dashboard</h1>
        <p className="mt-2 text-muted-foreground">Inventory, circulation, and members at a glance.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((s) => (
            <Card key={s.label} className="surface-paper">
              <CardContent className="pt-6">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="font-display text-2xl font-semibold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="inventory" className="mt-10">
          <TabsList>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="loans">Loans ({activeIssues.length})</TabsTrigger>
            <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="mt-6 space-y-8">
            <Card className="surface-paper">
              <CardHeader>
                <CardTitle className="font-display text-xl">Add a book</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-4 md:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addBook.mutate();
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      required
                      placeholder="e.g. Thinking, Fast and Slow"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      required
                      placeholder="e.g. Daniel Kahneman"
                      value={form.author}
                      onChange={(e) => setForm({ ...form, author: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      list="category-options"
                      placeholder="e.g. Psychology"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    />
                    <datalist id="category-options">
                      {ALL_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      placeholder="e.g. 9780374533557"
                      value={form.isbn}
                      onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cover_url">Cover Image URL (optional)</Label>
                    <Input
                      id="cover_url"
                      placeholder="Leave blank to auto-fetch from Open Library"
                      value={form.cover_url}
                      onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="copies">Total copies</Label>
                    <Input
                      id="copies"
                      type="number"
                      min={1}
                      value={form.total_copies}
                      onChange={(e) => setForm({ ...form, total_copies: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      rows={3}
                      placeholder="Overview or summary of the book..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" disabled={addBook.isPending}>
                      Add to catalog
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="surface-paper overflow-x-auto rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>ISBN</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead className="text-right">Remove</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {b.cover_url ? (
                            <img
                              src={b.cover_url}
                              alt={b.title}
                              className="h-12 w-9 rounded object-cover shadow-sm bg-muted flex-shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-12 w-9 items-center justify-center rounded bg-primary/10 text-primary flex-shrink-0">
                              <BookOpen className="size-4" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{b.title}</p>
                            <p className="text-xs text-muted-foreground">{b.author}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{b.category}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{b.isbn || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={b.available_copies > 0 ? "outline" : "destructive"}>
                          {b.available_copies}/{b.total_copies} available
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Remove ${b.title}`}
                          onClick={() => removeBook.mutate(b.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="loans" className="mt-6 space-y-6">
            <Card className="surface-paper">
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <Send className="size-5" /> Issue Book to Member
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-4 md:grid-cols-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    issueToMemberMutation.mutate();
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="issue-book">Select Book</Label>
                    <select
                      id="issue-book"
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={manualIssue.bookId}
                      onChange={(e) => setManualIssue({ ...manualIssue, bookId: e.target.value })}
                    >
                      <option value="">-- Choose a book --</option>
                      {books.map((b) => (
                        <option key={b.id} value={b.id} disabled={b.available_copies < 1}>
                          {b.title} ({b.author}) — {b.available_copies} available
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issue-member">Select Member</Label>
                    <select
                      id="issue-member"
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={manualIssue.memberId}
                      onChange={(e) => setManualIssue({ ...manualIssue, memberId: e.target.value })}
                    >
                      <option value="">-- Choose a member --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name || m.email} ({m.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full" disabled={issueToMemberMutation.isPending}>
                      Issue Book (14 Days)
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="surface-paper overflow-x-auto rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground text-center py-8">
                        No loans recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    issues.map((i) => {
                      const left = daysUntil(i.due_date);
                      const title = i.books?.title || "Library Book";
                      const author = i.books?.author || "Catalog Title";
                      const coverUrl = i.books?.cover_url;

                      return (
                        <TableRow key={i.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {coverUrl ? (
                                <img
                                  src={coverUrl}
                                  alt={title}
                                  className="h-12 w-9 rounded object-cover shadow-sm bg-muted flex-shrink-0"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="flex h-12 w-9 items-center justify-center rounded bg-primary/10 text-primary flex-shrink-0">
                                  <BookOpen className="size-4" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{title}</p>
                                <p className="text-xs text-muted-foreground">{author}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{memberName(i.user_id)}</TableCell>
                          <TableCell>{formatDate(i.issued_at)}</TableCell>
                          <TableCell>{formatDate(i.due_date)}</TableCell>
                          <TableCell>
                            {i.status === "returned" ? (
                              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                <CheckCircle className="size-3 text-emerald-500" /> Returned {formatDate(i.returned_at)}
                              </Badge>
                            ) : left < 0 ? (
                              <Badge variant="destructive">{Math.abs(left)} days overdue</Badge>
                            ) : (
                              <Badge variant="secondary">{left} days left</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {i.status === "issued" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={forceReturn.isPending}
                                onClick={() => forceReturn.mutate({ id: i.id, bookId: i.book_id })}
                              >
                                Mark returned
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <div className="surface-paper overflow-x-auto rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Active loans</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.full_name || "—"}</TableCell>
                      <TableCell>{m.email}</TableCell>
                      <TableCell>
                        <Badge variant={m.role === "librarian" ? "default" : "secondary"}>{m.role}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(m.created_at)}</TableCell>
                      <TableCell>{activeIssues.filter((i) => i.user_id === m.id).length}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
