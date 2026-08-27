import { useEffect, useRef, useState } from "react";
import {
  AreaSeries,
  BarSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  PriceScaleMode,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { bollinger, ema, heikinAshi, macd, rsi, sma, vwap, type Candle } from "@/lib/chart/indicators";
import { formatPct, formatPrice, formatVolume, getInterval, getSymbol } from "@/lib/chart/symbols";
import { tv } from "@/lib/chart/theme";
import { DATE_RANGES, newDrawingId, useChartStore, type Drawing } from "@/lib/chart/store";

type Hover = { time: Time; open: number; high: number; low: number; close: number; volume?: number } | null;

const FIB = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.618];
const COMPARE_COLORS = ["#ff6d00", "#26c6da", "#ab47bc"];

export function PriceChart({
  candles,
  compareMap,
}: {
  candles: Candle[];
  compareMap: Record<string, Candle[]>;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainRef = useRef<ISeriesApi<"Candlestick" | "Bar" | "Line" | "Area"> | null>(null);
  const [hover, setHover] = useState<Hover>(null);
  const [size, setSize] = useState(0);
  const [draft, setDraft] = useState<{ t: number; p: number } | null>(null);
  const fitted = useRef(false);

  const symbol = useChartStore((s) => s.symbol);
  const interval = useChartStore((s) => s.interval);
  const chartType = useChartStore((s) => s.chartType);
  const overlays = useChartStore((s) => s.overlays);
  const oscillators = useChartStore((s) => s.oscillators);
  const showVolume = useChartStore((s) => s.showVolume);
  const logScale = useChartStore((s) => s.logScale);
  const drawTool = useChartStore((s) => s.drawTool);
  const magnet = useChartStore((s) => s.magnet);
  const drawings = useChartStore((s) => s.drawings);
  const drawingsHidden = useChartStore((s) => s.drawingsHidden);
  const drawingsLocked = useChartStore((s) => s.drawingsLocked);
  const addDrawing = useChartStore((s) => s.addDrawing);
  const replay = useChartStore((s) => s.replay);
  const replayIndex = useChartStore((s) => s.replayIndex);
  const setDrawTool = useChartStore((s) => s.setDrawTool);
  const dateRange = useChartStore((s) => s.dateRange);
  const shotRev = useChartStore((s) => s.shotRev);
  const compare = useChartStore((s) => s.compare);

  const visible = replay && replayIndex != null ? candles.slice(0, Math.max(2, replayIndex)) : candles;
  const seriesData = chartType === "ha" ? heikinAshi(visible) : visible;
  const meta = getSymbol(symbol);
  const iv = getInterval(interval);
  const last = visible[visible.length - 1];
  const first = visible[0];
  const chg = last && first ? last.close - first.open : 0;
  const chgPct = last && first && first.open ? (chg / first.open) * 100 : 0;
  const up = chg >= 0;
  const ohlc =
    hover ??
    (last
      ? { time: last.time, open: last.open, high: last.high, low: last.low, close: last.close, volume: last.volume }
      : null);

  const seriesKey = `${chartType}|${overlays.join(",")}|${oscillators.join(",")}|${showVolume}|${compare.join(",")}|${iv.seconds}`;

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: tv.bg },
        textColor: tv.muted,
        fontFamily: "IBM Plex Mono, ui-monospace, monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: tv.grid },
        horzLines: { color: tv.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: tv.cross, style: LineStyle.Dashed, width: 1, labelBackgroundColor: tv.blue },
        horzLine: { color: tv.cross, style: LineStyle.Dashed, width: 1, labelBackgroundColor: tv.blue },
      },
      rightPriceScale: { borderColor: tv.border, scaleMargins: { top: 0.08, bottom: 0.18 } },
      timeScale: {
        borderColor: tv.border,
        timeVisible: iv.seconds < 86400,
        secondsVisible: iv.seconds < 60,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
      localization: { locale: "en-US" },
    });
    chartRef.current = chart;
    fitted.current = false;
    const ro = new ResizeObserver(() => setSize((n) => n + 1));
    ro.observe(el);
    const bump = () => setSize((n) => n + 1);
    chart.timeScale().subscribeVisibleLogicalRangeChange(bump);
    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      mainRef.current = null;
    };
  }, [iv.seconds]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.applyOptions({
      rightPriceScale: {
        mode: logScale ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
        borderColor: tv.border,
      },
    });
  }, [logScale]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !seriesData.length) return;

    for (const pane of chart.panes()) {
      for (const s of pane.getSeries()) {
        try {
          chart.removeSeries(s);
        } catch {
          /* ignore */
        }
      }
    }

    const range = chart.timeScale().getVisibleLogicalRange();

    const common = { lastValueVisible: true, priceLineVisible: true };
    let main: ISeriesApi<"Candlestick" | "Bar" | "Line" | "Area">;
    if (chartType === "bar") {
      main = chart.addSeries(BarSeries, { upColor: tv.up, downColor: tv.down, ...common });
      main.setData(seriesData);
    } else if (chartType === "line") {
      main = chart.addSeries(LineSeries, { color: tv.blue, lineWidth: 2, ...common });
      main.setData(seriesData.map((c) => ({ time: c.time, value: c.close })));
    } else if (chartType === "area") {
      main = chart.addSeries(AreaSeries, {
        lineColor: tv.blue,
        topColor: "rgba(41, 98, 255, 0.28)",
        bottomColor: "rgba(41, 98, 255, 0.02)",
        lineWidth: 2,
        ...common,
      });
      main.setData(seriesData.map((c) => ({ time: c.time, value: c.close })));
    } else {
      main = chart.addSeries(CandlestickSeries, {
        upColor: chartType === "hollow" ? "transparent" : tv.up,
        downColor: tv.down,
        borderUpColor: tv.up,
        borderDownColor: tv.down,
        wickUpColor: tv.up,
        wickDownColor: tv.down,
        borderVisible: true,
        ...common,
      });
      main.setData(seriesData);
    }
    mainRef.current = main;

    if (showVolume) {
      const vol = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "vol" });
      vol.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      vol.setData(
        seriesData.map((c) => ({
          time: c.time,
          value: c.volume,
          color: c.close >= c.open ? tv.volumeUp : tv.volumeDown,
        })),
      );
    }

    if (overlays.includes("ma20")) {
      chart.addSeries(LineSeries, { color: tv.blue, lineWidth: 1, lastValueVisible: false, priceLineVisible: false }).setData(sma(seriesData, 20));
    }
    if (overlays.includes("ma50")) {
      chart.addSeries(LineSeries, { color: "#ff6d00", lineWidth: 1, lastValueVisible: false, priceLineVisible: false }).setData(sma(seriesData, 50));
    }
    if (overlays.includes("ema20")) {
      chart.addSeries(LineSeries, { color: "#26c6da", lineWidth: 1, lastValueVisible: false, priceLineVisible: false }).setData(ema(seriesData, 20));
    }
    if (overlays.includes("vwap")) {
      chart.addSeries(LineSeries, { color: "#ab47bc", lineWidth: 1, lineStyle: LineStyle.Dashed, lastValueVisible: false, priceLineVisible: false }).setData(vwap(seriesData));
    }
    if (overlays.includes("bb")) {
      const bb = bollinger(seriesData);
      const opts = { lineWidth: 1 as const, lastValueVisible: false, priceLineVisible: false };
      chart.addSeries(LineSeries, { color: "#787b86", ...opts }).setData(bb.upper);
      chart.addSeries(LineSeries, { color: tv.blue, lineStyle: LineStyle.Dashed, ...opts }).setData(bb.mid);
      chart.addSeries(LineSeries, { color: "#787b86", ...opts }).setData(bb.lower);
    }

    compare.forEach((id, i) => {
      const data = compareMap[id];
      if (!data?.length) return;
      chart
        .addSeries(LineSeries, {
          color: COMPARE_COLORS[i % COMPARE_COLORS.length],
          lineWidth: 1,
          lastValueVisible: true,
          priceLineVisible: false,
        })
        .setData(data.map((c) => ({ time: c.time, value: c.close })));
    });

    let pane = 1;
    if (oscillators.includes("rsi")) {
      const s = chart.addSeries(LineSeries, { color: "#ab47bc", lineWidth: 1, priceLineVisible: false }, pane);
      s.setData(rsi(seriesData, 14));
      s.createPriceLine({ price: 70, color: tv.down, lineStyle: LineStyle.Dotted, axisLabelVisible: false, title: "" });
      s.createPriceLine({ price: 30, color: tv.up, lineStyle: LineStyle.Dotted, axisLabelVisible: false, title: "" });
      pane += 1;
    }
    if (oscillators.includes("macd")) {
      const m = macd(seriesData);
      chart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false }, pane).setData(m.hist);
      chart.addSeries(LineSeries, { color: tv.blue, lineWidth: 1, priceLineVisible: false, lastValueVisible: false }, pane).setData(m.macdLine);
      chart.addSeries(LineSeries, { color: "#ff6d00", lineWidth: 1, priceLineVisible: false, lastValueVisible: false }, pane).setData(m.signalLine);
    }

    if (!fitted.current) {
      chart.timeScale().fitContent();
      fitted.current = true;
    } else if (range) {
      try {
        chart.timeScale().setVisibleLogicalRange(range);
      } catch {
        /* ignore */
      }
    }
    setSize((n) => n + 1);

    const onMove = (param: { time?: Time; seriesData: Map<unknown, unknown> }) => {
      if (!param.time) {
        setHover(null);
        return;
      }
      const raw = param.seriesData.get(main) as
        | { open?: number; high?: number; low?: number; close?: number; value?: number }
        | undefined;
      if (!raw) {
        setHover(null);
        return;
      }
      const bar = visible.find((c) => c.time === param.time);
      setHover({
        time: param.time,
        open: raw.open ?? bar?.open ?? raw.value ?? 0,
        high: raw.high ?? bar?.high ?? raw.value ?? 0,
        low: raw.low ?? bar?.low ?? raw.value ?? 0,
        close: raw.close ?? bar?.close ?? raw.value ?? 0,
        volume: bar?.volume,
      });
    };
    chart.subscribeCrosshairMove(onMove);
    return () => {
      chart.unsubscribeCrosshairMove(onMove);
    };
  }, [seriesKey, seriesData, compareMap, visible, compare]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !visible.length) return;
    const spec = DATE_RANGES.find((r) => r.id === dateRange);
    if (!spec || dateRange === "All") {
      chart.timeScale().fitContent();
      return;
    }
    const to = Number(visible[visible.length - 1]!.time);
    let from = spec.seconds ? to - spec.seconds : to;
    if (dateRange === "YTD") {
      const d = new Date();
      from = Date.UTC(d.getUTCFullYear(), 0, 1) / 1000;
    }
    try {
      chart.timeScale().setVisibleRange({ from: from as UTCTimestamp, to: to as UTCTimestamp });
    } catch {
      chart.timeScale().fitContent();
    }
  }, [dateRange, visible.length]);

  useEffect(() => {
    if (!shotRev) return;
    const canvas = chartRef.current?.takeScreenshot();
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${symbol}-${interval}.png`;
      a.click();
    });
  }, [shotRev, symbol, interval]);

  useEffect(() => {
    const chart = chartRef.current;
    const series = mainRef.current;
    if (!chart || !series) return;

    const snap = (time: number, price: number) => {
      if (!magnet || !visible.length) return { t: time, p: price };
      let best = visible[0]!;
      let dist = Math.abs(Number(best.time) - time);
      for (const c of visible) {
        const d = Math.abs(Number(c.time) - time);
        if (d < dist) {
          dist = d;
          best = c;
        }
      }
      const pts = [best.open, best.high, best.low, best.close];
      let p = pts[0]!;
      let pd = Math.abs(p - price);
      for (const x of pts) {
        const d = Math.abs(x - price);
        if (d < pd) {
          pd = d;
          p = x;
        }
      }
      return { t: Number(best.time), p };
    };

    const onClick = (param: { time?: Time; point?: { x: number; y: number } | undefined }) => {
      if (drawingsLocked) return;
      if (drawTool === "cursor" || drawTool === "cross") return;
      if (param.time == null || !param.point) return;
      const price = series.coordinateToPrice(param.point.y);
      if (price == null) return;
      const snapped = snap(Number(param.time), price);
      if (drawTool === "hline") {
        addDrawing({ id: newDrawingId(), kind: "hline", price: snapped.p, color: tv.blue });
        setDrawTool("cross");
        setDraft(null);
        return;
      }
      if (drawTool === "text") {
        const text = window.prompt("Text note", "Note");
        if (text) addDrawing({ id: newDrawingId(), kind: "text", t: snapped.t, p: snapped.p, text });
        setDrawTool("cross");
        return;
      }
      if (!draft) {
        setDraft(snapped);
        return;
      }
      const base = { t1: draft.t, p1: draft.p, t2: snapped.t, p2: snapped.p };
      if (drawTool === "trend") addDrawing({ id: newDrawingId(), kind: "trend", ...base, color: tv.blue });
      if (drawTool === "ray") addDrawing({ id: newDrawingId(), kind: "ray", ...base, color: tv.blue });
      if (drawTool === "rect") addDrawing({ id: newDrawingId(), kind: "rect", ...base, color: tv.blue });
      if (drawTool === "fib") addDrawing({ id: newDrawingId(), kind: "fib", ...base });
      if (drawTool === "measure") addDrawing({ id: newDrawingId(), kind: "measure", ...base });
      setDraft(null);
      setDrawTool("cross");
    };

    chart.subscribeClick(onClick);
    return () => chart.unsubscribeClick(onClick);
  }, [drawTool, magnet, draft, visible, addDrawing, setDrawTool, drawingsLocked]);

  const paths = drawingsHidden
    ? null
    : renderDrawings(chartRef.current, mainRef.current, drawings, draft, drawTool, size);

  return (
    <div className="relative min-h-0 min-w-0 flex-1 bg-tv-bg">
      <div ref={hostRef} className="absolute inset-0" />
      <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full">
        {paths}
      </svg>
      <div className="pointer-events-none absolute left-3 top-2 z-20 font-sans text-2xs text-tv-muted">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-semibold text-tv-fg">
            {meta.exchange}:{meta.ticker}
          </span>
          <span>{iv.label}</span>
          {ohlc ? (
            <>
              <span>
                O<span className={up ? "text-tv-up" : "text-tv-down"}>{formatPrice(ohlc.open)}</span>
              </span>
              <span>
                H<span className={up ? "text-tv-up" : "text-tv-down"}>{formatPrice(ohlc.high)}</span>
              </span>
              <span>
                L<span className={up ? "text-tv-up" : "text-tv-down"}>{formatPrice(ohlc.low)}</span>
              </span>
              <span>
                C<span className={up ? "text-tv-up" : "text-tv-down"}>{formatPrice(ohlc.close)}</span>
              </span>
              <span className={up ? "text-tv-up" : "text-tv-down"}>
                {formatPrice(chg)} ({formatPct(chgPct)})
              </span>
              {ohlc.volume != null ? <span>Vol {formatVolume(ohlc.volume)}</span> : null}
            </>
          ) : null}
        </div>
        <div className="mt-0.5 flex gap-3 text-micro">
          {overlays.includes("ma20") ? <span className="text-tv-blue">MA20</span> : null}
          {overlays.includes("ma50") ? <span className="text-tv-ma50">MA50</span> : null}
          {overlays.includes("ema20") ? <span className="text-tv-ema">EMA20</span> : null}
          {overlays.includes("vwap") ? <span className="text-tv-vwap">VWAP</span> : null}
          {compare.map((id, i) => (
            <span key={id} style={{ color: COMPARE_COLORS[i % COMPARE_COLORS.length] }}>
              {id}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderDrawings(
  chart: IChartApi | null,
  series: ISeriesApi<"Candlestick" | "Bar" | "Line" | "Area"> | null,
  drawings: Drawing[],
  draft: { t: number; p: number } | null,
  tool: string,
  _size: number,
) {
  if (!chart || !series) return null;
  const xy = (t: number, p: number) => {
    const x = chart.timeScale().timeToCoordinate(t as UTCTimestamp);
    const y = series.priceToCoordinate(p);
    if (x == null || y == null) return null;
    return { x, y };
  };
  const nodes: React.ReactNode[] = [];
  const drawLine = (id: string, t1: number, p1: number, t2: number, p2: number, color: string, extend?: boolean) => {
    const a = xy(t1, p1);
    const b = xy(t2, p2);
    if (!a || !b) return;
    let x2: number = a.x as number;
    let y2: number = a.y as number;
    x2 = b.x as number;
    y2 = b.y as number;
    if (extend) {
      const dx = (b.x as number) - (a.x as number) || 1;
      const dy = (b.y as number) - (a.y as number);
      x2 = (a.x as number) + dx * 40;
      y2 = (a.y as number) + dy * 40;
    }
    nodes.push(<line key={id} x1={a.x} y1={a.y} x2={x2} y2={y2} stroke={color} strokeWidth={1.25} />);
  };
  for (const d of drawings) {
    if (d.kind === "hline") {
      const y = series.priceToCoordinate(d.price);
      if (y == null) continue;
      nodes.push(
        <g key={d.id}>
          <line x1={0} y1={y} x2="100%" y2={y} stroke={d.color} strokeWidth={1} strokeDasharray="4 3" />
        </g>,
      );
    } else if (d.kind === "trend") {
      drawLine(d.id, d.t1, d.p1, d.t2, d.p2, d.color);
    } else if (d.kind === "ray") {
      drawLine(d.id, d.t1, d.p1, d.t2, d.p2, d.color, true);
    } else if (d.kind === "text") {
      const a = xy(d.t, d.p);
      if (!a) continue;
      nodes.push(
        <text key={d.id} x={a.x} y={a.y} fill={tv.fg} fontSize="12" fontFamily="Source Sans 3, sans-serif">
          {d.text}
        </text>,
      );
    } else if (d.kind === "rect" || d.kind === "measure") {
      const a = xy(d.t1, d.p1);
      const b = xy(d.t2, d.p2);
      if (!a || !b) continue;
      const x = Math.min(a.x, b.x);
      const y = Math.min(a.y, b.y);
      const w = Math.abs(b.x - a.x);
      const h = Math.abs(b.y - a.y);
      nodes.push(
        <g key={d.id}>
          <rect x={x} y={y} width={w} height={h} fill="rgba(41,98,255,0.12)" stroke={tv.blue} strokeWidth={1} />
          {d.kind === "measure" ? (
            <text x={x + 6} y={y + 14} fill={tv.fg} fontSize="11" fontFamily="IBM Plex Mono, monospace">
              {formatPrice(Math.abs(d.p2 - d.p1))} ({(((d.p2 - d.p1) / d.p1) * 100).toFixed(2)}%)
            </text>
          ) : null}
        </g>,
      );
    } else if (d.kind === "fib") {
      const lo = Math.min(d.p1, d.p2);
      const hi = Math.max(d.p1, d.p2);
      const range = hi - lo || 1;
      FIB.forEach((lvl, i) => {
        const price = d.p1 > d.p2 ? d.p1 - range * lvl : d.p1 + range * lvl;
        const y = series.priceToCoordinate(price);
        if (y == null) return;
        nodes.push(
          <g key={`${d.id}-${i}`}>
            <line x1={0} y1={y} x2="100%" y2={y} stroke={i === 4 ? tv.blue : tv.muted} strokeWidth={1} />
            <text x={8} y={y - 3} fill={tv.muted} fontSize="10" fontFamily="IBM Plex Mono, monospace">
              {lvl.toFixed(3)} ({formatPrice(price)})
            </text>
          </g>,
        );
      });
    }
  }
  void draft;
  void tool;
  return nodes;
}
