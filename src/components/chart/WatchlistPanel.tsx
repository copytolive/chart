import { Star, X } from "lucide-react";
import { formatChg, formatPct, formatPrice, formatVolume, getSymbol } from "@/lib/chart/symbols";
import { useChartStore } from "@/lib/chart/store";
import { cn } from "@/lib/utils";
import { useTickers } from "./use-market";
import type { Quote } from "@/lib/chart/market";

export function WatchlistPanel({ quote }: { quote: Quote | null }) {
  const show = useChartStore((s) => s.showWatchlist);
  const tab = useChartStore((s) => s.rightTab);
  const toggle = useChartStore((s) => s.toggleWatchlist);
  const watchlist = useChartStore((s) => s.watchlist);
  const symbol = useChartStore((s) => s.symbol);
  const setSymbol = useChartStore((s) => s.setSymbol);
  const removeWatch = useChartStore((s) => s.removeWatch);
  const favorites = useChartStore((s) => s.favorites);
  const drawings = useChartStore((s) => s.drawings);
  const removeDrawing = useChartStore((s) => s.removeDrawing);
  const overlays = useChartStore((s) => s.overlays);
  const oscillators = useChartStore((s) => s.oscillators);
  const toggleOverlay = useChartStore((s) => s.toggleOverlay);
  const toggleOscillator = useChartStore((s) => s.toggleOscillator);
  const alerts = useChartStore((s) => s.alerts);
  const removeAlert = useChartStore((s) => s.removeAlert);
  const rows = useTickers(watchlist);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const meta = getSymbol(symbol);

  if (!show) return null;

  const title =
    tab === "watchlist"
      ? "Watchlist"
      : tab === "alerts"
        ? "Alerts"
        : tab === "objects"
          ? "Object tree"
          : tab === "details"
            ? "Details"
            : tab === "news"
              ? "News"
              : "Calendar";

  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-t border-tv-border bg-tv-surface md:w-72 md:border-l md:border-t-0">
      <div className="flex h-9 items-center border-b border-tv-border px-2">
        <span className="text-2xs font-semibold text-tv-fg">{title}</span>
        <button
          type="button"
          aria-label="Close panel"
          onClick={toggle}
          className="ml-auto grid size-7 place-items-center rounded-sm text-tv-muted hover:bg-tv-elevated hover:text-tv-fg"
        >
          <X className="size-3.5" />
        </button>
      </div>
      {tab === "watchlist" ? (
        <div className="tv-scroll min-h-0 flex-1 overflow-auto">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 border-b border-tv-border px-2 py-1 text-micro uppercase tracking-wide text-tv-muted">
            <span>Symbol</span>
            <span>Last</span>
            <span>Chg</span>
            <span>Chg%</span>
          </div>
          {watchlist.map((id) => {
            const s = getSymbol(id);
            const row = byId.get(id);
            const pct = row?.changePct ?? 0;
            const active = id === symbol;
            return (
              <div
                key={id}
                className={cn(
                  "group grid w-full grid-cols-[1fr_auto_auto_auto] items-center gap-x-2 px-2 py-1.5 text-2xs hover:bg-tv-elevated",
                  active && "bg-tv-elevated",
                )}
              >
                <button type="button" onClick={() => setSymbol(id)} className="flex min-w-0 items-center gap-1 text-left">
                  <Star
                    className={cn(
                      "size-3 shrink-0",
                      favorites.includes(id) ? "fill-tv-blue text-tv-blue" : "text-tv-muted",
                    )}
                  />
                  <span className="truncate font-medium text-tv-fg">{s.ticker}</span>
                </button>
                <button type="button" onClick={() => setSymbol(id)} className="font-mono tabular-nums text-tv-fg">
                  {row ? formatPrice(row.last) : "—"}
                </button>
                <button
                  type="button"
                  onClick={() => setSymbol(id)}
                  className={cn("font-mono tabular-nums", pct >= 0 ? "text-tv-up" : "text-tv-down")}
                >
                  {row ? formatChg(row.change) : "—"}
                </button>
                <span className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => setSymbol(id)}
                    className={cn("font-mono tabular-nums", pct >= 0 ? "text-tv-up" : "text-tv-down")}
                  >
                    {row ? formatPct(pct) : "—"}
                  </button>
                  <button
                    type="button"
                    className="text-tv-subtle opacity-0 hover:text-tv-down group-hover:opacity-100"
                    aria-label={`Remove ${s.ticker}`}
                    onClick={() => removeWatch(id)}
                  >
                    ×
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
      {tab === "details" ? (
        <div className="tv-scroll flex-1 space-y-2 overflow-auto p-3 text-2xs">
          <h2 className="text-sm font-semibold text-tv-fg">{meta.name}</h2>
          <p className="text-tv-muted">
            {meta.ticker} · {meta.exchange}
          </p>
          <Stat label="Last" value={quote ? formatPrice(quote.last) : "—"} />
          <Stat label="Change" value={quote ? formatPct(quote.changePct) : "—"} up={quote ? quote.change >= 0 : undefined} />
          <Stat label="High" value={quote ? formatPrice(quote.high) : "—"} />
          <Stat label="Low" value={quote ? formatPrice(quote.low) : "—"} />
          <Stat label="Volume" value={quote ? formatVolume(quote.volume) : "—"} />
          <Stat label="Notional" value={quote ? formatVolume(quote.quoteVolume) : "—"} />
        </div>
      ) : null}
      {tab === "news" ? (
        <div className="tv-scroll flex-1 space-y-3 overflow-auto p-3 text-2xs text-tv-muted">
          <p className="font-medium text-tv-fg">Market notes</p>
          <p>
            Live candles for {meta.ticker} come from public Binance / OKX market data. This workspace is inspired by
            TradingView — it is not affiliated, not an exchange, and not financial advice.
          </p>
          <p>Use drawings, overlays and oscillators on the chart, then paper-trade from the ticket below.</p>
        </div>
      ) : null}
      {tab === "alerts" ? (
        <div className="tv-scroll flex-1 overflow-auto text-2xs">
          {alerts.length === 0 ? (
            <p className="p-4 text-tv-muted">No alerts. Use Alert in the toolbar to create one.</p>
          ) : (
            alerts.map((a) => (
              <div key={a.id} className="flex items-center gap-2 border-b border-tv-border px-3 py-2">
                <span className={cn("size-1.5 rounded-full", a.triggered ? "bg-tv-down" : "bg-tv-blue")} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-tv-fg">{a.symbol}</div>
                  <div className="text-tv-muted">
                    {a.op === "above" ? "Crossing up" : "Crossing down"} {formatPrice(a.price)}
                  </div>
                </div>
                <button type="button" onClick={() => removeAlert(a.id)} className="text-tv-subtle hover:text-tv-down">
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      ) : null}
      {tab === "objects" ? (
        <div className="tv-scroll flex-1 overflow-auto text-2xs">
          <p className="px-3 py-2 text-micro uppercase tracking-wide text-tv-muted">Indicators</p>
          {overlays.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => toggleOverlay(id)}
              className="flex w-full items-center justify-between px-3 py-1.5 text-tv-fg hover:bg-tv-elevated"
            >
              <span>{id.toUpperCase()}</span>
              <span className="text-tv-subtle">×</span>
            </button>
          ))}
          {oscillators.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => toggleOscillator(id)}
              className="flex w-full items-center justify-between px-3 py-1.5 text-tv-fg hover:bg-tv-elevated"
            >
              <span>{id.toUpperCase()}</span>
              <span className="text-tv-subtle">×</span>
            </button>
          ))}
          <p className="px-3 py-2 text-micro uppercase tracking-wide text-tv-muted">Drawings</p>
          {drawings.length === 0 ? (
            <p className="px-3 text-tv-muted">No drawings on this chart.</p>
          ) : (
            drawings.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => removeDrawing(d.id)}
                className="flex w-full items-center justify-between px-3 py-1.5 text-tv-fg hover:bg-tv-elevated"
              >
                <span className="capitalize">{d.kind === "hline" ? "Horizontal line" : d.kind}</span>
                <span className="text-tv-subtle">×</span>
              </button>
            ))
          )}
        </div>
      ) : null}
      {tab === "calendar" ? (
        <div className="tv-scroll flex-1 space-y-3 overflow-auto p-3 text-2xs text-tv-muted">
          <p className="font-medium text-tv-fg">This week</p>
          <p>FOMC minutes · USD · medium impact</p>
          <p>US CPI · USD · high impact</p>
          <p>Bitcoin options expiry · BTC · high volume window</p>
          <p className="text-micro">Sample calendar. Connect a data vendor for live events.</p>
        </div>
      ) : null}
    </aside>
  );
}

function Stat({ label, value, up }: { label: string; value: string; up?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-tv-border py-1.5">
      <span className="text-tv-muted">{label}</span>
      <span className={cn("font-mono tabular-nums text-tv-fg", up === false && "text-tv-down", up === true && "text-tv-up")}>
        {value}
      </span>
    </div>
  );
}
