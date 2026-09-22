import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const linkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";
const activeClass = "bg-secondary text-foreground";

export function SiteNav() {
  const { user, role, fullName } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const links = [
    { to: "/", label: "Home" },
    { to: "/books", label: "Books" },
    ...(user ? [{ to: "/dashboard", label: "My Dashboard" }] : []),
    ...(user ? [{ to: "/circulation", label: "Issue / Return" }] : []),
    ...(role === "librarian" ? [{ to: "/admin", label: "Admin" }] : []),
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BookOpen className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">Smart-Shelf</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={linkClass} activeProps={{ className: cn(linkClass, activeClass) }}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <div className="text-right leading-tight">
                <p className="text-sm font-medium">{fullName || user.email}</p>
                <Badge variant="secondary" className="mt-0.5 text-[10px] uppercase tracking-wide">
                  {role ?? "student"}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="size-4" /> Sign out
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          <Menu className="size-5" />
        </Button>
      </div>

      {open && (
        <div className="border-t border-border bg-card px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className={linkClass} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            {user ? (
              <Button variant="outline" size="sm" className="mt-2" onClick={handleSignOut}>
                <LogOut className="size-4" /> Sign out
              </Button>
            ) : (
              <Button asChild size="sm" className="mt-2">
                <Link to="/auth" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
