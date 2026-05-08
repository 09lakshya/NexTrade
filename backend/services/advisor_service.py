import yfinance as yf
import numpy as np
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional
import redis, json, hashlib, os

YF_SYMBOL_OVERRIDES = {
    "TATAMOTORS": "TATAMOTORS.BO",
    "TATAMOTORS.NS": "TATAMOTORS.BO",
}

try:
    cache = redis.Redis(
        host=os.getenv('REDIS_HOST', 'localhost'),
        port=int(os.getenv('REDIS_PORT', 6379)),
        decode_responses=True
    )
    cache.ping()
    CACHE_AVAILABLE = True
except:
    CACHE_AVAILABLE = False
    cache = None

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


def _working_ticker(symbol: str):
    for candidate in _ticker_candidates(symbol):
        try:
            df = yf.Ticker(candidate).history(period="5d")
            if not df.empty:
                return candidate
        except Exception:
            continue
    return symbol

# ── RSI helper (self-contained so this service has no circular imports) ──────
def _rsi(prices, period=14):
    delta = prices.diff()
    gain = delta.where(delta > 0, 0).rolling(period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))


def _analyze_sentiment(text):
    """Analyze sentiment using TextBlob"""
    if not text:
        return 50
    try:
        from textblob import TextBlob
        blob = TextBlob(str(text))
        polarity = blob.sentiment.polarity
        return (polarity + 1) * 50  # Convert -1 to 1 range to 0 to 100
    except:
        return 50


