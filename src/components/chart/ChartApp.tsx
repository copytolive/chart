import { useEffect } from "react";
import { List, PanelBottom, Pause, Play } from "lucide-react";
import { getInterval, getSymbol } from "@/lib/chart/symbols";
import { useChartStore } from "@/lib/chart/store";
import { BottomDock } from "./BottomDock";
import { ChartDialogs } from "./Dialogs";
import { ChartHeader } from "./ChartHeader";
import { DateRangeBar } from "./DateRangeBar";
import { DrawTools } from "./DrawTools";
import { PriceChart } from "./PriceChart";
import { RightRail } from "./RightRail";
import { StatusBar } from "./StatusBar";
import { SymbolSearch } from "./SymbolSearch";
import { TopNav } from "./TopNav";
import { WatchlistPanel } from "./WatchlistPanel";
import { useCompareSeries, useMarket } from "./use-market";

export function ChartApp() {
  const symbol = useChartStore((s) => s.symbol);
  const interval = useChartStore((s) => s.interval);
  const replay = useChartStore((s) => s.replay);
  const replayIndex = useChartStore((s) => s.replayIndex);
  const setReplay = useChartStore((s) => s.setReplay);
  const setReplayIndex = useChartStore((s) => s.setReplayIndex);
  const setSearchOpen = useChartStore((s) => s.setSearchOpen);
  const showWatchlist = useChartStore((s) => s.showWatchlist);
  const toggleWatchlist = useChartStore((s) => s.toggleWatchlist);
  const toggleBottom = useChartStore((s) => s.toggleBottom);
  const showBottom = useChartStore((s) => s.showBottom);
  const compare = useChartStore((s) => s.compare);
  const alerts = useChartStore((s) => s.alerts);
  const markAlert = useChartStore((s) => s.markAlert);
  const { candles, quote, status, error } = useMarket(symbol, interval);
  const compareMap = useCompareSeries(compare, interval);
  const meta = getSymbol(symbol);
  const iv = getInterval(interval);

  useEffect(() => {
    void useChartStore.persist.rehydrate();
    if (window.innerWidth < 768) {
      useChartStore.setState({ showWatchlist: false, showBottom: false });
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") {
        if (e.key === "Escape") {
          useChartStore.getState().setSearchOpen(false);
          useChartStore.getState().setDialog(null);
        }
        return;
      }
      if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        useChartStore.getState().setDialog(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  useEffect(() => {
    if (!replay) return;
    const id = window.setInterval(() => {
      setReplayIndex((useChartStore.getState().replayIndex ?? 40) + 1);
    }, 180);
    return () => window.clearInterval(id);
  }, [replay, setReplayIndex]);

  useEffect(() => {
    if (replay && replayIndex != null && replayIndex >= candles.length) {
      setReplay(false);
      setReplayIndex(null);
    }
  }, [replay, replayIndex, candles.length, setReplay, setReplayIndex]);

  useEffect(() => {
    const last = quote?.last;
    if (!last) return;
    for (const a of alerts) {
      if (a.triggered || a.symbol !== symbol) continue;
      if ((a.op === "above" && last >= a.price) || (a.op === "below" && last <= a.price)) {
        markAlert(a.id);
      }
    }
  }, [quote?.last, alerts, symbol, markAlert]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-tv-bg text-tv-fg">
      <TopNav />
      <ChartHeader ticker={meta.ticker} />
      <div className="flex min-h-0 flex-1">
        <DrawTools />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative flex min-h-0 flex-1">
            <div className="relative flex min-w-0 flex-1 flex-col">
              <PriceChart candles={candles} compareMap={compareMap} />
              {status === "loading" && candles.length === 0 ? (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-tv-bg/70 text-sm text-tv-muted">
                  Fetching {meta.ticker}…
                </div>
              ) : null}
              {error && status === "offline" ? (
                <div className="absolute bottom-2 left-3 z-20 rounded-sm border border-tv-border bg-tv-surface px-2 py-1 text-micro text-tv-muted">
                  Live feed unavailable — showing simulated path
                </div>
              ) : null}
              {replay ? (
                <div className="flex h-8 items-center gap-2 border-t border-tv-border bg-tv-surface px-2 text-2xs">
                  <button
                    type="button"
                    onClick={() => setReplay(false)}
                    className="grid size-6 place-items-center rounded-sm text-tv-blue hover:bg-tv-elevated"
                    aria-label="Pause replay"
                  >
                    <Pause className="size-3.5" />
                  </button>
                  <Play className="size-3 text-tv-muted" />
                  <span className="text-tv-muted">
                    Bar {replayIndex ?? 0} / {candles.length}
                  </span>
                </div>
              ) : null}
              <DateRangeBar />
            </div>
            <div
              className={
                showWatchlist
                  ? "absolute inset-0 z-30 flex justify-end md:static md:z-auto md:block md:h-full md:w-72"
                  : "hidden"
              }
            >
              {showWatchlist ? (
                <button
                  type="button"
                  className="absolute inset-0 bg-tv-bg/50 md:hidden"
                  aria-label="Close watchlist"
                  onClick={toggleWatchlist}
                />
              ) : null}
              <div className="relative z-40 h-full w-full max-w-xs md:max-w-none">
                <WatchlistPanel quote={quote} />
              </div>
            </div>
            <RightRail />
          </div>
          <div className={showBottom ? "block" : "hidden md:block"}>
            <BottomDock candles={candles} quote={quote} />
          </div>
        </div>
      </div>
      <div className="flex h-9 items-center gap-1 border-t border-tv-border bg-tv-surface px-2 md:hidden">
        <button
          type="button"
          onClick={toggleWatchlist}
          className="flex h-8 items-center gap-1 rounded-sm px-2 text-2xs text-tv-muted hover:bg-tv-elevated hover:text-tv-fg"
        >
          <List className="size-3.5" />
          Watchlist
        </button>
        <button
          type="button"
          onClick={toggleBottom}
          className="flex h-8 items-center gap-1 rounded-sm px-2 text-2xs text-tv-muted hover:bg-tv-elevated hover:text-tv-fg"
        >
          <PanelBottom className="size-3.5" />
          Trade
        </button>
      </div>
      <StatusBar status={status} source={`${meta.exchange} · ${iv.label}`} />
      <SymbolSearch />
      <ChartDialogs lastPrice={quote?.last ?? 0} />
    </div>
  );
}
