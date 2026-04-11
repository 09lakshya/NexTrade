"""
Investment Calculator Service
Handles compound interest, real returns, and financial projections
"""

def calculate_investment(principal: float, annual_rate: float, years: int, inflation_rate: float = 0.06):
    """
    Calculate investment future value and real returns
    
    Args:
        principal: Initial investment amount (₹)
        annual_rate: Expected annual return rate (0.12 = 12%)
        years: Investment duration in years
        inflation_rate: Expected inflation rate (default 6%)
    
    Returns:
        Dict with future_value, profit, return_percentage, real_return_percentage
    """
    try:
        if principal <= 0 or annual_rate < 0 or years <= 0:
            return {"error": "Invalid input values"}
        
        # Future Value = P * (1 + r)^t
        future_value = principal * ((1 + annual_rate) ** years)
        
        # Profit
        profit = future_value - principal
        
        # Return Percentage
        return_percentage = (profit / principal) * 100
        
        # Real Return = [(1 + nominal_return) / (1 + inflation)] - 1
        # Using: Real Return % = Nominal Return % adjusted for inflation
        if inflation_rate > 0:
            real_return_percentage = (((1 + annual_rate) / (1 + inflation_rate)) - 1) * 100 * years
        else:
            real_return_percentage = return_percentage
        
        return {
            "principal": round(principal, 2),
            "future_value": round(future_value, 2),
            "profit": round(profit, 2),
            "return_percentage": round(return_percentage, 2),
            "real_return_percentage": round(real_return_percentage, 2),
            "annual_rate": annual_rate * 100,
            "years": years,
            "inflation_rate": inflation_rate * 100,
        }
    except Exception as e:
        print(f"Calculator error: {e}")
        return {"error": str(e)}


def calculate_portfolio_metrics(stocks: list, budget: float):
    """
    Calculate aggregate portfolio metrics
    
    Args:
        stocks: List of stock recommendations with current_price and suggested_allocation
        budget: Total investment amount
    
    Returns:
        Dict with portfolio summary metrics
    """
    try:
        if not stocks or budget <= 0:
            return {"error": "Invalid input"}
        
        total_allocation = sum(s.get("suggested_allocation", 0) for s in stocks)
        
        # Risk levels
        risk_distribution = {"low": 0, "medium": 0, "high": 0}
        for stock in stocks:
            risk = stock.get("risk_level", "medium")
            allocation = stock.get("suggested_allocation", 0)
            risk_distribution[risk] += allocation
        
        # Calculate portfolio risk score (0-10)
        low_pct = (risk_distribution["low"] / total_allocation * 100) if total_allocation > 0 else 0
        medium_pct = (risk_distribution["medium"] / total_allocation * 100) if total_allocation > 0 else 0
        high_pct = (risk_distribution["high"] / total_allocation * 100) if total_allocation > 0 else 0
        
        # Risk score: low=2, medium=5, high=8
        portfolio_risk_score = (low_pct * 2 + medium_pct * 5 + high_pct * 8) / 100
        
        # Average confidence (from all stocks' sentiment scores)
        avg_confidence = sum(s.get("confidence", 65) for s in stocks) / len(stocks) if stocks else 65
        
        return {
            "total_allocation": round(total_allocation, 2),
            "num_stocks": len(stocks),
            "portfolio_risk_score": round(portfolio_risk_score, 1),  # 0-10 scale
            "portfolio_risk_label": "Low" if portfolio_risk_score <= 3.5 else "Medium" if portfolio_risk_score <= 6.5 else "High",
            "low_risk_pct": round(low_pct, 1),
            "medium_risk_pct": round(medium_pct, 1),
            "high_risk_pct": round(high_pct, 1),
            "average_confidence": round(avg_confidence, 1),
        }
    except Exception as e:
        print(f"Portfolio metrics error: {e}")
        return {"error": str(e)}


def estimate_returns(stocks: list, annual_growth_rate: float = 0.12, years: int = 3):
    """
    Estimate portfolio returns based on growth rate and time horizon
    
    Args:
        stocks: List of stock recommendations
        annual_growth_rate: Expected annual growth (default 12% for Indian markets)
        years: Investment horizon
    
    Returns:
        Dict with projected returns
    """
    try:
        total_allocation = sum(s.get("suggested_allocation", 0) for s in stocks)
        
        if total_allocation <= 0:
            return {"error": "Invalid allocation"}
        
        # Adjust growth rate based on average risk
        risk_scores = {
            "low": 0.08,      # 8% expected return
            "medium": 0.12,   # 12% expected return
            "high": 0.16,     # 16% expected return (higher risk)
        }
        
        weighted_rate = 0
        for stock in stocks:
            risk = stock.get("risk_level", "medium")
            allocation = stock.get("suggested_allocation", 0)
            rate = risk_scores.get(risk, 0.12)
            weighted_rate += (allocation / total_allocation) * rate
        
        # Future value
        future_value = total_allocation * ((1 + weighted_rate) ** years)
        profit = future_value - total_allocation
        
        # Real return (assuming 6% inflation)
        inflation_rate = 0.06
        real_return_rate = ((1 + weighted_rate) / (1 + inflation_rate)) - 1
        real_future_value = total_allocation * ((1 + real_return_rate) ** years)
        
        return {
            "principal": round(total_allocation, 2),
            "future_value": round(future_value, 2),
            "profit": round(profit, 2),
            "return_percentage": round((profit / total_allocation * 100), 2),
            "weighted_annual_rate": round(weighted_rate * 100, 2),
            "real_return_percentage": round((real_return_rate * 100), 2),
            "real_future_value": round(real_future_value, 2),
            "years": years,
        }
    except Exception as e:
        print(f"Returns estimation error: {e}")
        return {"error": str(e)}
