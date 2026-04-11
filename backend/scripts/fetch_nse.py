import requests
import pandas as pd

def fetch_nse():
    url = "https://archives.nseindia.com/content/equities/EQUITY_L.csv"

    df = pd.read_csv(url)

    stocks = df[["SYMBOL", "NAME OF COMPANY"]]

    stocks = stocks.rename(columns={
        "SYMBOL": "symbol",
        "NAME OF COMPANY": "name"
    })

    stocks.to_json("stocks.json", orient="records", indent=2)

    print("✅ NSE stocks saved")

if __name__ == "__main__":
    fetch_nse()