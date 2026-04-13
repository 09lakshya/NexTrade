import { useState } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";
import Head from "next/head";
import { useRouter } from "next/router";

const GOALS = [
  { id: "wealth",    label: "Wealth Creation",  desc: "Grow money aggressively over time",  icon: "🚀" },
  { id: "income",    label: "Steady Income",    desc: "Regular returns with lower risk",     icon: "💰" },
  { id: "retirement",label: "Retirement",       desc: "Safe, long-term wealth building",     icon: "🏖️" },
  { id: "education", label: "Education Fund",   desc: "Save for a child's future",           icon: "🎓" },
  { id: "safety",    label: "Capital Safety",   desc: "Protect my money first",              icon: "🛡️" },
];

const DURATIONS = [
  { id: "short",  label: "Short Term",   sub: "Under 1 year" },
  { id: "medium", label: "Medium Term",  sub: "1 – 3 years"  },
  { id: "long",   label: "Long Term",    sub: "3+ years"     },
];

const RISKS = [
  { id: "low",    label: "Low Risk",    sub: "Safety over returns",       color: "#00e676" },
  { id: "medium", label: "Medium Risk", sub: "Balance of both",           color: "#ffd740" },
  { id: "high",   label: "High Risk",   sub: "Higher potential gains",    color: "#ff1744" },
];

const QUICK_AMOUNTS = [10000, 50000, 100000, 500000];

// ── Step header ───────────────────────────────────────────────────────────
function StepHeader({ number, title, done }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: done
            ? "linear-gradient(135deg, #00e676, #69f0ae)"
            : "rgba(0,229,255,0.15)",
          border: done ? "none" : "1.5px solid rgba(0,229,255,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: done ? "16px" : "0.85rem",
          fontWeight: 800,
          color: done ? "#080c1a" : "#00e5ff",
          flexShrink: 0,
          transition: "all 0.3s",
        }}
      >
        {done ? "✓" : number}
      </div>
      <h2
        style={{
          fontSize: "0.95rem",
          fontWeight: 700,
          color: "rgba(255,255,255,0.85)",
          letterSpacing: "0.01em",
        }}
      >
        {title}
      </h2>
    </div>
  );
}

