import yfinance as yf
import numpy as np
import pandas as pd
from textblob import TextBlob
import requests
from bs4 import BeautifulSoup
import os

try:
    _yf_cache_dir = os.path.join(os.getenv("TEMP", "C:\\tmp"), "nextrade-yfinance-cache")
    os.makedirs(_yf_cache_dir, exist_ok=True)
    yf.set_tz_cache_location(_yf_cache_dir)
except Exception:
    pass

YF_SYMBOL_OVERRIDES = {
    "TATAMOTORS": "TATAMOTORS.BO",
    "TATAMOTORS.NS": "TATAMOTORS.BO",
}


def _ticker_candidates(symbol: str):
    symbol = str(symbol).strip().upper()
    if symbol in YF_SYMBOL_OVERRIDES:
        override = YF_SYMBOL_OVERRIDES[symbol]
        if override.endswith(".BO"):
            base = override[:-3]
            return [override, f"{base}.NS"]
        if override.endswith(".NS"):
            base = override[:-3]
            return [override, f"{base}.BO"]
        return [override]
    if symbol.startswith("^"):
        return [symbol]
    if symbol.endswith(".NS"):
        base = symbol[:-3]
        return [symbol, f"{base}.BO"]
    if symbol.endswith(".BO"):
        base = symbol[:-3]
        return [symbol, f"{base}.NS"]
    return [f"{symbol}.NS", f"{symbol}.BO"]


def _get_working_ticker(symbol: str):
    for candidate in _ticker_candidates(symbol):
        try:
            df = yf.Ticker(candidate).history(period="5d")
            if not df.empty:
                return candidate
        except Exception:
            continue
    return symbol


def calculate_rsi(prices, period=14):
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))


def calculate_macd(prices, fast=12, slow=26, signal=9):
    """Calculate MACD indicator"""
    ema_fast = prices.ewm(span=fast).mean()
    ema_slow = prices.ewm(span=slow).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal).mean()
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram


def calculate_bollinger_bands(prices, period=20, std_dev=2):
    """Calculate Bollinger Bands"""
    sma = prices.rolling(period).mean()
    std = prices.rolling(period).std()
    upper_band = sma + (std * std_dev)
    lower_band = sma - (std * std_dev)
    return upper_band, sma, lower_band


def analyze_sentiment(text):
    """Analyze sentiment of text using TextBlob"""
    if not text:
        return 0
    try:
        blob = TextBlob(str(text))
        polarity = blob.sentiment.polarity
        # Convert -1 to 1 range to 0 to 100 range
        return (polarity + 1) * 50
    except:
        return 50


def _safe_float(value, default=None):
    try:
        if value is None:
            return default
        value = float(value)
        if np.isnan(value) or np.isinf(value):
            return default
        return value
    except Exception:
        return default


def _news_text(item: dict) -> str:
    content = item.get("content") or {}
    title = item.get("title") or content.get("title") or ""
    summary = (
        item.get("summary")
        or item.get("publisher")
        or content.get("summary")
        or content.get("description")
        or ""
    )
    return f"{title} {summary}".strip()


def _market_sentiment_proxy(symbol: str):
    """Fallback when news text is unavailable; keeps neutral from meaning unknown."""
    try:
        stock = yf.Ticker(_get_working_ticker(symbol))
        df = stock.history(period="3mo", interval="1d")
        if df.empty or len(df) < 15:
            return {"sentiment_score": 50, "news_count": 0, "impact": "neutral", "source": "none"}

        close = df["Close"]
        volume = df["Volume"]
        one_month_return = close.iloc[-1] / close.iloc[-min(22, len(close))] - 1
        one_week_return = close.iloc[-1] / close.iloc[-min(6, len(close))] - 1
        volume_ratio = volume.iloc[-5:].mean() / volume.iloc[-20:].mean() if volume.iloc[-20:].mean() > 0 else 1

        score = 50 + (one_month_return * 90) + (one_week_return * 70) + ((volume_ratio - 1) * 8)
        score = max(25, min(75, score))
        impact = "bullish" if score > 58 else "bearish" if score < 42 else "neutral"
        return {
            "sentiment_score": round(score, 2),
            "news_count": 0,
            "impact": impact,
            "source": "market_proxy",
        }
    except Exception:
        return {"sentiment_score": 50, "news_count": 0, "impact": "neutral", "source": "none"}


