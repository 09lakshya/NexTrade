import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import API from "../../services/api";
import RealChart from "../../components/RealChart";
import Navbar from "../../components/Navbar";
import Head from "next/head";

const PERIODS = [
  { key: "1d", label: "1D", yf: "1d" },
  { key: "1w", label: "1W", yf: "5d" },
  { key: "1m", label: "1M", yf: "1mo" },
  { key: "3m", label: "3M", yf: "3mo" },
  { key: "6m", label: "6M", yf: "6mo" },
  { key: "1y", label: "1Y", yf: "1y" },
  { key: "5y", label: "5Y", yf: "5y" },
];

// ── Info chip ─────────────────────────────────────────────────────────────
function InfoChip({ label, value, color = "#f1f5f9", sub }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "14px",
        padding: "16px 18px",
        transition: "all 0.2s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,229,255,0.15)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
    >
      <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>{label}</p>
      <p style={{ fontSize: "clamp(1rem, 2vw, 1.3rem)", fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>{value}</p>
      {sub && <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>{sub}</p>}
    </div>
  );
}

// ── Score bar ─────────────────────────────────────────────────────────────
function ScoreBar({ value, max = 100, color }) {
  return (
    <div style={{ height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "5px", overflow: "hidden" }}>
      <div style={{
        height: "100%",
        width: `${(value / max) * 100}%`,
        background: color,
        borderRadius: "5px",
        transition: "width 0.8s ease",
      }} />
    </div>
  );
}

export default function StockPage() {
  const router = useRouter();
  const { symbol } = router.query;

  const [history, setHistory]       = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [news, setNews]             = useState([]);
  const [period, setPeriod]         = useState("1m");
  const [loading, setLoading]       = useState(true);

  const getPeriodFormat = (p) => PERIODS.find(x => x.key === p)?.yf || p;

  useEffect(() => {
    if (!router.isReady || !symbol) return;
    const load = async () => {
      try {
        setLoading(true);
        const [histRes, predRes] = await Promise.all([
          API.get(`/market/${symbol}/history?period=${getPeriodFormat(period)}`),
          API.get(`/predict/${symbol}.NS`),
        ]);
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

  useEffect(() => {
    if (!router.isReady || !symbol) return;
    API.get(`/news/${symbol}`)
      .then(res => setNews(Array.isArray(res.data) ? res.data : []))
      .catch(() => setNews([]));
  }, [router.isReady, symbol]);

  if (!router.isReady || !symbol) {
    return (
      <div style={{ minHeight: "100vh" }}>
        <Navbar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <div className="spinner" style={{ width: "40px", height: "40px" }} />
        </div>
      </div>
    );
  }

  const pred = prediction;
  const hasPrice = pred && pred.current_price;
  const isPredUp = pred && pred.change >= 0;
  const bull = pred && pred.trend === "BULLISH";
  const predDelta = pred ? pred.predicted_price - pred.current_price : 0;
  const predDeltaPct = pred && pred.current_price ? ((predDelta / pred.current_price) * 100).toFixed(2) : "0";

  return (
    <>
      <Head>
        <title>{symbol} — NexTrade</title>
        <meta name="description" content={`Real-time price, AI predictions and analysis for ${symbol} stock.`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: "100vh" }}>
        <Navbar />

        <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "clamp(20px, 4vw, 32px) clamp(12px, 3vw, 24px) clamp(40px, 8vw, 80px)" }}>

          {/* ── Header ─────────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "32px", animation: "fadeInUp 0.5s ease forwards" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <button
                  onClick={() => router.back()}
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "6px 12px", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", fontFamily: "inherit", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#f1f5f9"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
                >
                  ← Back
                </button>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase" }}>NSE · India</p>
              </div>

              <h1
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "clamp(2rem, 5vw, 3.5rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  background: "linear-gradient(90deg, #00e5ff 0%, #40c4ff 50%, #e040fb 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  marginBottom: "4px",
                }}
              >
                {symbol}
              </h1>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
                Real-time price · AI predictions · Market analysis
              </p>
            </div>

            {/* Live price badge */}
            {hasPrice && (
              <div style={{ background: "rgba(13,18,36,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "18px", padding: "20px 24px", textAlign: "right", backdropFilter: "blur(16px)" }}>
                <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Current Price</p>
                <p style={{ fontSize: "2rem", fontWeight: 900, color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.03em", marginBottom: "4px" }}>
                  ₹{pred.current_price}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: isPredUp ? "#00e676" : "#ff1744" }}>
                    {isPredUp ? "▲ +" : "▼ "}{pred.change} ({pred.percent_change}%)
                  </span>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "20px",
                    background: bull ? "rgba(0,230,118,0.12)" : "rgba(255,23,68,0.12)",
                    color: bull ? "#00e676" : "#ff1744",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    border: `1px solid ${bull ? "rgba(0,230,118,0.25)" : "rgba(255,23,68,0.25)"}`,
                  }}>
                    {bull ? "BULLISH" : "BEARISH"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Period selector ─────────────────────────────────────── */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "4px", width: "fit-content", maxWidth: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch", animation: "fadeInUp 0.5s 0.1s ease both" }}>
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "9px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  transition: "all 0.2s",
                  background: period === key ? "rgba(0,229,255,0.12)" : "transparent",
                  color: period === key ? "#00e5ff" : "rgba(255,255,255,0.4)",
                  boxShadow: period === key ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Chart ──────────────────────────────────────────────── */}
          <div style={{ marginBottom: "24px", animation: "fadeInUp 0.5s 0.15s ease both" }}>
            {loading ? (
              <div style={{ background: "rgba(13,18,36,0.7)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "clamp(14px, 2vw, 20px)", height: "clamp(250px, 40vw, 400px)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px" }}>
                <div className="spinner" style={{ width: "36px", height: "36px" }} />
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>Loading chart data…</p>
              </div>
            ) : history.length > 0 ? (
              <div style={{ background: "rgba(13,18,36,0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "clamp(14px, 2vw, 20px)", padding: "clamp(14px, 3vw, 24px)", height: "clamp(250px, 40vw, 400px)", backdropFilter: "blur(16px)" }}>
                <RealChart data={history} />
              </div>
            ) : (
              <div style={{ background: "rgba(13,18,36,0.7)", border: "1px solid rgba(255,23,68,0.15)", borderRadius: "20px", padding: "60px 24px", textAlign: "center" }}>
                <p style={{ fontSize: "2rem", marginBottom: "12px" }}>📉</p>
                <p style={{ color: "rgba(255,23,68,0.7)", fontSize: "1rem" }}>No chart data available for this period</p>
              </div>
            )}
          </div>

          {/* ── AI Prediction ───────────────────────────────────────── */}
          {pred && pred.current_price && (
            <div style={{ background: "rgba(13,18,36,0.8)", border: "1px solid rgba(0,229,255,0.15)", borderRadius: "20px", padding: "28px", marginBottom: "24px", backdropFilter: "blur(16px)", animation: "fadeInUp 0.5s 0.2s ease both" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                  🤖
                </div>
                <div>
                  <p className="section-label" style={{ margin: 0 }}>Machine Learning</p>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.3rem", fontWeight: 800, background: "linear-gradient(90deg, #00e5ff, #40c4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    AI Prediction
                  </h2>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(140px, 100%), 1fr))", gap: "clamp(8px, 1.5vw, 12px)" }}>
                <InfoChip label="Current Price" value={`₹${pred.current_price}`} />
                <InfoChip
                  label="24h Change"
                  value={`${isPredUp ? "▲ +" : "▼ "}${pred.change}`}
                  color={isPredUp ? "#00e676" : "#ff1744"}
                  sub={`${pred.percent_change}%`}
                />
                <InfoChip
                  label="Predicted Price"
                  value={`₹${pred.predicted_price}`}
                  color={predDelta >= 0 ? "#00e676" : "#ff1744"}
                  sub={`${predDelta >= 0 ? "+" : ""}${predDelta.toFixed(2)} (${predDeltaPct}%)`}
                />
                <InfoChip
                  label="Day Close"
                  value={`₹${pred.day_close_prediction}`}
                  color={pred.day_close_prediction - pred.current_price >= 0 ? "#00e676" : "#ff1744"}
                />
                <InfoChip
                  label="Trend"
                  value={pred.trend}
                  color={bull ? "#00e676" : "#ff1744"}
                />
                <InfoChip
                  label="Confidence"
                  value={`${pred.confidence}%`}
                  color={pred.confidence >= 70 ? "#00e676" : pred.confidence >= 55 ? "#ffd740" : "#ff1744"}
                />
                <InfoChip
                  label="RSI"
                  value={pred.rsi}
                  color={pred.rsi < 35 ? "#40c4ff" : pred.rsi <= 65 ? "#00e676" : "#ff1744"}
                  sub={pred.rsi < 35 ? "Oversold" : pred.rsi > 65 ? "Overbought" : "Neutral"}
                />
              </div>
            </div>
          )}

          {/* ── Sentiment + Fundamentals ────────────────────────────── */}
          {pred && (pred.news_sentiment !== undefined || pred.fundamental_score !== undefined) && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: "clamp(12px, 2vw, 16px)", marginBottom: "24px", animation: "fadeInUp 0.5s 0.25s ease both" }}>

              {/* News Sentiment */}
              {pred.news_sentiment !== undefined && (
                <div style={{ background: "rgba(13,18,36,0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "24px", backdropFilter: "blur(12px)" }}>
                  <p className="section-label">Analysis</p>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.2rem", fontWeight: 800, color: "#f1f5f9", marginBottom: "20px" }}>News Sentiment</h2>

                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                      <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Sentiment Score</span>
                      <span style={{
                        fontSize: "1.8rem",
                        fontWeight: 900,
                        color: pred.news_sentiment > 60 ? "#00e676" : pred.news_sentiment < 40 ? "#ff1744" : "#40c4ff",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}>
                        {pred.news_sentiment.toFixed(1)}
                        <span style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>/100</span>
                      </span>
                    </div>
                    <ScoreBar
                      value={pred.news_sentiment}
                      color={pred.news_sentiment > 60 ? "#00e676" : pred.news_sentiment < 40 ? "#ff1744" : "#40c4ff"}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      background: pred.news_impact === "bullish" ? "rgba(0,230,118,0.12)" : pred.news_impact === "bearish" ? "rgba(255,23,68,0.12)" : "rgba(64,196,255,0.12)",
                      color: pred.news_impact === "bullish" ? "#00e676" : pred.news_impact === "bearish" ? "#ff1744" : "#40c4ff",
                      border: `1px solid ${pred.news_impact === "bullish" ? "rgba(0,230,118,0.25)" : pred.news_impact === "bearish" ? "rgba(255,23,68,0.25)" : "rgba(64,196,255,0.25)"}`,
                    }}>
                      {pred.news_impact}
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)" }}>{pred.news_count} articles analyzed</span>
                  </div>

                  <div style={{ marginTop: "16px", padding: "12px", background: "rgba(64,196,255,0.05)", border: "1px solid rgba(64,196,255,0.1)", borderRadius: "10px" }}>
                    <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                      ℹ️ News sentiment analysis improves prediction accuracy by ~15–20% by capturing market emotion shifts.
                    </p>
                  </div>
                </div>
              )}

              {/* Fundamentals */}
              {pred.fundamental_score !== undefined && (
                <div style={{ background: "rgba(13,18,36,0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "24px", backdropFilter: "blur(12px)" }}>
                  <p className="section-label">Company Health</p>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.2rem", fontWeight: 800, color: "#f1f5f9", marginBottom: "20px" }}>Fundamentals</h2>

                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                      <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Fundamental Score</span>
                      <span style={{
                        fontSize: "1.8rem",
                        fontWeight: 900,
                        color: pred.fundamental_score > 65 ? "#00e676" : pred.fundamental_score < 35 ? "#ff1744" : "#40c4ff",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}>
                        {pred.fundamental_score.toFixed(1)}
                        <span style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>/100</span>
                      </span>
                    </div>
                    <ScoreBar
                      value={pred.fundamental_score}
                      color={pred.fundamental_score > 65 ? "#00e676" : pred.fundamental_score < 35 ? "#ff1744" : "#40c4ff"}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(90px, 100%), 1fr))", gap: "10px", marginBottom: "16px" }}>
                    {[
                      { label: "PE Ratio", value: pred.pe_ratio ? pred.pe_ratio.toFixed(2) : "N/A", color: "#f1f5f9" },
                      { label: "Earnings Growth", value: pred.earnings_growth ? (pred.earnings_growth * 100).toFixed(1) + "%" : "N/A", color: pred.earnings_growth > 0 ? "#00e676" : "#ff1744" },
                      { label: "Revenue Growth", value: pred.revenue_growth ? (pred.revenue_growth * 100).toFixed(1) + "%" : "N/A", color: pred.revenue_growth > 0 ? "#00e676" : "#ff1744" },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "12px" }}>
                        <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>{label}</p>
                        <p style={{ fontSize: "1rem", fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: "12px", background: "rgba(64,196,255,0.05)", border: "1px solid rgba(64,196,255,0.1)", borderRadius: "10px" }}>
                    <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                      ℹ️ Strong fundamentals with positive sentiment indicate long-term bullish potential.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── News ────────────────────────────────────────────────── */}
          {news.length > 0 && (
            <div style={{ animation: "fadeInUp 0.5s 0.3s ease both" }}>
              <div style={{ marginBottom: "16px" }}>
                <p className="section-label">Market News</p>
                <h2 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "1.4rem",
                  fontWeight: 800,
                  background: "linear-gradient(90deg, #00e5ff, #40c4ff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  Latest News
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {news.map((item, i) => (
                  <a
                    key={i}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      background: "rgba(13,18,36,0.7)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "16px",
                      padding: "18px 22px",
                      textDecoration: "none",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = "rgba(0,229,255,0.2)";
                      e.currentTarget.style.background = "rgba(13,18,36,0.9)";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.background = "rgba(13,18,36,0.7)";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <p style={{ fontWeight: 600, fontSize: "0.95rem", color: "#e2e8f0", marginBottom: "8px", lineHeight: 1.5 }}>
                      {item.title}
                    </p>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#00e5ff", background: "rgba(0,229,255,0.08)", padding: "2px 8px", borderRadius: "6px" }}>
                        {item.publisher}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>·</span>
                      <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>{item.date}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
