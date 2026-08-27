import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { SYMBOLS, formatPrice, getSymbol } from "@/lib/chart/symbols";
import { type OverlayId, type OscillatorId, useChartStore } from "@/lib/chart/store";
import { cn } from "@/lib/utils";
import { CheckRow } from "./Flyout";

const OVERLAYS: { id: OverlayId; label: string }[] = [
  { id: "ma20", label: "Moving Average (20)" },
  { id: "ma50", label: "Moving Average (50)" },
  { id: "ema20", label: "EMA (20)" },
  { id: "bb", label: "Bollinger Bands" },
  { id: "vwap", label: "VWAP" },
];

const OSC: { id: OscillatorId; label: string }[] = [
  { id: "rsi", label: "Relative Strength Index (14)" },
  { id: "macd", label: "MACD" },
];

export function ChartDialogs({ lastPrice }: { lastPrice: number }) {
  const dialog = useChartStore((s) => s.dialog);
  const setDialog = useChartStore((s) => s.setDialog);
  if (!dialog) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-tv-bg/60 px-3 pt-20">
      <div className="relative w-full max-w-lg overflow-hidden rounded-md border border-tv-border bg-tv-surface shadow-2xl">
        {dialog === "indicators" ? <IndicatorsBody /> : null}
        {dialog === "settings" ? <SettingsBody /> : null}
        {dialog === "alert" ? <AlertBody lastPrice={lastPrice} /> : null}
        {dialog === "compare" ? <CompareBody /> : null}
        {dialog === "goto" ? <GotoBody /> : null}
        {dialog === "layout" ? <LayoutBody /> : null}
        <button
          type="button"
          onClick={() => setDialog(null)}
          className="absolute right-2 top-2 grid size-7 place-items-center rounded-sm text-tv-muted hover:bg-tv-elevated hover:text-tv-fg"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

function Head({ title }: { title: string }) {
  return <h2 className="border-b border-tv-border px-4 py-3 text-sm font-semibold text-tv-fg">{title}</h2>;
}

function IndicatorsBody() {
  const [q, setQ] = useState("");
  const overlays = useChartStore((s) => s.overlays);
  const oscillators = useChartStore((s) => s.oscillators);
  const toggleOverlay = useChartStore((s) => s.toggleOverlay);
  const toggleOscillator = useChartStore((s) => s.toggleOscillator);
  const n = q.trim().toLowerCase();
  const ov = OVERLAYS.filter((o) => o.label.toLowerCase().includes(n));
  const os = OSC.filter((o) => o.label.toLowerCase().includes(n));
  return (
    <>
      <Head title="Indicators, metrics and strategies" />
      <div className="p-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          className="mb-2 h-8 w-full rounded-sm border border-tv-border bg-tv-bg px-2 text-2xs text-tv-fg outline-none"
        />
        <p className="px-1 pb-1 text-micro uppercase tracking-wide text-tv-muted">Overlays</p>
        {ov.map((o) => (
          <CheckRow key={o.id} label={o.label} on={overlays.includes(o.id)} onClick={() => toggleOverlay(o.id)} />
        ))}
        <p className="px-1 pb-1 pt-2 text-micro uppercase tracking-wide text-tv-muted">Oscillators</p>
        {os.map((o) => (
          <CheckRow
            key={o.id}
            label={o.label}
            on={oscillators.includes(o.id)}
            onClick={() => toggleOscillator(o.id)}
          />
        ))}
      </div>
    </>
  );
}

function SettingsBody() {
  const logScale = useChartStore((s) => s.logScale);
  const toggleLog = useChartStore((s) => s.toggleLog);
  const showVolume = useChartStore((s) => s.showVolume);
  const toggleVolume = useChartStore((s) => s.toggleVolume);
  const magnet = useChartStore((s) => s.magnet);
  const toggleMagnet = useChartStore((s) => s.toggleMagnet);
  return (
    <>
      <Head title="Chart settings" />
      <div className="p-2">
        <CheckRow label="Logarithmic scale" on={logScale} onClick={toggleLog} />
        <CheckRow label="Volume" on={showVolume} onClick={toggleVolume} />
        <CheckRow label="Magnet mode" on={magnet} onClick={toggleMagnet} />
        <p className="px-3 py-2 text-micro text-tv-muted">
          Candle colors follow the TradingView dark palette: up #089981, down #f23645. Background #131722.
        </p>
      </div>
    </>
  );
}

function AlertBody({ lastPrice }: { lastPrice: number }) {
  const symbol = useChartStore((s) => s.symbol);
  const addAlert = useChartStore((s) => s.addAlert);
  const setDialog = useChartStore((s) => s.setDialog);
  const setRightTab = useChartStore((s) => s.setRightTab);
  const [op, setOp] = useState<"above" | "below">("above");
  const [price, setPrice] = useState(lastPrice ? String(lastPrice.toFixed(2)) : "");
  const meta = getSymbol(symbol);
  return (
    <>
      <Head title="Create alert" />
      <div className="space-y-3 p-4 text-2xs">
        <p className="text-tv-muted">
          {meta.ticker} · last {formatPrice(lastPrice)}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOp("above")}
            className={cn(
              "h-8 flex-1 rounded-sm border text-2xs",
              op === "above" ? "border-tv-blue text-tv-blue" : "border-tv-border text-tv-muted",
            )}
          >
            Crossing up
          </button>
          <button
            type="button"
            onClick={() => setOp("below")}
            className={cn(
              "h-8 flex-1 rounded-sm border text-2xs",
              op === "below" ? "border-tv-blue text-tv-blue" : "border-tv-border text-tv-muted",
            )}
          >
            Crossing down
          </button>
        </div>
        <label className="block text-tv-muted">
          Price
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 h-8 w-full rounded-sm border border-tv-border bg-tv-bg px-2 font-mono text-tv-fg outline-none"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            const n = Number(price);
            if (!Number.isFinite(n) || n <= 0) return;
            addAlert({ symbol, op, price: n });
            setRightTab("alerts");
            setDialog(null);
          }}
          className="h-9 w-full rounded-sm bg-tv-blue text-2xs font-semibold text-tv-fg"
        >
          Create
        </button>
      </div>
    </>
  );
}

