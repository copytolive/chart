import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IntervalKey } from "./symbols";
import { tv } from "./theme";

export type ChartType = "candle" | "hollow" | "ha" | "bar" | "line" | "area";
export type DrawTool =
  | "cursor"
  | "cross"
  | "trend"
  | "ray"
  | "hline"
  | "rect"
  | "fib"
  | "measure"
  | "text";
export type OverlayId = "ma20" | "ma50" | "ema20" | "bb" | "vwap";
export type OscillatorId = "rsi" | "macd";
export type RightTab = "watchlist" | "alerts" | "objects" | "details" | "news" | "calendar";
export type BottomTab = "trade" | "positions" | "orders" | "data" | "pine" | "strategy";
export type DialogId = "settings" | "alert" | "compare" | "indicators" | "goto" | "layout" | null;
export type DateRangeId = "1D" | "5D" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "5Y" | "All";

export type Drawing =
  | { id: string; kind: "hline"; price: number; color: string }
  | { id: string; kind: "trend"; t1: number; p1: number; t2: number; p2: number; color: string }
  | { id: string; kind: "ray"; t1: number; p1: number; t2: number; p2: number; color: string }
  | { id: string; kind: "rect"; t1: number; p1: number; t2: number; p2: number; color: string }
  | { id: string; kind: "fib"; t1: number; p1: number; t2: number; p2: number }
  | { id: string; kind: "measure"; t1: number; p1: number; t2: number; p2: number }
  | { id: string; kind: "text"; t: number; p: number; text: string };

export type PaperFill = {
  id: string;
  side: "buy" | "sell";
  symbol: string;
  qty: number;
  price: number;
  time: number;
};

export type PriceAlert = {
  id: string;
  symbol: string;
  op: "above" | "below";
  price: number;
  created: number;
  triggered: boolean;
};

type ChartState = {
  symbol: string;
  interval: IntervalKey;
  chartType: ChartType;
  overlays: OverlayId[];
  oscillators: OscillatorId[];
  drawTool: DrawTool;
  magnet: boolean;
  drawingsLocked: boolean;
  drawingsHidden: boolean;
  logScale: boolean;
  showVolume: boolean;
  showWatchlist: boolean;
  showBottom: boolean;
  rightTab: RightTab;
  bottomTab: BottomTab;
  dialog: DialogId;
  dateRange: DateRangeId;
  compare: string[];
  drawings: Drawing[];
  watchlist: string[];
  favorites: string[];
  searchOpen: boolean;
  replay: boolean;
  replayIndex: number | null;
  shotRev: number;
  cash: number;
  qty: number;
  fills: PaperFill[];
  alerts: PriceAlert[];
  setSymbol: (id: string) => void;
  setInterval: (key: IntervalKey) => void;
  setChartType: (t: ChartType) => void;
  toggleOverlay: (id: OverlayId) => void;
  toggleOscillator: (id: OscillatorId) => void;
  setDrawTool: (t: DrawTool) => void;
  toggleMagnet: () => void;
  toggleLock: () => void;
  toggleHideDrawings: () => void;
  toggleLog: () => void;
  toggleVolume: () => void;
  toggleWatchlist: () => void;
  toggleBottom: () => void;
  setRightTab: (t: RightTab) => void;
  setBottomTab: (t: BottomTab) => void;
  setDialog: (d: DialogId) => void;
  setDateRange: (r: DateRangeId) => void;
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  addDrawing: (d: Drawing) => void;
  removeDrawing: (id: string) => void;
  clearDrawings: () => void;
  undoDrawing: () => void;
  setSearchOpen: (v: boolean) => void;
  addWatch: (id: string) => void;
  removeWatch: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setReplay: (v: boolean) => void;
  setReplayIndex: (n: number | null) => void;
  requestShot: () => void;
  paperBuy: (price: number) => void;
  paperSell: (price: number) => void;
  setOrderQty: (n: number) => void;
  addAlert: (a: Omit<PriceAlert, "id" | "created" | "triggered">) => void;
  removeAlert: (id: string) => void;
  markAlert: (id: string) => void;
};

const uid = () => Math.random().toString(36).slice(2, 10);

