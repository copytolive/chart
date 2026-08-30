# CopyToLive Chart — XAUUSD Dark Renko Reference

Pixel-oriented static reconstruction of the supplied TradingView XAUUSD screenshot.

## Reference target

- Canvas design size: **2048 × 1210**
- Symbol: **XAUUSD**
- Timeframe: **1D**
- Chart type: **Renko [ATR(14), 100]**
- Theme: **dark**
- Includes the top toolbar, left drawing rail, Renko path, price/time axes, watchlist, XAUUSD details, performance cards, seasonals, and bottom range bar.

## Files

- `index.html` — fixed screenshot-comparison shell
- `styles.css` — fullscreen scaling surface
- `app.js` — deterministic Canvas renderer using measured geometry/colors from the reference screenshot

The renderer scales the 2048×1210 reference composition to the browser viewport while preserving its aspect ratio. This project is independent and is not affiliated with TradingView. TradingView is a trademark of TradingView, Inc.