function CompareBody() {
  const [q, setQ] = useState("");
  const compare = useChartStore((s) => s.compare);
  const toggleCompare = useChartStore((s) => s.toggleCompare);
  const symbol = useChartStore((s) => s.symbol);
  const results = useMemo(() => {
    const n = q.trim().toLowerCase();
    return SYMBOLS.filter((s) => s.id !== symbol).filter(
      (s) => !n || s.ticker.toLowerCase().includes(n) || s.name.toLowerCase().includes(n),
    );
  }, [q, symbol]);
  return (
    <>
      <Head title="Compare symbol" />
      <div className="p-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          className="mb-2 h-8 w-full rounded-sm border border-tv-border bg-tv-bg px-2 text-2xs text-tv-fg outline-none"
        />
        <ul className="tv-scroll max-h-72 overflow-auto">
          {results.map((s) => (
            <li key={s.id}>
              <CheckRow label={`${s.ticker}  ${s.name}`} on={compare.includes(s.id)} onClick={() => toggleCompare(s.id)} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function GotoBody() {
  const setDateRange = useChartStore((s) => s.setDateRange);
  const setDialog = useChartStore((s) => s.setDialog);
  return (
    <>
      <Head title="Go to" />
      <div className="space-y-3 p-4 text-2xs">
        <p className="text-tv-muted">Jump the visible range. Use the date-range chips under the chart for presets.</p>
        <div className="grid grid-cols-3 gap-2">
          {(["1D", "1M", "1Y", "All"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setDateRange(id);
                setDialog(null);
              }}
              className="h-8 rounded-sm border border-tv-border text-tv-fg hover:bg-tv-elevated"
            >
              {id}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function LayoutBody() {
  return (
    <>
      <Head title="Layout" />
      <div className="p-4 text-2xs text-tv-muted">
        Single-chart layout is active. Multi-chart grids are saved locally with your symbol, interval, drawings and
        paper fills.
      </div>
    </>
  );
}
