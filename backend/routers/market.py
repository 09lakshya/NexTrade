from fastapi import APIRouter, WebSocket
import asyncio
import yfinance as yf
from services.data_service import get_stock_price, get_history

router = APIRouter(prefix="/market")

# =========================
# 📊 STOCK LIST
# =========================
stocks = [
    "NIFTY50",
    "SENSEX",
    "RELIANCE",
    "TCS",
    "INFY",
    "HDFCBANK",
    "ICICIBANK",
    "SBIN"
]

# =========================
# 🔧 HELPER (FIXED)
# =========================
def get_ticker(symbol):
    if symbol == "NIFTY50":
        return "^NSEI"
    elif symbol == "SENSEX":
        return "^BSESN"
    else:
        return symbol + ".NS"


# =========================
# 📊 CURRENT PRICE API
# =========================
@router.get("/{symbol}")
def get_market(symbol: str):
    ticker = get_ticker(symbol)  # ✅ FIX
    return {
        "symbol": symbol,
        "price": get_stock_price(ticker)
    }


# =========================
# 📈 HISTORY API (FIXED)
# =========================
@router.get("/{symbol}/history")
def history(symbol: str, period: str = "1mo"):
    ticker = get_ticker(symbol)   # ✅ THIS FIXES EVERYTHING
    return get_history(ticker, period)


# =========================
# ⚡ WEBSOCKET (LIVE DASHBOARD)
# =========================
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    while True:
        data = {}

        for symbol in stocks:
            try:
                ticker = get_ticker(symbol)
                stock = yf.Ticker(ticker)

                hist = stock.history(period="5d")

                if hist.empty:
                    continue

                close_series = hist["Close"].dropna()

                if len(close_series) < 2:
                    continue

                price = float(close_series.iloc[-1])
                prev_close = float(close_series.iloc[-2])

                change = price - prev_close
                percent = (change / prev_close * 100) if prev_close != 0 else 0

                data[symbol] = {
                    "price": round(price, 2),
                    "change": round(change, 2),
                    "percent": round(percent, 2)
                }

            except Exception as e:
                print(f"Error fetching {symbol}:", e)

        # Ensure indices exist
        data.setdefault("NIFTY50", {"price": 0, "change": 0, "percent": 0})
        data.setdefault("SENSEX", {"price": 0, "change": 0, "percent": 0})

        await websocket.send_json(data)
        await asyncio.sleep(2)