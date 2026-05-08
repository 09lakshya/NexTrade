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
function InfoChip({ label, value, color, sub }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "14px",
        padding: "16px 18px",
        transition: "all 0.2s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent-glow)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
    >
      <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>{label}</p>
      <p style={{ fontSize: "clamp(1rem, 2vw, 1.3rem)", fontWeight: 800, color: color || "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>{value}</p>
      {sub && <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px" }}>{sub}</p>}
    </div>
  );
}

// ── Score bar ─────────────────────────────────────────────────────────────
function ScoreBar({ value, max = 100, color }) {
  return (
    <div style={{ height: "5px", background: "var(--border-subtle)", borderRadius: "5px", overflow: "hidden" }}>
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
  const normalizedSymbol =
    typeof symbol === "string" ? symbol.replace(/\.NS$/i, "") : symbol;

  const [history, setHistory]       = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [news, setNews]             = useState([]);
  const [period, setPeriod]         = useState("1m");
  const [loading, setLoading]       = useState(true);

  const getPeriodFormat = (p) => PERIODS.find(x => x.key === p)?.yf || p;

  useEffect(() => {
    if (!router.isReady || !normalizedSymbol) return;
    const load = async () => {
      try {
        setLoading(true);
        const [histRes, predRes] = await Promise.all([
          API.get(`/market/${normalizedSymbol}/history?period=${getPeriodFormat(period)}`),
          API.get(`/predict/${normalizedSymbol}.NS`),
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
  }, [router.isReady, normalizedSymbol, period]);

  useEffect(() => {
    if (!router.isReady || !normalizedSymbol) return;
    API.get(`/news/${normalizedSymbol}`)
      .then(res => setNews(Array.isArray(res.data) ? res.data : []))
      .catch(() => setNews([]));
  }, [router.isReady, normalizedSymbol]);

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
  const neutral = pred && pred.trend === "NEUTRAL";
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
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-medium)",
                    borderRadius: "10px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    fontSize: "0.8rem",
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.borderColor = "var(--accent-glow)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border-medium)"; }}
                >
                  ← Back
                </button>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>NSE · India</p>
              </div>

              <h1
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "clamp(2rem, 5vw, 3.5rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  background: "linear-gradient(90deg, var(--accent) 0%, var(--purple) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  marginBottom: "4px",
                }}
              >
                {symbol}
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Real-time price · AI predictions · Market analysis
              </p>
            </div>

            {/* Live price badge */}
            {hasPrice && (
              <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-medium)",
                borderRadius: "18px",
                padding: "20px 24px",
                textAlign: "right",
                backdropFilter: "blur(16px)",
                boxShadow: "var(--shadow-card)",
              }}>
                <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Current Price</p>
                <p style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.03em", marginBottom: "4px" }}>
                  ₹{pred.current_price}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: isPredUp ? "var(--green)" : "var(--red)" }}>
                    {isPredUp ? "▲ +" : "▼ "}{pred.change} ({pred.percent_change}%)
                  </span>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "20px",
                    background: neutral ? "var(--accent-dim)" : bull ? "var(--green-dim)" : "var(--red-dim)",
                    color: neutral ? "var(--accent)" : bull ? "var(--green)" : "var(--red)",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    border: `1px solid ${neutral ? "var(--accent-glow)" : bull ? "var(--green-dim)" : "var(--red-dim)"}`,
                  }}>
                    {neutral ? "NEUTRAL" : bull ? "BULLISH" : "BEARISH"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Period selector ─────────────────────────────────────── */}
          <div style={{
            display: "flex",
            gap: "4px",
            marginBottom: "16px",
            background: "var(--filter-tab-bg)",
            border: "1px solid var(--filter-tab-border)",
            borderRadius: "12px",
            padding: "4px",
            width: "fit-content",
            maxWidth: "100%",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            animation: "fadeInUp 0.5s 0.1s ease both",
          }}>
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
                  background: period === key ? "var(--accent-dim)" : "transparent",
                  color: period === key ? "var(--accent)" : "var(--filter-tab-inactive)",
                  boxShadow: period === key ? "0 2px 8px var(--shadow-card)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Chart ──────────────────────────────────────────────── */}
          <div style={{ marginBottom: "24px", animation: "fadeInUp 0.5s 0.15s ease both" }}>
            {loading ? (
              <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "clamp(14px, 2vw, 20px)",
                height: "clamp(250px, 40vw, 400px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "16px",
              }}>
                <div className="spinner" style={{ width: "36px", height: "36px" }} />
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading chart data…</p>
              </div>
            ) : history.length > 0 ? (
              <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "clamp(14px, 2vw, 20px)",
                padding: "clamp(14px, 3vw, 24px)",
                height: "clamp(250px, 40vw, 400px)",
                backdropFilter: "blur(16px)",
                boxShadow: "var(--shadow-card)",
              }}>
                <RealChart data={history} />
              </div>
            ) : (
              <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--red-dim)",
                borderRadius: "20px",
                padding: "60px 24px",
                textAlign: "center",
              }}>
                <p style={{ fontSize: "2rem", marginBottom: "12px" }}>📉</p>
                <p style={{ color: "var(--red)", fontSize: "1rem" }}>No chart data available for this period</p>
              </div>
            )}
          </div>

          {/* ── AI Prediction ───────────────────────────────────────── */}
          {pred && pred.current_price && (
            <div style={{
              background: "var(--bg-card)",
              border: "1px solid var(--accent-glow)",
              borderRadius: "20px",
              padding: "28px",
              marginBottom: "24px",
              backdropFilter: "blur(16px)",
              boxShadow: "var(--shadow-card)",
              animation: "fadeInUp 0.5s 0.2s ease both",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "var(--accent-dim)",
                  border: "1px solid var(--accent-glow)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                }}>
                  🤖
                </div>
                <div>
                  <p className="section-label" style={{ margin: 0 }}>Machine Learning</p>
                  <h2 style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "1.3rem",
                    fontWeight: 800,
                    background: "linear-gradient(90deg, var(--accent), var(--purple))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}>
                    AI Prediction
                  </h2>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(140px, 100%), 1fr))", gap: "clamp(8px, 1.5vw, 12px)" }}>
                <InfoChip label="Current Price" value={`₹${pred.current_price}`} />
                <InfoChip
                  label="24h Change"
                  value={`${isPredUp ? "▲ +" : "▼ "}${pred.change}`}
                  color={isPredUp ? "var(--green)" : "var(--red)"}
                  sub={`${pred.percent_change}%`}
                />
                <InfoChip
                  label="Predicted Price"
                  value={`₹${pred.predicted_price}`}
                  color={predDelta >= 0 ? "var(--green)" : "var(--red)"}
                  sub={`${predDelta >= 0 ? "+" : ""}${predDelta.toFixed(2)} (${predDeltaPct}%)`}
                />
                <InfoChip
                  label="Day Close"
                  value={`₹${pred.day_close_prediction}`}
                  color={pred.day_close_prediction - pred.current_price >= 0 ? "var(--green)" : "var(--red)"}
                />
                <InfoChip
                  label="Trend"
                  value={pred.trend}
                  color={neutral ? "var(--accent)" : bull ? "var(--green)" : "var(--red)"}
                />
                <InfoChip
                  label="Confidence"
                  value={`${pred.confidence}%`}
                  color={pred.confidence >= 70 ? "var(--green)" : pred.confidence >= 55 ? "var(--gold)" : "var(--red)"}
                />
                <InfoChip
                  label="RSI"
                  value={pred.rsi}
                  color={pred.rsi < 35 ? "var(--accent)" : pred.rsi <= 65 ? "var(--green)" : "var(--red)"}
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
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "20px", padding: "24px", backdropFilter: "blur(12px)", boxShadow: "var(--shadow-card)" }}>
                  <p className="section-label">Analysis</p>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "20px" }}>News Sentiment</h2>

                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Sentiment Score</span>
                      <span style={{
                        fontSize: "1.8rem",
                        fontWeight: 900,
                        color: pred.news_sentiment > 60 ? "var(--green)" : pred.news_sentiment < 40 ? "var(--red)" : "var(--accent)",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}>
                        {pred.news_sentiment.toFixed(1)}
                        <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 600 }}>/100</span>
                      </span>
                    </div>
                    <ScoreBar
                      value={pred.news_sentiment}
                      color={pred.news_sentiment > 60 ? "var(--green)" : pred.news_sentiment < 40 ? "var(--red)" : "var(--accent)"}
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
                      background: pred.news_impact === "bullish" ? "var(--green-dim)" : pred.news_impact === "bearish" ? "var(--red-dim)" : "var(--accent-dim)",
                      color: pred.news_impact === "bullish" ? "var(--green)" : pred.news_impact === "bearish" ? "var(--red)" : "var(--accent)",
                      border: `1px solid ${pred.news_impact === "bullish" ? "var(--green-dim)" : pred.news_impact === "bearish" ? "var(--red-dim)" : "var(--accent-glow)"}`,
                    }}>
                      {pred.news_impact}
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      {pred.sentiment_source === "news" ? `${pred.news_count} articles analyzed` : "Market momentum proxy"}
                    </span>
                  </div>

                  <div style={{ marginTop: "16px", padding: "12px", background: "var(--accent-dim)", border: "1px solid var(--accent-glow)", borderRadius: "10px" }}>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      ℹ️ News sentiment analysis improves prediction accuracy by ~15–20% by capturing market emotion shifts.
                    </p>
                  </div>
                </div>
              )}

              {/* Fundamentals */}
              {pred.fundamental_score !== undefined && (
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "20px", padding: "24px", backdropFilter: "blur(12px)", boxShadow: "var(--shadow-card)" }}>
                  <p className="section-label">Company Health</p>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "20px" }}>Fundamentals</h2>

                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Fundamental Score</span>
                      <span style={{
                        fontSize: "1.8rem",
                        fontWeight: 900,
                        color: pred.fundamental_score > 65 ? "var(--green)" : pred.fundamental_score < 35 ? "var(--red)" : "var(--accent)",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}>
                        {pred.fundamental_score.toFixed(1)}
                        <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 600 }}>/100</span>
                      </span>
                    </div>
                    <ScoreBar
                      value={pred.fundamental_score}
                      color={pred.fundamental_score > 65 ? "var(--green)" : pred.fundamental_score < 35 ? "var(--red)" : "var(--accent)"}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(90px, 100%), 1fr))", gap: "10px", marginBottom: "16px" }}>
                    {[
                      { label: "PE Ratio", value: pred.pe_ratio != null ? pred.pe_ratio.toFixed(2) : "N/A", color: "var(--text-primary)" },
                      { label: "Earnings Growth", value: pred.earnings_growth != null ? (pred.earnings_growth * 100).toFixed(1) + "%" : "N/A", color: pred.earnings_growth > 0 ? "var(--green)" : "var(--red)" },
                      { label: "Revenue Growth", value: pred.revenue_growth != null ? (pred.revenue_growth * 100).toFixed(1) + "%" : "N/A", color: pred.revenue_growth > 0 ? "var(--green)" : "var(--red)" },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ background: "var(--input-bg)", border: "1px solid var(--border-subtle)", borderRadius: "10px", padding: "12px" }}>
                        <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>{label}</p>
                        <p style={{ fontSize: "1rem", fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: "12px", background: "var(--accent-dim)", border: "1px solid var(--accent-glow)", borderRadius: "10px" }}>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
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
                  background: "linear-gradient(90deg, var(--accent), var(--purple))",
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
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "16px",
                      padding: "18px 22px",
                      textDecoration: "none",
                      transition: "all 0.2s",
                      boxShadow: "var(--shadow-card)",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = "var(--accent-glow)";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "var(--border-subtle)";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <p style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "8px", lineHeight: 1.5 }}>
                      {item.title}
                    </p>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--accent)", background: "var(--accent-dim)", padding: "2px 8px", borderRadius: "6px" }}>
                        {item.publisher}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>·</span>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500 }}>{item.date}</span>
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
