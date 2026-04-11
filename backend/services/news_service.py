import yfinance as yf
from datetime import datetime

def get_stock_news(symbol: str):
    try:
        stock = yf.Ticker(symbol)
        try:
            news_data = stock.news
        except Exception:
            return []

        if not news_data or not isinstance(news_data, list):
            return []

        result = []
        for item in news_data[:6]:
            if not isinstance(item, dict):
                continue
            title = item.get("title", "")
            if not title:
                continue
            ts = item.get("providerPublishTime", 0)
            try:
                date_str = datetime.fromtimestamp(ts).strftime("%d %b %Y")
            except Exception:
                date_str = "Recent"
            result.append({
                "title": title,
                "link": item.get("link", "#"),
                "publisher": item.get("publisher", ""),
                "date": date_str,
            })
        return result

    except Exception as e:
        print(f"News Error for {symbol}: {e}")
        return []