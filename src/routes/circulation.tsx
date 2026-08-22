import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { daysUntil, formatDate, useSession } from "@/lib/session";
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
        content: "Track the books you have borrowed from Smart-Shelf, see due dates, spot overdue loans, and return books.",
      },
      { property: "og:title", content: "Issue & Return — Smart-Shelf Library" },
      { property: "og:description", content: "Your borrowed books, due dates, and one-click returns." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CirculationPage,
});

type IssueRow = {
  id: string;
  issued_at: string;
  due_date: string;
  returned_at: string | null;
  status: string;
  books: { title: string; author: string; category: string } | null;
};

function CirculationPage() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

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

  const returnMutation = useMutation({
    mutationFn: async (issueId: string) => {
      const { error } = await supabase.rpc("return_book", { _issue_id: issueId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Book returned. Thank you!");
      queryClient.invalidateQueries({ queryKey: ["my-issues"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["all-issues"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const active = issues.filter((i) => i.status === "issued");
  const history = issues.filter((i) => i.status !== "issued");
  const overdue = active.filter((i) => daysUntil(i.due_date) < 0);

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-semibold md:text-4xl">Issue &amp; Return</h1>
        <p className="mt-2 text-muted-foreground">Loans run for 14 days from the issue date.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Currently borrowed", value: active.length },
            { label: "Overdue", value: overdue.length },
            { label: "Returned", value: history.length },
          ].map((s) => (
            <Card key={s.label} className="surface-paper">
              <CardContent className="pt-6">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="font-display text-3xl font-semibold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Currently borrowed</h2>
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
                    <TableHead>Issued</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
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
                        <TableCell>{formatDate(row.issued_at)}</TableCell>
                        <TableCell>{formatDate(row.due_date)}</TableCell>
                        <TableCell>
                          {left < 0 ? (
                            <Badge variant="destructive">{Math.abs(left)} days overdue</Badge>
                          ) : (
                            <Badge variant="secondary">{left} days left</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={returnMutation.isPending}
                            onClick={() => returnMutation.mutate(row.id)}
                          >
                            Return
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

        {history.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold">Return history</h2>
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
                  {history.map((row) => (
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