def fetch_news_sentiment(symbol: str):
    """Fetch and analyze news sentiment for a stock"""
    try:
        stock = yf.Ticker(_get_working_ticker(symbol))
        
        # Try to get news from yfinance
        try:
            news = stock.news
            if not news:
                return {"sentiment_score": 50, "news_count": 0, "impact": "neutral"}
            
            sentiments = []
            for item in news[:10]:  # Last 10 news items
                text = _news_text(item)
                if text:
                    sentiment = analyze_sentiment(text)
                    sentiments.append(sentiment)

            if not sentiments:
                return _market_sentiment_proxy(symbol)
            
            avg_sentiment = float(np.mean(sentiments)) if sentiments else 50
            
            # Determine impact
            if avg_sentiment > 60:
                impact = "bullish"
            elif avg_sentiment < 40:
                impact = "bearish"
            else:
                impact = "neutral"
            
            return {
                "sentiment_score": float(round(avg_sentiment, 2)),
                "news_count": len(sentiments),
                "impact": impact,
                "details": len(sentiments) > 0,
                "source": "news",
            }
        except:
            # Fallback if news not available
            return _market_sentiment_proxy(symbol)
    except Exception as e:
        print(f"News sentiment error: {e}")
        return _market_sentiment_proxy(symbol)


def get_fundamental_data(symbol: str):
    """Get fundamental data for a stock"""
    try:
        stock = yf.Ticker(_get_working_ticker(symbol))
        info = stock.get_info() or {}
        fast_info = getattr(stock, "fast_info", {}) or {}
        
        fundamentals = {
            "pe_ratio": _safe_float(info.get("trailingPE")),
            "pb_ratio": _safe_float(info.get("priceToBook")),
            "dividend_yield": _safe_float(info.get("dividendYield"), 0),
            "earnings_growth": _safe_float(info.get("earningsGrowth"), 0),
            "revenue_growth": _safe_float(info.get("revenueGrowth"), 0),
            "profit_margin": _safe_float(info.get("profitMargins"), 0),
            "debt_to_equity": _safe_float(info.get("debtToEquity")),
            "roa": _safe_float(info.get("returnOnAssets"), 0),
            "roe": _safe_float(info.get("returnOnEquity"), 0),
            "market_cap": _safe_float(info.get("marketCap") or fast_info.get("market_cap"), 0),
            "data_points": 0,
        }

        fundamentals["data_points"] = sum(
            1 for key in [
                "pe_ratio", "pb_ratio", "dividend_yield", "earnings_growth",
                "revenue_growth", "profit_margin", "debt_to_equity", "roa",
                "roe", "market_cap"
            ]
            if fundamentals.get(key) not in (None, 0)
        )
        
        return fundamentals
    except Exception as e:
        print(f"Fundamental data error: {e}")
        return {}


def calculate_fundamental_score(fundamentals: dict):
    """Calculate a score based on fundamental data"""
    score = 50  # Neutral baseline
    factors = 0
    
    try:
        # PE Ratio analysis
        pe = fundamentals.get("pe_ratio")
        if pe and pe > 0:
            if pe < 15:
                score += 10  # Undervalued
            elif pe > 30:
                score -= 5   # Expensive
            factors += 1
        
        # Earnings growth
        eg = fundamentals.get("earnings_growth", 0)
        if eg and eg > 0:
            score += min(eg * 10, 15)  # Cap at +15
            factors += 1
        elif eg and eg < 0:
            score -= min(abs(eg) * 10, 10)
            factors += 1
        
        # Revenue growth
        rg = fundamentals.get("revenue_growth", 0)
        if rg and rg > 0:
            score += min(rg * 5, 10)
            factors += 1
        
        # ROE (Return on Equity)
        roe = fundamentals.get("roe", 0)
        if roe and roe > 0.15:  # > 15% is good
            score += 8
            factors += 1
        elif roe and roe < 0:
            score -= 8
            factors += 1
        
        # Debt to Equity
        dte = fundamentals.get("debt_to_equity")
        if dte and dte > 2:  # High debt
            score -= 5
            factors += 1
        elif dte and dte < 1:  # Low debt
            score += 5
            factors += 1
        
        # Dividend yield
        dy = fundamentals.get("dividend_yield", 0)
        if dy and dy > 0.02:  # > 2% is good
            score += 5
            factors += 1
        
    except Exception as e:
        print(f"Fundamental scoring error: {e}")
    
    if factors == 0:
        return None

    # Blend back toward neutral when only a few data points are available.
    reliability = min(1, factors / 4)
    score = 50 + ((score - 50) * reliability)
    return max(0, min(100, score))  # Clamp between 0-100


