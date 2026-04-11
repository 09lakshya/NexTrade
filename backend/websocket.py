import asyncio
import yfinance as yf

def get_stock_data(symbol):
    stock = yf.Ticker(symbol)
    df = stock.history(period="2d")

    if len(df) < 2:
        return {"price": 0, "change": 0, "percent": 0}

    latest = df["Close"].iloc[-1]
    prev = df["Close"].iloc[-2]

    change = latest - prev
    percent = (change / prev) * 100

    return {
        "price": round(latest, 2),
        "change": round(change, 2),
        "percent": round(percent, 2),
    }

async def websocket_endpoint(websocket):
    await websocket.accept()

    while True:
        data = {
            "NIFTY50": get_stock_data("^NSEI"),
            "SENSEX": get_stock_data("^BSESN"),
            "RELIANCE": get_stock_data("RELIANCE.NS"),
            "TCS": get_stock_data("TCS.NS"),
            "INFY": get_stock_data("INFY.NS"),
            "HDFCBANK": get_stock_data("HDFCBANK.NS"),
            "ICICIBANK": get_stock_data("ICICIBANK.NS"),
            "SBIN": get_stock_data("SBIN.NS"),
        }

        await websocket.send_json(data)
        await asyncio.sleep(2)