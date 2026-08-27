import type { UTCTimestamp } from "lightweight-charts";

export type Candle = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type LinePoint = { time: UTCTimestamp; value: number };

export function sma(data: Candle[], period: number): LinePoint[] {
  const out: LinePoint[] = [];
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i]!.close;
    if (i >= period) sum -= data[i - period]!.close;
    if (i >= period - 1) out.push({ time: data[i]!.time, value: sum / period });
  }
  return out;
}

export function ema(data: Candle[], period: number): LinePoint[] {
  const out: LinePoint[] = [];
  const k = 2 / (period + 1);
  let prev = 0;
  for (let i = 0; i < data.length; i++) {
    const close = data[i]!.close;
    if (i === 0) prev = close;
    else prev = close * k + prev * (1 - k);
    if (i >= period - 1) out.push({ time: data[i]!.time, value: prev });
  }
  return out;
}

export function bollinger(data: Candle[], period = 20, mult = 2) {
  const mid: LinePoint[] = [];
  const upper: LinePoint[] = [];
  const lower: LinePoint[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += data[j]!.close;
    const mean = sum / period;
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const d = data[j]!.close - mean;
      variance += d * d;
    }
    const sd = Math.sqrt(variance / period);
    const t = data[i]!.time;
    mid.push({ time: t, value: mean });
    upper.push({ time: t, value: mean + mult * sd });
    lower.push({ time: t, value: mean - mult * sd });
  }
  return { mid, upper, lower };
}

export function vwap(data: Candle[]): LinePoint[] {
  const out: LinePoint[] = [];
  let pv = 0;
  let vol = 0;
  for (const c of data) {
    const typical = (c.high + c.low + c.close) / 3;
    pv += typical * c.volume;
    vol += c.volume;
    out.push({ time: c.time, value: vol > 0 ? pv / vol : typical });
  }
  return out;
}

export function rsi(data: Candle[], period = 14): LinePoint[] {
  const out: LinePoint[] = [];
  if (data.length < period + 1) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = data[i]!.close - data[i - 1]!.close;
    if (d >= 0) gain += d;
    else loss -= d;
  }
  gain /= period;
  loss /= period;
  const push = (i: number, g: number, l: number) => {
    const rs = l === 0 ? 100 : g / l;
    const value = 100 - 100 / (1 + rs);
    out.push({ time: data[i]!.time, value });
  };
  push(period, gain, loss);
  for (let i = period + 1; i < data.length; i++) {
    const d = data[i]!.close - data[i - 1]!.close;
    const g = d > 0 ? d : 0;
    const l = d < 0 ? -d : 0;
    gain = (gain * (period - 1) + g) / period;
    loss = (loss * (period - 1) + l) / period;
    push(i, gain, loss);
  }
  return out;
}

export function macd(data: Candle[], fast = 12, slow = 26, signal = 9) {
  const emaArr = (period: number) => {
    const k = 2 / (period + 1);
    const out: number[] = [];
    let prev = data[0]?.close ?? 0;
    for (let i = 0; i < data.length; i++) {
      prev = i === 0 ? data[i]!.close : data[i]!.close * k + prev * (1 - k);
      out.push(prev);
    }
    return out;
  };
  const fastE = emaArr(fast);
  const slowE = emaArr(slow);
  const macdLine: LinePoint[] = [];
  for (let i = 0; i < data.length; i++) {
    macdLine.push({ time: data[i]!.time, value: fastE[i]! - slowE[i]! });
  }
  const k = 2 / (signal + 1);
  const signalLine: LinePoint[] = [];
  const hist: { time: UTCTimestamp; value: number; color?: string }[] = [];
  let prev = macdLine[0]?.value ?? 0;
  for (let i = 0; i < macdLine.length; i++) {
    prev = i === 0 ? macdLine[i]!.value : macdLine[i]!.value * k + prev * (1 - k);
    signalLine.push({ time: macdLine[i]!.time, value: prev });
    const h = macdLine[i]!.value - prev;
    hist.push({
      time: macdLine[i]!.time,
      value: h,
      color: h >= 0 ? "rgba(8, 153, 129, 0.7)" : "rgba(242, 54, 69, 0.7)",
    });
  }
  return { macdLine, signalLine, hist };
}

export function heikinAshi(data: Candle[]): Candle[] {
  const out: Candle[] = [];
  for (let i = 0; i < data.length; i++) {
    const c = data[i]!;
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const prev = out[i - 1];
    const haOpen = prev ? (prev.open + prev.close) / 2 : (c.open + c.close) / 2;
    out.push({
      time: c.time,
      open: haOpen,
      high: Math.max(c.high, haOpen, haClose),
      low: Math.min(c.low, haOpen, haClose),
      close: haClose,
      volume: c.volume,
    });
  }
  return out;
}
