import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/books")({
  head: () => ({
    meta: [
      { title: "Book catalog — Smart-Shelf Library" },
      {
        name: "description",
        content: "Search the Smart-Shelf college library catalog by title, author, or category and borrow available copies.",
      },
      { property: "og:title", content: "Book catalog — Smart-Shelf Library" },
      { property: "og:description", content: "Search by title, author, or category and borrow available copies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BooksPage,
});

function BooksPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const { data, error } = await supabase.from("books").select("*").order("title");
      if (error) throw error;
      return data;
    },
  });

  const { data: myIssues = [] } = useQuery({
    queryKey: ["my-issues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issued_books")
        .select("book_id")
        .eq("status", "issued");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const issuedBookIds = useMemo(() => new Set(myIssues.map((i) => i.book_id)), [myIssues]);

  const categories = useMemo(() => ["All", ...Array.from(new Set(books.map((b) => b.category))).sort()], [books]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books.filter((b) => {
      const matchesCategory = category === "All" || b.category === category;
      const matchesQuery =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [books, query, category]);

  const issueMutation = useMutation({
    mutationFn: async (bookId: string) => {
      const { error } = await supabase.rpc("issue_book", { _book_id: bookId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Book issued — due in 14 days.");
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["my-issues"] });
      queryClient.invalidateQueries({ queryKey: ["all-issues"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-semibold md:text-4xl">Book catalog</h1>
        <p className="mt-2 text-muted-foreground">Search by title, author, or category.</p>

        <div className="mt-6 flex flex-col gap-4">
          <div className="relative max-w-lg">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search books…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Button
                key={c}
                size="sm"
                variant={category === c ? "default" : "outline"}
                onClick={() => setCategory(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="mt-10 text-muted-foreground">Loading catalog…</p>
        ) : filtered.length === 0 ? (
          <p className="mt-10 text-muted-foreground">No books match that search.</p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((book) => (
              <Card key={book.id} className="surface-paper flex flex-col overflow-hidden">
                <div className="relative h-56 w-full overflow-hidden border-b border-border bg-secondary/60">
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={`Cover of ${book.title}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BookOpen className="size-10 text-muted-foreground/50" />
                    </div>
                  )}
                  <Badge className="absolute left-3 top-3 shadow-sm">{book.category}</Badge>
                </div>
                <CardContent className="flex flex-1 flex-col pt-5">
                  <h2 className="font-display text-xl font-semibold leading-snug">{book.title}</h2>
                  <p className="text-sm text-muted-foreground">{book.author}</p>
                  {book.description && (
                    <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{book.description}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className={book.available_copies > 0 ? "text-primary" : "text-destructive"}>
                      {book.available_copies} of {book.total_copies} available
                    </span>
                    {book.isbn && <span className="text-xs text-muted-foreground">ISBN {book.isbn}</span>}
                  </div>
                  <div className="mt-5 pt-1">
                    {user ? (
                      issuedBookIds.has(book.id) ? (
                        <Button className="w-full" disabled>
                          Already issued
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          disabled={book.available_copies < 1 || issueMutation.isPending}
                          onClick={() => issueMutation.mutate(book.id)}
                        >
                          {book.available_copies > 0 ? "Issue book" : "All copies out"}
                        </Button>
                      )
                    ) : (
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/auth">Sign in to borrow</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
