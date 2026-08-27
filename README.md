# Chart

Public TradingView-inspired market terminal for [copytolive/chart](https://github.com/copytolive/chart).

Live **BTCUSD** candlesticks (and other crypto pairs) from public Binance Vision / OKX market data, in a dark TradingView-like workspace: drawings, indicators, watchlist, alerts, compare, bar replay, and paper trading.

This is **not** affiliated with TradingView. The charting engine is [Lightweight Charts](https://www.tradingview.com/lightweight-charts/) (Apache-2.0). Not financial advice; paper trades never hit an exchange.

## Run locally

```bash
git clone https://github.com/copytolive/chart.git
cd chart
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173). Node 22+.

```bash
npm run build     # production build
npm run preview   # serve the build
npm run typecheck
```

## Features

- Candlestick, hollow candle, Heikin Ashi, bar, line, and area
- Timeframes: 1m–12h, 1D, 3D, 1W, 1M
- Date-range chips: 1D · 5D · 1M · 3M · 6M · YTD · 1Y · 5Y · All
- Overlays: MA 20/50, EMA 20, Bollinger Bands, VWAP
- Oscillators: RSI, MACD
- Drawings: trend, ray, horizontal, rectangle, Fibonacci, measure, text
- Magnet, lock, hide, object tree
- Live watchlist (Symbol / Last / Chg / Chg%), symbol search (`/` or Ctrl/Cmd+K)
- Compare overlay, price alerts, snapshot, log scale
- Paper trading ticket with local fills
- Bar replay

## Layout

Matches the TradingView chart chrome: top nav, symbol/interval/type toolbar, left drawing rail, main pane with OHLC legend + volume, date-range bar, right icon rail + watchlist, bottom trading panel.

## Data

Klines and 24h tickers are fetched server-side from `data-api.binance.vision`, with OKX as fallback. Polls every 8 seconds. No API key.

## Stack

React 19, TanStack Start, Tailwind v4, Zustand, Lightweight Charts v5.

## License

MIT. TradingView is a trademark of TradingView, Inc. This project is an independent look-alike UI built on the open-source Lightweight Charts library.
