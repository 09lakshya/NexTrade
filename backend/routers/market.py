from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import yfinance as yf
from services.data_service import get_stock_price, get_history

router = APIRouter(prefix="/market")

# =========================
# 📊 STOCK LIST (NIFTY 50 Universe)
# =========================
NIFTY50_SYMBOLS = [
    "NIFTY50", "SENSEX",
    "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "BHARTIARTL", "SBIN",
    "INFY", "LICI", "ITC", "HINDUNILVR", "LT", "BAJFINANCE", "HCLTECH",
    "MARUTI", "SUNPHARMA", "TATAMOTORS", "NTPC", "KOTAKBANK", "ONGC",
    "TITAN", "ADANIENT", "COALINDIA", "ASIANPAINT", "BAJAJFINSV", "M&M",
    "ULTRACEMCO", "POWERGRID", "NESTLEIND", "WIPRO", "GRASIM", "JSWSTEEL",
    "TATASTEEL", "TATACONSUM", "HDFCLIFE", "TECHM", "INDUSINDBK",
    "BAJAJ-AUTO", "APOLLOHOSP", "BRITANNIA", "EICHERMOT", "CIPLA", "DIVISLAB",
    "DRREDDY", "HINDALCO", "SBILIFE", "HEROMOTOCO", "UPL"
]

# =========================
# 🔧 GLOBALS & HELPERS
# =========================
def get_ticker(symbol):
    if symbol == "NIFTY50":
        return "^NSEI"
    elif symbol == "SENSEX":
        return "^BSESN"
    else:
        return symbol + ".NS"

GLOBAL_CACHE = {
    "NIFTY50": {"price": 0, "change": 0, "percent": 0},
    "SENSEX": {"price": 0, "change": 0, "percent": 0}
}
_background_task = None
_active_connections = set()

# =========================
# 🔄 BACKGROUND CACHE UPDATER
# =========================
async def update_market_cache():
    global GLOBAL_CACHE
    tickers_map = {get_ticker(s): s for s in NIFTY50_SYMBOLS}
    ticker_string = " ".join(tickers_map.keys())
    
    while True:
        try:
            # Bulk download all tickers at once (fast!)
            df = yf.download(ticker_string, period="5d", interval="1d", progress=False)
            
            new_data = {}
            if "Close" in df:
                close_df = df["Close"]
                
                for ticker, sym in tickers_map.items():
                    try:
                        # yf.download structure can vary slightly if 1 vs many tickers are passed
                        if hasattr(close_df, "columns") and ticker in close_df.columns:
                            close_series = close_df[ticker].dropna()
                        elif isinstance(close_df, dict) and ticker in close_df: # edge cases
                            close_series = close_df[ticker].dropna()
                        elif isinstance(close_df, type(df["Close"])) and len(tickers_map) == 1:
                            close_series = close_df.dropna()
                        else:
                            continue
                            
                        if len(close_series) < 2:
                            continue
                            
                        price = float(close_series.iloc[-1])
                        prev_close = float(close_series.iloc[-2])
                        change = price - prev_close
                        percent = (change / prev_close * 100) if prev_close != 0 else 0
                        
                        new_data[sym] = {
                            "price": round(price, 2),
                            "change": round(change, 2),
                            "percent": round(percent, 2)
                        }
                    except Exception as ex:
                        print(f"Error parsing {sym}: {ex}")

            # Fallback for indices if something goes wrong
            new_data.setdefault("NIFTY50", GLOBAL_CACHE.get("NIFTY50", {"price": 0, "change": 0, "percent": 0}))
            new_data.setdefault("SENSEX", GLOBAL_CACHE.get("SENSEX", {"price": 0, "change": 0, "percent": 0}))

            if new_data:
                GLOBAL_CACHE.update(new_data)
                
            # Broadcast to all connected clients
            for connection in list(_active_connections):
                try:
                    await connection.send_json(GLOBAL_CACHE)
                except Exception:
                    _active_connections.discard(connection)
                    
        except Exception as e:
            print(f"[Background Fetch] Failed to bulk fetch market data: {e}")
            
        await asyncio.sleep(15)  # 15s refresh interval to avoid rate limiting


# =========================
# ⚡ WEBSOCKET 
# =========================
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global _background_task
    await websocket.accept()
    
    # Start the global caching task if it isn't running yet
    if _background_task is None:
        _background_task = asyncio.create_task(update_market_cache())
        
    _active_connections.add(websocket)
    
    # Send the current cache immediately upon connection
    await websocket.send_json(GLOBAL_CACHE)
    
    try:
        while True:
            # Keep the connection open and wait for client messages (if any)
            await websocket.receive_text()
    except WebSocketDisconnect:
        _active_connections.discard(websocket)

# =========================
# 📊 API ENDPOINTS
# =========================
@router.get("/{symbol}")
def get_market(symbol: str):
    ticker = get_ticker(symbol)
    return {
        "symbol": symbol,
        "price": get_stock_price(ticker)
    }

@router.get("/{symbol}/history")
def history(symbol: str, period: str = "1mo"):
    ticker = get_ticker(symbol)
    return get_history(ticker, period)