from fastapi import APIRouter
from services.news_service import get_stock_news

router = APIRouter(prefix="/news")

def _ticker(symbol: str) -> str:
    if symbol == "NIFTY50":  return "^NSEI"
    if symbol == "SENSEX":   return "^BSESN"
    return symbol + ".NS"

@router.get("/{symbol}")
def stock_news(symbol: str):
    return get_stock_news(_ticker(symbol))