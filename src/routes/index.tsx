import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, CalendarClock, LayoutDashboard, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mergeBooksWithCatalog } from "@/data/booksCatalog";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart-Shelf — College Library Management System" },
      {
        name: "description",
        content:
          "Smart-Shelf is a college library system: search the catalog, issue and return books with due-date tracking, and manage inventory from the librarian dashboard.",
      },
      { property: "og:title", content: "Smart-Shelf — College Library Management System" },
      {
        property: "og:description",
        content: "Search books, borrow with due dates, and manage the library inventory in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const features = [
  {
    icon: Search,
    title: "Searchable catalog",
    body: "Find any title by name, author, or category with live filtering across the whole shelf.",
  },
  {
    icon: CalendarClock,
    title: "Issue & return",
    body: "Borrow a copy in one click. Smart-Shelf tracks a 14-day due date and flags overdue loans.",
  },
  {
    icon: LayoutDashboard,
    title: "Librarian dashboard",
    body: "Add or remove books, watch inventory levels, and review every active and overdue loan.",
  },
];

function Home() {
  const { data: stats } = useQuery({
    queryKey: ["home-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("books").select("*");
      const booksList = mergeBooksWithCatalog(data || []);
      const titles = booksList.length;
      const copies = booksList.reduce((sum, b) => sum + b.total_copies, 0);
      const categories = new Set(booksList.map((b) => b.category)).size;
      return { titles, copies, categories };
    },
  });

  return (
    <div className="min-h-screen">
      <SiteNav />

      <main>
        <section className="relative overflow-hidden border-b border-border shadow-2xl">
          {/* Crisp, prominent bookshelf background with balanced aesthetic library overlay */}
          <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=2400&q=90"
              alt="Aesthetic Library Bookshelf"
              className="h-full w-full object-cover brightness-90 contrast-105"
            />
            {/* Rich balanced overlay: dark library vignette that keeps text 100% readable while the bookshelf is clearly visible */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/65 to-slate-950/80" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/40" />
          </div>

          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-24 md:grid-cols-[1.15fr_1fr] md:items-center">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-950/60 backdrop-blur-md px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-purple-200 shadow-md">
                <BookOpen className="size-3.5 text-purple-300" /> College Library System
              </p>
              <h1 className="text-4xl font-semibold leading-tight md:text-6xl text-white drop-shadow-sm">
                The whole library, <span className="text-purple-300 font-bold">on one shelf.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-slate-200 leading-relaxed drop-shadow-xs">
                Smart-Shelf gives students a searchable catalog with one-click borrowing, and gives librarians full
                control over inventory, loans, and overdue tracking.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-lg hover:shadow-purple-500/25 transition-all">
                  <Link to="/books">Browse the catalog</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/25 backdrop-blur-md font-medium shadow-md">
                  <Link to="/auth">Create an account</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl p-7 bg-slate-950/75 backdrop-blur-xl border border-white/15 shadow-2xl text-white">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <p className="font-display text-sm uppercase tracking-wider text-purple-200 font-semibold">Shelf at a glance</p>
                <Badge variant="outline" className="border-purple-400/40 text-purple-200 bg-purple-950/40">Live Inventory</Badge>
              </div>
              <dl className="mt-6 grid grid-cols-3 gap-3.5 text-center">
                {[
                  { label: "Titles", value: stats?.titles ?? "—" },
                  { label: "Copies", value: stats?.copies ?? "—" },
                  { label: "Categories", value: stats?.categories ?? "—" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-slate-900/80 backdrop-blur-sm py-4 border border-white/10 shadow-inner">
                    <dt className="text-xs uppercase tracking-wide text-slate-300 font-medium">{s.label}</dt>
                    <dd className="font-display text-3xl font-bold text-white mt-1">{s.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-xs text-slate-300 leading-normal">
                Loans run for 14 days. Overdue items are highlighted for both the student and the librarian.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-semibold">Built for students and librarians</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="surface-paper">
                <CardContent className="pt-6">
                  <span className="mb-4 flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <f.icon className="size-5" />
                  </span>
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <p className="mx-auto max-w-6xl px-4 text-sm text-muted-foreground">
          Smart-Shelf · Library Management System · College project demo
        </p>
      </footer>
    </div>
  );
}
