import json
import os

BASE_DIR = os.path.dirname(__file__)
file_path = os.path.join(BASE_DIR, "stocks.json")
with open(file_path, encoding="utf-8") as f:
    STOCKS = json.load(f)

SYMBOL_ALIASES = [
    {"symbol": "TATAMOTORS", "name": "Tata Motors Limited"},
]

existing_symbols = {s["symbol"] for s in STOCKS}
for alias in SYMBOL_ALIASES:
    if alias["symbol"] not in existing_symbols:
        STOCKS.append(alias)


TRENDING = ["RELIANCE", "TCS", "INFY", "HDFCBANK"]

def get_trending():
    return [s for s in STOCKS if s["symbol"] in TRENDING]

def search_stocks(query):
    q = query.lower()

    results = []

    for stock in STOCKS:
        score = 0

        symbol = stock["symbol"].lower()
        name = stock["name"].lower()

        if symbol.startswith(q):
            score += 5
        elif q in symbol:
            score += 3

        if q in name:
            score += 2

        if score > 0:
            results.append({**stock, "score": score})

    results.sort(key=lambda x: x["score"], reverse=True)

    return results[:10]
