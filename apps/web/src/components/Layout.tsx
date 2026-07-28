import { Link, NavLink, Outlet } from "react-router";
import { cn } from "@/lib/utils";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "text-sm transition-colors",
    isActive
      ? "text-foreground font-medium"
      : "text-muted-foreground hover:text-foreground",
  );

export function Layout() {
  return (
    <div className="bg-background text-foreground min-h-svh">
      <header className="border-border border-b">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-6">
          <div className="space-y-1">
            <Link
              to="/"
              className="text-primary text-2xl font-semibold tracking-tight"
            >
              kerbside
            </Link>
            <p className="text-muted-foreground text-sm">
              street-level evidence for active-travel network models
            </p>
          </div>
          <nav className="flex items-center gap-6" aria-label="Primary">
            <NavLink to="/" end className={navLinkClass}>
              Scoreboard
            </NavLink>
            <NavLink to="/cities" className={navLinkClass}>
              Cities
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
