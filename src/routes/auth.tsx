import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BookOpen, Lock, Mail, User, Shield, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In or Register — Smart-Shelf Library" },
      {
        name: "description",
        content:
          "Create a Smart-Shelf student or librarian account to borrow books and manage college library circulation.",
      },
      { property: "og:title", content: "Sign In or Register — Smart-Shelf Library" },
      {
        property: "og:description",
        content: "Student and librarian access to the Smart-Shelf college library system.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [busy, setBusy] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");

  useEffect(() => {
    if (!loading && session) navigate({ to: "/books", replace: true });
  }, [loading, session, navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back to Smart-Shelf!");
    navigate({ to: "/books" });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name, role },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      toast.success("Registration received! Please check your email to confirm your account.");
      return;
    }
    toast.success("Account created successfully!");
    navigate({ to: "/books" });
  };

  const signInWithGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/books" });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F6FA] px-4 py-12 text-[#1F2937]">
      {/* Return to Home link */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#6C4AB6] transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to Home
        </Link>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          College Portal
        </span>
      </div>

      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-[#6C4AB6] text-white shadow-md shadow-[#6C4AB6]/30 transition-transform group-hover:scale-105">
              <BookOpen className="size-6" />
            </span>
            <span className="font-display text-2xl font-bold tracking-tight text-[#14213D]">
              Smart-Shelf
            </span>
          </Link>
          <p className="mt-1.5 text-xs text-[#64748B]">College Library Management System</p>
        </div>

        {/* Auth Card */}
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-lg">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="font-display text-xl font-bold text-[#14213D]">
              Library Access
            </CardTitle>
            <CardDescription className="text-xs text-[#64748B] mt-1">
              Sign in to manage borrowed books or register a new college library account.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-0">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-xl bg-slate-100 p-1 mb-6">
                <TabsTrigger
                  value="login"
                  className="rounded-lg text-xs font-semibold text-[#64748B] data-[state=active]:bg-white data-[state=active]:text-[#14213D] data-[state=active]:shadow-xs transition-all"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-lg text-xs font-semibold text-[#64748B] data-[state=active]:bg-white data-[state=active]:text-[#14213D] data-[state=active]:shadow-xs transition-all"
                >
                  Create Account
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form className="space-y-4" onSubmit={signIn}>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-xs font-bold text-[#14213D]">
                      College Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="login-email"
                        type="email"
                        required
                        placeholder="student@college.edu"
                        className="h-10 pl-9 bg-white border-[#E2E8F0] text-[#1F2937] placeholder:text-slate-400 text-xs rounded-xl focus-visible:ring-2 focus-visible:ring-[#6C4AB6]"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="login-password" className="text-xs font-bold text-[#14213D]">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="login-password"
                        type="password"
                        required
                        placeholder="••••••••"
                        className="h-10 pl-9 bg-white border-[#E2E8F0] text-[#1F2937] placeholder:text-slate-400 text-xs rounded-xl focus-visible:ring-2 focus-visible:ring-[#6C4AB6]"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 bg-[#6C4AB6] hover:bg-[#8B5CF6] text-white font-semibold shadow-xs text-xs mt-2"
                    disabled={busy}
                  >
                    {busy ? "Signing in..." : "Sign In to Library"}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form className="space-y-4" onSubmit={signUp}>
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-bold text-[#14213D]">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="name"
                        required
                        placeholder="Alex Johnson"
                        className="h-10 pl-9 bg-white border-[#E2E8F0] text-[#1F2937] placeholder:text-slate-400 text-xs rounded-xl focus-visible:ring-2 focus-visible:ring-[#6C4AB6]"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-bold text-[#14213D]">
                      College Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        required
                        placeholder="alex@college.edu"
                        className="h-10 pl-9 bg-white border-[#E2E8F0] text-[#1F2937] placeholder:text-slate-400 text-xs rounded-xl focus-visible:ring-2 focus-visible:ring-[#6C4AB6]"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-bold text-[#14213D]">
                      Password (min. 6 characters)
                    </Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="password"
                        type="password"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        className="h-10 pl-9 bg-white border-[#E2E8F0] text-[#1F2937] placeholder:text-slate-400 text-xs rounded-xl focus-visible:ring-2 focus-visible:ring-[#6C4AB6]"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Role Selector */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#14213D]">Select Role</Label>
                    <RadioGroup
                      value={role}
                      onValueChange={setRole}
                      className="grid grid-cols-2 gap-3"
                    >
                      <label
                        className={`flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer transition-all ${
                          role === "student"
                            ? "border-[#6C4AB6] bg-[#F0EBFA] text-[#6C4AB6]"
                            : "border-[#E2E8F0] bg-white text-[#1F2937] hover:bg-slate-50"
                        }`}
                      >
                        <RadioGroupItem value="student" className="text-[#6C4AB6]" />
                        <span className="text-xs font-semibold">Student</span>
                      </label>

                      <label
                        className={`flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer transition-all ${
                          role === "librarian"
                            ? "border-[#6C4AB6] bg-[#F0EBFA] text-[#6C4AB6]"
                            : "border-[#E2E8F0] bg-white text-[#1F2937] hover:bg-slate-50"
                        }`}
                      >
                        <RadioGroupItem value="librarian" className="text-[#6C4AB6]" />
                        <span className="text-xs font-semibold">Librarian</span>
                      </label>
                    </RadioGroup>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 bg-[#6C4AB6] hover:bg-[#8B5CF6] text-white font-semibold shadow-xs text-xs mt-2"
                    disabled={busy}
                  >
                    {busy ? "Creating account..." : "Complete Registration"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <span className="h-px flex-1 bg-[#E2E8F0]" /> or continue with{" "}
              <span className="h-px flex-1 bg-[#E2E8F0]" />
            </div>

            {/* Google OAuth Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 border-[#E2E8F0] bg-white text-[#14213D] hover:bg-slate-50 font-semibold text-xs shadow-xs"
              onClick={signInWithGoogle}
            >
              <svg className="size-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign in with Google
            </Button>
          </CardContent>
        </Card>

        {/* Info footer */}
        <p className="mt-6 text-center text-xs text-[#64748B]">
          College final year project · Secure Supabase Authentication
        </p>
      </div>
    </div>
  );
}
