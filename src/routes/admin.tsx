import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Trash2,
  BookOpen,
  CheckCircle,
  Send,
  Shield,
  Layers,
  Users,
  AlertTriangle,
  Clock,
  PlusCircle,
  ArrowRight,
} from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Librarian Dashboard — Smart-Shelf Library" },
      {
        name: "description",
        content:
          "Manage the Smart-Shelf inventory: add or remove books, review issued and overdue loans, and oversee college library members.",
      },
      { property: "og:title", content: "Librarian Dashboard — Smart-Shelf Library" },
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

  // Fetch catalog books
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

  // Fetch all circulation issues
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

  // Fetch library members
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
      if (!form.title.trim() || !form.author.trim()) {
        throw new Error("Please provide at least a title and author.");
      }
      const copies = Math.max(1, Number(form.total_copies) || 1);
      const cleanIsbn = normalizeIsbn(form.isbn);
      const autoCover =
        form.cover_url ||
        (cleanIsbn ? `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg` : null);

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
      toast.success("Book added to the college catalog successfully!");
      setForm({
        title: "",
        author: "",
        category: "",
        isbn: "",
        cover_url: "",
        description: "",
        total_copies: "1",
      });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["home-stats"] });
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
      toast.success("Book issued to member successfully (14 Days).");
      setManualIssue({ bookId: "", memberId: "" });
      queryClient.invalidateQueries({ queryKey: ["all-issues"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["home-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeBook = useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith("local-")) {
        toast.info("Default catalog titles cannot be deleted, but can be managed locally.");
        return;
      }
      const { error } = await supabase.from("books").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Book removed from catalog.");
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["all-issues"] });
      queryClient.invalidateQueries({ queryKey: ["home-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const forceReturn = useMutation({
    mutationFn: async ({ id, bookId }: { id: string; bookId?: string }) => {
      await executeReturnBook(id, bookId);
    },
    onSuccess: () => {
      toast.success("Book successfully marked as returned.");
      queryClient.invalidateQueries({ queryKey: ["all-issues"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["home-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Guard for non-librarian users
  if (!loading && user && !isLibrarian) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] text-[#1F2937]">
        <SiteNav />
        <main className="mx-auto max-w-xl px-4 py-24 text-center">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-10 shadow-sm">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-[#D97706] mx-auto mb-4 border border-amber-200">
              <Shield className="size-7" />
            </div>
            <h1 className="font-display text-2xl font-bold text-[#14213D]">Librarians Only</h1>
            <p className="mt-2 text-sm text-[#64748B] leading-relaxed">
              This dashboard is restricted to authorized college library staff. If you need administrative access,
              please register an account with the "Librarian" role.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild className="bg-[#6C4AB6] hover:bg-[#8B5CF6] text-white text-xs font-semibold">
                <Link to="/dashboard">Go to Student Dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="border-[#E2E8F0] text-xs font-semibold">
                <Link to="/books">Browse Books</Link>
              </Button>
            </div>
          </div>
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
    return m?.full_name || m?.email || "College Member";
  };

  const adminStats = [
    { label: "Book Titles", value: books.length, icon: BookOpen, color: "text-[#6C4AB6]", bg: "bg-[#F0EBFA]" },
    {
      label: "Copies on Shelf",
      value: `${availableCopies} / ${totalCopies}`,
      icon: Layers,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Active Loans",
      value: activeIssues.length,
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Overdue Loans",
      value: overdueIssues.length,
      icon: AlertTriangle,
      color: overdueIssues.length > 0 ? "text-[#DC2626]" : "text-slate-600",
      bg: overdueIssues.length > 0 ? "bg-rose-50" : "bg-slate-100",
    },
    { label: "Total Members", value: members.length, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#1F2937]">
      <SiteNav />

      {/* Header Banner */}
      <section className="border-b border-[#E2E8F0] bg-white py-8 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6C4AB6]">
                <Shield className="size-4" /> Administration Portal
              </div>
              <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-[#14213D] sm:text-4xl">
                Librarian Dashboard
              </h1>
              <p className="mt-1 text-sm text-[#64748B]">
                Manage catalog inventory, record new titles, process member loans, and monitor circulation activity.
              </p>
            </div>

            <Badge className="bg-[#14213D] text-white border-none text-xs px-3 py-1 font-semibold self-start sm:self-auto">
              Staff Privileges Active
            </Badge>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        {/* Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {adminStats.map((s) => {
            const IconComp = s.icon;
            return (
              <Card key={s.label} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">{s.label}</span>
                  <div className={`flex size-8 items-center justify-center rounded-lg ${s.bg} ${s.color}`}>
                    <IconComp className="size-4" />
                  </div>
                </div>
                <p className="font-display text-2xl font-bold text-[#14213D] mt-3">{s.value}</p>
              </Card>
            );
          })}
        </div>

        {/* Administration Tabs */}
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md rounded-xl bg-slate-100 p-1 mb-8">
            <TabsTrigger
              value="inventory"
              className="rounded-lg text-xs font-semibold text-[#64748B] data-[state=active]:bg-white data-[state=active]:text-[#14213D] data-[state=active]:shadow-xs transition-all"
            >
              Inventory ({books.length})
            </TabsTrigger>
            <TabsTrigger
              value="loans"
              className="rounded-lg text-xs font-semibold text-[#64748B] data-[state=active]:bg-white data-[state=active]:text-[#14213D] data-[state=active]:shadow-xs transition-all"
            >
              Loans ({activeIssues.length})
            </TabsTrigger>
            <TabsTrigger
              value="members"
              className="rounded-lg text-xs font-semibold text-[#64748B] data-[state=active]:bg-white data-[state=active]:text-[#14213D] data-[state=active]:shadow-xs transition-all"
            >
              Members ({members.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: INVENTORY MANAGEMENT */}
          <TabsContent value="inventory" className="space-y-8">
            {/* Add Book Form Card */}
            <Card className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
              <CardHeader className="border-b border-[#F1F5F9] pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-[#F0EBFA] text-[#6C4AB6]">
                    <PlusCircle className="size-5" />
                  </span>
                  <div>
                    <CardTitle className="font-display text-lg font-bold text-[#14213D]">
                      Add New Book to Catalog
                    </CardTitle>
                    <CardDescription className="text-xs text-[#64748B]">
                      Enter book metadata. ISBN allows automated cover fetching from Open Library.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <form
                  className="grid gap-5 md:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addBook.mutate();
                  }}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="title" className="text-xs font-bold text-[#14213D]">
                      Book Title *
                    </Label>
                    <Input
                      id="title"
                      required
                      placeholder="e.g. Introduction to Algorithms"
                      className="h-10 bg-white border-[#E2E8F0] text-xs rounded-xl focus-visible:ring-2 focus-visible:ring-[#6C4AB6]"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="author" className="text-xs font-bold text-[#14213D]">
                      Author Name *
                    </Label>
                    <Input
                      id="author"
                      required
                      placeholder="e.g. Thomas H. Cormen"
                      className="h-10 bg-white border-[#E2E8F0] text-xs rounded-xl focus-visible:ring-2 focus-visible:ring-[#6C4AB6]"
                      value={form.author}
                      onChange={(e) => setForm({ ...form, author: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-xs font-bold text-[#14213D]">
                      Category / Department
                    </Label>
                    <Input
                      id="category"
                      list="category-options"
                      placeholder="e.g. Computer Science"
                      className="h-10 bg-white border-[#E2E8F0] text-xs rounded-xl focus-visible:ring-2 focus-visible:ring-[#6C4AB6]"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    />
                    <datalist id="category-options">
                      {ALL_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="isbn" className="text-xs font-bold text-[#14213D]">
                      ISBN-10 / ISBN-13
                    </Label>
                    <Input
                      id="isbn"
                      placeholder="e.g. 9780262046305"
                      className="h-10 bg-white border-[#E2E8F0] text-xs rounded-xl focus-visible:ring-2 focus-visible:ring-[#6C4AB6]"
                      value={form.isbn}
                      onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="copies" className="text-xs font-bold text-[#14213D]">
                      Total Copies in Library
                    </Label>
                    <Input
                      id="copies"
                      type="number"
                      min={1}
                      className="h-10 bg-white border-[#E2E8F0] text-xs rounded-xl focus-visible:ring-2 focus-visible:ring-[#6C4AB6]"
                      value={form.total_copies}
                      onChange={(e) => setForm({ ...form, total_copies: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cover_url" className="text-xs font-bold text-[#14213D]">
                      Custom Cover URL (optional)
                    </Label>
                    <Input
                      id="cover_url"
                      placeholder="Leave blank to auto-fetch from ISBN"
                      className="h-10 bg-white border-[#E2E8F0] text-xs rounded-xl focus-visible:ring-2 focus-visible:ring-[#6C4AB6]"
                      value={form.cover_url}
                      onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="description" className="text-xs font-bold text-[#14213D]">
                      Book Summary / Synopsis
                    </Label>
                    <Textarea
                      id="description"
                      rows={2}
                      placeholder="Brief overview of the book's subject matter..."
                      className="bg-white border-[#E2E8F0] text-xs rounded-xl focus-visible:ring-2 focus-visible:ring-[#6C4AB6]"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2 pt-2">
                    <Button
                      type="submit"
                      disabled={addBook.isPending}
                      className="bg-[#6C4AB6] hover:bg-[#8B5CF6] text-white text-xs font-semibold px-6 shadow-xs"
                    >
                      {addBook.isPending ? "Adding Title..." : "Add Title to Catalog"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Inventory Table */}
            <div className="space-y-3">
              <h3 className="font-display text-lg font-bold text-[#14213D]">
                Catalog Inventory ({books.length} Books)
              </h3>
              <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow className="border-[#E2E8F0]">
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                        Book
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                        Category
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                        ISBN
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                        Availability
                      </TableHead>
                      <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-[#14213D]">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {books.map((b) => (
                      <TableRow key={b.id} className="border-[#E2E8F0] hover:bg-slate-50/60 transition-colors">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            {b.cover_url ? (
                              <img
                                src={b.cover_url}
                                alt={b.title}
                                className="h-12 w-9 rounded object-cover shadow-xs border border-[#E2E8F0] bg-slate-100 flex-shrink-0"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="flex h-12 w-9 items-center justify-center rounded bg-[#F0EBFA] text-[#6C4AB6] border border-[#DDD6FE] flex-shrink-0">
                                <BookOpen className="size-4" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-[#14213D] leading-snug">{b.title}</p>
                              <p className="text-xs text-[#64748B]">{b.author}</p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge className="bg-[#F0EBFA] text-[#6C4AB6] border-[#DDD6FE] text-xs font-medium">
                            {b.category}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-xs font-mono text-[#64748B]">
                          {b.isbn || "—"}
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={`text-xs font-semibold ${
                              b.available_copies > 0
                                ? "bg-emerald-50 text-[#15803D] border-emerald-200"
                                : "bg-rose-50 text-[#DC2626] border-rose-200"
                            }`}
                          >
                            {b.available_copies} of {b.total_copies} available
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-slate-400 hover:text-[#DC2626] hover:bg-rose-50 size-8"
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
            </div>
          </TabsContent>

          {/* TAB 2: LOANS & ISSUE TO MEMBER */}
          <TabsContent value="loans" className="space-y-8">
            {/* Quick Issue to Member Form */}
            <Card className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
              <CardHeader className="border-b border-[#F1F5F9] pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-[#F0EBFA] text-[#6C4AB6]">
                    <Send className="size-5" />
                  </span>
                  <div>
                    <CardTitle className="font-display text-lg font-bold text-[#14213D]">
                      Issue Book to Registered Member
                    </CardTitle>
                    <CardDescription className="text-xs text-[#64748B]">
                      Directly assign a copy to a student. Loan automatically calculates a 14-day due date.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <form
                  className="grid gap-4 md:grid-cols-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    issueToMemberMutation.mutate();
                  }}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="issue-book" className="text-xs font-bold text-[#14213D]">
                      Select Book Title *
                    </Label>
                    <select
                      id="issue-book"
                      required
                      className="w-full h-10 rounded-xl border border-[#E2E8F0] bg-white text-[#1F2937] px-3 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C4AB6]"
                      value={manualIssue.bookId}
                      onChange={(e) => setManualIssue({ ...manualIssue, bookId: e.target.value })}
                    >
                      <option value="">-- Choose a book title --</option>
                      {books.map((b) => (
                        <option key={b.id} value={b.id} disabled={b.available_copies < 1}>
                          {b.title} ({b.author}) — {b.available_copies} available
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="issue-member" className="text-xs font-bold text-[#14213D]">
                      Select College Member *
                    </Label>
                    <select
                      id="issue-member"
                      required
                      className="w-full h-10 rounded-xl border border-[#E2E8F0] bg-white text-[#1F2937] px-3 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C4AB6]"
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
                    <Button
                      type="submit"
                      className="w-full h-10 bg-[#6C4AB6] hover:bg-[#8B5CF6] text-white font-semibold text-xs shadow-xs"
                      disabled={issueToMemberMutation.isPending}
                    >
                      {issueToMemberMutation.isPending ? "Issuing..." : "Issue Book (14 Days)"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Active & Past Loans Table */}
            <div className="space-y-3">
              <h3 className="font-display text-lg font-bold text-[#14213D]">
                All Recorded Loans ({issues.length})
              </h3>
              <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow className="border-[#E2E8F0]">
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                        Book Details
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                        Borrower
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                        Issued On
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                        Due Date
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                        Status
                      </TableHead>
                      <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-[#14213D]">
                        Staff Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issues.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-xs text-[#64748B]">
                          No loans recorded in the system yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      issues.map((i) => {
                        const left = daysUntil(i.due_date);
                        const title = i.books?.title || "Library Book";
                        const author = i.books?.author || "Catalog Title";
                        const coverUrl = i.books?.cover_url;

                        return (
                          <TableRow key={i.id} className="border-[#E2E8F0] hover:bg-slate-50/60 transition-colors">
                            <TableCell className="py-3">
                              <div className="flex items-center gap-3">
                                {coverUrl ? (
                                  <img
                                    src={coverUrl}
                                    alt={title}
                                    className="h-12 w-9 rounded object-cover shadow-xs border border-[#E2E8F0] bg-slate-100 flex-shrink-0"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div className="flex h-12 w-9 items-center justify-center rounded bg-[#F0EBFA] text-[#6C4AB6] border border-[#DDD6FE] flex-shrink-0">
                                    <BookOpen className="size-4" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-[#14213D] leading-snug">{title}</p>
                                  <p className="text-xs text-[#64748B]">{author}</p>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="text-xs font-semibold text-[#14213D]">
                              {memberName(i.user_id)}
                            </TableCell>

                            <TableCell className="text-xs text-[#64748B]">{formatDate(i.issued_at)}</TableCell>
                            <TableCell className="text-xs text-[#64748B]">{formatDate(i.due_date)}</TableCell>

                            <TableCell>
                              {i.status === "returned" ? (
                                <Badge className="bg-emerald-50 text-[#15803D] border-emerald-200 text-xs font-semibold">
                                  <CheckCircle className="size-3 mr-1" /> Returned
                                </Badge>
                              ) : left < 0 ? (
                                <Badge className="bg-rose-50 text-[#B91C1C] border-rose-200 text-xs font-semibold">
                                  <AlertTriangle className="size-3 mr-1 text-[#B91C1C]" /> {Math.abs(left)} days overdue
                                </Badge>
                              ) : (
                                <Badge className="bg-[#F0EBFA] text-[#6C4AB6] border-[#DDD6FE] text-xs font-semibold">
                                  <Clock className="size-3 mr-1" /> {left} days left
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell className="text-right">
                              {i.status === "issued" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-[#1D3557] text-[#1D3557] hover:bg-slate-50 text-xs font-semibold"
                                  disabled={forceReturn.isPending}
                                  onClick={() => forceReturn.mutate({ id: i.id, bookId: i.book_id })}
                                >
                                  Mark Returned
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
            </div>
          </TabsContent>

          {/* TAB 3: MEMBER MANAGEMENT */}
          <TabsContent value="members" className="space-y-4">
            <h3 className="font-display text-lg font-bold text-[#14213D]">
              Registered Members ({members.length})
            </h3>
            <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="border-[#E2E8F0]">
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                      Member Name
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                      College Email
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                      Role
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                      Joined Date
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-[#14213D]">
                      Active Loans
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => {
                    const memberActiveLoans = activeIssues.filter((i) => i.user_id === m.id).length;
                    return (
                      <TableRow key={m.id} className="border-[#E2E8F0] hover:bg-slate-50/60 transition-colors">
                        <TableCell className="font-bold text-[#14213D] py-3.5">
                          {m.full_name || "College User"}
                        </TableCell>
                        <TableCell className="text-xs text-[#64748B]">{m.email}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              m.role === "librarian"
                                ? "bg-purple-100 text-[#6C4AB6] border-purple-200 text-xs font-semibold uppercase tracking-wider"
                                : "bg-blue-50 text-[#1D3557] border-blue-200 text-xs font-semibold uppercase tracking-wider"
                            }
                          >
                            {m.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-[#64748B]">{formatDate(m.created_at)}</TableCell>
                        <TableCell className="text-right font-bold text-[#14213D] text-xs">
                          {memberActiveLoans}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
