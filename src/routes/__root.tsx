import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F6FA] px-4">
      <div className="max-w-md text-center rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <h1 className="text-6xl font-bold text-[#6C4AB6] font-display">404</h1>
        <h2 className="mt-4 text-xl font-bold text-[#14213D] font-display">Page Not Found</h2>
        <p className="mt-2 text-sm text-[#64748B]">
          The library page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-[#6C4AB6] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#8B5CF6]"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F6FA] px-4">
      <div className="max-w-md text-center rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-[#14213D] font-display">
          Unable to Load Library View
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Something went wrong while connecting to the college library catalog. You can try refreshing or return home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-[#6C4AB6] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#8B5CF6] cursor-pointer"
          >
            Try Again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-semibold text-[#14213D] transition-colors hover:bg-slate-50"
          >
            Go to Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Smart-Shelf — College Library Management System" },
      {
        name: "description",
        content: "Smart-Shelf: search the library catalog, issue and return books, and manage inventory.",
      },
      { property: "og:title", content: "Smart-Shelf — College Library Management System" },
      {
        property: "og:description",
        content: "Search the library catalog, issue and return books, and manage inventory.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=DM+Sans:wght@400;500;600&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}

