import pandas as pd

def calculate_indicators(df: pd.DataFrame):
    df = df.copy()

    # Moving Averages
    df["MA20"] = df["Close"].rolling(window=20).mean()
    df["MA50"] = df["Close"].rolling(window=50).mean()

    # RSI
    delta = df["Close"].diff()

    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()

    rs = gain / loss
    df["RSI"] = 100 - (100 / (1 + rs))

    # Volatility
    df["volatility"] = df["Close"].pct_change().rolling(window=10).std()

    return df