# ── Curated universe ──────────────────────────────────────────────────────────
UNIVERSE = {
    "HDFCBANK.NS":   {"name": "HDFC Bank",            "sector": "Banking",         "risk": "low",    "desc": "India's largest private bank — safe, stable, and consistently profitable."},
    "TCS.NS":        {"name": "TCS",                   "sector": "IT",              "risk": "low",    "desc": "Tata's IT giant that runs software for companies across 46 countries."},
    "INFY.NS":       {"name": "Infosys",               "sector": "IT",              "risk": "low",    "desc": "One of India's most trusted software exporters with a global client base."},
    "ITC.NS":        {"name": "ITC",                   "sector": "FMCG",            "risk": "low",    "desc": "Behind brands like Aashirvaad, Classmate, and Fiama — strong cash flows."},
    "HINDUNILVR.NS": {"name": "Hindustan Unilever",    "sector": "FMCG",            "risk": "low",    "desc": "Maker of Dove, Lifebuoy, Surf Excel — products in every Indian household."},
    "NESTLEIND.NS":  {"name": "Nestle India",          "sector": "FMCG",            "risk": "low",    "desc": "Behind Maggi and KitKat — a premium FMCG stock with consistent profits."},
    "RELIANCE.NS":   {"name": "Reliance Industries",   "sector": "Conglomerate",    "risk": "medium", "desc": "India's largest company, spanning oil & gas, Jio, and retail."},
    "BHARTIARTL.NS": {"name": "Bharti Airtel",         "sector": "Telecom",         "risk": "medium", "desc": "India's #2 telecom company, riding the 5G growth wave."},
    "AXISBANK.NS":   {"name": "Axis Bank",             "sector": "Banking",         "risk": "medium", "desc": "One of India's top private banks with a strong digital banking platform."},
    "WIPRO.NS":      {"name": "Wipro",                 "sector": "IT",              "risk": "medium", "desc": "A global IT services company with a growing focus on AI and cloud."},
    "HCLTECH.NS":    {"name": "HCL Technologies",      "sector": "IT",              "risk": "medium", "desc": "Fast-growing IT company known for engineering and product services."},
    "BAJFINANCE.NS": {"name": "Bajaj Finance",         "sector": "Finance",         "risk": "medium", "desc": "India's largest consumer-finance company — strong growth, wide reach."},
    "TATAMOTORS.NS": {"name": "Tata Motors",           "sector": "Auto",            "risk": "medium", "desc": "Maker of Tata EVs and owner of Jaguar Land Rover globally."},
    "ADANIENT.NS":   {"name": "Adani Enterprises",     "sector": "Infrastructure",  "risk": "high",   "desc": "India's largest infrastructure conglomerate — high growth potential, higher risk."},
    "SUZLON.NS":     {"name": "Suzlon Energy",         "sector": "Renewable Energy","risk": "high",   "cap": "small", "desc": "Leading wind energy company riding India's green-energy push."},
    "IDFCFIRSTB.NS": {"name": "IDFC First Bank",       "sector": "Banking",         "risk": "medium", "cap": "mid",   "desc": "A challenger private bank with retail-led growth and improving operating metrics."},
    "IRFC.NS":       {"name": "IRFC",                  "sector": "Finance",         "risk": "medium", "cap": "mid",   "desc": "Railway financing company linked to India's long-term rail infrastructure expansion."},
    "NHPC.NS":       {"name": "NHPC",                  "sector": "Power",           "risk": "medium", "cap": "mid",   "desc": "Hydropower utility with public-sector backing and renewable-energy optionality."},
    "IDEA.NS":       {"name": "Vodafone Idea",         "sector": "Telecom",         "risk": "high",   "cap": "penny", "desc": "A speculative telecom turnaround candidate with survival and debt-related risks."},
    "YESBANK.NS":    {"name": "Yes Bank",              "sector": "Banking",         "risk": "high",   "cap": "penny", "desc": "A recovering private bank; suitable only for investors who can tolerate high uncertainty."},
    "JPPOWER.NS":    {"name": "Jaiprakash Power",      "sector": "Power",           "risk": "high",   "cap": "penny", "desc": "Power-sector penny stock with turnaround potential and meaningful balance-sheet risk."},
    "RPOWER.NS":     {"name": "Reliance Power",        "sector": "Power",           "risk": "high",   "cap": "penny", "desc": "Speculative power-sector name where price action can be sharp and unpredictable."},
    "GMRINFRA.NS":   {"name": "GMR Airports Infra",    "sector": "Infrastructure",  "risk": "high",   "cap": "small", "desc": "Airport infrastructure operator with traffic-growth upside and elevated execution risk."},
    "SOUTHBANK.NS":  {"name": "South Indian Bank",     "sector": "Banking",         "risk": "high",   "cap": "penny", "desc": "Regional bank turnaround idea with lower valuation and higher asset-quality sensitivity."},
    "UJJIVANSFB.NS": {"name": "Ujjivan Small Finance", "sector": "Banking",         "risk": "high",   "cap": "small", "desc": "Small finance bank exposed to inclusion-led growth, but with cyclical credit risk."},
    "IFCI.NS":       {"name": "IFCI",                  "sector": "Finance",         "risk": "high",   "cap": "penny", "desc": "Speculative financial-services name where momentum can dominate fundamentals."},
    "PATELENG.NS":   {"name": "Patel Engineering",     "sector": "Infrastructure",  "risk": "high",   "cap": "small", "desc": "Infrastructure contractor that can benefit from capex cycles, with execution risk."},
    "GTLINFRA.NS":   {"name": "GTL Infrastructure",    "sector": "Telecom Infra",   "risk": "high",   "cap": "penny", "desc": "Very speculative telecom-infrastructure penny stock with extreme volatility."},
}

GOAL_CANDIDATES = {
    "wealth":     ["RELIANCE.NS", "HCLTECH.NS", "BHARTIARTL.NS", "BAJFINANCE.NS",
                   "TATAMOTORS.NS", "ADANIENT.NS", "WIPRO.NS", "SUZLON.NS",
                   "GMRINFRA.NS", "PATELENG.NS", "IDEA.NS", "JPPOWER.NS"],
    "income":     ["ITC.NS", "HINDUNILVR.NS", "NESTLEIND.NS",
                   "HDFCBANK.NS", "TCS.NS", "INFY.NS", "NHPC.NS", "IRFC.NS"],
    "retirement": ["HDFCBANK.NS", "TCS.NS", "HINDUNILVR.NS",
                   "ITC.NS", "NESTLEIND.NS", "INFY.NS"],
    "education":  ["HDFCBANK.NS", "TCS.NS", "RELIANCE.NS",
                   "BAJFINANCE.NS", "BHARTIARTL.NS", "INFY.NS", "IDFCFIRSTB.NS", "IRFC.NS"],
    "safety":     ["HDFCBANK.NS", "TCS.NS", "HINDUNILVR.NS",
                   "ITC.NS", "NESTLEIND.NS"],
}

