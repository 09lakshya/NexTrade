from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.advisor_service import get_recommendations
from services.calculator_service import calculate_investment, calculate_portfolio_metrics, estimate_returns

router = APIRouter(prefix="/advisor")


class AdvisorInput(BaseModel):
    goal:     str    # wealth | income | retirement | education | safety
    duration: str    # short | medium | long
    risk:     str    # low | medium | high
    budget:   float
    investmentType: str = "one-time"  # one-time | monthly
    investmentMonths: Optional[int] = None


class CalculatorInput(BaseModel):
    principal: float
    annual_rate: float
    years: int
    inflation_rate: float = 0.06


@router.post("/recommend")
def recommend(payload: AdvisorInput):
    return get_recommendations(
        goal=payload.goal,
        duration=payload.duration,
        risk=payload.risk,
        budget=payload.budget,
        investment_type=payload.investmentType,
        investment_months=payload.investmentMonths,
    )


@router.post("/calculate")
def calculate(payload: CalculatorInput):
    """Calculate investment returns with inflation adjustment"""
    return calculate_investment(
        principal=payload.principal,
        annual_rate=payload.annual_rate / 100,  # Convert percentage to decimal
        years=payload.years,
        inflation_rate=payload.inflation_rate / 100,
    )


@router.post("/portfolio-summary")
def portfolio_summary(stocks: list, budget: float):
    """Calculate portfolio-level metrics"""
    portfolio_metrics = calculate_portfolio_metrics(stocks, budget)
    portfolio_returns = estimate_returns(stocks, years=3)
    
    return {
        "metrics": portfolio_metrics,
        "projections": portfolio_returns,
    }
