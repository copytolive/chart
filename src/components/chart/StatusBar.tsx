import { cn } from "@/lib/utils";
import { useChartStore } from "@/lib/chart/store";

export function StatusBar({
  status,
  source,
}: {
  status: "loading" | "live" | "delayed" | "offline";
  source: string;
}) {
  const logScale = useChartStore((s) => s.logScale);
  const toggleLog = useChartStore((s) => s.toggleLog);
  const magnet = useChartStore((s) => s.magnet);
  const toggleMagnet = useChartStore((s) => s.toggleMagnet);

  return (
    <footer className="flex h-6 shrink-0 items-center gap-3 border-t border-tv-border bg-tv-surface px-2 text-micro text-tv-muted">
      <span className="flex items-center gap-1.5">
        <span
          className={cn(
            "size-1.5 rounded-full",
            status === "live" && "bg-tv-up",
            status === "delayed" && "bg-tv-blue",
            status === "loading" && "bg-tv-muted",
            status === "offline" && "bg-tv-down",
          )}
        />
        {status === "live" ? "LIVE" : status === "delayed" ? "DELAYED" : status === "loading" ? "LOADING" : "OFFLINE"}
      </span>
      <span className="hidden sm:inline">{source}</span>
      <a
        href="https://www.tradingview.com/lightweight-charts/"
        target="_blank"
        rel="noreferrer"
        className="hidden hover:text-tv-fg md:inline"
      >
        Charts by TradingView Lightweight Charts
      </a>
      <span className="ml-auto flex items-center gap-2">
        <button type="button" onClick={toggleMagnet} className={cn("hover:text-tv-fg", magnet && "text-tv-blue")}>
          magnet {magnet ? "on" : "off"}
        </button>
        <button type="button" onClick={toggleLog} className={cn("hover:text-tv-fg", logScale && "text-tv-blue")}>
          {logScale ? "log" : "linear"}
        </button>
        <span>adj</span>
        <span>UTC</span>
      </span>
    </footer>
  );
}
