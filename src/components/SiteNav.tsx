import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, LogOut, Menu, X, Shield, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SiteNav() {
  const { user, role, fullName } = useSession();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      navigate({ to: "/auth", replace: true });
    } catch (err) {
      console.error("Sign out error:", err);
      navigate({ to: "/auth", replace: true });
    }
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/books", label: "Books" },
    ...(user ? [{ to: "/dashboard", label: "My Dashboard" }] : []),
    ...(user ? [{ to: "/circulation", label: "Issue / Return" }] : []),
    ...(role === "librarian" ? [{ to: "/admin", label: "Admin Panel" }] : []),
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-[#1D3557] bg-[#14213D]/95 backdrop-blur-md text-white shadow-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] rounded-lg p-1">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C4AB6] to-[#8B5CF6] text-white shadow-md shadow-[#6C4AB6]/30 transition-transform group-hover:scale-105">
            <BookOpen className="size-5" />
          </span>
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold tracking-tight text-white leading-tight">
              Smart-Shelf
            </span>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-300">
              College Library System
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1.5 md:flex" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const isActive = currentPath === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-[#6C4AB6] text-white shadow-sm font-semibold"
                    : "text-slate-200 hover:bg-white/10 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action / Auth Status */}
        <div className="hidden items-center gap-3.5 md:flex">
          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-white/15">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-full bg-[#1D3557] border border-white/20 text-[#8B5CF6]">
                  {role === "librarian" ? <Shield className="size-4 text-purple-300" /> : <UserIcon className="size-4 text-purple-300" />}
                </div>
                <div className="text-left leading-tight">
                  <p className="text-sm font-semibold text-white max-w-[140px] truncate" title={fullName || user.email || ""}>
                    {fullName || user.email?.split("@")[0] || "Member"}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "mt-0.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0",
                      role === "librarian"
                        ? "bg-purple-950/70 text-purple-200 border-purple-400/50"
                        : "bg-blue-950/60 text-blue-200 border-blue-400/40"
                    )}
                  >
                    {role === "librarian" ? "Librarian" : "Student"}
                  </Badge>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="ml-2 border-white/25 text-white hover:bg-rose-500/20 hover:text-rose-100 hover:border-rose-400/50 bg-[#1D3557]/60 cursor-pointer text-xs font-medium"
              >
                <LogOut className="size-3.5 mr-1" /> Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="text-slate-200 hover:text-white hover:bg-white/10 text-sm font-medium"
              >
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-[#6C4AB6] hover:bg-[#8B5CF6] text-white font-medium shadow-md transition-all text-sm px-4"
              >
                <Link to="/auth">Get Started</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-white hover:bg-white/10"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </Button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-[#1D3557] bg-[#14213D] px-4 py-4 md:hidden animate-in slide-in-from-top-2 duration-200 shadow-2xl">
          <nav className="flex flex-col gap-1.5" aria-label="Mobile Navigation">
            {navLinks.map((link) => {
              const isActive = currentPath === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "rounded-lg px-3.5 py-2.5 text-base font-medium transition-colors",
                    isActive
                      ? "bg-[#6C4AB6] text-white font-semibold"
                      : "text-slate-200 hover:bg-white/10 hover:text-white"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="mt-3 pt-3 border-t border-white/15">
              {user ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 px-2">
                    <div className="flex size-9 items-center justify-center rounded-full bg-[#1D3557] text-[#8B5CF6]">
                      <UserIcon className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{fullName || user.email}</p>
                      <Badge variant="outline" className="text-[10px] uppercase text-purple-200 border-purple-400/40 mt-0.5">
                        {role === "librarian" ? "Librarian" : "Student"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-white/20 text-white hover:bg-rose-500/20 hover:text-rose-100 mt-1"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                  >
                    <LogOut className="size-4 mr-2" /> Sign out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    asChild
                    className="w-full bg-[#6C4AB6] hover:bg-[#8B5CF6] text-white font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link to="/auth">Sign In / Register</Link>
                  </Button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
