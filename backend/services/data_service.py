import yfinance as yf

YF_SYMBOL_OVERRIDES = {
    "TATAMOTORS": "TATAMOTORS.BO",
    "TATAMOTORS.NS": "TATAMOTORS.BO",
}


def _ticker_candidates(symbol: str):
    symbol = symbol.strip().upper()
    if symbol in YF_SYMBOL_OVERRIDES:
        override = YF_SYMBOL_OVERRIDES[symbol]
        if override.endswith(".BO"):
            base = override[:-3]
            return [override, f"{base}.NS"]
        if override.endswith(".NS"):
            base = override[:-3]
            return [override, f"{base}.BO"]
        return [override]
    if symbol.startswith("^"):
        return [symbol]
    if symbol.endswith(".NS"):
        base = symbol[:-3]
        return [symbol, f"{base}.BO"]
    if symbol.endswith(".BO"):
        base = symbol[:-3]
        return [symbol, f"{base}.NS"]
    return [f"{symbol}.NS", f"{symbol}.BO"]

# =========================
# 📊 CURRENT PRICE FUNCTION
# =========================
def get_stock_price(symbol: str):
    for ticker_symbol in _ticker_candidates(symbol):
        try:
            stock = yf.Ticker(ticker_symbol)
            df = stock.history(period="2d")

            if df.empty:
                continue

            return float(df["Close"].iloc[-1])
        except Exception:
            continue
    return 0


# =========================
# 📈 HISTORY FUNCTION
# =========================
def get_history(symbol: str, period: str = "1mo"):
    for ticker_symbol in _ticker_candidates(symbol):
        try:
            stock = yf.Ticker(ticker_symbol)

            if period == "1d":
                # Intraday 5-minute data for the whole day
                df = stock.history(period="1d", interval="5m")
                if df.empty:
                    continue
            elif period == "5d":
                # Intraday 15-minute data for 5 days
                df = stock.history(period="5d", interval="15m")
                if df.empty:
                    continue
            else:
                # Daily data for 1mo and beyond
                df = stock.history(period=period, interval="1d")
                if df.empty:
                    continue

            df = df.reset_index()
            # yfinance returns 'Datetime' for intraday and 'Date' for daily
            date_col = "Datetime" if "Datetime" in df.columns else "Date"

            df = df[[date_col, "Close"]]
            df = df.rename(columns={date_col: "Date"})

            df["Date"] = df["Date"].astype(str)

            return df.to_dict(orient="records")
        except Exception:
            continue

    return []
