from fastapi import APIRouter
from pydantic import BaseModel
from services.portfolio_service import get_portfolio, add_holding, remove_holding
from services.data_service import get_stock_price

router = APIRouter(prefix="/portfolio")


class HoldingInput(BaseModel):
    user_id:      str
    symbol:       str
    company_name: str
    quantity:     float
    buy_price:    float


@router.get("/{user_id}")
def fetch_portfolio(user_id: str):
    if not user_id or len(user_id) < 5:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid user ID")
        
    holdings = get_portfolio(user_id)
    enriched = []
    for h in holdings:
        ticker        = h["symbol"] + ".NS"
        current_price = get_stock_price(ticker)
        invested      = h["quantity"] * h["buy_price"]
        current_value = h["quantity"] * current_price
        pnl           = current_value - invested
        pnl_pct       = (pnl / invested * 100) if invested > 0 else 0
        enriched.append({
            **h,
            "current_price": round(current_price, 2),
            "invested":      round(invested, 2),
            "current_value": round(current_value, 2),
            "pnl":           round(pnl, 2),
            "pnl_percent":   round(pnl_pct, 2),
        })
    return enriched


@router.post("/add")
def add_to_portfolio(payload: HoldingInput):
    new_id = add_holding(
        payload.user_id, payload.symbol, payload.company_name,
        payload.quantity, payload.buy_price,
    )
    return {"success": True, "id": new_id}


@router.delete("/{holding_id}")
def delete_holding(holding_id: int, user_id: str):
    success = remove_holding(holding_id, user_id)
    return {"success": success}