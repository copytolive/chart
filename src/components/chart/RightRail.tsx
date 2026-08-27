import {
  Bell,
  CalendarDays,
  HelpCircle,
  Layers,
  List,
  Newspaper,
  PanelRight,
} from "lucide-react";
import { type RightTab, useChartStore } from "@/lib/chart/store";
import { cn } from "@/lib/utils";

const ITEMS: { id: RightTab; label: string; icon: typeof List }[] = [
  { id: "watchlist", label: "Watchlist", icon: List },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "objects", label: "Object tree", icon: Layers },
  { id: "details", label: "Details", icon: PanelRight },
  { id: "news", label: "News", icon: Newspaper },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
];

export function RightRail() {
  const tab = useChartStore((s) => s.rightTab);
  const show = useChartStore((s) => s.showWatchlist);
  const setTab = useChartStore((s) => s.setRightTab);

  return (
    <aside className="hidden w-11 shrink-0 flex-col items-center border-l border-tv-border bg-tv-surface py-1 md:flex">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const on = show && tab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            title={item.label}
            aria-label={item.label}
            aria-pressed={on}
            onClick={() => setTab(item.id)}
            className={cn(
              "grid size-9 place-items-center rounded-sm text-tv-muted transition-colors hover:bg-tv-elevated hover:text-tv-fg",
              on && "bg-tv-elevated text-tv-blue",
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} />
          </button>
        );
      })}
      <div className="mt-auto pb-1">
        <a
          href="https://www.tradingview.com/lightweight-charts/"
          target="_blank"
          rel="noreferrer"
          title="Help · Lightweight Charts"
          className="grid size-9 place-items-center rounded-sm text-tv-muted hover:bg-tv-elevated hover:text-tv-fg"
        >
          <HelpCircle className="size-4" />
        </a>
      </div>
    </aside>
  );
}
