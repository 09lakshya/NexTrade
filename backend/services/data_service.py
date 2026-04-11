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

        # For 1-day period, show the last trading day with last day data
        if period == "1d":
            # Get 5 days to ensure we have last trading day
            df = stock.history(period="5d", interval="1d")
            
            if not df.empty:
                # Get only the latest trading day
                df = df.tail(1)
                print(f"✓ Got 1d data for {symbol} (latest trading day)")
            else:
                print(f"❌ No data for {symbol} in last 5 days")
                return []
        else:
            # For other periods, use daily interval
            df = stock.history(period=period, interval="1d")
            
            if df.empty:
                print(f"❌ No data for {symbol} with period {period}")
                return []

        df = df.reset_index()
        df = df[["Date", "Close"]]
        df["Date"] = df["Date"].astype(str)

        print(f"✓ Returning {len(df)} records for {symbol}: {df.to_dict(orient='records')}")
        return df.to_dict(orient="records")

    except Exception as e:
        print(f"❌ History Error for {symbol}: {e}")
        import traceback
        traceback.print_exc()
        return []