from fastapi import APIRouter
from services.ai_service import predict_stock

router = APIRouter(prefix="/predict")

@router.get("/{symbol}")
def get_prediction(symbol: str):
    return predict_stock(symbol)