DURATION_LABELS = {
    "short":  "under 1 year",
    "medium": "1–3 years",
    "long":   "3+ years",
}

TARGET_STOCKS_BY_DURATION = {
    "short": 3,
    "medium": 6,
    "long": 10,
}

DEFAULT_MONTHS_BY_DURATION = {
    "short": 12,
    "medium": 36,
    "long": 60,
}

RISK_COMPATIBILITY = {
    "low": {"low"},
    "medium": {"low", "medium"},
    "high": {"low", "medium", "high"},
}

OPPORTUNISTIC_CAPS = {"small", "micro", "penny"}

# Duration bonuses (stocks with better long-term fundamentals get boosted for longer horizons)
DURATION_MULTIPLIERS = {
    "short":  {"low": 1.2, "medium": 0.9, "high": 0.7},   # Favor blue chips for short term
    "medium": {"low": 1.0, "medium": 1.1, "high": 0.9},   # Balanced
    "long":   {"low": 0.8, "medium": 0.9, "high": 1.3},   # High-risk growth for long term
}


def _advisor_candidates(goal: str, risk: str):
    goal_matches = GOAL_CANDIDATES.get(goal, GOAL_CANDIDATES["wealth"])
    allowed_risks = RISK_COMPATIBILITY.get(risk, RISK_COMPATIBILITY["medium"])
    risk_matches = [
        sym for sym, meta in UNIVERSE.items()
        if meta.get("risk", "medium") in allowed_risks
    ]
    return list(dict.fromkeys(goal_matches + risk_matches + list(UNIVERSE.keys())))


def _is_opportunistic(meta: dict) -> bool:
    return meta.get("cap") in OPPORTUNISTIC_CAPS


def _opportunistic_bonus(meta: dict, goal: str, duration: str, risk: str) -> int:
    if not _is_opportunistic(meta):
        return 0

    bonus = 0
    if risk == "high":
        bonus += 14
    if goal == "wealth":
        bonus += 8
    if duration == "long":
        bonus += 8
    elif duration == "medium":
        bonus += 3
    else:
        bonus -= 6
    if goal in {"safety", "retirement"}:
        bonus -= 18
    if risk == "low":
        bonus -= 25

    return bonus


def _minimum_opportunistic_count(goal: str, duration: str, risk: str, target_count: int) -> int:
    if risk != "high":
        return 0
    if duration == "long" and target_count >= 6:
        return 2
    if goal == "wealth" or duration in {"medium", "long"}:
        return 1
    return 0


def _select_recommendations(scored: list, goal: str, duration: str, risk: str, target_count: int):
    selected = scored[:target_count]
    needed = _minimum_opportunistic_count(goal, duration, risk, target_count)
    if needed <= 0:
        return selected

    selected_symbols = {item["sym"] for item in selected}
    current_count = sum(1 for item in selected if _is_opportunistic(item["meta"]))
    replacements = [
        item for item in scored
        if item["sym"] not in selected_symbols and _is_opportunistic(item["meta"])
    ]

    while current_count < needed and replacements and selected:
        replacement = replacements.pop(0)
        for idx in range(len(selected) - 1, -1, -1):
            if not _is_opportunistic(selected[idx]["meta"]):
                selected[idx] = replacement
                selected_symbols.add(replacement["sym"])
                current_count += 1
                break
        else:
            break

    return sorted(selected, key=lambda x: x["score"], reverse=True)


def _investment_amounts(budget: float, investment_type: str, investment_months: Optional[int], duration: str):
    is_sip = investment_type in {"monthly", "sip"}
    months = int(investment_months or DEFAULT_MONTHS_BY_DURATION.get(duration, 36))
    months = max(1, months)
    total_budget = budget * months if is_sip else budget
    return is_sip, months, total_budget


