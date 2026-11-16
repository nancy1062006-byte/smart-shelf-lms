import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  ArrowRight,
  Shield,
  History,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { daysUntil, formatDate, useSession } from "@/lib/session";
import { fetchMergedIssues, type IssueRecord } from "@/lib/circulationStorage";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard — Smart-Shelf Library" },
      {
        name: "description",
        content:
          "Your Smart-Shelf student dashboard: profile details, books you currently have issued, due dates and borrowing history.",
      },
      { property: "og:title", content: "My Dashboard — Smart-Shelf Library" },
      {
        property: "og:description",
        content: "See your profile, issued books and due dates in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, role, fullName, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  // Fetch student profile details
  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, email, created_at")
          .eq("id", user!.id)
          .maybeSingle();
        if (error) {
          console.warn("Could not fetch profile:", error.message);
          return null;
        }
        return data;
      } catch (e) {
        console.warn("Profile fetch error:", e);
        return null;
      }
    },
  });

  // Fetch student issues
  const { data: issues = [], isLoading } = useQuery<IssueRecord[]>({
    queryKey: ["my-issues", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        return await fetchMergedIssues(user!.id);
      } catch (e) {
        console.warn("fetchMergedIssues error in dashboard:", e);
        return [];
      }
    },
  });

  const active = issues.filter((i) => i.status === "issued");
  const returned = issues.filter((i) => i.status !== "issued");
  const overdue = active.filter((i) => daysUntil(i.due_date) < 0);
  const nextDue = [...active].sort((a, b) => daysUntil(a.due_date) - daysUntil(b.due_date))[0];

  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#1F2937]">
      <SiteNav />

      {/* Header Banner */}
      <section className="border-b border-[#E2E8F0] bg-white py-8 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6C4AB6]">
                <User className="size-4" /> Personal Library Desk
              </div>
              <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-[#14213D] sm:text-4xl">
                My Dashboard
              </h1>
              <p className="mt-1 text-sm text-[#64748B]">
                Welcome back, <span className="font-semibold text-[#14213D]">{fullName || user?.email?.split("@")[0] || "Student"}</span>. Track your active borrowings, due dates, and circulation history.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                asChild
                className="bg-[#6C4AB6] hover:bg-[#8B5CF6] text-white shadow-xs text-xs font-semibold"
              >
                <Link to="/books">
                  <BookOpen className="size-3.5 mr-1.5" /> Borrow More Books
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-[#1D3557] text-[#1D3557] hover:bg-slate-50 text-xs font-semibold"
              >
                <Link to="/circulation">Return Books</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
        {/* Profile & Metric Cards Overview */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Student Profile Card */}
          <Card className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm lg:col-span-1">
            <CardHeader className="border-b border-[#F1F5F9] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#6C4AB6] border border-[#DDD6FE]">
                  {role === "librarian" ? <Shield className="size-6" /> : <User className="size-6" />}
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-[#14213D] font-display">
                    Account Profile
                  </CardTitle>
                  <p className="text-xs text-[#64748B]">Smart-Shelf Membership</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 text-sm">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  Full Name
                </span>
                <p className="font-semibold text-[#14213D] mt-0.5">
                  {profile?.full_name || fullName || "College Student"}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  College Email
                </span>
                <p className="font-medium text-[#14213D] mt-0.5 break-all">
                  {profile?.email || user?.email || "—"}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    Role
                  </span>
                  <div className="mt-1">
                    <Badge
                      className={
                        role === "librarian"
                          ? "bg-purple-100 text-[#6C4AB6] border-purple-200 uppercase tracking-wide font-semibold text-[10px]"
                          : "bg-blue-50 text-[#1D3557] border-blue-200 uppercase tracking-wide font-semibold text-[10px]"
                      }
                    >
                      {role ?? "student"}
                    </Badge>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    Member Since
                  </span>
                  <p className="text-xs font-semibold text-[#14213D] mt-1">
                    {formatDate(profile?.created_at || user?.created_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4 Key Statistics Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm hover:border-[#6C4AB6]/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Books Currently Issued
                </span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-[#F0EBFA] text-[#6C4AB6]">
                  <BookOpen className="size-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold text-[#14213D]">{active.length}</span>
                <span className="text-xs text-[#64748B]">active loans</span>
              </div>
            </Card>

            <Card
              className={`rounded-2xl border p-6 shadow-sm transition-all ${
                overdue.length > 0
                  ? "border-rose-200 bg-rose-50/50"
                  : "border-[#E2E8F0] bg-white hover:border-[#6C4AB6]/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Overdue Books
                </span>
                <div
                  className={`flex size-9 items-center justify-center rounded-lg ${
                    overdue.length > 0
                      ? "bg-rose-100 text-[#DC2626]"
                      : "bg-slate-100 text-slate-500"
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
                  {overdue.length > 0 ? "requires immediate return" : "all on schedule"}
                </span>
              </div>
            </Card>

            <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm hover:border-[#6C4AB6]/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Past Books Returned
                </span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-[#15803D]">
                  <CheckCircle2 className="size-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold text-[#14213D]">{returned.length}</span>
                <span className="text-xs text-[#64748B]">completed returns</span>
              </div>
            </Card>

            <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm hover:border-[#6C4AB6]/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Next Due Date
                </span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-[#1D3557]">
                  <Calendar className="size-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold text-[#14213D]">
                  {nextDue ? formatDate(nextDue.due_date) : "None"}
                </span>
                {nextDue && (
                  <span
                    className={`text-xs font-semibold ${
                      daysUntil(nextDue.due_date) < 0
                        ? "text-[#DC2626]"
                        : "text-[#15803D]"
                    }`}
                  >
                    ({daysUntil(nextDue.due_date) < 0
                      ? `${Math.abs(daysUntil(nextDue.due_date))}d overdue`
                      : `${daysUntil(nextDue.due_date)}d left`})
                  </span>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Section: Currently Issued Books */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
            <div>
              <h2 className="text-xl font-bold text-[#14213D] font-display flex items-center gap-2">
                <Clock className="size-5 text-[#6C4AB6]" /> Books Currently Issued
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Active borrowings with 14-day tracking. Return on time to keep library records clear.
              </p>
            </div>
            {active.length > 0 && (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-[#6C4AB6] text-[#6C4AB6] hover:bg-[#F0EBFA] text-xs font-semibold shrink-0"
              >
                <Link to="/circulation">Manage in Circulation</Link>
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center text-sm text-[#64748B]">
              Loading your library loans…
            </div>
          ) : active.length === 0 ? (
            <Card className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-10 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#F0EBFA] text-[#6C4AB6] mx-auto mb-3">
                <BookOpen className="size-7" />
              </div>
              <h3 className="font-display text-base font-bold text-[#14213D]">
                No Books Currently Issued
              </h3>
              <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                You do not have any active book loans. Explore the catalog to discover interesting titles and borrow
                them for 14 days.
              </p>
              <Button
                asChild
                className="mt-5 bg-[#6C4AB6] hover:bg-[#8B5CF6] text-white text-xs font-semibold"
              >
                <Link to="/books">
                  Browse Catalog <ArrowRight className="size-3.5 ml-1" />
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
                      Loan Status
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-[#14213D]">
                      Action
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
                            asChild
                            size="sm"
                            className="bg-[#14213D] hover:bg-[#1D3557] text-white text-xs font-semibold shadow-xs"
                          >
                            <Link to="/circulation">Return Book</Link>
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

        {/* Section: Past Borrowings History */}
        {returned.length > 0 && (
          <section className="space-y-4">
            <div className="border-b border-[#E2E8F0] pb-4">
              <h2 className="text-xl font-bold text-[#14213D] font-display flex items-center gap-2">
                <History className="size-5 text-[#15803D]" /> Borrowing History
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Past loans that have been successfully returned to the college library.
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
                      Issued On
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                      Due Date
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                      Returned On
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-[#14213D]">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returned.map((row) => (
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
                          <CheckCircle2 className="size-3 mr-1" /> Returned
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
