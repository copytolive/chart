import { CalendarSearch } from "lucide-react";
import { DATE_RANGES, useChartStore } from "@/lib/chart/store";
import { cn } from "@/lib/utils";

export function DateRangeBar() {
  const dateRange = useChartStore((s) => s.dateRange);
  const setDateRange = useChartStore((s) => s.setDateRange);
  const setDialog = useChartStore((s) => s.setDialog);
  const logScale = useChartStore((s) => s.logScale);
  const toggleLog = useChartStore((s) => s.toggleLog);

  return (
    <div className="flex h-7 shrink-0 items-center gap-0.5 border-t border-tv-border bg-tv-bg px-1 text-tv-muted">
      {DATE_RANGES.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => setDateRange(r.id)}
          className={cn(
            "h-6 rounded-sm px-1.5 font-mono text-micro font-medium hover:bg-tv-elevated hover:text-tv-fg",
            dateRange === r.id && "text-tv-blue",
          )}
        >
          {r.label}
        </button>
      ))}
      <button
        type="button"
        title="Go to"
        onClick={() => setDialog("goto")}
        className="ml-1 grid size-6 place-items-center rounded-sm hover:bg-tv-elevated hover:text-tv-fg"
      >
        <CalendarSearch className="size-3.5" />
      </button>
      <span className="ml-auto flex items-center gap-2 pr-1 text-micro">
        <button
          type="button"
          onClick={toggleLog}
          className={cn("hover:text-tv-fg", logScale && "text-tv-blue")}
        >
          {logScale ? "log" : "auto"}
        </button>
        <span>UTC</span>
      </span>
    </div>
  );
}
