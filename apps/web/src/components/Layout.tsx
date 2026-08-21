import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { cn } from "@/lib/utils";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "glass-tab motion-interactive text-sm",
    isActive
      ? "glass-tab-active text-foreground font-medium"
      : "text-muted-foreground hover:text-foreground",
  );

function titleForPath(pathname: string): string {
  if (pathname === "/") return "Findings | Kerbside";
  if (pathname === "/controls") return "Controls | Kerbside";
  if (pathname === "/cities") return "Cities | Kerbside";
  if (pathname === "/guide") return "Story | Kerbside";
  if (pathname.startsWith("/experiments/")) return "Experiment evidence | Kerbside";
  return "Page not found | Kerbside";
}

export function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = titleForPath(pathname);
  }, [pathname]);

  return (
    <div className="bg-background text-foreground flex min-h-svh flex-col overflow-x-clip">
      <a
        href="#main-content"
        className="bg-background text-foreground sr-only fixed left-4 top-4 z-50 rounded-md border px-3 py-2 shadow-sm focus:not-sr-only"
      >
        Skip to main content
      </a>
      <header className="glass-surface sticky top-0 z-40 border-b">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-6">
          <div className="space-y-1">
            <Link
              to="/"
              viewTransition
              className="motion-interactive text-primary inline-flex rounded-lg px-1 text-2xl font-semibold tracking-tight"
            >
              kerbside
            </Link>
            <p className="text-muted-foreground text-sm">
              Which street-network settings actually predict cycle counts?
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-2 gap-y-2" aria-label="Primary">
            <NavLink to="/guide" viewTransition className={navLinkClass}>
              Story
            </NavLink>
            <NavLink to="/" end viewTransition className={navLinkClass}>
              Findings
            </NavLink>
            <NavLink to="/cities" viewTransition className={navLinkClass}>
              Cities
            </NavLink>
            <NavLink to="/controls" viewTransition className={navLinkClass}>
              Controls
            </NavLink>
          </nav>
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <div key={pathname} className="page-shell">
          <Outlet />
        </div>
      </main>
      <footer className="glass-surface border-t">
        <div className="text-muted-foreground mx-auto flex max-w-5xl flex-col gap-2 px-6 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>Kerbside — updated August 2026.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link to="/guide" viewTransition className="motion-interactive rounded-sm hover:text-foreground underline underline-offset-2">
              Story
            </Link>
            <Link to="/" viewTransition className="motion-interactive rounded-sm hover:text-foreground underline underline-offset-2">
              Findings
            </Link>
            <Link to="/cities" viewTransition className="motion-interactive rounded-sm hover:text-foreground underline underline-offset-2">
              Cities
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
