import asyncio
import time
import yfinance as yf

SYMBOLS = {
    "NIFTY50": "^NSEI",
    "SENSEX": "^BSESN",
    "RELIANCE": "RELIANCE.NS",
    "TCS": "TCS.NS",
    "INFY": "INFY.NS",
    "HDFCBANK": "HDFCBANK.NS",
    "ICICIBANK": "ICICIBANK.NS",
    "SBIN": "SBIN.NS",
}

REFRESH_SECONDS = 15
_cache = {"at": 0, "data": None}
_cache_lock = asyncio.Lock()

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

async def get_market_snapshot():
    async with _cache_lock:
        now = time.time()
        if _cache["data"] and now - _cache["at"] < REFRESH_SECONDS:
            return _cache["data"]

        results = await asyncio.gather(
            *(asyncio.to_thread(get_stock_data, ticker) for ticker in SYMBOLS.values()),
            return_exceptions=True,
        )
        data = {}
        for label, result in zip(SYMBOLS.keys(), results):
            data[label] = (
                {"price": 0, "change": 0, "percent": 0}
                if isinstance(result, Exception)
                else result
            )

        _cache["at"] = now
        _cache["data"] = data
        return data

async def websocket_endpoint(websocket):
    await websocket.accept()

    while True:
        data = await get_market_snapshot()
        await websocket.send_json(data)
        await asyncio.sleep(REFRESH_SECONDS)
