from typing import Optional
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from services.portfolio_service import get_portfolio, add_holding, remove_holding
from services.data_service import get_stock_price
from services.auth_service import verify_token

router = APIRouter(prefix="/portfolio")


class HoldingInput(BaseModel):
    symbol:       str
    company_name: str
    quantity:     float
    buy_price:    float


def _require_user_id(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.split(" ", 1)[1]
    user_id = verify_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return str(user_id)


def _enrich_holdings(user_id: str):
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


@router.get("/me")
def fetch_portfolio_me(authorization: Optional[str] = Header(None)):
    user_id = _require_user_id(authorization)
    return _enrich_holdings(user_id)


@router.get("/{user_id}")
def fetch_portfolio(user_id: str, authorization: Optional[str] = Header(None)):
    auth_user_id = _require_user_id(authorization)
    if user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return _enrich_holdings(auth_user_id)


@router.post("/add")
def add_to_portfolio(payload: HoldingInput, authorization: Optional[str] = Header(None)):
    user_id = _require_user_id(authorization)
    if payload.quantity <= 0 or payload.buy_price <= 0:
        raise HTTPException(status_code=400, detail="Quantity and buy price must be greater than zero")

    new_id = add_holding(
        user_id, payload.symbol, payload.company_name,
        payload.quantity, payload.buy_price,
    )
    return {"success": True, "id": new_id}


@router.delete("/{holding_id}")
def delete_holding(holding_id: int, authorization: Optional[str] = Header(None)):
    user_id = _require_user_id(authorization)
    success = remove_holding(holding_id, user_id)
    return {"success": success}
