import { useCallback, useEffect, useRef, useState } from "react";
import type { Candle } from "@/lib/chart/indicators";
import { loadKlines, loadTickers, quoteFromCandles, syntheticCandles, type Quote, type TickerRow } from "@/lib/chart/market";
import { getInterval, getSymbol, type IntervalKey } from "@/lib/chart/symbols";

export function useMarket(symbolId: string, intervalKey: IntervalKey) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [status, setStatus] = useState<"loading" | "live" | "delayed" | "offline">("loading");
  const [error, setError] = useState<string | null>(null);
  const candlesRef = useRef<Candle[]>([]);

  const refresh = useCallback(async () => {
    const symbol = getSymbol(symbolId);
    const interval = getInterval(intervalKey);
    try {
      const res = await loadKlines({ data: { symbolId, interval: intervalKey, limit: 1000 } });
      if (res.candles.length) {
        candlesRef.current = res.candles;
        setCandles(res.candles);
        setStatus("live");
        setError(null);
        return;
      }
      throw new Error("empty");
    } catch (err) {
      if (candlesRef.current.length) {
        setStatus("delayed");
        return;
      }
      const seed = symbol.ticker.startsWith("BTC") ? 79900 : 3200;
      const fake = syntheticCandles(seed, interval.seconds);
      candlesRef.current = fake;
      setCandles(fake);
      setStatus("offline");
      setError(err instanceof Error ? err.message : "Market data unavailable");
    }
  }, [symbolId, intervalKey]);

  useEffect(() => {
    candlesRef.current = [];
    setCandles([]);
    setStatus("loading");
    void refresh();
    const id = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, 8000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const quote: Quote | null = quoteFromCandles(candles);
  return { candles, quote, status, error, refresh };
}

export function useTickers(ids: string[]) {
  const [rows, setRows] = useState<TickerRow[]>([]);
  const key = ids.join(",");
  useEffect(() => {
    let alive = true;
    const pull = async () => {
      try {
        const data = await loadTickers({ data: { ids } });
        if (alive) setRows(data);
      } catch {
        /* keep last */
      }
    };
    void pull();
    const id = window.setInterval(pull, 8000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [key]);
  return rows;
}

export function useCompareSeries(ids: string[], intervalKey: IntervalKey) {
  const [map, setMap] = useState<Record<string, Candle[]>>({});
  const key = ids.join(",");
  useEffect(() => {
    if (!ids.length) {
      setMap({});
      return;
    }
    let alive = true;
    const pull = async () => {
      const next: Record<string, Candle[]> = {};
      await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await loadKlines({ data: { symbolId: id, interval: intervalKey, limit: 500 } });
            next[id] = res.candles;
          } catch {
            next[id] = [];
          }
        }),
      );
      if (alive) setMap(next);
    };
    void pull();
    return () => {
      alive = false;
    };
  }, [key, intervalKey]);
  return map;
}
