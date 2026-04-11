import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import API from "../../services/api";
import RealChart from "../../components/RealChart";
import Navbar from "../../components/Navbar";

export default function StockPage() {
  const router = useRouter();
  const { symbol } = router.query;

  const [history, setHistory] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [news, setNews] = useState([]);
  const [period, setPeriod] = useState("1m");
  const [loading, setLoading] = useState(true);

  // Map display periods to yfinance format
  const getPeriodFormat = (p) => {
    const mapping = {
      "1d": "1d",
      "1w": "5d",
      "1m": "1mo",
      "3m": "3mo",
      "6m": "6mo",
      "1y": "1y",
      "5y": "5y",
    };
    return mapping[p] || p;
  };

  // Chart + prediction (unchanged logic)
  useEffect(() => {
    if (!router.isReady || !symbol) return;

    const load = async () => {
      try {
        setLoading(true);
        const yfinancePeriod = getPeriodFormat(period);
        const histRes = await API.get(
          `/market/${symbol}/history?period=${yfinancePeriod}`,
        );
        const predRes = await API.get(`/predict/${symbol}.NS`);
        setHistory(Array.isArray(histRes.data) ? histRes.data : []);
        setPrediction(predRes.data);
      } catch (err) {
        console.error("ERROR:", err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router.isReady, symbol, period]);

  // News — separate effect, silent failure
  useEffect(() => {
    if (!router.isReady || !symbol) return;
    API.get(`/news/${symbol}`)
      .then((res) => setNews(Array.isArray(res.data) ? res.data : []))
      .catch(() => setNews([]));
  }, [router.isReady, symbol]);

  if (!router.isReady || !symbol) {
    return (
      <div className="min-h-screen bg-gradient-premium text-white">
        <Navbar />
        <div className="px-8 py-12 max-w-7xl mx-auto">
          <div className="glass border border-accent border-opacity-20 rounded-2xl p-12 text-center">
            <p className="text-gray-400 text-lg">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-premium text-white">
      <Navbar />

      <div className="px-8 py-12 max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-accent via-blue-400 to-purple-400 bg-clip-text text-transparent">
              {symbol}
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Real-time price, predictions & analysis
          </p>
        </div>

        {/* TIMEFRAME */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {["1d", "1w", "1m", "3m", "6m", "1y", "5y"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-full font-semibold transition-all duration-200 ${
                period === p
                  ? "glass border-2 border-accent bg-accent bg-opacity-40 text-accent shadow-lg shadow-accent/50"
                  : "glass border border-accent border-opacity-20 text-gray-300 hover:border-opacity-50"
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>

        {/* CHART */}
        {loading ? (
          <div className="glass border border-accent border-opacity-20 rounded-2xl p-12 text-center mb-8">
            <p className="text-gray-400 text-lg">Loading chart...</p>
          </div>
        ) : history.length > 0 ? (
          <div className="glass border border-accent border-opacity-20 p-6 rounded-2xl mb-8 h-[400px] hover:shadow-premium-lg transition-all duration-300">
            <RealChart data={history} />
          </div>
        ) : (
          <div className="glass border border-red-premium border-opacity-20 rounded-2xl p-8 text-center mb-8">
            <p className="text-red-premium text-lg">No chart data available</p>
          </div>
        )}

        {/* PREDICTION */}
        {prediction && prediction.current_price && (
          <div className="glass border border-accent border-opacity-20 p-8 rounded-2xl mb-8 hover:shadow-premium-lg transition-all duration-300">
            <h2 className="text-2xl font-bold mb-6">
              <span className="bg-gradient-to-r from-accent to-blue-400 bg-clip-text text-transparent">
                AI Prediction
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="glass border border-accent border-opacity-20 rounded-xl p-4">
                <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold mb-2">
                  Current Price
                </p>
                <p className="text-3xl font-bold text-white">
                  ₹{prediction.current_price}
                </p>
              </div>

              <div
                className={`glass border rounded-xl p-4 ${prediction.change >= 0 ? "border-green-premium border-opacity-30" : "border-red-premium border-opacity-30"}`}
              >
                <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold mb-2">
                  24h Change
                </p>
                <p
                  className={`text-3xl font-bold ${prediction.change >= 0 ? "text-green-premium" : "text-red-premium"}`}
                >
                  {prediction.change >= 0 ? "▲" : "▼"} {prediction.change}{" "}
                  <span className="text-lg">
                    ({prediction.percent_change}%)
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass border border-accent border-opacity-20 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                  Predicted Price
                </p>
                <p className="text-2xl font-bold text-white">
                  ₹{prediction.predicted_price}{" "}
                  <span
                    className={
                      prediction.trend === "BULLISH"
                        ? "text-green-premium"
                        : "text-red-premium"
                    }
                  >
                    {prediction.trend === "BULLISH" ? "▲" : "▼"}{" "}
                    {prediction.predicted_price - prediction.current_price >= 0
                      ? "+"
                      : ""}
                    {(
                      prediction.predicted_price - prediction.current_price
                    ).toFixed(2)}{" "}
                    (
                    {(
                      ((prediction.predicted_price - prediction.current_price) /
                        prediction.current_price) *
                      100
                    ).toFixed(2)}
                    %)
                  </span>
                </p>
              </div>

              <div className="glass border border-accent border-opacity-20 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                  Day Close
                </p>
                <p className="text-2xl font-bold text-white">
                  ₹{prediction.day_close_prediction}{" "}
                  <span
                    className={
                      prediction.day_close_prediction -
                        prediction.current_price >=
                      0
                        ? "text-green-premium"
                        : "text-red-premium"
                    }
                  >
                    {prediction.day_close_prediction -
                      prediction.current_price >=
                    0
                      ? "▲"
                      : "▼"}{" "}
                    {prediction.day_close_prediction -
                      prediction.current_price >=
                    0
                      ? "+"
                      : ""}
                    {(
                      prediction.day_close_prediction - prediction.current_price
                    ).toFixed(2)}{" "}
                    (
                    {(
                      ((prediction.day_close_prediction -
                        prediction.current_price) /
                        prediction.current_price) *
                      100
                    ).toFixed(2)}
                    %)
                  </span>
                </p>
              </div>

              <div className="glass border border-accent border-opacity-20 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                  Trend
                </p>
                <p
                  className={`text-2xl font-bold ${prediction.trend === "BULLISH" ? "text-green-premium" : "text-red-premium"}`}
                >
                  {prediction.trend}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="glass border border-accent border-opacity-20 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                  Confidence
                </p>
                <p
                  className={`text-xl font-bold ${prediction.confidence >= 70 ? "text-green-premium" : "text-red-premium"}`}
                >
                  {prediction.confidence}%
                </p>
              </div>

              <div className="glass border border-accent border-opacity-20 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                  RSI
                </p>
                <p className="text-xl font-bold text-white">{prediction.rsi}</p>
              </div>
            </div>
          </div>
        )}

        {/* NEWS SENTIMENT & FUNDAMENTALS */}
        {prediction && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* NEWS SENTIMENT */}
            {prediction.news_sentiment !== undefined && (
              <div className="glass border border-accent border-opacity-20 p-8 rounded-2xl hover:shadow-premium-lg transition-all duration-300">
                <h2 className="text-2xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-accent to-blue-400 bg-clip-text text-transparent">
                    News Sentiment
                  </span>
                </h2>

                <div className="grid grid-cols-1 gap-4">
                  <div className="glass border border-accent border-opacity-20 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                      Sentiment Score
                    </p>
                    <p
                      className={`text-3xl font-bold ${
                        prediction.news_sentiment > 60
                          ? "text-green-premium"
                          : prediction.news_sentiment < 40
                            ? "text-red-premium"
                            : "text-blue-400"
                      }`}
                    >
                      {prediction.news_sentiment.toFixed(1)}/100
                    </p>
                  </div>

                  <div className="glass border border-accent border-opacity-20 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                      Impact
                    </p>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${
                          prediction.news_impact === "bullish"
                            ? "bg-green-premium bg-opacity-20 text-green-premium"
                            : prediction.news_impact === "bearish"
                              ? "bg-red-premium bg-opacity-20 text-red-premium"
                              : "bg-blue-400 bg-opacity-20 text-blue-400"
                        }`}
                      >
                        {prediction.news_impact}
                      </span>
                      <span className="text-sm text-gray-400">
                        ({prediction.news_count} articles analyzed)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-400 bg-opacity-10 border border-blue-400 border-opacity-20 rounded-lg">
                  <p className="text-xs text-gray-300 leading-relaxed">
                    ℹ️ News sentiment analysis helps identify market sentiment
                    shifts that technical indicators may miss, improving
                    prediction accuracy by ~15-20%.
                  </p>
                </div>
              </div>
            )}

            {/* FUNDAMENTALS */}
            {prediction.fundamental_score !== undefined && (
              <div className="glass border border-accent border-opacity-20 p-8 rounded-2xl hover:shadow-premium-lg transition-all duration-300">
                <h2 className="text-2xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-accent to-blue-400 bg-clip-text text-transparent">
                    Fundamentals
                  </span>
                </h2>

                <div className="grid grid-cols-1 gap-4">
                  <div className="glass border border-accent border-opacity-20 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                      Fundamental Score
                    </p>
                    <p
                      className={`text-3xl font-bold ${
                        prediction.fundamental_score > 65
                          ? "text-green-premium"
                          : prediction.fundamental_score < 35
                            ? "text-red-premium"
                            : "text-blue-400"
                      }`}
                    >
                      {prediction.fundamental_score.toFixed(1)}/100
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass border border-accent border-opacity-20 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">PE Ratio</p>
                      <p className="text-lg font-bold text-white">
                        {prediction.pe_ratio
                          ? prediction.pe_ratio.toFixed(2)
                          : "N/A"}
                      </p>
                    </div>

                    <div className="glass border border-accent border-opacity-20 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">
                        Earnings Growth
                      </p>
                      <p
                        className={`text-lg font-bold ${
                          prediction.earnings_growth &&
                          prediction.earnings_growth > 0
                            ? "text-green-premium"
                            : "text-red-premium"
                        }`}
                      >
                        {prediction.earnings_growth
                          ? (prediction.earnings_growth * 100).toFixed(1) + "%"
                          : "N/A"}
                      </p>
                    </div>

                    <div className="glass border border-accent border-opacity-20 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">
                        Revenue Growth
                      </p>
                      <p
                        className={`text-lg font-bold ${
                          prediction.revenue_growth &&
                          prediction.revenue_growth > 0
                            ? "text-green-premium"
                            : "text-red-premium"
                        }`}
                      >
                        {prediction.revenue_growth
                          ? (prediction.revenue_growth * 100).toFixed(1) + "%"
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-400 bg-opacity-10 border border-blue-400 border-opacity-20 rounded-lg">
                  <p className="text-xs text-gray-300 leading-relaxed">
                    ℹ️ Strong fundamentals combined with positive sentiment
                    indicate long-term bullish potential. Companies with strong
                    growth metrics tend to outperform.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* NEWS */}
        {news.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">
              <span className="bg-gradient-to-r from-accent to-blue-400 bg-clip-text text-transparent">
                Latest News
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {news.map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass border border-accent border-opacity-20 p-6 rounded-2xl hover:shadow-premium-lg hover:border-opacity-50 transition-all duration-300 group"
                >
                  <p className="font-semibold text-lg text-white group-hover:text-accent transition-colors duration-200 leading-snug mb-3">
                    {item.title}
                  </p>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span className="font-medium">{item.publisher}</span>
                    <span>·</span>
                    <span>{item.date}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