// ── Option card ───────────────────────────────────────────────────────────
function OptionCard({ selected, onClick, label, sub, icon, accentColor }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: "pointer",
        padding: "clamp(12px, 2vw, 16px)",
        minHeight: "60px",
        touchAction: "manipulation",
        borderRadius: "14px",
        border: `1.5px solid ${selected ? (accentColor || "rgba(0,229,255,0.8)") : hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)"}`,
        background: selected
          ? `rgba(0,229,255,0.07)`
          : hovered
          ? "rgba(255,255,255,0.04)"
          : "rgba(13,18,36,0.6)",
        transition: "all 0.2s ease",
        transform: selected ? "scale(1.02)" : hovered ? "scale(1.01)" : "scale(1)",
        boxShadow: selected ? `0 0 20px rgba(0,229,255,0.12)` : "none",
        userSelect: "none",
      }}
    >
      {icon && (
        <p style={{ fontSize: "1.4rem", marginBottom: "8px" }}>{icon}</p>
      )}
      <p
        style={{
          fontWeight: 700,
          fontSize: "0.875rem",
          color: selected ? "#00e5ff" : hovered ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.65)",
          marginBottom: sub ? "4px" : 0,
          transition: "color 0.2s",
        }}
      >
        {label}
      </p>
      {sub && (
        <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.38)", lineHeight: 1.4 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ── Portfolio summary ─────────────────────────────────────────────────────
function PortfolioSummary({ stocks, budget }) {
  if (!stocks || stocks.length === 0) return null;

  const avgConfidence = stocks.reduce((s, x) => s + (x.confidence || 65), 0) / stocks.length;
  const riskCounts = { low: 0, medium: 0, high: 0 };
  stocks.forEach((s) => riskCounts[s.risk_level]++);
  const riskLabel =
    riskCounts.high > 2 ? "High Risk" :
    riskCounts.high > 0 ? "Moderate-High" :
    riskCounts.medium > 0 ? "Balanced" : "Conservative";

  const EXPECTED_ANNUAL_RETURNS = { low: 10, medium: 14, high: 20 };
  const INVESTMENT_HORIZON = 3;
  const INFLATION_RATE = 6;

  let totalExpectedReturns = 0, totalNominalReturns = 0;
  stocks.forEach((stock) => {
    const alloc = stock.suggested_allocation || budget / stocks.length;
    const ear = EXPECTED_ANNUAL_RETURNS[stock.risk_level] / 100;
    const nominalValue = alloc * Math.pow(1 + ear, INVESTMENT_HORIZON);
    totalNominalReturns += nominalValue - alloc;
    totalExpectedReturns += nominalValue;
  });

  const totalProfit = totalNominalReturns;
  const returnPct = ((totalProfit / budget) * 100).toFixed(2);
  const inflationFactor = Math.pow(1 + INFLATION_RATE / 100, INVESTMENT_HORIZON);
  const realValue = totalExpectedReturns / inflationFactor;
  const realProfit = realValue - budget;
  const realReturnPct = ((realProfit / budget) * 100).toFixed(2);

  const stats = [
    { label: "Total Investment", value: `₹${budget.toLocaleString("en-IN")}`, color: "#f1f5f9" },
    { label: "Stocks Selected",  value: stocks.length, color: "#00e5ff" },
    { label: "Avg Confidence",   value: `${avgConfidence.toFixed(0)}%`, color: "#00e676" },
    { label: "Portfolio Risk",   value: riskLabel, color: "#e040fb" },
  ];

  return (
    <div
      style={{
        background: "rgba(13,18,36,0.7)",
        border: "1px solid rgba(0,229,255,0.15)",
        borderRadius: "20px",
        padding: "28px",
        marginBottom: "32px",
        backdropFilter: "blur(20px)",
        animation: "fadeInUp 0.5s ease forwards",
      }}
    >
      <div style={{ marginBottom: "20px" }}>
        <p className="section-label">Portfolio Analysis</p>
        <h2 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "1.5rem",
          fontWeight: 800,
          background: "linear-gradient(90deg, #00e5ff, #40c4ff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          Portfolio Summary
        </h2>
      </div>

      {/* Key stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(130px, 100%), 1fr))", gap: "clamp(8px, 1.5vw, 12px)", marginBottom: "24px" }}>
        {stats.map(({ label, value, color }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "16px" }}>
            <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>{label}</p>
            <p style={{ fontSize: "1.4rem", fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Nominal returns */}
      <div style={{ background: "rgba(0,230,118,0.06)", border: "1px solid rgba(0,230,118,0.15)", borderRadius: "14px", padding: "20px", marginBottom: "12px" }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(0,230,118,0.7)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "14px" }}>
          💹 Expected Returns ({INVESTMENT_HORIZON}-Year Horizon)
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100px, 100%), 1fr))", gap: "10px" }}>
          {[
            { label: "Invested", value: `₹${budget.toLocaleString("en-IN")}`, color: "#f1f5f9" },
            { label: "Returns",  value: `₹${totalProfit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, color: "#00e676" },
            { label: "Total Value", value: `₹${totalExpectedReturns.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, color: "#00e676" },
            { label: "Return %", value: `${returnPct}%`, color: "#00e676" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "12px" }}>
              <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
              <p style={{ fontSize: "1rem", fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Real returns */}
      <div style={{ background: "rgba(224,64,251,0.06)", border: "1px solid rgba(224,64,251,0.15)", borderRadius: "14px", padding: "20px" }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(224,64,251,0.7)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "14px" }}>
          🎯 Real Returns (Inflation-Adjusted @ {INFLATION_RATE}%)
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100px, 100%), 1fr))", gap: "10px" }}>
          {[
            { label: "Invested", value: `₹${budget.toLocaleString("en-IN")}`, color: "#f1f5f9" },
            { label: "Real Returns", value: `₹${realProfit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, color: realProfit > 0 ? "#e040fb" : "#ff1744" },
            { label: "Real Value", value: `₹${realValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, color: "#e040fb" },
            { label: "Real Return %", value: `${realReturnPct}%`, color: parseFloat(realReturnPct) > 0 ? "#e040fb" : "#ff1744" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "12px" }}>
              <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
              <p style={{ fontSize: "1rem", fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", marginTop: "12px" }}>
          Real returns account for inflation and show purchasing power growth.
        </p>
      </div>
    </div>
  );
}

// ── Recommendation card ───────────────────────────────────────────────────
function RecoCard({ stock, rank, totalBudget }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const bull = stock.trend === "BULLISH";
  const riskColors = { low: "#00e676", medium: "#ffd740", high: "#ff1744" };
  const riskBg    = { low: "rgba(0,230,118,0.1)", medium: "rgba(255,215,64,0.1)", high: "rgba(255,23,68,0.1)" };
  const rsiColor  = stock.rsi < 35 ? "#40c4ff" : stock.rsi <= 65 ? "#00e676" : "#ff1744";
  const allocationPct = ((stock.suggested_allocation / totalBudget) * 100).toFixed(1);
  const confColor = stock.confidence >= 75 ? "#00e676" : stock.confidence >= 60 ? "#ffd740" : "#ff9100";

  return (
    <div
      style={{
        background: "rgba(13,18,36,0.8)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "clamp(14px, 2vw, 18px)",
        padding: "clamp(16px, 3vw, 24px)",
        transition: "all 0.25s ease",
        backdropFilter: "blur(16px)",
        animation: `fadeInUp 0.4s ${rank * 0.1}s ease both`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.border = "1px solid rgba(0,229,255,0.2)";
        e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Top row */}
      <div 
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "12px", cursor: "pointer" }}
        onClick={() => router.push(`/stock/${stock.symbol}`)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
            <span style={{ padding: "2px 10px", borderRadius: "20px", background: "rgba(0,229,255,0.1)", color: "#00e5ff", fontSize: "0.7rem", fontWeight: 800, border: "1px solid rgba(0,229,255,0.2)" }}>
              #{rank}
            </span>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: "1.1rem",
              background: "linear-gradient(90deg, #00e5ff, #40c4ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              {stock.name}
            </span>
            <span style={{ padding: "2px 8px", borderRadius: "20px", background: riskBg[stock.risk_level], color: riskColors[stock.risk_level], fontSize: "0.65rem", fontWeight: 700, border: `1px solid ${riskColors[stock.risk_level]}30` }}>
              {stock.risk_level} risk
            </span>
          </div>
          <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
            {stock.symbol} · {stock.sector}
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>
            ₹{stock.current_price}
          </p>
          <p style={{ fontSize: "0.8rem", fontWeight: 700, color: bull ? "#00e676" : "#ff1744" }}>
            {bull ? "▲ BULLISH" : "▼ BEARISH"}
          </p>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.55)", marginBottom: "16px", lineHeight: 1.6 }}>
        {stock.description}
      </p>

      {/* RSI bar */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>RSI</span>
          <span style={{ fontSize: "0.8rem", fontWeight: 800, color: rsiColor }}>{stock.rsi}</span>
        </div>
        <div style={{ height: "5px", borderRadius: "5px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${Math.min(stock.rsi, 100)}%`,
            borderRadius: "5px",
            background: bull ? "linear-gradient(90deg, #00e676, #69f0ae)" : "linear-gradient(90deg, #ff5252, #ff1744)",
            transition: "width 0.8s ease",
          }} />
        </div>
      </div>

      {/* Sentiment + Confidence */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
        {stock.sentiment_score !== undefined && (
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "12px" }}>
            <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>News Sentiment</p>
            <p style={{ fontSize: "1.1rem", fontWeight: 800, color: stock.sentiment_score > 60 ? "#00e676" : stock.sentiment_score < 40 ? "#ff1744" : "#40c4ff", fontFamily: "'Space Grotesk', sans-serif" }}>
              {stock.sentiment_score}/100
            </p>
          </div>
        )}
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "12px" }}>
          <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Confidence</p>
          <p style={{ fontSize: "1.1rem", fontWeight: 800, color: confColor, fontFamily: "'Space Grotesk', sans-serif" }}>
            {stock.confidence}%
          </p>
        </div>
      </div>

      {/* Toggle AI reason */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.15)", borderRadius: "10px", padding: "8px 14px", cursor: "pointer", color: "#00e5ff", fontSize: "0.78rem", fontWeight: 600, fontFamily: "inherit", marginBottom: expanded ? "12px" : "16px", transition: "all 0.2s", width: "100%", textAlign: "left" }}
      >
        {expanded ? "▲ Hide AI Analysis" : "▼ View AI Analysis"}
      </button>

      {expanded && (
        <div style={{ background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.1)", borderRadius: "12px", padding: "14px", marginBottom: "16px", animation: "fadeIn 0.25s ease" }}>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>
            {stock.reason}
          </p>
        </div>
      )}

      {/* Allocation chips */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.18)", borderRadius: "12px", padding: "12px 16px" }}>
          <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Allocation</p>
          <p style={{ fontSize: "0.95rem", fontWeight: 800, color: "#00e676" }}>
            ₹{stock.suggested_allocation.toLocaleString("en-IN")} ({allocationPct}%)
          </p>
        </div>
        <div style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.15)", borderRadius: "12px", padding: "12px 16px" }}>
          <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Est. Shares</p>
          <p style={{ fontSize: "0.95rem", fontWeight: 800, color: "#00e5ff" }}>{stock.shares_you_can_buy}</p>
        </div>
      </div>

      <div style={{ marginTop: "16px", textAlign: "right" }}>
        <button 
          onClick={() => router.push(`/stock/${stock.symbol}`)} 
          className="text-xs text-accent border border-accent border-opacity-30 px-4 py-2 rounded-full hover:bg-accent hover:bg-opacity-10 transition-all duration-200 font-semibold"
        >
          View Stock →
        </button>
      </div>
    </div>
  );
}

