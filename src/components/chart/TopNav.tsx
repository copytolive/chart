import { Bell, CalendarDays, ChevronDown, Search, User } from "lucide-react";
import { useChartStore } from "@/lib/chart/store";
import { cn } from "@/lib/utils";

const LINKS = ["Products", "Community", "Markets", "Brokers", "More"] as const;

export function TopNav() {
  const setSearchOpen = useChartStore((s) => s.setSearchOpen);
  const setBottomTab = useChartStore((s) => s.setBottomTab);

  return (
    <header className="flex h-12 shrink-0 items-center gap-1 border-b border-tv-border bg-tv-surface px-2 text-tv-fg md:px-3">
      <div className="flex items-center gap-2 pr-2">
        <Logo />
        <span className="hidden font-semibold tracking-tight text-tv-fg sm:inline">Chart</span>
      </div>
      <nav className="hidden items-center gap-0.5 md:flex">
        {LINKS.map((label) => (
          <button
            key={label}
            type="button"
            className="flex h-8 items-center gap-0.5 rounded-sm px-2 text-2xs font-medium text-tv-muted transition-colors hover:bg-tv-elevated hover:text-tv-fg"
          >
            {label}
            <ChevronDown className="size-3 opacity-70" />
          </button>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex h-8 items-center gap-2 rounded-sm border border-tv-border bg-tv-bg px-2 text-2xs text-tv-muted transition-colors hover:border-tv-blue hover:text-tv-fg md:min-w-44"
        >
          <Search className="size-3.5" />
          <span className="hidden md:inline">Search</span>
          <kbd className="ml-auto hidden rounded-xs border border-tv-border px-1 font-mono text-micro text-tv-subtle md:inline">
            /
          </kbd>
        </button>
        <span className="hidden md:contents">
          <IconBtn label="Calendar">
            <CalendarDays className="size-4" />
          </IconBtn>
          <IconBtn label="Alerts" onClick={() => setBottomTab("data")}>
            <Bell className="size-4" />
          </IconBtn>
          <IconBtn label="Account">
            <User className="size-4" />
          </IconBtn>
        </span>
        <button
          type="button"
          onClick={() => setBottomTab("trade")}
          className="ml-1 h-8 rounded-sm bg-tv-blue px-2 text-2xs font-semibold text-tv-fg transition-colors hover:bg-tv-blue-dim md:px-3"
        >
          Get started
        </button>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 28 28" className="size-7" aria-hidden="true">
      <rect width="28" height="28" rx="5" className="fill-tv-bg" />
      <rect x="6" y="9" width="4" height="11" className="fill-tv-up" />
      <rect x="7.4" y="5" width="1.2" height="18" className="fill-tv-up" />
      <rect x="12" y="7" width="4" height="9" className="fill-tv-down" />
      <rect x="13.4" y="4" width="1.2" height="16" className="fill-tv-down" />
      <rect x="18" y="11" width="4" height="8" className="fill-tv-blue" />
      <rect x="19.4" y="8" width="1.2" height="14" className="fill-tv-blue" />
    </svg>
  );
}

function IconBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-sm text-tv-muted transition-colors",
        "hover:bg-tv-elevated hover:text-tv-fg",
      )}
    >
      {children}
    </button>
  );
}
