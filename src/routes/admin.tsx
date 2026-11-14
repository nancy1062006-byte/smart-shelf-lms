import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ALL_CATEGORIES, mergeBooksWithCatalog } from "@/data/booksCatalog";
import { daysUntil, formatDate, useSession } from "@/lib/session";
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

type AdminIssue = {
  id: string;
  issued_at: string;
  due_date: string;
  returned_at: string | null;
  status: string;
  user_id: string;
  books: { title: string; author: string } | null;
};

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
      const { data, error } = await supabase.from("books").select("*").order("title");
      if (error) throw error;
      return data;
    },
  });

  const books = useMemo(() => mergeBooksWithCatalog(rawBooks), [rawBooks]);

  const { data: issues = [] } = useQuery({
    queryKey: ["all-issues"],
    enabled: isLibrarian,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issued_books")
        .select("id, issued_at, due_date, returned_at, status, user_id, books(title, author)")
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return data as unknown as AdminIssue[];
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["members"],
    enabled: isLibrarian,
    queryFn: async () => {
      const [{ data: profiles, error }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, created_at").order("created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (error) throw error;
      return (profiles ?? []).map((p) => ({
        ...p,
        role: (roles ?? []).find((r) => r.user_id === p.id)?.role ?? "student",
      }));
    },
  });

  const [form, setForm] = useState({
    title: "",
    author: "",
    category: "",
    isbn: "",
    description: "",
    total_copies: "1",
  });

  const addBook = useMutation({
    mutationFn: async () => {
      const copies = Math.max(1, Number(form.total_copies) || 1);
      const { error } = await supabase.from("books").insert({
        title: form.title,
        author: form.author,
        category: form.category || "General",
        isbn: form.isbn || null,
        description: form.description || null,
        total_copies: copies,
        available_copies: copies,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Book added to the shelf.");
      setForm({ title: "", author: "", category: "", isbn: "", description: "", total_copies: "1" });
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
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("return_book", { _issue_id: id });
      if (error) throw error;
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
            <TabsTrigger value="loans">Loans</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
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
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      required
                      value={form.author}
                      onChange={(e) => setForm({ ...form, author: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      list="category-options"
                      placeholder="e.g. Computer Science"
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
                    <Input id="isbn" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
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
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead className="text-right">Remove</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.title}</TableCell>
                      <TableCell>{b.author}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{b.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {b.available_copies}/{b.total_copies}
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

          <TabsContent value="loans" className="mt-6">
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
                      <TableCell colSpan={6} className="text-muted-foreground">
                        No loans recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    issues.map((i) => {
                      const left = daysUntil(i.due_date);
                      return (
                        <TableRow key={i.id}>
                          <TableCell className="font-medium">{i.books?.title}</TableCell>
                          <TableCell>{memberName(i.user_id)}</TableCell>
                          <TableCell>{formatDate(i.issued_at)}</TableCell>
                          <TableCell>{formatDate(i.due_date)}</TableCell>
                          <TableCell>
                            {i.status === "returned" ? (
                              <Badge variant="outline">Returned {formatDate(i.returned_at)}</Badge>
                            ) : left < 0 ? (
                              <Badge variant="destructive">{Math.abs(left)} days overdue</Badge>
                            ) : (
                              <Badge variant="secondary">{left} days left</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {i.status === "issued" && (
                              <Button size="sm" variant="outline" onClick={() => forceReturn.mutate(i.id)}>
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
