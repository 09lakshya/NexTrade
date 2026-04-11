import { useEffect, useState } from "react";
import StockCard from "../components/StockCard";
import Navbar from "../components/Navbar";

export default function Home() {
  const [stocks, setStocks] = useState({});
  const [prevStocks, setPrevStocks] = useState({});

  useEffect(() => {
    let ws;

    const connect = () => {
      ws = new WebSocket("ws://localhost:8000/market/ws");

      ws.onopen = () => console.log("✅ WS Connected");

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setPrevStocks((prev) => prev);
          setStocks((prev) => {
            setPrevStocks(prev);
            return data;
          });
        } catch (err) {
          console.error("WS Parse Error:", err);
        }
      };

      ws.onclose = () => {
        console.log("⚠️ WS Closed. Reconnecting...");
        setTimeout(connect, 2000);
      };

      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      if (ws) ws.close();
    };
  }, []);

  // ✅ ADDED (index separation logic)
  const indexSymbols = ["NIFTY50", "SENSEX"];
  const entries = Object.entries(stocks || {});

  const indexEntries = entries.filter(([symbol]) =>
    indexSymbols.includes(symbol),
  );

  const otherEntries = entries
    .filter(([symbol]) => !indexSymbols.includes(symbol))
    .sort((a, b) => b[1].percent - a[1].percent);

  return (
    <div className="min-h-screen bg-gradient-premium text-white">
      <Navbar />

      <div className="px-8 py-12 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-accent via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Live Market
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Real-time trading insights and market data
          </p>
        </div>

        {/* Market Indexes */}
        {indexEntries.length > 0 && (
          <div className="mb-12">
            <h6 className="text-lg font-semibold opacity-70 mb-6 uppercase tracking-wider">
              Market Indexes
            </h6>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {indexEntries.map(([symbol, current]) => {
                const previous = prevStocks[symbol];
                const currentPrice = current?.price || 0;
                const previousPrice = previous?.price || 0;

                let color = "text-white";
                if (previous) {
                  if (currentPrice > previousPrice)
                    color = "text-green-premium";
                  else if (currentPrice < previousPrice)
                    color = "text-red-premium";
                }

                return (
                  <StockCard
                    key={symbol}
                    symbol={symbol}
                    price={currentPrice}
                    change={current?.change}
                    percent={current?.percent}
                    color={color}
                    small
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Trending Stocks */}
        <div>
          <h6 className="text-lg font-semibold opacity-70 mb-6 uppercase tracking-wider">
            Trending Stocks
          </h6>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherEntries.map(([symbol, current]) => {
              const previous = prevStocks[symbol];
              const currentPrice = current?.price || 0;
              const previousPrice = previous?.price || 0;

              let color = "text-white";
              if (previous) {
                if (currentPrice > previousPrice) color = "text-green-premium";
                else if (currentPrice < previousPrice)
                  color = "text-red-premium";
              }

              return (
                <StockCard
                  key={symbol}
                  symbol={symbol}
                  price={currentPrice}
                  change={current?.change}
                  percent={current?.percent}
                  color={color}
                />
              );
            })}
          </div>

          {otherEntries.length === 0 && (
            <div className="glass border border-accent border-opacity-20 rounded-3xl p-12 text-center">
              <p className="text-gray-400 text-lg">
                Loading live market data...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
