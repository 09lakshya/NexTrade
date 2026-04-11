import { useRouter } from "next/router";

export default function StockCard({
  symbol,
  price,
  change,
  percent,
  color,
  small,
}) {
  const router = useRouter();
  const isPositive = change >= 0;

  return (
    <div
      onClick={() => router.push(`/stock/${symbol}`)}
      className={`group glass border border-accent border-opacity-20 p-6 rounded-2xl cursor-pointer 
                  hover:shadow-premium-lg hover:border-accent hover:border-opacity-50 
                  hover:scale-105 active:scale-95 overflow-hidden relative
                  ${small ? "p-4" : ""}`}
    >
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent to-blue-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl"></div>

      <div className="relative z-10">
        {/* Symbol */}
        <div className="flex justify-between items-start mb-3">
          <h2
            className={`font-bold bg-gradient-to-r from-accent to-blue-400 bg-clip-text text-transparent ${small ? "text-lg" : "text-xl"}`}
          >
            {symbol}
          </h2>
          <span
            className={`text-xs px-2 py-1 rounded-full ${isPositive ? "bg-green-premium bg-opacity-20 text-green-premium" : "bg-red-premium bg-opacity-20 text-red-premium"}`}
          >
            {isPositive ? "↑" : "↓"}
          </span>
        </div>

        {/* Price */}
        <p
          className={`font-bold mb-2 ${small ? "text-lg" : "text-2xl"} ${color || "text-white"}`}
        >
          ₹{price.toFixed(2)}
        </p>

        {/* Change */}
        <div
          className={`flex items-center gap-2 ${isPositive ? "text-green-premium" : "text-red-premium"}`}
        >
          <span className="text-sm font-semibold">
            {isPositive ? "+" : ""}
            {change.toFixed(2)}
          </span>
          <span className="text-xs bg-white bg-opacity-10 px-2 py-1 rounded-full">
            {isPositive ? "+" : ""}
            {percent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Border shimmer effect on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.1), transparent)",
          animation: "shimmer 2s infinite",
        }}
      ></div>
    </div>
  );
}
``;
