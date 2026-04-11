from fastapi import APIRouter
from services.search_service import search_stocks, get_trending

router = APIRouter(prefix="/search")

@router.get("")
def search(q: str = ""):
    if not q:
        return get_trending()

    results = search_stocks(q)

    # 🔥 RETURN ONLY SYMBOLS (FIX FRONTEND ISSUE)
    return [r["symbol"] for r in results]