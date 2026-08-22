import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, CalendarClock, LayoutDashboard, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
      const { data, error } = await supabase.from("books").select("total_copies, available_copies, category");
      if (error) throw error;
      const titles = data.length;
      const copies = data.reduce((sum, b) => sum + b.total_copies, 0);
      const categories = new Set(data.map((b) => b.category)).size;
      return { titles, copies, categories };
    },
  });

  return (
    <div className="min-h-screen">
      <SiteNav />

      <main>
        <section className="border-b border-border bg-secondary/40">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-[1.15fr_1fr] md:items-center">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                <BookOpen className="size-3.5" /> College Library System
              </p>
              <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
                The whole library, <span className="text-gradient-shelf">on one shelf.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                Smart-Shelf gives students a searchable catalog with one-click borrowing, and gives librarians full
                control over inventory, loans, and overdue tracking.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/books">Browse the catalog</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/auth">Create an account</Link>
                </Button>
              </div>
            </div>

            <div className="surface-paper rounded-xl p-6">
              <p className="font-display text-sm uppercase tracking-widest text-muted-foreground">Shelf at a glance</p>
              <dl className="mt-6 grid grid-cols-3 gap-4 text-center">
                {[
                  { label: "Titles", value: stats?.titles ?? "—" },
                  { label: "Copies", value: stats?.copies ?? "—" },
                  { label: "Categories", value: stats?.categories ?? "—" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-secondary/60 py-5">
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</dt>
                    <dd className="font-display text-3xl font-semibold">{s.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-sm text-muted-foreground">
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
