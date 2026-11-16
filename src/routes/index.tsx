import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  BookOpen,
  CalendarClock,
  LayoutDashboard,
  Search,
  CheckCircle2,
  BookmarkCheck,
  Layers,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mergeBooksWithCatalog, type CatalogBook } from "@/data/booksCatalog";
import { useSession } from "@/lib/session";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart-Shelf — College Library Management System" },
      {
        name: "description",
        content:
          "Smart-Shelf is a premier college library system: search the live catalog, issue and return books with automated 14-day tracking, and manage inventory with ease.",
      },
      { property: "og:title", content: "Smart-Shelf — College Library Management System" },
      {
        property: "og:description",
        content: "Search books, borrow with automated due dates, and track library circulation on one shelf.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const libraryFeatures = [
  {
    icon: BookOpen,
    title: "Digital Book Collection",
    description:
      "Explore a comprehensive multi-disciplinary catalog spanning 12 academic categories with verified ISBNs and details.",
  },
  {
    icon: Search,
    title: "Easy Book Search",
    description:
      "Instant real-time search by title, author, category, or ISBN with immediate filtering across the entire shelf collection.",
  },
  {
    icon: CalendarClock,
    title: "Issue & Return Management",
    description:
      "One-click borrowing with automated 14-day due-date calculation, overdue tracking, and fast book return processing.",
  },
  {
    icon: LayoutDashboard,
    title: "Student Dashboard",
    description:
      "Personalized portal showing your active loans, due date countdowns, overdue warnings, and past borrowing history.",
  },
  {
    icon: Layers,
    title: "Book Availability Tracking",
    description:
      "Real-time stock indicators showing total and available copies per title, preventing double-borrowing.",
  },
  {
    icon: ShieldCheck,
    title: "Library Management",
    description:
      "Admin features for librarians: add new inventory, remove titles, issue books to members, and monitor circulation.",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Explore Books",
    description:
      "Browse our curated collection across academic categories or use smart search to find specific subjects.",
    icon: Search,
  },
  {
    step: "02",
    title: "Find Your Required Book",
    description:
      "Check live copy availability, read book synopses, verify ISBN numbers, and review edition information.",
    icon: BookmarkCheck,
  },
  {
    step: "03",
    title: "Issue or Return Books",
    description:
      "Borrow any available title with a single click. Every loan automatically sets a 14-day return due date.",
    icon: CalendarClock,
  },
  {
    step: "04",
    title: "Track Your Library Activity",
    description:
      "Monitor your personal dashboard for due date alerts, overdue status, and complete borrowing history.",
    icon: UserCheck,
  },
];

