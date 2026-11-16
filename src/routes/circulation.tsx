import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  Info,
  Clock,
} from "lucide-react";
import { daysUntil, formatDate, useSession } from "@/lib/session";
import { fetchMergedIssues, executeReturnBook, type IssueRecord } from "@/lib/circulationStorage";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/circulation")({
  head: () => ({
    meta: [
      { title: "Issue & Return — Smart-Shelf Library" },
      {
        name: "description",
        content:
          "Track the books you have borrowed from Smart-Shelf, see due dates, spot overdue loans, and return books easily.",
      },
      { property: "og:title", content: "Issue & Return — Smart-Shelf Library" },
      { property: "og:description", content: "Your borrowed books, due dates, and one-click returns." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CirculationPage,
});

function CirculationPage() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  // Fetch student's circulation issues
  const { data: issues = [], isLoading } = useQuery<IssueRecord[]>({
    queryKey: ["my-issues", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        return await fetchMergedIssues(user!.id);
      } catch (e) {
        console.warn("fetchMergedIssues error in circulation page:", e);
        return [];
      }
    },
  });

  // Return book mutation
  const returnMutation = useMutation({
    mutationFn: async ({ issueId, bookId }: { issueId: string; bookId?: string }) => {
      await executeReturnBook(issueId, bookId);
    },
    onSuccess: () => {
      toast.success("Book returned successfully. Thank you!");
      queryClient.invalidateQueries({ queryKey: ["my-issues"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["all-issues"] });
      queryClient.invalidateQueries({ queryKey: ["home-stats"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to return book"),
  });

  const active = issues.filter((i) => i.status === "issued");
  const history = issues.filter((i) => i.status !== "issued");
  const overdue = active.filter((i) => daysUntil(i.due_date) < 0);

  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#1F2937]">
      <SiteNav />

      {/* Header Banner */}
      <section className="border-b border-[#E2E8F0] bg-white py-8 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6C4AB6]">
                <CalendarClock className="size-4" /> Circulation Desk
              </div>
              <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-[#14213D] sm:text-4xl">
                Issue &amp; Return
              </h1>
              <p className="mt-1 text-sm text-[#64748B]">
                Manage active loans and process book returns. College loans run for 14 calendar days from the date of issue.
              </p>
            </div>

            <Button
              asChild
              className="bg-[#6C4AB6] hover:bg-[#8B5CF6] text-white shadow-xs text-xs font-semibold self-start sm:self-auto"
            >
              <Link to="/books">
                <BookOpen className="size-3.5 mr-1.5" /> Borrow New Book
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        {/* Circulation Notice Banner */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 sm:p-5 flex items-start gap-3.5 text-sm text-[#1D3557]">
          <Info className="size-5 text-[#1D3557] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Library Circulation Policy:</span> Standard loans are active for 14 days.
            Please ensure books are returned before their scheduled due date. Overdue books will be highlighted in red
            until returned to the shelf.
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Currently Borrowed
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#F0EBFA] text-[#6C4AB6]">
                <BookOpen className="size-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-[#14213D]">{active.length}</span>
              <span className="text-xs text-[#64748B]">active items</span>
            </div>
          </Card>

          <Card
            className={`rounded-2xl border p-6 shadow-sm ${
              overdue.length > 0 ? "border-rose-200 bg-rose-50/50" : "border-[#E2E8F0] bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Overdue Loans
              </span>
              <div
                className={`flex size-9 items-center justify-center rounded-lg ${
                  overdue.length > 0 ? "bg-rose-100 text-[#DC2626]" : "bg-slate-100 text-slate-500"
                }`}
              >
                <AlertTriangle className="size-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span
                className={`font-display text-3xl font-bold ${
                  overdue.length > 0 ? "text-[#DC2626]" : "text-[#14213D]"
                }`}
              >
                {overdue.length}
              </span>
              <span className="text-xs text-[#64748B]">
                {overdue.length > 0 ? "overdue notices" : "zero overdue"}
              </span>
            </div>
          </Card>

          <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Returned History
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-[#15803D]">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-[#14213D]">{history.length}</span>
              <span className="text-xs text-[#64748B]">titles returned</span>
            </div>
          </Card>
        </div>

        {/* Section: Currently Borrowed Books */}
        <section className="space-y-4">
          <div className="border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#14213D] font-display flex items-center gap-2">
                <Clock className="size-5 text-[#6C4AB6]" /> Currently Borrowed Books
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Click "Return Book" to check a book back into the college inventory.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center text-sm text-[#64748B]">
              Loading circulation records…
            </div>
          ) : active.length === 0 ? (
            <Card className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-10 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#F0EBFA] text-[#6C4AB6] mx-auto mb-3">
                <RotateCcw className="size-7" />
              </div>
              <h3 className="font-display text-base font-bold text-[#14213D]">
                No Books Currently Borrowed
              </h3>
              <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                You currently have no outstanding books. Visit the catalog to find study materials and textbooks.
              </p>
              <Button
                asChild
                className="mt-5 bg-[#6C4AB6] hover:bg-[#8B5CF6] text-white text-xs font-semibold"
              >
                <Link to="/books">
                  Browse Book Catalog <ArrowRight className="size-3.5 ml-1" />
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="border-[#E2E8F0]">
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                      Book Details
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                      Category
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                      Issue Date
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                      Due Date
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                      Status
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-[#14213D]">
                      Circulation Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {active.map((row) => {
                    const left = daysUntil(row.due_date);
                    const bookTitle = row.books?.title || "Library Book";
                    const bookAuthor = row.books?.author || "Catalog Title";
                    const category = row.books?.category || "General";
                    const coverUrl = row.books?.cover_url;

                    return (
                      <TableRow key={row.id} className="border-[#E2E8F0] hover:bg-slate-50/60 transition-colors">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3.5">
                            {coverUrl ? (
                              <img
                                src={coverUrl}
                                alt={bookTitle}
                                className="h-14 w-10 rounded-md object-cover shadow-xs border border-[#E2E8F0] bg-slate-100 flex-shrink-0"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="flex h-14 w-10 items-center justify-center rounded-md bg-[#F0EBFA] text-[#6C4AB6] border border-[#DDD6FE] flex-shrink-0">
                                <BookOpen className="size-5" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-[#14213D] leading-snug">{bookTitle}</p>
                              <p className="text-xs text-[#64748B] mt-0.5">{bookAuthor}</p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge className="bg-[#F0EBFA] text-[#6C4AB6] border-[#DDD6FE] font-medium text-xs">
                            {category}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-xs font-semibold text-[#1F2937]">
                          {formatDate(row.issued_at)}
                        </TableCell>

                        <TableCell className="text-xs font-semibold text-[#1F2937]">
                          {formatDate(row.due_date)}
                        </TableCell>

                        <TableCell>
                          {left < 0 ? (
                            <Badge className="bg-rose-50 text-[#B91C1C] border-rose-200 font-semibold text-xs">
                              <AlertTriangle className="size-3 mr-1 text-[#B91C1C]" /> {Math.abs(left)} days overdue
                            </Badge>
                          ) : left <= 3 ? (
                            <Badge className="bg-amber-50 text-[#92400E] border-amber-200 font-semibold text-xs">
                              <Clock className="size-3 mr-1 text-[#92400E]" /> Due in {left} days
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-50 text-[#15803D] border-emerald-200 font-semibold text-xs">
                              <CheckCircle2 className="size-3 mr-1 text-[#15803D]" /> {left} days left
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            className="bg-[#14213D] hover:bg-[#1D3557] text-white text-xs font-semibold shadow-xs cursor-pointer"
                            disabled={returnMutation.isPending}
                            onClick={() => returnMutation.mutate({ issueId: row.id, bookId: row.book_id })}
                          >
                            {returnMutation.isPending ? "Processing..." : "Return Book"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {/* Section: Return History */}
        {history.length > 0 && (
          <section className="space-y-4">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h2 className="text-xl font-bold text-[#14213D] font-display flex items-center gap-2">
                <CheckCircle2 className="size-5 text-[#15803D]" /> Completed Returns History
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Archived records of returned college library books.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="border-[#E2E8F0]">
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                      Book Title
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                      Category
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                      Issued Date
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                      Due Date
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                      Returned Date
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-[#14213D]">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((row) => (
                    <TableRow key={row.id} className="border-[#E2E8F0] hover:bg-slate-50/60 transition-colors">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          {row.books?.cover_url && (
                            <img
                              src={row.books.cover_url}
                              alt={row.books.title}
                              className="h-10 w-7 rounded object-cover shadow-xs border border-[#E2E8F0] bg-slate-100 flex-shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                          )}
                          <div>
                            <p className="font-semibold text-[#14213D] leading-tight">
                              {row.books?.title || "Library Book"}
                            </p>
                            <p className="text-xs text-[#64748B]">{row.books?.author || "Catalog Title"}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge className="bg-slate-100 text-[#1F2937] border-slate-200 text-xs">
                          {row.books?.category || "General"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-[#64748B]">{formatDate(row.issued_at)}</TableCell>
                      <TableCell className="text-xs text-[#64748B]">{formatDate(row.due_date)}</TableCell>
                      <TableCell className="text-xs font-semibold text-[#15803D]">
                        {formatDate(row.returned_at)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Badge className="bg-emerald-50 text-[#15803D] border-emerald-200 text-xs font-semibold">
                          <CheckCircle2 className="size-3 mr-1" /> Returned to Shelf
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
