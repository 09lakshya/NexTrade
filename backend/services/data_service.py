import yfinance as yf

# =========================
# 📊 CURRENT PRICE FUNCTION
# =========================
def get_stock_price(symbol: str):
    try:
        stock = yf.Ticker(symbol)
        df = stock.history(period="2d")

        if df.empty:
            return 0

        return float(df["Close"].iloc[-1])

    except Exception as e:
        print("Price Error:", e)
        return 0


# =========================
# 📈 HISTORY FUNCTION
# =========================
def get_history(symbol: str, period: str = "1mo"):
    try:
        stock = yf.Ticker(symbol)

        if period == "1d":
            # Intraday 5-minute data for the whole day
            df = stock.history(period="1d", interval="5m")
            if df.empty:
                return []
        elif period == "5d":
            # Intraday 15-minute data for 5 days
            df = stock.history(period="5d", interval="15m")
            if df.empty:
                return []
        else:
            # Daily data for 1mo and beyond
            df = stock.history(period=period, interval="1d")
            if df.empty:
                return []

        df = df.reset_index()
        # yfinance returns 'Datetime' for intraday and 'Date' for daily
        date_col = "Datetime" if "Datetime" in df.columns else "Date"
        
        df = df[[date_col, "Close"]]
        df = df.rename(columns={date_col: "Date"})
        
        df["Date"] = df["Date"].astype(str)

        return df.to_dict(orient="records")

    except Exception as e:
        print(f"❌ History Error for {symbol}: {e}")
        import traceback
        traceback.print_exc()
        return []