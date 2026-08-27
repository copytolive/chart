import { formatPrice, getSymbol } from "@/lib/chart/symbols";
import { useChartStore } from "@/lib/chart/store";
import { cn } from "@/lib/utils";
import type { Candle } from "@/lib/chart/indicators";
import type { Quote } from "@/lib/chart/market";

const TABS = [
  ["trade", "Trading Panel"],
  ["positions", "Positions"],
  ["orders", "Orders"],
  ["data", "Data Window"],
  ["pine", "Pine Editor"],
  ["strategy", "Strategy Tester"],
] as const;

export function BottomDock({ candles, quote }: { candles: Candle[]; quote: Quote | null }) {
  const show = useChartStore((s) => s.showBottom);
  const tab = useChartStore((s) => s.bottomTab);
  const setTab = useChartStore((s) => s.setBottomTab);
  const toggle = useChartStore((s) => s.toggleBottom);
  const cash = useChartStore((s) => s.cash);
  const qty = useChartStore((s) => s.qty);
  const fills = useChartStore((s) => s.fills);
  const paperBuy = useChartStore((s) => s.paperBuy);
  const paperSell = useChartStore((s) => s.paperSell);
  const symbol = useChartStore((s) => s.symbol);
  const last = quote?.last ?? candles.at(-1)?.close ?? 0;
  const posValue = qty * last;
  const meta = getSymbol(symbol);

  return (
    <section className="shrink-0 border-t border-tv-border bg-tv-surface">
      <div className="flex h-8 items-center border-b border-tv-border px-1">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "h-7 rounded-sm px-2 text-2xs font-medium text-tv-muted hover:text-tv-fg",
              show && tab === id && "text-tv-fg",
            )}
          >
            {label}
          </button>
        ))}
        <button type="button" onClick={toggle} className="ml-auto h-7 px-2 text-micro text-tv-muted hover:text-tv-fg">
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {show ? (
        <div className="h-40 overflow-auto md:h-44">
          {tab === "trade" ? (
            <div className="grid h-full gap-4 p-3 md:grid-cols-[240px_1fr]">
              <div className="flex flex-col gap-2">
                <p className="text-2xs text-tv-muted">
                  Paper · {meta.ticker} @ <span className="font-mono text-tv-fg">{formatPrice(last)}</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => paperBuy(last)}
                    className="h-9 rounded-sm bg-tv-up text-2xs font-semibold text-tv-bg hover:opacity-90"
                  >
                    Buy $1,000
                  </button>
                  <button
                    type="button"
                    onClick={() => paperSell(last)}
                    className="h-9 rounded-sm bg-tv-down text-2xs font-semibold text-tv-fg hover:opacity-90"
                  >
                    Sell all
                  </button>
                </div>
                <p className="text-micro text-tv-muted">Simulated fills only. No real order is sent.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-2xs md:grid-cols-4">
                <Metric label="Cash" value={`$${cash.toLocaleString("en-US", { maximumFractionDigits: 2 })}`} />
                <Metric label="Position" value={`${qty.toFixed(6)} ${meta.ticker.replace("USD", "")}`} />
                <Metric label="Mkt value" value={`$${posValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}`} />
                <Metric
                  label="Equity"
                  value={`$${(cash + posValue).toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
                />
              </div>
            </div>
          ) : null}
          {tab === "positions" ? (
            <table className="w-full text-left text-2xs">
              <thead className="text-tv-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Symbol</th>
                  <th className="px-3 py-2 font-medium">Qty</th>
                  <th className="px-3 py-2 font-medium">Last</th>
                  <th className="px-3 py-2 font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {qty > 0 ? (
                  <tr className="border-t border-tv-border">
                    <td className="px-3 py-2 font-medium">{meta.ticker}</td>
                    <td className="px-3 py-2 font-mono">{qty.toFixed(6)}</td>
                    <td className="px-3 py-2 font-mono">{formatPrice(last)}</td>
                    <td className="px-3 py-2 font-mono">${posValue.toFixed(2)}</td>
                  </tr>
                ) : (
                  <tr>
                    <td className="px-3 py-6 text-tv-muted" colSpan={4}>
                      No open paper position.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : null}
          {tab === "orders" ? (
            <table className="w-full text-left text-2xs">
              <thead className="text-tv-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Time</th>
                  <th className="px-3 py-2 font-medium">Side</th>
                  <th className="px-3 py-2 font-medium">Symbol</th>
                  <th className="px-3 py-2 font-medium">Qty</th>
                  <th className="px-3 py-2 font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {fills.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-tv-muted" colSpan={5}>
                      No paper fills yet. Use Buy / Sell on the Trading Panel.
                    </td>
                  </tr>
                ) : (
                  fills.map((f) => (
                    <tr key={f.id} className="border-t border-tv-border">
                      <td className="px-3 py-1.5 font-mono text-tv-muted">{new Date(f.time).toISOString().slice(11, 19)}</td>
                      <td className={cn("px-3 py-1.5 font-medium", f.side === "buy" ? "text-tv-up" : "text-tv-down")}>
                        {f.side.toUpperCase()}
                      </td>
                      <td className="px-3 py-1.5">{f.symbol}</td>
                      <td className="px-3 py-1.5 font-mono">{f.qty.toFixed(6)}</td>
                      <td className="px-3 py-1.5 font-mono">{formatPrice(f.price)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : null}
          {tab === "data" ? (
            <div className="grid grid-cols-2 gap-2 p-3 text-2xs md:grid-cols-4">
              <Metric label="Open" value={quote ? formatPrice(quote.open) : "—"} />
              <Metric label="High" value={quote ? formatPrice(quote.high) : "—"} />
              <Metric label="Low" value={quote ? formatPrice(quote.low) : "—"} />
              <Metric label="Close" value={quote ? formatPrice(quote.last) : "—"} />
            </div>
          ) : null}
          {tab === "pine" ? (
            <div className="p-4 font-mono text-2xs text-tv-muted">
              // Pine scripts are not executed in this workspace.
              <br />
              // Add Moving Average, RSI or MACD from Indicators instead.
            </div>
          ) : null}
          {tab === "strategy" ? (
            <div className="p-4 text-2xs text-tv-muted">
              Paper fills on the Orders tab are the strategy log. Replay walks historical bars so you can rehearse
              entries before sending a simulated order.
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-micro uppercase tracking-wide text-tv-muted">{label}</div>
      <div className="font-mono text-sm tabular-nums text-tv-fg">{value}</div>
    </div>
  );
}
