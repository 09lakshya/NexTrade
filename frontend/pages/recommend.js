import { useState } from "react";
import Navbar from "../components/Navbar";

export default function Recommend() {
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);

  const getRecommendations = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          risk: "medium",
          investment: 50000,
          duration: "long",
          goal: "wealth",
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-premium text-white">
      <Navbar />
      <div className="px-8 py-12 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-accent via-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Recommendations
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Intelligent stock recommendations powered by AI
          </p>
        </div>

        {/* Action Button */}
        <div className="mb-12">
          <button
            onClick={getRecommendations}
            disabled={loading}
            className="btn-premium disabled:opacity-50"
          >
            {loading ? "Loading..." : "Get Recommendations"}
          </button>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {result.length > 0 ? (
            result.map((stock, i) => (
              <div
                key={i}
                className="glass border border-accent border-opacity-20 p-6 rounded-2xl hover:shadow-premium-lg transition-all duration-300"
              >
                <h2 className="text-xl font-bold bg-gradient-to-r from-accent to-blue-400 bg-clip-text text-transparent mb-4">
                  {stock.symbol}
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Trend:</span>
                    <span className="text-accent font-semibold">
                      {stock.trend}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Confidence:</span>
                    <span className="text-green-premium font-semibold">
                      {stock.confidence}%
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full glass border border-accent border-opacity-20 p-12 rounded-2xl text-center">
              <p className="text-gray-400 text-lg">
                Click "Get Recommendations" to view AI-powered stock suggestions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
