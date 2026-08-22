import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "librarian" | "student";

export type SessionState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  role: Role | null;
  fullName: string;
};

export function useSession(): SessionState {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    let active = true;

    const loadDetails = async (userId: string | undefined) => {
      if (!userId) {
        if (active) {
          setRole(null);
          setFullName("");
        }
        return;
      }
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
      ]);
      if (!active) return;
      const isLibrarian = (roles ?? []).some((r) => r.role === "librarian");
      setRole(isLibrarian ? "librarian" : (roles ?? []).length > 0 ? "student" : "student");
      setFullName(profile?.full_name ?? "");
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
      void loadDetails(newSession?.user?.id);
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
      void loadDetails(data.session?.user?.id);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { loading, session, user: session?.user ?? null, role, fullName };
}

export function daysUntil(dateStr: string): number {
  const due = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
