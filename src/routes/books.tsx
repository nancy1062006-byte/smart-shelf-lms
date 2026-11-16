import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookOpen,
  Search,
  CheckCircle,
  AlertCircle,
  Filter,
  Check,
  RotateCcw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { ALL_CATEGORIES, mergeBooksWithCatalog, type CatalogBook } from "@/data/booksCatalog";
import { fetchMergedIssues, executeIssueBook, normalizeIsbn } from "@/lib/circulationStorage";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/books")({
  head: () => ({
    meta: [
      { title: "Book Catalog — Smart-Shelf Library" },
      {
        name: "description",
        content:
          "Search the Smart-Shelf college library catalog by title, author, or category and borrow available copies with instant 14-day loan tracking.",
      },
      { property: "og:title", content: "Book Catalog — Smart-Shelf Library" },
      {
        property: "og:description",
        content: "Search by title, author, or category and borrow available copies.",
      },
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
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Fetch remote books and merge with catalog
  const { data: rawBooks = [], isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from("books").select("*").order("title");
        if (error) {
          console.warn("Could not load remote books, using catalog:", error.message);
          return [];
        }
        return data || [];
      } catch (err) {
        console.warn("Books fetch exception, falling back to catalog:", err);
        return [];
      }
    },
  });

  const books = useMemo(() => mergeBooksWithCatalog(rawBooks), [rawBooks]);

  // Fetch user's active issues to disable re-issuing
  const { data: myIssues = [] } = useQuery({
    queryKey: ["my-issues", user?.id],
    queryFn: async () => {
      if (!user) return [];
      try {
        return await fetchMergedIssues(user.id);
      } catch (err) {
        console.warn("Could not fetch my-issues:", err);
        return [];
      }
    },
    enabled: !!user,
  });

  const issuedKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const i of myIssues) {
      if (i.status === "issued") {
        if (i.book_id) keys.add(i.book_id);
        if (i.books?.title) keys.add(i.books.title.toLowerCase());
        if (i.books?.isbn) {
          const norm = normalizeIsbn(i.books.isbn);
          if (norm) keys.add(norm);
        }
      }
    }
    return keys;
  }, [myIssues]);

  const isBookIssued = (b: CatalogBook) => {
    const norm = normalizeIsbn(b.isbn);
    return (
      (b.id && issuedKeys.has(b.id)) ||
      (b.title && issuedKeys.has(b.title.toLowerCase())) ||
      (norm && issuedKeys.has(norm))
    );
  };

  const categories = useMemo(() => ["All", ...ALL_CATEGORIES], []);

  // Filter books by query, category, and availability
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books.filter((b) => {
      const matchesCategory = category === "All" || b.category === category;
      const matchesQuery =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        (b.isbn && b.isbn.toLowerCase().includes(q));
      const matchesAvailability = !onlyAvailable || b.available_copies > 0;
      return matchesCategory && matchesQuery && matchesAvailability;
    });
  }, [books, query, category, onlyAvailable]);

  // Issue mutation
  const issueMutation = useMutation({
    mutationFn: async (book: CatalogBook) => {
      if (!user) throw new Error("Please sign in to borrow books.");
      await executeIssueBook(book, user);
    },
    onSuccess: () => {
      toast.success("Book issued successfully! Due in 14 days.");
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["my-issues"] });
      queryClient.invalidateQueries({ queryKey: ["all-issues"] });
      queryClient.invalidateQueries({ queryKey: ["home-stats"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to issue book"),
  });

  const resetFilters = () => {
    setQuery("");
    setCategory("All");
    setOnlyAvailable(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#1F2937]">
      <SiteNav />

      {/* Page Header */}
      <section className="border-b border-[#E2E8F0] bg-white py-10 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6C4AB6]">
                <BookOpen className="size-4" /> Academic Library Catalog
              </div>
              <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-[#14213D] sm:text-4xl">
                Explore College Books
              </h1>
              <p className="mt-1.5 text-sm text-[#64748B] max-w-2xl">
                Browse our comprehensive collection across 12 academic disciplines. Check real-time shelf
                availability and borrow titles with a single click.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              <div className="rounded-xl bg-[#F0EBFA] border border-[#DDD6FE] px-4 py-2.5 text-center">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#6C4AB6]">
                  Available Titles
                </span>
                <span className="font-display text-2xl font-bold text-[#14213D]">
                  {books.filter((b) => b.available_copies > 0).length} / {books.length}
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar & Quick Filters */}
          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-2xl">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-11 pl-10 pr-4 bg-white border-[#E2E8F0] text-[#1F2937] placeholder:text-[#64748B] rounded-xl shadow-xs focus-visible:ring-2 focus-visible:ring-[#6C4AB6] focus-visible:border-transparent text-sm"
                placeholder="Search by book title, author, category, or ISBN…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOnlyAvailable((prev) => !prev)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold border transition-all cursor-pointer ${
                  onlyAvailable
                    ? "bg-[#15803D] text-white border-[#15803D] shadow-xs"
                    : "bg-white text-[#1F2937] border-[#E2E8F0] hover:bg-slate-50"
                }`}
              >
                <Check className={`size-3.5 ${onlyAvailable ? "text-white" : "text-transparent"}`} />
                Available Copies Only
              </button>

              {(query || category !== "All" || onlyAvailable) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-xs text-[#DC2626] hover:bg-rose-50 hover:text-[#DC2626] h-10 px-3"
                >
                  <RotateCcw className="size-3.5 mr-1" /> Reset Filters
                </Button>
              )}
            </div>
          </div>

          {/* Category Chips Filter */}
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[#64748B]">
              <Filter className="size-3.5" /> Filter by Category:
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const isActive = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer border ${
                      isActive
                        ? "bg-[#6C4AB6] text-white border-[#6C4AB6] shadow-xs font-semibold"
                        : "bg-white text-[#1F2937] border-[#E2E8F0] hover:bg-[#F0EBFA] hover:text-[#6C4AB6]"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Grid */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Results Counter */}
        <div className="mb-6 flex items-center justify-between text-xs text-[#64748B]">
          <p>
            Showing <span className="font-bold text-[#14213D]">{filtered.length}</span> titles
            {category !== "All" && (
              <span>
                {" "}
                in <span className="font-semibold text-[#6C4AB6]">{category}</span>
              </span>
            )}
            {query && (
              <span>
                {" "}
                matching "<span className="font-semibold text-[#14213D]">{query}</span>"
              </span>
            )}
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm"
              >
                <div className="h-52 w-full rounded-xl bg-slate-200 mb-4" />
                <div className="h-5 w-3/4 rounded bg-slate-200 mb-2" />
                <div className="h-4 w-1/2 rounded bg-slate-200 mb-4" />
                <div className="h-8 w-full rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#F0EBFA] text-[#6C4AB6] mx-auto mb-4">
              <BookOpen className="size-7" />
            </div>
            <h3 className="font-display text-lg font-bold text-[#14213D]">No books found</h3>
            <p className="mt-1.5 text-sm text-[#64748B]">
              No titles matched your current search and filter criteria. Try adjusting your search query or reset the
              filters.
            </p>
            <Button
              onClick={resetFilters}
              className="mt-6 bg-[#6C4AB6] hover:bg-[#8B5CF6] text-white text-xs font-semibold"
            >
              Reset All Filters
            </Button>
          </div>
        ) : (
          /* Book Cards Grid */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((book) => {
              const issued = isBookIssued(book);
              const isAvailable = book.available_copies > 0;

              return (
                <Card
                  key={book.id || book.title}
                  className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm hover:shadow-md hover:border-[#6C4AB6]/50 transition-all group"
                >
                  {/* Book Cover Image */}
                  <div className="relative h-56 w-full overflow-hidden bg-slate-100 border-b border-[#E2E8F0]">
                    {book.cover_url || book.isbn ? (
                      <img
                        src={
                          book.cover_url ||
                          (book.isbn ? `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg` : undefined)
                        }
                        alt={`Cover of ${book.title}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (book.isbn && !target.dataset.triedGoogle) {
                            target.dataset.triedGoogle = "true";
                            target.src = `https://books.google.com/books/content?vid=isbn${book.isbn}&printsec=frontcover&img=1&zoom=1`;
                          } else {
                            target.style.display = "none";
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "flex";
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400"
                      style={{ display: book.cover_url || book.isbn ? "none" : "flex" }}
                    >
                      <BookOpen className="size-12" />
                    </div>

                    {/* Category Badge */}
                    <Badge className="absolute left-3 top-3 bg-[#F0EBFA] text-[#6C4AB6] border-[#DDD6FE] font-semibold text-xs shadow-xs">
                      {book.category}
                    </Badge>

                    {/* In-Stock Tag */}
                    <Badge
                      className={`absolute right-3 top-3 text-[10px] font-semibold shadow-xs ${
                        isAvailable
                          ? "bg-emerald-50 text-[#15803D] border-emerald-200"
                          : "bg-rose-50 text-[#B91C1C] border-rose-200"
                      }`}
                    >
                      {isAvailable ? "In Stock" : "Out of Stock"}
                    </Badge>
                  </div>

                  {/* Book Details */}
                  <CardContent className="flex flex-1 flex-col p-5">
                    <h2 className="font-display text-base font-bold text-[#1F2937] leading-snug line-clamp-1 group-hover:text-[#6C4AB6] transition-colors">
                      {book.title}
                    </h2>
                    <p className="text-xs text-[#64748B] mt-0.5">{book.author}</p>

                    {book.description && (
                      <p className="mt-2.5 line-clamp-2 text-xs text-[#64748B] leading-relaxed">
                        {book.description}
                      </p>
                    )}

                    {/* Stock & Availability Info */}
                    <div className="mt-auto pt-4 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                      <div>
                        <span
                          className={`font-bold ${
                            isAvailable ? "text-[#15803D]" : "text-[#DC2626]"
                          }`}
                        >
                          {book.available_copies} of {book.total_copies}
                        </span>
                        <span className="text-[#64748B] ml-1">available</span>
                      </div>
                      {book.isbn && (
                        <span className="text-[10px] font-mono text-slate-400">
                          ISBN {book.isbn.slice(-6)}
                        </span>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 pt-1">
                      {user ? (
                        issued ? (
                          <Button
                            className="w-full bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed text-xs font-semibold"
                            disabled
                          >
                            <CheckCircle className="size-3.5 mr-1 text-[#15803D]" /> Already Issued
                          </Button>
                        ) : (
                          <Button
                            className={`w-full text-xs font-semibold shadow-xs transition-all ${
                              isAvailable
                                ? "bg-[#6C4AB6] hover:bg-[#8B5CF6] text-white cursor-pointer"
                                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                            }`}
                            disabled={!isAvailable || issueMutation.isPending}
                            onClick={() => issueMutation.mutate(book)}
                          >
                            {issueMutation.isPending ? (
                              "Processing..."
                            ) : isAvailable ? (
                              "Issue Book (14 Days)"
                            ) : (
                              "All Copies Borrowed"
                            )}
                          </Button>
                        )
                      ) : (
                        <Button
                          asChild
                          variant="outline"
                          className="w-full border-[#6C4AB6] text-[#6C4AB6] hover:bg-[#F0EBFA] text-xs font-semibold"
                        >
                          <Link to="/auth">Sign In to Borrow</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
