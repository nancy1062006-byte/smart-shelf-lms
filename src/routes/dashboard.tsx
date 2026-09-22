import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { daysUntil, formatDate, useSession } from "@/lib/session";
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

type IssueRow = {
  id: string;
  issued_at: string;
  due_date: string;
  returned_at: string | null;
  status: string;
  books: { title: string; author: string; category: string } | null;
};

function DashboardPage() {
  const { user, role, fullName, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, created_at")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ["my-issues", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issued_books")
        .select("id, issued_at, due_date, returned_at, status, books(title, author, category)")
        .eq("user_id", user!.id)
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return data as unknown as IssueRow[];
    },
  });

  const active = issues.filter((i) => i.status === "issued");
  const returned = issues.filter((i) => i.status !== "issued");
  const overdue = active.filter((i) => daysUntil(i.due_date) < 0);
  const nextDue = [...active].sort((a, b) => daysUntil(a.due_date) - daysUntil(b.due_date))[0];

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="font-display text-3xl font-semibold md:text-4xl">My dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Everything on your library account — your details, what you are reading and when it is due back.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="surface-paper lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Name</p>
                <p className="font-medium">{profile?.full_name || fullName || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                <p className="font-medium break-all">{profile?.email || user?.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Membership</p>
                <Badge variant="secondary" className="mt-1 uppercase tracking-wide">
                  {role ?? "student"}
                </Badge>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Member since</p>
                <p className="font-medium">{formatDate(profile?.created_at)}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            {[
              { label: "Books issued", value: active.length },
              { label: "Overdue", value: overdue.length },
              { label: "Returned", value: returned.length },
              {
                label: "Next due date",
                value: nextDue ? formatDate(nextDue.due_date) : "—",
              },
            ].map((s) => (
              <Card key={s.label} className="surface-paper">
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
                  <p className="font-display text-2xl font-semibold">{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Books I have issued</h2>
            <Button asChild variant="outline" size="sm">
              <Link to="/circulation">Manage returns</Link>
            </Button>
          </div>

          {isLoading ? (
            <p className="mt-4 text-muted-foreground">Loading…</p>
          ) : active.length === 0 ? (
            <Card className="surface-paper mt-4">
              <CardContent className="flex flex-col items-start gap-3 pt-6">
                <p className="text-muted-foreground">You have no books issued right now.</p>
                <Button asChild>
                  <Link to="/books">Browse the catalog</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="surface-paper mt-4 overflow-x-auto rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {active.map((row) => {
                    const left = daysUntil(row.due_date);
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <p className="font-medium">{row.books?.title}</p>
                          <p className="text-xs text-muted-foreground">{row.books?.author}</p>
                        </TableCell>
                        <TableCell>{row.books?.category}</TableCell>
                        <TableCell>{formatDate(row.issued_at)}</TableCell>
                        <TableCell>{formatDate(row.due_date)}</TableCell>
                        <TableCell>
                          {left < 0 ? (
                            <Badge variant="destructive">{Math.abs(left)} days overdue</Badge>
                          ) : (
                            <Badge variant="secondary">{left} days left</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {returned.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold">Past borrowings</h2>
            <div className="surface-paper mt-4 overflow-x-auto rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Returned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returned.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.books?.title}</TableCell>
                      <TableCell>{formatDate(row.issued_at)}</TableCell>
                      <TableCell>{formatDate(row.due_date)}</TableCell>
                      <TableCell>{formatDate(row.returned_at)}</TableCell>
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