function Home() {
  const { user } = useSession();

  // Fetch books from database and merge with catalog
  const { data: books = [], isLoading } = useQuery<CatalogBook[]>({
    queryKey: ["books"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from("books").select("*").order("title");
        if (error) {
          console.warn("Could not load remote books for home stats, using default catalog:", error.message);
          return mergeBooksWithCatalog([]);
        }
        return mergeBooksWithCatalog(data || []);
      } catch (err) {
        console.warn("Home stats fetch exception, falling back to catalog:", err);
        return mergeBooksWithCatalog([]);
      }
    },
  });

  // Calculate dynamic stats from actual database data
  const stats = useMemo(() => {
    const titles = books.length;
    const copies = books.reduce((sum, b) => sum + (b.total_copies || 0), 0);
    const available = books.reduce((sum, b) => sum + (b.available_copies || 0), 0);
    const categories = new Set(books.map((b) => b.category)).size;
    return { titles, copies, available, categories };
  }, [books]);

  // Derive Popular Books (highest total copies / most popular titles)
  const popularBooks = useMemo(() => {
    return [...books]
      .sort((a, b) => b.total_copies - a.total_copies || b.available_copies - a.available_copies)
      .slice(0, 4);
  }, [books]);

  // Derive Recently Added Books (latest entries or end of collection)
  const recentlyAddedBooks = useMemo(() => {
    return [...books]
      .sort((a, b) => {
        if (a.created_at && b.created_at) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return 0;
      })
      .slice(0, 4);
  }, [books]);

  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#1F2937]">
      <SiteNav />

      <main>
        {/* ================= HERO SECTION ================= */}
        <section className="relative overflow-hidden border-b border-[#E2E8F0] bg-[#FAF7F2] shadow-sm">
          {/* Warm Cozy Bookshelf Background Image with Light 80-85% White/Cream Overlay */}
          <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1507842229451-7f01dd8629d8?auto=format&fit=crop&w=2400&q=90"
              alt="Warm Cozy College Library Bookshelf"
              className="h-full w-full object-cover object-center brightness-95 contrast-95"
            />
            {/* Subtle, Light 80-85% White/Cream Tint Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/88 via-[#FDFBF7]/82 to-white/88 backdrop-blur-[2px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FAF7F2] via-transparent to-white/50" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-[1.2fr_0.9fr] md:items-center lg:py-28 lg:px-8">
            {/* Left Content */}
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#DDD6FE] bg-white/90 backdrop-blur-md px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#6C4AB6] shadow-xs">
                <Sparkles className="size-3.5 text-[#6C4AB6]" /> College Library Management System
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-[#14213D] md:text-5xl lg:text-6xl leading-[1.15] font-display">
                The whole library,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C4AB6] via-[#7C3AED] to-[#1D3557]">
                  on one shelf.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg text-[#334155] leading-relaxed font-medium">
                Smart-Shelf empowers students with an interactive catalog, real-time availability, and one-click
                borrowing, while giving librarians complete control over inventory, active loans, and overdue tracking.
              </p>

              {/* Dynamic Action Buttons based on Auth Status */}
              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-[#6C4AB6] hover:bg-[#8B5CF6] text-white font-semibold shadow-lg shadow-[#6C4AB6]/25 transition-all hover:-translate-y-0.5 text-base px-6 h-12"
                >
                  <Link to="/books">
                    Explore Books <ArrowRight className="size-4 ml-1" />
                  </Link>
                </Button>

                {user ? (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="bg-white hover:bg-slate-50 text-[#14213D] border-[#CBD5E1] font-semibold shadow-xs text-base px-6 h-12 transition-all"
                  >
                    <Link to="/dashboard">
                      <LayoutDashboard className="size-4 mr-2 text-[#6C4AB6]" /> My Dashboard
                    </Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="bg-white hover:bg-slate-50 text-[#14213D] border-[#CBD5E1] font-semibold shadow-xs text-base px-6 h-12 transition-all"
                  >
                    <Link to="/auth">Create an Account</Link>
                  </Button>
                )}
              </div>

              {/* Highlights */}
              <div className="mt-8 flex flex-wrap items-center gap-6 pt-6 border-t border-[#E2E8F0] text-xs text-[#475569] font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-[#15803D]" /> 14-Day Automated Loan Period
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-[#15803D]" /> Multi-disciplinary Catalog
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-[#15803D]" /> Instant Due Date Alerts
                </span>
              </div>
            </div>

            {/* Right Card: Shelf at a Glance (Dynamic Statistics) */}
            <div className="rounded-2xl p-7 bg-white/95 backdrop-blur-md border border-[#E2E8F0] shadow-xl text-[#1F2937] transition-all">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#6C4AB6] border border-[#DDD6FE]">
                    <Layers className="size-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-base uppercase tracking-wider text-[#14213D] font-bold">
                      Shelf at a Glance
                    </h2>
                    <p className="text-[11px] text-[#64748B]">Live Database Metrics</p>
                  </div>
                </div>
                <Badge
                  className="border-emerald-200 text-[#15803D] bg-emerald-50 text-xs px-2.5 py-0.5 font-semibold"
                >
                  <span className="size-2 rounded-full bg-[#15803D] inline-block mr-1.5 animate-pulse" />
                  Active System
                </Badge>
              </div>

              {/* Dynamic Metric Cards */}
              <dl className="mt-6 grid grid-cols-3 gap-3.5 text-center">
                <div className="rounded-xl bg-[#FAF7F2] p-4 border border-[#E2E8F0] shadow-xs transition-all hover:border-[#6C4AB6]/40 hover:bg-white">
                  <div className="flex justify-center text-[#6C4AB6] mb-1.5">
                    <BookOpen className="size-5" />
                  </div>
                  <dt className="text-xs uppercase tracking-wide text-[#64748B] font-bold">Total Titles</dt>
                  <dd className="font-display text-3xl font-bold text-[#14213D] mt-1">
                    {isLoading ? (
                      <span className="inline-block size-6 animate-pulse rounded bg-slate-200" />
                    ) : (
                      stats.titles
                    )}
                  </dd>
                </div>

                <div className="rounded-xl bg-[#FAF7F2] p-4 border border-[#E2E8F0] shadow-xs transition-all hover:border-[#6C4AB6]/40 hover:bg-white">
                  <div className="flex justify-center text-[#15803D] mb-1.5">
                    <BookmarkCheck className="size-5" />
                  </div>
                  <dt className="text-xs uppercase tracking-wide text-[#64748B] font-bold">Total Copies</dt>
                  <dd className="font-display text-3xl font-bold text-[#14213D] mt-1">
                    {isLoading ? (
                      <span className="inline-block size-6 animate-pulse rounded bg-slate-200" />
                    ) : (
                      stats.copies
                    )}
                  </dd>
                </div>

                <div className="rounded-xl bg-[#FAF7F2] p-4 border border-[#E2E8F0] shadow-xs transition-all hover:border-[#6C4AB6]/40 hover:bg-white">
                  <div className="flex justify-center text-[#D97706] mb-1.5">
                    <Layers className="size-5" />
                  </div>
                  <dt className="text-xs uppercase tracking-wide text-[#64748B] font-bold">Categories</dt>
                  <dd className="font-display text-3xl font-bold text-[#14213D] mt-1">
                    {isLoading ? (
                      <span className="inline-block size-6 animate-pulse rounded bg-slate-200" />
                    ) : (
                      stats.categories
                    )}
                  </dd>
                </div>
              </dl>

              {/* Real-time Availability Bar */}
              <div className="mt-6 rounded-xl bg-[#F8FAFC] p-4 border border-[#E2E8F0]">
                <div className="flex items-center justify-between text-xs text-[#334155] font-semibold mb-1.5">
                  <span>Available on Shelf</span>
                  <span className="font-bold text-[#15803D]">
                    {stats.available} of {stats.copies} copies
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#6C4AB6] to-[#15803D] transition-all duration-500"
                    style={{
                      width: `${stats.copies > 0 ? (stats.available / stats.copies) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <p className="mt-4 text-xs text-[#64748B] leading-normal text-center">
                Loans run for 14 calendar days. Inventory counts dynamically update with every issue and return.
              </p>
            </div>
          </div>
        </section>

        {/* ================= POPULAR BOOKS SECTION ================= */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6C4AB6]">
                <TrendingUp className="size-4" /> Recommended Collection
              </div>
              <h2 className="text-2xl font-bold text-[#14213D] md:text-3xl font-display mt-1">
                Popular in Library
              </h2>
              <p className="mt-1 text-sm text-[#64748B]">
                Discover widely borrowed titles and high-demand college textbooks across departments.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-[#6C4AB6] text-[#6C4AB6] hover:bg-[#F0EBFA] font-medium shrink-0"
            >
              <Link to="/books">
                View All Books <ArrowRight className="size-3.5 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {popularBooks.map((book) => (
              <Card
                key={book.id || book.title}
                className="flex flex-col overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm hover:shadow-md hover:border-[#6C4AB6]/40 transition-all group"
              >
                {/* Book Cover Header */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100 border-b border-[#E2E8F0]">
                  {book.cover_url || book.isbn ? (
                    <img
                      src={
                        book.cover_url ||
                        (book.isbn ? `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg` : undefined)
                      }
                      alt={book.title}
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
                    <BookOpen className="size-10" />
                  </div>
                  <Badge className="absolute left-3 top-3 bg-[#F0EBFA] text-[#6C4AB6] border-[#DDD6FE] font-medium shadow-xs">
                    {book.category}
                  </Badge>
                </div>

                {/* Card Content */}
                <CardContent className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-base font-bold text-[#1F2937] line-clamp-1 group-hover:text-[#6C4AB6] transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">{book.author}</p>

                  <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-[#E2E8F0]">
                    <span
                      className={`font-semibold ${
                        book.available_copies > 0 ? "text-[#15803D]" : "text-[#DC2626]"
                      }`}
                    >
                      {book.available_copies > 0
                        ? `${book.available_copies} of ${book.total_copies} Copies`
                        : "Out of Stock"}
                    </span>
                    {book.isbn && <span className="text-[10px] text-slate-400">ISBN: {book.isbn.slice(-6)}</span>}
                  </div>

                  <div className="mt-4 pt-1">
                    <Button
                      asChild
                      size="sm"
                      className="w-full bg-[#14213D] hover:bg-[#1D3557] text-white text-xs font-semibold shadow-xs"
                    >
                      <Link to="/books">
                        {book.available_copies > 0 ? "Borrow Book" : "View in Catalog"}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ================= RECENTLY ADDED BOOKS SECTION ================= */}
        <section className="bg-white border-y border-[#E2E8F0] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8B5CF6]">
                  <Sparkles className="size-4" /> New Arrivals
                </div>
                <h2 className="text-2xl font-bold text-[#14213D] md:text-3xl font-display mt-1">
                  Recently Added Books
                </h2>
                <p className="mt-1 text-sm text-[#64748B]">
                  Latest additions to the college library across technology, science, and literature.
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-[#1D3557] text-[#1D3557] hover:bg-slate-50 font-medium shrink-0"
              >
                <Link to="/books">
                  Browse Full Catalog <ArrowRight className="size-3.5 ml-1" />
                </Link>
              </Button>
            </div>

            {recentlyAddedBooks.length === 0 ? (
              <div className="mt-8 rounded-xl border border-dashed border-[#E2E8F0] p-12 text-center">
                <BookOpen className="size-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#1F2937]">No recently added books found</p>
                <p className="text-xs text-[#64748B] mt-1">Books added by the librarian will appear here.</p>
              </div>
            ) : (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {recentlyAddedBooks.map((book) => (
                  <Card
                    key={book.id || book.title}
                    className="flex flex-col overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm hover:shadow-md hover:border-[#6C4AB6]/40 transition-all group"
                  >
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100 border-b border-[#E2E8F0]">
                      {book.cover_url || book.isbn ? (
                        <img
                          src={
                            book.cover_url ||
                            (book.isbn ? `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg` : undefined)
                          }
                          alt={book.title}
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
                        <BookOpen className="size-10" />
                      </div>
                      <Badge className="absolute left-3 top-3 bg-[#14213D] text-white border-none font-medium shadow-xs">
                        New
                      </Badge>
                      <Badge className="absolute right-3 top-3 bg-white/90 backdrop-blur-xs text-[#1F2937] border-[#E2E8F0] text-[10px]">
                        {book.category}
                      </Badge>
                    </div>

                    <CardContent className="flex flex-1 flex-col p-5">
                      <h3 className="font-display text-base font-bold text-[#1F2937] line-clamp-1 group-hover:text-[#6C4AB6] transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-xs text-[#64748B] mt-0.5">{book.author}</p>

                      <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-[#E2E8F0]">
                        <span
                          className={`font-semibold ${
                            book.available_copies > 0 ? "text-[#15803D]" : "text-[#DC2626]"
                          }`}
                        >
                          {book.available_copies > 0
                            ? `${book.available_copies} of ${book.total_copies} Available`
                            : "Borrowed Out"}
                        </span>
                        <span className="text-[10px] text-slate-400">14-Day Loan</span>
                      </div>

                      <div className="mt-4 pt-1">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="w-full border-[#6C4AB6] text-[#6C4AB6] hover:bg-[#F0EBFA] text-xs font-semibold"
                        >
                          <Link to="/books">View Book</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ================= LIBRARY FEATURES SECTION ================= */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0EBFA] px-3.5 py-1 text-xs font-bold text-[#6C4AB6] uppercase tracking-wider">
              System Capabilities
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#14213D] sm:text-4xl font-display">
              Built for Students and Librarians
            </h2>
            <p className="mt-3 text-base text-[#64748B] leading-relaxed">
              Every essential feature you need to search academic literature, track loans seamlessly, and run college
              circulation operations efficiently.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {libraryFeatures.map((feat) => {
              const IconComp = feat.icon;
              return (
                <Card
                  key={feat.title}
                  className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm hover:shadow-md hover:border-[#6C4AB6]/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex size-12 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#6C4AB6] border border-[#DDD6FE] shadow-xs mb-5">
                      <IconComp className="size-6" />
                    </div>
                    <h3 className="text-lg font-bold text-[#14213D] font-display">{feat.title}</h3>
                    <p className="mt-2 text-sm text-[#64748B] leading-relaxed">{feat.description}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#F1F5F9] flex items-center text-xs font-semibold text-[#6C4AB6]">
                    Fully Supported <CheckCircle2 className="size-3.5 ml-1.5 text-[#15803D]" />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ================= HOW SMART-SHELF WORKS SECTION ================= */}
        <section className="bg-gradient-to-b from-white to-[#F5F6FA] border-t border-[#E2E8F0] py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#14213D] px-3.5 py-1 text-xs font-bold text-white uppercase tracking-wider">
                Simple 4-Step Process
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#14213D] sm:text-4xl font-display">
                How Smart-Shelf Works
              </h2>
              <p className="mt-3 text-base text-[#64748B]">
                A clean, intuitive library workflow designed to save time for both students and staff.
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {workflowSteps.map((step, idx) => {
                const IconComp = step.icon;
                return (
                  <div
                    key={step.step}
                    className="relative flex flex-col rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <span className="font-display text-2xl font-bold text-[#6C4AB6] bg-[#F0EBFA] size-11 flex items-center justify-center rounded-xl border border-[#DDD6FE]">
                        {step.step}
                      </span>
                      <div className="flex size-10 items-center justify-center rounded-lg bg-slate-50 text-slate-500 group-hover:text-[#6C4AB6] group-hover:bg-[#F0EBFA] transition-colors">
                        <IconComp className="size-5" />
                      </div>
                    </div>

                    <h3 className="font-display text-lg font-bold text-[#14213D] mb-2">{step.title}</h3>
                    <p className="text-sm text-[#64748B] leading-relaxed flex-1">{step.description}</p>

                    <div className="mt-5 pt-3 border-t border-[#F1F5F9] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Step {idx + 1} of 4
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= CALL TO ACTION BANNER ================= */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#14213D] via-[#1D3557] to-[#14213D] px-8 py-14 text-white shadow-xl sm:px-14 lg:flex lg:items-center lg:justify-between border border-[#1D3557]">
            <div className="max-w-xl">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl font-display">
                Ready to explore the library catalog?
              </h2>
              <p className="mt-3 text-base text-slate-200 leading-relaxed">
                Log in with your college credentials to issue books in seconds or browse our complete multi-category
                collection.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-4 lg:mt-0 lg:shrink-0">
              <Button
                asChild
                size="lg"
                className="bg-[#6C4AB6] hover:bg-[#8B5CF6] text-white font-semibold shadow-md px-6 h-12"
              >
                <Link to="/books">Browse All Books</Link>
              </Button>
              {!user && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/10 hover:bg-white/20 text-white font-medium px-6 h-12"
                >
                  <Link to="/auth">Sign In / Register</Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-[#E2E8F0] bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-[#6C4AB6] text-white">
                  <BookOpen className="size-4" />
                </span>
                <span className="font-display text-lg font-bold text-[#14213D]">Smart-Shelf</span>
              </div>
              <p className="mt-3 text-sm text-[#64748B] max-w-sm leading-relaxed">
                Smart-Shelf is an advanced college library management system offering real-time catalog search, automated
                issue and return workflows, and comprehensive inventory management.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#14213D] font-display">
                Quick Navigation
              </h4>
              <ul className="mt-3 space-y-2 text-sm text-[#64748B]">
                <li>
                  <Link to="/" className="hover:text-[#6C4AB6] transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/books" className="hover:text-[#6C4AB6] transition-colors">
                    Book Catalog
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-[#6C4AB6] transition-colors">
                    My Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/circulation" className="hover:text-[#6C4AB6] transition-colors">
                    Issue &amp; Return
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#14213D] font-display">System Info</h4>
              <ul className="mt-3 space-y-2 text-sm text-[#64748B]">
                <li>Academic Year 2026</li>
                <li>Final Year BCA Project Demonstration</li>
                <li>Powered by Supabase &amp; React</li>
                <li>14-Day Loan Policy Enabled</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-[#E2E8F0] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B]">
            <p>© 2026 Smart-Shelf LMS. All rights reserved.</p>
            <p className="mt-2 sm:mt-0">College Library Management System · Demo Environment</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
