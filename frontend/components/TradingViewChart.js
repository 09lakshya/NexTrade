import { useEffect, useRef } from "react";

export default function TradingViewChart({ symbol }) {
  const container = useRef();

  useEffect(() => {
    if (!container.current) return;

    container.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;

    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `NSE:${symbol.toUpperCase()}`,
      interval: "5",
      timezone: "Asia/Kolkata",
      theme: "dark",
      style: "1", // candlestick
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: true,
    });

    container.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="h-[500px] bg-gray-900 rounded-xl p-2">
      <div ref={container} className="h-full w-full" />
    </div>
  );
}