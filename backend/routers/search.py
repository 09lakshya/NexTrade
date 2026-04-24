from fastapi import APIRouter
from services.search_service import search_stocks, get_trending

router = APIRouter(prefix="/search")


@router.get("")
def search(q: str = ""):
    if not q:
        return [r["symbol"] for r in get_trending()]

    results = search_stocks(q)
    return [r["symbol"] for r in results]