# ── Fetch signals for one ticker ──────────────────────────────────────────────
def _fetch_signals(symbol: str):
    for ticker_symbol in _ticker_candidates(symbol):
        try:
            df = yf.Ticker(ticker_symbol).history(period="1mo", interval="1d")
            if df.empty or len(df) < 14:
                continue
            close = df["Close"]
            current = float(close.iloc[-1])
            window  = min(20, len(close))
            ma20    = float(close.rolling(window).mean().iloc[-1])
            rsi_val = float(_rsi(close).iloc[-1])
            if np.isnan(rsi_val):
                rsi_val = 50.0
            return {
                "current_price": round(current, 2),
                "rsi":           round(rsi_val, 2),
                "trend":         "BULLISH" if current > ma20 else "BEARISH",
            }
        except Exception:
            continue
    return None


# ── Scoring with news sentiment ───────────────────────────────────────────────
def _score(signals: dict, sentiment_score: float = 50, risk_level: str = "medium", duration: str = "medium") -> int:
    """
    Score a stock based on technical signals, sentiment, and duration
    
    Args:
        signals: Technical signals (trend, RSI)
        sentiment_score: News sentiment 0-100
        risk_level: Stock risk level (low/medium/high)
        duration: Investment duration (short/medium/long)
    
    Returns:
        Composite score 0-100
    """
    score = 0
    
    # Technical score (40% weight)
    technical = 30 if signals["trend"] == "BULLISH" else 0
    rsi = signals["rsi"]
    if   35 <= rsi <= 55: technical += 25
    elif 20 <= rsi <  35: technical += 20
    elif 55 <  rsi <= 65: technical += 15
    elif 65 <  rsi <= 72: technical += 5
    score += technical * 0.4
    
    # Sentiment score (30% weight) - normalized 0-100
    sentiment_normalized = (sentiment_score - 50) / 100  # -0.5 to 0.5
    score += (50 + sentiment_normalized * 50) * 0.3
    
    # Duration multiplier (30% weight)
    multiplier = DURATION_MULTIPLIERS.get(duration, {}).get(risk_level, 1.0)
    score += 50 * multiplier * 0.3
    
    return int(min(100, max(0, score)))


# ── Calculate confidence ────────────────────────────────────────────────────
def _calculate_confidence(score: int, sentiment_score: float, rsi: float, trend: str) -> int:
    """
    Calculate prediction confidence 0-100 based on multiple factors
    """
    confidence = score  # Base from technical + sentiment + duration
    
    # Boost if sentiment is strong
    if sentiment_score > 65:
        confidence = min(100, confidence + 8)
    elif sentiment_score < 35:
        confidence = min(100, confidence + 5)  # Bearish also increases confidence if trend matches
    
    # Adjust based on RSI extremes
    if 30 < rsi < 70:  # Healthy range
        confidence = min(100, confidence + 5)
    
    return int(max(30, min(100, confidence)))  # Min 30% confidence


# ── Plain-language reason ─────────────────────────────────────────────────────
def _reason(meta: dict, signals: dict, goal: str, duration: str, sentiment_score: float = 50) -> str:
    name, sector = meta["name"], meta["sector"]
    dur = DURATION_LABELS.get(duration, "")

    trend_phrase = (
        "showing strong upward momentum"
        if signals["trend"] == "BULLISH"
        else "currently in a consolidation phase"
    )

    rsi = signals["rsi"]
    if   rsi < 35:         rsi_note = "Its RSI suggests it may be undervalued — potentially a great entry point."
    elif rsi <= 55:        rsi_note = "Its RSI is in a healthy zone — not overbought, with room left to grow."
    elif rsi <= 68:        rsi_note = "Strong buying interest — keep an eye out for any pullback before entering."
    else:                  rsi_note = "RSI is elevated — the stock has run up recently. Consider waiting for a dip."

    # Add sentiment context
    sentiment_phrase = ""
    if sentiment_score > 65:
        sentiment_phrase = " Recent news sentiment is positive, adding to the bullish case."
    elif sentiment_score < 35:
        sentiment_phrase = " However, recent news sentiment is mixed — monitor news before investing."

    goal_sentence = {
        "wealth":     f"Picked for wealth creation — {name} ({sector}) has strong long-term growth potential over {dur}.",
        "income":     f"Suitable for steady returns — {name} is a reliable company with consistent performance.",
        "retirement": f"Ideal for retirement planning — {name} is a blue-chip known for stability over {dur}.",
        "education":  f"Good for an education fund — {name} balances growth and safety over {dur}.",
        "safety":     f"A safe pick — {name} is one of India's most established companies in {sector}.",
    }.get(goal, f"A strong pick in the {sector} sector.")

    return f"{goal_sentence} It is currently {trend_phrase}. {rsi_note}{sentiment_phrase}"