export const useChartStore = create<ChartState>()(
  persist(
    (set, get) => ({
      symbol: "BTCUSD",
      interval: "D",
      chartType: "candle",
      overlays: ["ma20", "ma50"],
      oscillators: [],
      drawTool: "cross",
      magnet: true,
      drawingsLocked: false,
      drawingsHidden: false,
      logScale: false,
      showVolume: true,
      showWatchlist: true,
      showBottom: true,
      rightTab: "watchlist",
      bottomTab: "trade",
      dialog: null,
      dateRange: "All",
      compare: [],
      drawings: [],
      watchlist: ["BTCUSD", "ETHUSD", "SOLUSD", "BNBUSD", "XRPUSD", "DOGEUSD", "ADAUSD", "PAXGUSD"],
      favorites: ["BTCUSD"],
      searchOpen: false,
      replay: false,
      replayIndex: null,
      shotRev: 0,
      cash: 10_000,
      qty: 0,
      fills: [],
      alerts: [],
      setSymbol: (id) => set({ symbol: id, replay: false, replayIndex: null }),
      setInterval: (key) => set({ interval: key, replay: false, replayIndex: null }),
      setChartType: (t) => set({ chartType: t }),
      toggleOverlay: (id) =>
        set({
          overlays: get().overlays.includes(id) ? get().overlays.filter((x) => x !== id) : [...get().overlays, id],
        }),
      toggleOscillator: (id) =>
        set({
          oscillators: get().oscillators.includes(id)
            ? get().oscillators.filter((x) => x !== id)
            : [...get().oscillators, id],
        }),
      setDrawTool: (t) => set({ drawTool: t }),
      toggleMagnet: () => set({ magnet: !get().magnet }),
      toggleLock: () => set({ drawingsLocked: !get().drawingsLocked }),
      toggleHideDrawings: () => set({ drawingsHidden: !get().drawingsHidden }),
      toggleLog: () => set({ logScale: !get().logScale }),
      toggleVolume: () => set({ showVolume: !get().showVolume }),
      toggleWatchlist: () => set({ showWatchlist: !get().showWatchlist }),
      toggleBottom: () => set({ showBottom: !get().showBottom }),
      setRightTab: (t) => {
        if (get().rightTab === t && get().showWatchlist) set({ showWatchlist: false });
        else set({ rightTab: t, showWatchlist: true });
      },
      setBottomTab: (t) => set({ bottomTab: t, showBottom: true }),
      setDialog: (d) => set({ dialog: d }),
      setDateRange: (r) => set({ dateRange: r }),
      toggleCompare: (id) => {
        const cur = get().compare;
        set({ compare: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(0, 3) });
      },
      clearCompare: () => set({ compare: [] }),
      addDrawing: (d) => {
        if (get().drawingsLocked) return;
        set({ drawings: [...get().drawings, d] });
      },
      removeDrawing: (id) => set({ drawings: get().drawings.filter((d) => d.id !== id) }),
      clearDrawings: () => {
        if (get().drawingsLocked) return;
        set({ drawings: [] });
      },
      undoDrawing: () => {
        if (get().drawingsLocked) return;
        set({ drawings: get().drawings.slice(0, -1) });
      },
      setSearchOpen: (v) => set({ searchOpen: v }),
      addWatch: (id) => {
        if (get().watchlist.includes(id)) return;
        set({ watchlist: [...get().watchlist, id] });
      },
      removeWatch: (id) => set({ watchlist: get().watchlist.filter((x) => x !== id) }),
      toggleFavorite: (id) => {
        const fav = get().favorites;
        set({ favorites: fav.includes(id) ? fav.filter((x) => x !== id) : [...fav, id] });
      },
      setReplay: (v) => set({ replay: v, replayIndex: v ? 80 : null }),
      setReplayIndex: (n) => set({ replayIndex: n }),
      requestShot: () => set({ shotRev: get().shotRev + 1 }),
      setOrderQty: (n) => set({ qty: n }),
      paperBuy: (price) => {
        const { cash, qty, symbol, fills } = get();
        const spend = Math.min(cash, 1000);
        if (spend <= 0 || price <= 0) return;
        const got = spend / price;
        set({
          cash: cash - spend,
          qty: qty + got,
          fills: [{ id: uid(), side: "buy" as const, symbol, qty: got, price, time: Date.now() }, ...fills].slice(0, 80),
        });
      },
      paperSell: (price) => {
        const { cash, qty, symbol, fills } = get();
        if (qty <= 0 || price <= 0) return;
        set({
          cash: cash + qty * price,
          qty: 0,
          fills: [{ id: uid(), side: "sell" as const, symbol, qty, price, time: Date.now() }, ...fills].slice(0, 80),
        });
      },
      addAlert: (a) =>
        set({
          alerts: [{ id: uid(), created: Date.now(), triggered: false, ...a }, ...get().alerts].slice(0, 40),
        }),
      removeAlert: (id) => set({ alerts: get().alerts.filter((x) => x.id !== id) }),
      markAlert: (id) =>
        set({
          alerts: get().alerts.map((x) => (x.id === id ? { ...x, triggered: true } : x)),
        }),
    }),
    {
      name: "copytolive-chart",
      skipHydration: true,
      partialize: (s) => ({
        symbol: s.symbol,
        interval: s.interval,
        chartType: s.chartType,
        overlays: s.overlays,
        oscillators: s.oscillators,
        magnet: s.magnet,
        drawingsLocked: s.drawingsLocked,
        logScale: s.logScale,
        showVolume: s.showVolume,
        showWatchlist: s.showWatchlist,
        showBottom: s.showBottom,
        rightTab: s.rightTab,
        bottomTab: s.bottomTab,
        dateRange: s.dateRange,
        compare: s.compare,
        drawings: s.drawings,
        watchlist: s.watchlist,
        favorites: s.favorites,
        cash: s.cash,
        qty: s.qty,
        fills: s.fills,
        alerts: s.alerts,
      }),
    },
  ),
);

export function newDrawingId() {
  return uid();
}

export const drawColor = tv.blue;

export const DATE_RANGES: { id: DateRangeId; label: string; seconds: number | null }[] = [
  { id: "1D", label: "1D", seconds: 86400 },
  { id: "5D", label: "5D", seconds: 5 * 86400 },
  { id: "1M", label: "1M", seconds: 30 * 86400 },
  { id: "3M", label: "3M", seconds: 90 * 86400 },
  { id: "6M", label: "6M", seconds: 180 * 86400 },
  { id: "YTD", label: "YTD", seconds: null },
  { id: "1Y", label: "1Y", seconds: 365 * 86400 },
  { id: "5Y", label: "5Y", seconds: 5 * 365 * 86400 },
  { id: "All", label: "All", seconds: null },
];
