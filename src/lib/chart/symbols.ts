export type IntervalKey =
  | "1"
  | "3"
  | "5"
  | "15"
  | "30"
  | "60"
  | "120"
  | "240"
  | "360"
  | "720"
  | "D"
  | "3D"
  | "W"
  | "M";

export const INTERVALS: { key: IntervalKey; label: string; binance: string; seconds: number; group: "min" | "hour" | "day" | "week" | "month" }[] = [
  { key: "1", label: "1m", binance: "1m", seconds: 60, group: "min" },
  { key: "3", label: "3m", binance: "3m", seconds: 180, group: "min" },
  { key: "5", label: "5m", binance: "5m", seconds: 300, group: "min" },
  { key: "15", label: "15m", binance: "15m", seconds: 900, group: "min" },
  { key: "30", label: "30m", binance: "30m", seconds: 1800, group: "min" },
  { key: "60", label: "1h", binance: "1h", seconds: 3600, group: "hour" },
  { key: "120", label: "2h", binance: "2h", seconds: 7200, group: "hour" },
  { key: "240", label: "4h", binance: "4h", seconds: 14400, group: "hour" },
  { key: "360", label: "6h", binance: "6h", seconds: 21600, group: "hour" },
  { key: "720", label: "12h", binance: "12h", seconds: 43200, group: "hour" },
  { key: "D", label: "1D", binance: "1d", seconds: 86400, group: "day" },
  { key: "3D", label: "3D", binance: "3d", seconds: 259200, group: "day" },
  { key: "W", label: "1W", binance: "1w", seconds: 604800, group: "week" },
  { key: "M", label: "1M", binance: "1M", seconds: 2592000, group: "month" },
];

export const INTERVAL_GROUPS: { id: "min" | "hour" | "day" | "week" | "month"; label: string }[] = [
  { id: "min", label: "Minutes" },
  { id: "hour", label: "Hours" },
  { id: "day", label: "Days" },
  { id: "week", label: "Weeks" },
  { id: "month", label: "Months" },
];

export type MarketSymbol = {
  id: string;
  ticker: string;
  name: string;
  exchange: string;
  binance: string;
  kind: "crypto" | "metal";
};

export const SYMBOLS: MarketSymbol[] = [
  { id: "BTCUSD", ticker: "BTCUSD", name: "Bitcoin / U.S. Dollar", exchange: "BINANCE", binance: "BTCUSDT", kind: "crypto" },
  { id: "ETHUSD", ticker: "ETHUSD", name: "Ethereum / U.S. Dollar", exchange: "BINANCE", binance: "ETHUSDT", kind: "crypto" },
  { id: "SOLUSD", ticker: "SOLUSD", name: "Solana / U.S. Dollar", exchange: "BINANCE", binance: "SOLUSDT", kind: "crypto" },
  { id: "BNBUSD", ticker: "BNBUSD", name: "BNB / U.S. Dollar", exchange: "BINANCE", binance: "BNBUSDT", kind: "crypto" },
  { id: "XRPUSD", ticker: "XRPUSD", name: "XRP / U.S. Dollar", exchange: "BINANCE", binance: "XRPUSDT", kind: "crypto" },
  { id: "DOGEUSD", ticker: "DOGEUSD", name: "Dogecoin / U.S. Dollar", exchange: "BINANCE", binance: "DOGEUSDT", kind: "crypto" },
  { id: "ADAUSD", ticker: "ADAUSD", name: "Cardano / U.S. Dollar", exchange: "BINANCE", binance: "ADAUSDT", kind: "crypto" },
  { id: "AVAXUSD", ticker: "AVAXUSD", name: "Avalanche / U.S. Dollar", exchange: "BINANCE", binance: "AVAXUSDT", kind: "crypto" },
  { id: "LINKUSD", ticker: "LINKUSD", name: "Chainlink / U.S. Dollar", exchange: "BINANCE", binance: "LINKUSDT", kind: "crypto" },
  { id: "DOTUSD", ticker: "DOTUSD", name: "Polkadot / U.S. Dollar", exchange: "BINANCE", binance: "DOTUSDT", kind: "crypto" },
  { id: "TONUSD", ticker: "TONUSD", name: "Toncoin / U.S. Dollar", exchange: "BINANCE", binance: "TONUSDT", kind: "crypto" },
  { id: "SUIUSD", ticker: "SUIUSD", name: "Sui / U.S. Dollar", exchange: "BINANCE", binance: "SUIUSDT", kind: "crypto" },
  { id: "PEPEUSD", ticker: "PEPEUSD", name: "Pepe / U.S. Dollar", exchange: "BINANCE", binance: "PEPEUSDT", kind: "crypto" },
  { id: "LTCUSD", ticker: "LTCUSD", name: "Litecoin / U.S. Dollar", exchange: "BINANCE", binance: "LTCUSDT", kind: "crypto" },
  { id: "BCHUSD", ticker: "BCHUSD", name: "Bitcoin Cash / U.S. Dollar", exchange: "BINANCE", binance: "BCHUSDT", kind: "crypto" },
  { id: "PAXGUSD", ticker: "PAXGUSD", name: "PAX Gold / U.S. Dollar", exchange: "BINANCE", binance: "PAXGUSDT", kind: "metal" },
];

export function getSymbol(id: string): MarketSymbol {
  return SYMBOLS.find((s) => s.id === id) ?? SYMBOLS[0]!;
}

export function getInterval(key: IntervalKey) {
  return INTERVALS.find((i) => i.key === key) ?? INTERVALS.find((i) => i.key === "D")!;
}

export function formatPrice(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1000) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (abs >= 1) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  if (abs >= 0.01) return n.toFixed(5);
  return n.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}

export function formatVolume(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toFixed(2);
}

export function formatPct(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function formatChg(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${formatPrice(n)}`;
}
