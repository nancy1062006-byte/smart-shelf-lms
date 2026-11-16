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
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md text-slate-800 shadow-xs transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] rounded-lg p-1">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C4AB6] to-[#8B5CF6] text-white shadow-md shadow-[#6C4AB6]/30 transition-transform group-hover:scale-105">
            <BookOpen className="size-5" />
          </span>
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold tracking-tight text-slate-900 leading-tight">
              Smart-Shelf
            </span>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-500">
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
                    ? "bg-[#6C4AB6] text-white shadow-xs font-semibold"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
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
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-full bg-purple-50 border border-purple-200 text-[#6C4AB6]">
                  {role === "librarian" ? <Shield className="size-4 text-[#6C4AB6]" /> : <UserIcon className="size-4 text-[#6C4AB6]" />}
                </div>
                <div className="text-left leading-tight">
                  <p className="text-sm font-semibold text-slate-900 max-w-[140px] truncate" title={fullName || user.email || ""}>
                    {fullName || user.email?.split("@")[0] || "Member"}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "mt-0.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0",
                      role === "librarian"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
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
                className="ml-2 border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 bg-white shadow-2xs cursor-pointer text-xs font-medium"
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
                className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-sm font-medium"
              >
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-[#6C4AB6] hover:bg-[#8B5CF6] text-white font-medium shadow-xs transition-all text-sm px-4"
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
          className="md:hidden text-slate-800 hover:bg-slate-100"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </Button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-4 md:hidden animate-in slide-in-from-top-2 duration-200 shadow-xl text-slate-800">
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
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="mt-3 pt-3 border-t border-slate-200">
              {user ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 px-2">
                    <div className="flex size-9 items-center justify-center rounded-full bg-purple-50 text-[#6C4AB6] border border-purple-200">
                      <UserIcon className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{fullName || user.email}</p>
                      <Badge variant="outline" className="text-[10px] uppercase text-purple-700 border-purple-200 mt-0.5">
                        {role === "librarian" ? "Librarian" : "Student"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 mt-1"
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
