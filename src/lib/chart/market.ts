import { createServerFn } from "@tanstack/react-start";
import type { UTCTimestamp } from "lightweight-charts";
import type { Candle } from "./indicators";
import { getInterval, getSymbol, SYMBOLS, type IntervalKey } from "./symbols";

export type Quote = {
  last: number;
  open: number;
  high: number;
  low: number;
  change: number;
  changePct: number;
  volume: number;
  quoteVolume: number;
};

export type TickerRow = {
  id: string;
  last: number;
  change: number;
  changePct: number;
  volume: number;
};

type KlineRow = [number, string, string, string, string, string, ...unknown[]];

async function fetchJson(url: string, ms = 6000): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function parseBinanceKlines(raw: unknown): Candle[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const r = row as KlineRow;
      return {
        time: Math.floor(Number(r[0]) / 1000) as UTCTimestamp,
        open: Number(r[1]),
        high: Number(r[2]),
        low: Number(r[3]),
        close: Number(r[4]),
        volume: Number(r[5]),
      };
    })
    .filter((c) => Number.isFinite(c.open) && Number.isFinite(c.close));
}

function parseOkxKlines(raw: unknown): Candle[] {
  const data = (raw as { data?: string[][] })?.data;
  if (!Array.isArray(data)) return [];
  return data
    .map((r) => ({
      time: Math.floor(Number(r[0]) / 1000) as UTCTimestamp,
      open: Number(r[1]),
      high: Number(r[2]),
      low: Number(r[3]),
      close: Number(r[4]),
      volume: Number(r[5]),
    }))
    .filter((c) => Number.isFinite(c.open) && Number.isFinite(c.close))
    .sort((a, b) => Number(a.time) - Number(b.time));
}

const OKX_BAR: Record<string, string> = {
  "1m": "1m",
  "3m": "3m",
  "5m": "5m",
  "15m": "15m",
  "30m": "30m",
  "1h": "1H",
  "2h": "2H",
  "4h": "4H",
  "6h": "6H",
  "12h": "12H",
  "1d": "1D",
  "3d": "3D",
  "1w": "1W",
  "1M": "1M",
};

async function fetchCandles(binance: string, interval: string, limit: number): Promise<Candle[]> {
  try {
    const url = `https://data-api.binance.vision/api/v3/klines?symbol=${encodeURIComponent(binance)}&interval=${interval}&limit=${limit}`;
    const candles = parseBinanceKlines(await fetchJson(url));
    if (candles.length) return candles;
  } catch {
    /* next venue */
  }
  const bar = OKX_BAR[interval] ?? "1D";
  const inst = binance.replace("USDT", "-USDT");
  const url = `https://www.okx.com/api/v5/market/candles?instId=${inst}&bar=${bar}&limit=${Math.min(limit, 300)}`;
  const candles = parseOkxKlines(await fetchJson(url));
  if (!candles.length) throw new Error("klines empty");
  return candles;
}

export const loadKlines = createServerFn({ method: "GET" })
  .validator((d: { symbolId: string; interval: IntervalKey; limit?: number }) => d)
  .handler(async ({ data }) => {
    const symbol = getSymbol(data.symbolId);
    const interval = getInterval(data.interval);
    const candles = await fetchCandles(symbol.binance, interval.binance, data.limit ?? 1000);
    return { candles, source: "binance" as const, exchange: symbol.exchange };
  });

export const loadTickers = createServerFn({ method: "GET" })
  .validator((d: { ids: string[] }) => d)
  .handler(async ({ data }) => {
    const ids = data.ids.length ? data.ids : SYMBOLS.map((s) => s.id);
    try {
      const pairs = ids.map((id) => getSymbol(id).binance);
      const url = `https://data-api.binance.vision/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(pairs))}`;
      const json = await fetchJson(url);
      if (Array.isArray(json)) {
        const byPair = new Map<
          string,
          { lastPrice: string; priceChange: string; priceChangePercent: string; volume: string }
        >();
        for (const row of json as {
          symbol: string;
          lastPrice: string;
          priceChange: string;
          priceChangePercent: string;
          volume: string;
        }[]) {
          byPair.set(row.symbol, row);
        }
        return ids.map((id) => {
          const row = byPair.get(getSymbol(id).binance);
          return {
            id,
            last: Number(row?.lastPrice ?? 0),
            change: Number(row?.priceChange ?? 0),
            changePct: Number(row?.priceChangePercent ?? 0),
            volume: Number(row?.volume ?? 0),
          };
        });
      }
    } catch {
      /* fall through */
    }
    const rows: TickerRow[] = [];
    for (const id of ids) {
      try {
        const inst = getSymbol(id).binance.replace("USDT", "-USDT");
        const json = (await fetchJson(`https://www.okx.com/api/v5/market/ticker?instId=${inst}`)) as {
          data?: { last: string; open24h: string; vol24h: string }[];
        };
        const t = json.data?.[0];
        const last = Number(t?.last ?? 0);
        const open = Number(t?.open24h ?? last);
        const change = last - open;
        rows.push({
          id,
          last,
          change,
          changePct: open ? (change / open) * 100 : 0,
          volume: Number(t?.vol24h ?? 0),
        });
      } catch {
        rows.push({ id, last: 0, change: 0, changePct: 0, volume: 0 });
      }
    }
    return rows;
  });

export function quoteFromCandles(candles: Candle[]): Quote | null {
  if (!candles.length) return null;
  const last = candles[candles.length - 1]!;
  const first = candles[0]!;
  const change = last.close - first.open;
  const changePct = first.open === 0 ? 0 : (change / first.open) * 100;
  let high = -Infinity;
  let low = Infinity;
  let volume = 0;
  let quoteVolume = 0;
  for (const c of candles) {
    high = Math.max(high, c.high);
    low = Math.min(low, c.low);
    volume += c.volume;
    quoteVolume += c.volume * c.close;
  }
  return {
    last: last.close,
    open: first.open,
    high,
    low,
    change,
    changePct,
    volume,
    quoteVolume,
  };
}

export function syntheticCandles(seed: number, intervalSec: number, count = 400): Candle[] {
  const now = Math.floor(Date.now() / 1000);
  const aligned = now - (now % intervalSec);
  let p = seed;
  const out: Candle[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const t = (aligned - i * intervalSec) as UTCTimestamp;
    const wave = Math.sin(i / 9) * 0.004 + Math.sin(i / 27) * 0.007;
    const noise = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const n = (noise < 0 ? noise + 1 : noise) - 0.5;
    const ret = 0.00012 + wave + n * 0.006;
    const open = p;
    const close = Math.max(0.00000001, p * (1 + ret));
    const hi = Math.max(open, close) * (1 + Math.abs(n) * 0.003);
    const lo = Math.min(open, close) * (1 - Math.abs(wave) * 0.003);
    out.push({
      time: t,
      open,
      high: hi,
      low: lo,
      close,
      volume: 80 + Math.abs(n) * 420,
    });
    p = close;
  }
  return out;
}