// ── Main Advisor Page ─────────────────────────────────────────────────────
export default function Advisor() {
  const [goal, setGoal] = useState(null);
  const [duration, setDuration] = useState(null);
  const [risk, setRisk] = useState(null);
  const [investmentType, setInvestmentType] = useState("one-time");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!goal || !duration || !risk || !budget) {
      setError("Please complete all four sections before continuing.");
      return;
    }
    if (parseFloat(budget) <= 0) {
      setError("Please enter a valid investment amount.");
      return;
    }
    setError(""); setLoading(true); setResults(null);
    try {
      const res = await API.post("/advisor/recommend", {
        goal, duration, risk,
        budget: parseFloat(budget),
        investmentType,
      });
      setResults(res.data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const progress = [goal, duration, risk, budget].filter(Boolean).length;

  return (
    <>
      <Head>
        <title>AI Advisor — NexTrade</title>
        <meta name="description" content="Get AI-powered stock recommendations tailored to your investment goals, duration, and risk appetite." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div style={{ minHeight: "100vh" }}>
        <Navbar />

        <div style={{ maxWidth: "860px", margin: "0 auto", padding: "clamp(20px, 4vw, 40px) clamp(12px, 3vw, 24px) clamp(40px, 8vw, 80px)" }}>

          {/* Header */}
          <div style={{ marginBottom: "40px", animation: "fadeInUp 0.5s ease forwards" }}>
            <p className="section-label">Personalised Recommendations</p>
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                background: "linear-gradient(90deg, #00e5ff 0%, #40c4ff 40%, #e040fb 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: "10px",
              }}
            >
              AI Financial Advisor
            </h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.95rem" }}>
              Answer four simple questions and get stock picks tailored to you.
            </p>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: "36px", animation: "fadeInUp 0.5s 0.1s ease both" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Progress
              </span>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#00e5ff" }}>
                {progress} / 4 complete
              </span>
            </div>
            <div style={{ height: "4px", borderRadius: "4px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${(progress / 4) * 100}%`,
                borderRadius: "4px",
                background: "linear-gradient(90deg, #00e5ff, #e040fb)",
                transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
              }} />
            </div>
          </div>

          {/* Step 1 — Goal */}
          <div style={{ background: "rgba(13,18,36,0.6)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "clamp(14px, 2vw, 20px)", padding: "clamp(18px, 3vw, 28px)", marginBottom: "16px", backdropFilter: "blur(16px)", animation: "fadeInUp 0.5s 0.15s ease both" }}>
            <StepHeader number={1} title="What's your investment goal?" done={!!goal} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(140px, 100%), 1fr))", gap: "clamp(8px, 1.5vw, 12px)" }}>
              {GOALS.map((g) => (
                <OptionCard
                  key={g.id}
                  selected={goal === g.id}
                  onClick={() => setGoal(g.id)}
                  label={g.label}
                  sub={g.desc}
                  icon={g.icon}
                />
              ))}
            </div>
          </div>

          {/* Step 2 — Duration */}
          <div style={{ background: "rgba(13,18,36,0.6)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "clamp(14px, 2vw, 20px)", padding: "clamp(18px, 3vw, 28px)", marginBottom: "16px", backdropFilter: "blur(16px)", animation: "fadeInUp 0.5s 0.2s ease both" }}>
            <StepHeader number={2} title="How long do you plan to stay invested?" done={!!duration} />
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {DURATIONS.map((d) => (
                <OptionCard
                  key={d.id}
                  selected={duration === d.id}
                  onClick={() => setDuration(d.id)}
                  label={d.label}
                  sub={d.sub}
                />
              ))}
            </div>
          </div>

          {/* Step 3 — Risk */}
          <div style={{ background: "rgba(13,18,36,0.6)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "clamp(14px, 2vw, 20px)", padding: "clamp(18px, 3vw, 28px)", marginBottom: "16px", backdropFilter: "blur(16px)", animation: "fadeInUp 0.5s 0.25s ease both" }}>
            <StepHeader number={3} title="How much risk are you comfortable with?" done={!!risk} />
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {RISKS.map((r) => (
                <OptionCard
                  key={r.id}
                  selected={risk === r.id}
                  onClick={() => setRisk(r.id)}
                  label={r.label}
                  sub={r.sub}
                  accentColor={r.color}
                />
              ))}
            </div>
          </div>

          {/* Step 4 — Budget */}
          <div style={{ background: "rgba(13,18,36,0.6)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "clamp(14px, 2vw, 20px)", padding: "clamp(18px, 3vw, 28px)", marginBottom: "24px", backdropFilter: "blur(16px)", animation: "fadeInUp 0.5s 0.3s ease both" }}>
            <StepHeader number={4} title="How much do you want to invest?" done={!!budget} />

            {/* Investment type toggle */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "4px" }}>
              {["one-time", "monthly"].map((type) => (
                <button
                  key={type}
                  onClick={() => setInvestmentType(type)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "9px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                    background: investmentType === type ? "rgba(0,229,255,0.12)" : "transparent",
                    color: investmentType === type ? "#00e5ff" : "rgba(255,255,255,0.45)",
                    boxShadow: investmentType === type ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
                  }}
                >
                  {type === "one-time" ? "💰 Lump Sum" : "📅 Monthly SIP"}
                </button>
              ))}
            </div>

            {/* Amount input */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "18px 20px", marginBottom: "14px", transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.5rem", color: "#00e5ff", fontWeight: 700 }}>₹</span>
                <input
                  type="number"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  placeholder={investmentType === "one-time" ? "e.g. 500000" : "e.g. 10000"}
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "#f1f5f9",
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    fontFamily: "'Space Grotesk', sans-serif",
                    flex: 1,
                    minWidth: 0,
                  }}
                  onFocus={e => { e.currentTarget.parentElement.parentElement.style.borderColor = "rgba(0,229,255,0.5)"; }}
                  onBlur={e => { e.currentTarget.parentElement.parentElement.style.borderColor = "rgba(255,255,255,0.1)"; }}
                />
                {investmentType === "monthly" && (
                  <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>/month</span>
                )}
              </div>
            </div>

            {/* Quick amounts */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {QUICK_AMOUNTS.map((amt) => {
                const val = investmentType === "monthly" ? amt / 10 : amt;
                return (
                  <button
                    key={amt}
                    onClick={() => setBudget(String(val))}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      border: "1px solid rgba(0,229,255,0.2)",
                      background: "rgba(0,229,255,0.06)",
                      color: "#00e5ff",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,229,255,0.12)"; e.currentTarget.style.borderColor = "rgba(0,229,255,0.4)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,229,255,0.06)"; e.currentTarget.style.borderColor = "rgba(0,229,255,0.2)"; }}
                  >
                    ₹{val.toLocaleString("en-IN")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: "rgba(255,23,68,0.08)", border: "1px solid rgba(255,23,68,0.25)", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", color: "#ff1744", fontSize: "0.875rem", fontWeight: 600, animation: "fadeIn 0.3s ease" }}>
              ⚠️ {error}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "14px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              background: loading ? "rgba(0,229,255,0.3)" : "linear-gradient(135deg, #00e5ff 0%, #0091ea 100%)",
              color: "#080c1a",
              fontWeight: 800,
              fontSize: "1rem",
              fontFamily: "inherit",
              letterSpacing: "0.01em",
              transition: "all 0.25s",
              boxShadow: loading ? "none" : "0 8px 32px rgba(0,229,255,0.3)",
              marginBottom: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              opacity: loading ? 0.7 : 1,
              animation: "fadeInUp 0.5s 0.35s ease both",
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,229,255,0.45)"; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,229,255,0.3)"; }}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: "18px", height: "18px", borderWidth: "2px" }} />
                Analysing India's markets for you…
              </>
            ) : (
              "Get My Stock Picks →"
            )}
          </button>

          {/* Loading state */}
          {loading && (
            <div style={{ textAlign: "center", marginBottom: "40px", animation: "fadeIn 0.3s ease" }}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontWeight: 500, marginBottom: "4px" }}>
                Checking RSI, sentiment, and momentum for your picks…
              </p>
              <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)" }}>
                This takes about 5 – 10 seconds.
              </p>
            </div>
          )}

          {/* Results */}
          {results && results.length > 0 && (
            <div>
              <PortfolioSummary stocks={results} budget={parseFloat(budget)} />

              <div style={{ marginBottom: "20px" }}>
                <p className="section-label">AI Recommendations</p>
                <h2 style={{
                  fontSize: "1.4rem",
                  fontWeight: 800,
                  fontFamily: "'Space Grotesk', sans-serif",
                  background: "linear-gradient(90deg, #00e5ff, #40c4ff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  Your Personalised Picks
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
                {results.map((stock, i) => (
                  <RecoCard key={i} stock={stock} rank={i + 1} totalBudget={parseFloat(budget)} />
                ))}
              </div>

              {/* Disclaimer */}
              <div style={{ background: "rgba(255,23,68,0.06)", border: "1px solid rgba(255,23,68,0.2)", borderRadius: "14px", padding: "16px 20px", fontSize: "0.8rem", color: "rgba(255,100,100,0.85)" }}>
                ⚠️ <strong>Disclaimer:</strong> These picks are AI-generated for educational purposes only and are <strong>not financial advice</strong>. Always consult a SEBI-registered investment advisor before investing.
              </div>
            </div>
          )}

          {results && results.length === 0 && (
            <div style={{ background: "rgba(13,18,36,0.7)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px", padding: "48px 24px", textAlign: "center" }}>
              <p style={{ fontSize: "3rem", marginBottom: "12px" }}>🔍</p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem" }}>
                No suitable stocks found for your criteria. Try adjusting your preferences.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
