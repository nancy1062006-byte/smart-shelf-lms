import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { daysUntil, formatDate, useSession } from "@/lib/session";
import { fetchMergedIssues, executeReturnBook, type IssueRecord } from "@/lib/circulationStorage";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen } from "lucide-react";

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

function CirculationPage() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const { data: issues = [], isLoading } = useQuery<IssueRecord[]>({
    queryKey: ["my-issues", user?.id],
    enabled: !!user,
    queryFn: async () => {
      return await fetchMergedIssues(user!.id);
    },
  });

  const returnMutation = useMutation({
    mutationFn: async ({ issueId, bookId }: { issueId: string; bookId?: string }) => {
      await executeReturnBook(issueId, bookId);
    },
    onSuccess: () => {
      toast.success("Book returned. Thank you!");
      queryClient.invalidateQueries({ queryKey: ["my-issues"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["all-issues"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to return book"),
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
                    <TableHead>Category</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
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
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {coverUrl ? (
                              <img
                                src={coverUrl}
                                alt={bookTitle}
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
                              <p className="font-medium">{bookTitle}</p>
                              <p className="text-xs text-muted-foreground">{bookAuthor}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{category}</Badge>
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
                            onClick={() => returnMutation.mutate({ issueId: row.id, bookId: row.book_id })}
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
                    <TableHead>Category</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Returned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {row.books?.cover_url && (
                            <img
                              src={row.books.cover_url}
                              alt={row.books.title}
                              className="h-10 w-7 rounded object-cover shadow-xs bg-muted flex-shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                          )}
                          <div>
                            <p className="font-medium">{row.books?.title || "Library Book"}</p>
                            <p className="text-xs text-muted-foreground">{row.books?.author || "Catalog Title"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.books?.category || "General"}</Badge>
                      </TableCell>
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