def calculate_technical_quality_score(close, volume):
    returns = close.pct_change().dropna()
    if returns.empty:
        return 50

    momentum_3m = close.iloc[-1] / close.iloc[-min(63, len(close))] - 1
    momentum_1m = close.iloc[-1] / close.iloc[-min(22, len(close))] - 1
    volatility = returns.tail(60).std() * np.sqrt(252)
    drawdown = close.iloc[-1] / close.tail(min(126, len(close))).max() - 1
    avg_volume = volume.tail(min(20, len(volume))).mean()

    score = 50
    score += max(-18, min(18, momentum_3m * 80))
    score += max(-10, min(10, momentum_1m * 70))
    score -= max(0, min(12, (volatility - 0.25) * 25))
    score += max(-8, min(4, drawdown * 20))
    if avg_volume and avg_volume > 0:
        score += 3

    return max(20, min(80, score))


def predict_stock(symbol: str):
    try:
        # Get more historical data for better accuracy
        stock = yf.Ticker(_get_working_ticker(symbol))
        df = stock.history(period="1y")  # 1 year of daily data to support long moving averages
        
        if df.empty or len(df) < 50:
            return {"error": "Not enough data"}

        close = df["Close"]
        volume = df["Volume"]

        current_price = float(close.iloc[-1])
        prev_price = float(close.iloc[-2])
        
        change = current_price - prev_price
        percent_change = (change / prev_price) * 100

        # ===== TECHNICAL INDICATORS =====
        rsi = calculate_rsi(close).iloc[-1]
        
        # MACD
        macd_line, signal_line, histogram = calculate_macd(close)
        current_macd = macd_line.iloc[-1]
        current_signal = signal_line.iloc[-1]
        current_histogram = histogram.iloc[-1]
        
        # Bollinger Bands
        upper_bb, middle_bb, lower_bb = calculate_bollinger_bands(close)
        current_upper = upper_bb.iloc[-1]
        current_middle = middle_bb.iloc[-1]
        current_lower = lower_bb.iloc[-1]
        
        # Moving Averages
        ma20 = close.rolling(20).mean().iloc[-1]
        ma50 = close.rolling(50).mean().iloc[-1]
        ma200 = close.rolling(200).mean().iloc[-1] if len(close) >= 200 else np.nan
        
        # Volume Analysis
        avg_volume = volume.rolling(20).mean().iloc[-1]
        current_volume = volume.iloc[-1]
        volume_signal = current_volume / avg_volume if avg_volume > 0 else 1

        # ===== SENTIMENT & FUNDAMENTAL ANALYSIS =====
        news_data = fetch_news_sentiment(symbol)
        news_sentiment = news_data.get("sentiment_score", 50)
        
        fundamentals = get_fundamental_data(symbol)
        fundamental_score = calculate_fundamental_score(fundamentals)
        fundamental_source = "fundamentals"
        if fundamental_score is None:
            fundamental_score = calculate_technical_quality_score(close, volume)
            fundamental_source = "technical_proxy"

        # ===== TREND DETECTION =====
        trend_score = 0
        confidence_factors = []
        
        # MA trend analysis
        if not np.isnan(ma200):
            if ma20 > ma50 > ma200:
                trend_score += 2
                confidence_factors.append(25)
            elif ma20 < ma50 < ma200:
                trend_score -= 2
                confidence_factors.append(25)
            elif ma20 > ma50:
                trend_score += 1
                confidence_factors.append(15)
            elif ma20 < ma50:
                trend_score -= 1
                confidence_factors.append(15)
        else:
            if ma20 > ma50:
                trend_score += 1
                confidence_factors.append(15)
            elif ma20 < ma50:
                trend_score -= 1
                confidence_factors.append(15)
        
        # RSI Analysis
        if rsi > 70:  # Overbought
            trend_score -= 1
            confidence_factors.append(10)
        elif rsi < 30:  # Oversold
            trend_score += 1
            confidence_factors.append(10)
        elif rsi > 60:
            trend_score += 1
            confidence_factors.append(8)
        elif rsi < 40:
            trend_score -= 1
            confidence_factors.append(8)
        
        # MACD Analysis
        if current_histogram > 0 and current_macd > current_signal:
            trend_score += 1.5
            confidence_factors.append(20)
        elif current_histogram < 0 and current_macd < current_signal:
            trend_score -= 1.5
            confidence_factors.append(20)
        
        # Bollinger Bands Analysis
        if current_price > current_middle:
            trend_score += 0.5
            confidence_factors.append(10)
        elif current_price < current_middle:
            trend_score -= 0.5
            confidence_factors.append(10)
        
        # ===== NEWS SENTIMENT INFLUENCE =====
        if news_sentiment > 60:  # Bullish sentiment
            trend_score += 0.8
            confidence_factors.append(15)
        elif news_sentiment < 40:  # Bearish sentiment
            trend_score -= 0.8
            confidence_factors.append(15)
        
        # ===== FUNDAMENTAL ANALYSIS INFLUENCE =====
        if fundamental_score > 65:  # Strong fundamentals
            trend_score += 0.6
            confidence_factors.append(12)
        elif fundamental_score < 35:  # Weak fundamentals
            trend_score -= 0.6
            confidence_factors.append(12)
        
        # Volume Analysis
        if volume_signal > 1.2:  # Higher than average volume
            confidence_factors.append(5)
        
        # Determine trend and confidence
        if trend_score > 0:
            trend = "BULLISH"
            base_confidence = min(50 + abs(trend_score) * 5, 95)
        elif trend_score < 0:
            trend = "BEARISH"
            base_confidence = min(50 + abs(trend_score) * 5, 95)
        else:
            trend = "NEUTRAL"
            base_confidence = 50
        
        # Dynamic confidence based on multiple factors (including sentiment & fundamentals)
        factor_confidence = min(100, sum(confidence_factors) * 0.85)
        confidence = int(min(100, round((base_confidence * 0.45) + (factor_confidence * 0.55))))

        # ===== PRICE PREDICTION =====
        # Calculate volatility
        volatility = close.pct_change().rolling(20).std().iloc[-1]
        
        # Sentiment and fundamental adjustment. Keep these small; they should nudge,
        # not dominate, a short-term price forecast.
        sentiment_factor = (news_sentiment - 50) / 100  # -0.5 to 0.5
        fundamental_factor = (fundamental_score - 50) / 100  # -0.5 to 0.5
        momentum_5d = close.iloc[-1] / close.iloc[-min(6, len(close))] - 1
        momentum_20d = close.iloc[-1] / close.iloc[-min(21, len(close))] - 1
        mean_reversion = (current_middle - current_price) / current_price if current_price else 0

        expected_move = (
            momentum_5d * 0.30
            + momentum_20d * 0.20
            + mean_reversion * 0.15
            + sentiment_factor * 0.025
            + fundamental_factor * 0.035
        )
        max_move = max(0.015, min(0.08, volatility * 2.2))
        expected_move = max(-max_move, min(max_move, expected_move))
        predicted_price = current_price * (1 + expected_move)

        # ===== DAY CLOSE PREDICTION =====
        x = np.arange(len(close))
        y = close.values
        
        coefficients = np.polyfit(x[-20:], y[-20:], 1)
        slope = coefficients[0]
        intraday_bias = expected_move * 0.35
        day_close_prediction = current_price * (1 + intraday_bias) + slope * 0.35
        
        day_close_prediction = max(day_close_prediction, lower_bb.iloc[-1])
        day_close_prediction = min(day_close_prediction, upper_bb.iloc[-1])

        return {
            "current_price": round(current_price, 2),
            "change": round(change, 2),
            "percent_change": round(percent_change, 2),
            "predicted_price": round(predicted_price, 2),
            "day_close_prediction": round(day_close_prediction, 2),
            "confidence": confidence,
            "trend": trend,
            "rsi": round(float(rsi), 2),
            "macd": round(current_histogram, 4),
            "volatility": round(volatility * 100, 2),
            # New: News and Sentiment
            "news_sentiment": float(round(news_sentiment, 2)),
            "news_impact": news_data.get("impact", "neutral"),
            "news_count": news_data.get("news_count", 0),
            "sentiment_source": news_data.get("source", "news"),
            # New: Fundamental Analysis
            "fundamental_score": float(round(fundamental_score, 2)),
            "fundamental_source": fundamental_source,
            "fundamental_data_points": fundamentals.get("data_points", 0),
            "pe_ratio": fundamentals.get("pe_ratio"),
            "earnings_growth": fundamentals.get("earnings_growth"),
            "revenue_growth": fundamentals.get("revenue_growth"),
        }

    except Exception as e:
        print("Prediction Error:", e)
        return {"error": "Prediction failed"}