# ── Main entry point ──────────────────────────────────────────────────────────
def get_recommendations(goal: str, duration: str, risk: str, budget: float, investment_type: str = "one-time", investment_months: Optional[int] = None):
    is_sip, months, total_budget = _investment_amounts(budget, investment_type, investment_months, duration)
    target_count = TARGET_STOCKS_BY_DURATION.get(duration, TARGET_STOCKS_BY_DURATION["medium"])

    # Graceful fallback: if Redis is unavailable, function runs normally without caching
    if CACHE_AVAILABLE:
        key = f"advisor:{goal}:{duration}:{risk}:{investment_type}:{months}:{int(total_budget//10000)}"
        cached_value = cache.get(key)
        if cached_value:
            return json.loads(cached_value)

    candidates = _advisor_candidates(goal, risk)

    # Parallel fetch
    signals_map = {}
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(_fetch_signals, sym): sym for sym in candidates}
        for future in as_completed(futures):
            sym = futures[future]
            try:
                result = future.result()
                if result:
                    signals_map[sym] = result
            except Exception:
                pass

    # Score and rank with sentiment
    scored = []
    for sym, signals in signals_map.items():
        meta = UNIVERSE.get(sym, {})
        
        # Fetch sentiment for this stock (0-100)
        try:
            stock_obj = yf.Ticker(_working_ticker(sym))
            news = getattr(stock_obj, 'news', [])
            sentiments = []
            for item in news[:5]:  # Top 5 news items
                title = item.get("title", "")
                summary = item.get("summary", "")
                text = f"{title} {summary}"
                sentiment = _analyze_sentiment(text)
                sentiments.append(sentiment)
            sentiment_score = np.mean(sentiments) if sentiments else 50
        except:
            sentiment_score = 50
        
        stock_risk = meta.get("risk", "medium")
        score = _score(signals, sentiment_score, stock_risk, duration)
        score = int(min(100, max(0, score + _opportunistic_bonus(meta, goal, duration, risk))))
        confidence = _calculate_confidence(score, sentiment_score, signals["rsi"], signals["trend"])
        
        scored.append({
            "sym": sym,
            "meta": meta,
            "signals": signals,
            "sentiment_score": sentiment_score,
            "score": score,
            "confidence": confidence,
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    selected = _select_recommendations(scored, goal, duration, risk, target_count)

    if not selected:
        return []

    per_stock = round(total_budget / len(selected), 0)
    monthly_per_stock = round(budget / len(selected), 0) if is_sip else None

    results = []
    for item in selected:
        sym     = item["sym"]
        meta    = item["meta"]
        signals = item["signals"]
        sentiment_score = item["sentiment_score"]
        confidence = item["confidence"]
        price   = signals["current_price"]
        shares  = int(per_stock / price) if price > 0 else 0

        results.append({
            "symbol":               sym.replace(".NS", "").replace(".BO", ""),
            "name":                 meta.get("name", sym),
            "sector":               meta.get("sector", ""),
            "description":          meta.get("desc", ""),
            "risk_level":           meta.get("risk", "medium"),
            "cap_segment":          meta.get("cap", "large"),
            "current_price":        price,
            "trend":                signals["trend"],
            "rsi":                  signals["rsi"],
            "sentiment_score":      round(sentiment_score, 1),
            "confidence":           confidence,
            "reason":               _reason(meta, signals, goal, duration, sentiment_score),
            "suggested_allocation": per_stock,
            "monthly_allocation":    monthly_per_stock,
            "investment_type":       "monthly" if is_sip else "one-time",
            "investment_months":     months if is_sip else None,
            "total_investment":      total_budget,
            "shares_you_can_buy":   shares,
        })

    if CACHE_AVAILABLE:
        cache.setex(key, 900, json.dumps(results))
        
    return results




