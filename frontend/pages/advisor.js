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
  { id: "low",    label: "Low Risk",    sub: "Safety over returns",       color: "var(--green)" },
  { id: "medium", label: "Medium Risk", sub: "Balance of both",           color: "var(--gold)" },
  { id: "high",   label: "High Risk",   sub: "Higher potential gains",    color: "var(--red)" },
];

const QUICK_AMOUNTS = [10000, 50000, 100000, 500000];
const DEFAULT_SIP_MONTHS = { short: 12, medium: 36, long: 60 };
const TARGET_STOCKS_BY_DURATION = { short: 3, medium: 6, long: 10 };

function durationFromMonths(months) {
  if (months <= 12) return "short";
  if (months <= 36) return "medium";
  return "long";
}

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
            ? "linear-gradient(135deg, var(--green), var(--green-dim))"
            : "var(--accent-dim)",
          border: done ? "none" : "1.5px solid var(--accent-glow)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: done ? "16px" : "0.85rem",
          fontWeight: 800,
          color: done ? "var(--bg-primary)" : "var(--accent)",
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
          color: "var(--text-primary)",
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
        border: `1.5px solid ${selected ? (accentColor || "var(--accent)") : hovered ? "var(--border-medium)" : "var(--border-subtle)"}`,
        background: selected
          ? "var(--accent-dim)"
          : hovered
          ? "var(--hover-overlay)"
          : "var(--bg-card)",
        transition: "all 0.2s ease",
        transform: selected ? "scale(1.02)" : hovered ? "scale(1.01)" : "scale(1)",
        boxShadow: selected ? "0 0 20px var(--accent-glow)" : "none",
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
          color: selected ? "var(--accent)" : hovered ? "var(--text-primary)" : "var(--text-secondary)",
          marginBottom: sub ? "4px" : 0,
          transition: "color 0.2s",
        }}
      >
        {label}
      </p>
      {sub && (
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ── Portfolio summary ─────────────────────────────────────────────────────
function PortfolioSummary({ stocks, budget, investmentType, investmentMonths }) {
  if (!stocks || stocks.length === 0) return null;

  const isSip = investmentType === "monthly";
  const totalBudget = isSip ? budget * investmentMonths : budget;
  const horizonYears = isSip ? Math.max(investmentMonths / 12, 1 / 12) : 3;
  const avgConfidence = stocks.reduce((s, x) => s + (x.confidence || 65), 0) / stocks.length;
  const riskCounts = { low: 0, medium: 0, high: 0 };
  stocks.forEach((s) => riskCounts[s.risk_level]++);
  const riskLabel =
    riskCounts.high > 2 ? "High Risk" :
    riskCounts.high > 0 ? "Moderate-High" :
    riskCounts.medium > 0 ? "Balanced" : "Conservative";

  const EXPECTED_ANNUAL_RETURNS = { low: 10, medium: 14, high: 20 };
  const INFLATION_RATE = 6;

  let totalExpectedReturns = 0, totalNominalReturns = 0;
  stocks.forEach((stock) => {
    const alloc = stock.suggested_allocation || totalBudget / stocks.length;
    const ear = EXPECTED_ANNUAL_RETURNS[stock.risk_level] / 100;
    const nominalValue = alloc * Math.pow(1 + ear, horizonYears);
    totalNominalReturns += nominalValue - alloc;
    totalExpectedReturns += nominalValue;
  });

  const totalProfit = totalNominalReturns;
  const returnPct = ((totalProfit / totalBudget) * 100).toFixed(2);
  const inflationFactor = Math.pow(1 + INFLATION_RATE / 100, horizonYears);
  const realValue = totalExpectedReturns / inflationFactor;
  const realProfit = realValue - totalBudget;
  const realReturnPct = ((realProfit / totalBudget) * 100).toFixed(2);

  const stats = [
    { label: isSip ? "Total SIP" : "Total Investment", value: `₹${totalBudget.toLocaleString("en-IN")}`, color: "var(--text-primary)" },
    { label: "Stocks Selected",  value: stocks.length, color: "var(--accent)" },
    { label: "Avg Confidence",   value: `${avgConfidence.toFixed(0)}%`, color: "var(--green)" },
    { label: "Portfolio Risk",   value: riskLabel, color: "var(--purple)" },
  ];

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--accent-glow)",
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
          background: "linear-gradient(90deg, var(--accent), var(--purple))",
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
          <div key={label} style={{ background: "var(--input-bg)", border: "1px solid var(--border-subtle)", borderRadius: "14px", padding: "16px" }}>
            <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>{label}</p>
            <p style={{ fontSize: "1.4rem", fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Nominal returns */}
      <div style={{ background: "var(--green-dim)", border: "1px solid var(--green-dim)", borderRadius: "14px", padding: "20px", marginBottom: "12px" }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--green)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "14px" }}>
          💹 Expected Returns ({isSip ? `${investmentMonths}-Month SIP` : "3-Year Horizon"})
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100px, 100%), 1fr))", gap: "10px" }}>
          {[
            { label: "Invested", value: `₹${totalBudget.toLocaleString("en-IN")}`, color: "var(--text-primary)" },
            { label: "Returns",  value: `₹${totalProfit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, color: "var(--green)" },
            { label: "Total Value", value: `₹${totalExpectedReturns.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, color: "var(--green)" },
            { label: "Return %", value: `${returnPct}%`, color: "var(--green)" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "var(--bg-primary)", borderRadius: "10px", padding: "12px" }}>
              <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
              <p style={{ fontSize: "1rem", fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Real returns */}
      <div style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-glow)", borderRadius: "14px", padding: "20px" }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--purple)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "14px" }}>
          🎯 Real Returns (Inflation-Adjusted @ {INFLATION_RATE}%)
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100px, 100%), 1fr))", gap: "10px" }}>
          {[
            { label: "Invested", value: `₹${totalBudget.toLocaleString("en-IN")}`, color: "var(--text-primary)" },
            { label: "Real Returns", value: `₹${realProfit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, color: realProfit > 0 ? "var(--purple)" : "var(--red)" },
            { label: "Real Value", value: `₹${realValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, color: "var(--purple)" },
            { label: "Real Return %", value: `${realReturnPct}%`, color: parseFloat(realReturnPct) > 0 ? "var(--purple)" : "var(--red)" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "var(--bg-primary)", borderRadius: "10px", padding: "12px" }}>
              <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
              <p style={{ fontSize: "1rem", fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "12px" }}>
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
  const riskColors = { low: "var(--green)", medium: "var(--gold)", high: "var(--red)" };
  const riskBg    = { low: "var(--green-dim)", medium: "var(--accent-dim)", high: "var(--red-dim)" };
  const rsiColor  = stock.rsi < 35 ? "var(--accent)" : stock.rsi <= 65 ? "var(--green)" : "var(--red)";
  const allocationPct = ((stock.suggested_allocation / totalBudget) * 100).toFixed(1);
  const confColor = stock.confidence >= 75 ? "var(--green)" : stock.confidence >= 60 ? "var(--gold)" : "var(--red)";
  const isSip = stock.investment_type === "monthly";
  const capLabel = stock.cap_segment === "penny"
    ? "penny stock"
    : stock.cap_segment === "small"
    ? "small cap"
    : stock.cap_segment === "mid"
    ? "mid cap"
    : "large cap";

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "clamp(14px, 2vw, 18px)",
        padding: "clamp(16px, 3vw, 24px)",
        transition: "all 0.25s ease",
        backdropFilter: "blur(16px)",
        animation: `fadeInUp 0.4s ${rank * 0.1}s ease both`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.border = "1px solid var(--accent-glow)";
        e.currentTarget.style.boxShadow = "0 16px 48px var(--shadow-card)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.border = "1px solid var(--border-subtle)";
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
            <span style={{ padding: "2px 10px", borderRadius: "20px", background: "var(--accent-dim)", color: "var(--accent)", fontSize: "0.7rem", fontWeight: 800, border: "1px solid var(--accent-glow)" }}>
              #{rank}
            </span>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: "1.1rem",
              background: "linear-gradient(90deg, var(--accent), var(--purple))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              {stock.name}
            </span>
            <span style={{ padding: "2px 8px", borderRadius: "20px", background: riskBg[stock.risk_level], color: riskColors[stock.risk_level], fontSize: "0.65rem", fontWeight: 700, border: `1px solid ${riskColors[stock.risk_level]}30` }}>
              {stock.risk_level} risk
            </span>
            <span style={{ padding: "2px 8px", borderRadius: "20px", background: "var(--bg-primary)", color: "var(--text-secondary)", fontSize: "0.65rem", fontWeight: 700, border: "1px solid var(--border-subtle)" }}>
              {capLabel}
            </span>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
            {stock.symbol} · {stock.sector}
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>
            ₹{stock.current_price}
          </p>
          <p style={{ fontSize: "0.8rem", fontWeight: 700, color: bull ? "var(--green)" : "var(--red)" }}>
            {bull ? "▲ BULLISH" : "▼ BEARISH"}
          </p>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: 1.6 }}>
        {stock.description}
      </p>

      {/* RSI bar */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>RSI</span>
          <span style={{ fontSize: "0.8rem", fontWeight: 800, color: rsiColor }}>{stock.rsi}</span>
        </div>
        <div style={{ height: "5px", borderRadius: "5px", background: "var(--border-subtle)", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${Math.min(stock.rsi, 100)}%`,
            borderRadius: "5px",
            background: bull ? "linear-gradient(90deg, var(--green), var(--green-dim))" : "linear-gradient(90deg, var(--red-dim), var(--red))",
            transition: "width 0.8s ease",
          }} />
        </div>
      </div>

      {/* Sentiment + Confidence */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
        {stock.sentiment_score !== undefined && (
          <div style={{ background: "var(--bg-primary)", borderRadius: "10px", padding: "12px" }}>
            <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>News Sentiment</p>
            <p style={{ fontSize: "1.1rem", fontWeight: 800, color: stock.sentiment_score > 60 ? "var(--green)" : stock.sentiment_score < 40 ? "var(--red)" : "var(--accent)", fontFamily: "'Space Grotesk', sans-serif" }}>
              {stock.sentiment_score}/100
            </p>
          </div>
        )}
        <div style={{ background: "var(--bg-primary)", borderRadius: "10px", padding: "12px" }}>
          <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Confidence</p>
          <p style={{ fontSize: "1.1rem", fontWeight: 800, color: confColor, fontFamily: "'Space Grotesk', sans-serif" }}>
            {stock.confidence}%
          </p>
        </div>
      </div>

      {/* Toggle AI reason */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-glow)", borderRadius: "10px", padding: "8px 14px", cursor: "pointer", color: "var(--accent)", fontSize: "0.78rem", fontWeight: 600, fontFamily: "inherit", marginBottom: expanded ? "12px" : "16px", transition: "all 0.2s", width: "100%", textAlign: "left" }}
      >
        {expanded ? "▲ Hide AI Analysis" : "▼ View AI Analysis"}
      </button>

      {expanded && (
        <div style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-glow)", borderRadius: "12px", padding: "14px", marginBottom: "16px", animation: "fadeIn 0.25s ease" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
            {stock.reason}
          </p>
        </div>
      )}

      {/* Allocation chips */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ background: "var(--green-dim)", border: "1px solid var(--green-dim)", borderRadius: "12px", padding: "12px 16px" }}>
          <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>{isSip ? "Total Allocation" : "Allocation"}</p>
          <p style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--green)" }}>
            ₹{stock.suggested_allocation.toLocaleString("en-IN")} ({allocationPct}%)
          </p>
          {isSip && (
            <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "4px", fontWeight: 600 }}>
              â‚¹{stock.monthly_allocation.toLocaleString("en-IN")}/mo for {stock.investment_months} months
            </p>
          )}
        </div>
        <div style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-glow)", borderRadius: "12px", padding: "12px 16px" }}>
          <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Est. Shares</p>
          <p style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--accent)" }}>{stock.shares_you_can_buy}</p>
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
  const [investmentMonths, setInvestmentMonths] = useState("");
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
    if (investmentType === "monthly" && (!investmentMonths || parseInt(investmentMonths, 10) <= 0)) {
      setError("Please enter the number of months you plan to keep investing through SIP.");
      return;
    }
    setError(""); setLoading(true); setResults(null);
    try {
      const res = await API.post("/advisor/recommend", {
        goal, duration, risk,
        budget: parseFloat(budget),
        investmentType,
        investmentMonths: investmentType === "monthly" ? parseInt(investmentMonths, 10) : null,
      });
      setResults(res.data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isSip = investmentType === "monthly";
  const parsedBudget = parseFloat(budget) || 0;
  const parsedMonths = parseInt(investmentMonths, 10) || DEFAULT_SIP_MONTHS[duration] || 0;
  const totalInvestment = isSip ? parsedBudget * parsedMonths : parsedBudget;
  const budgetStepDone = !!budget && (!isSip || !!investmentMonths);
  const progress = [goal, duration, risk, budgetStepDone].filter(Boolean).length;
  const progressTotal = 4;
  const suggestedStockCount = TARGET_STOCKS_BY_DURATION[duration] || TARGET_STOCKS_BY_DURATION.medium;

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
                background: "linear-gradient(90deg, var(--accent) 0%, var(--purple) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: "10px",
              }}
            >
              AI Financial Advisor
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Answer a few simple questions and get stock picks tailored to you.
            </p>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: "36px", animation: "fadeInUp 0.5s 0.1s ease both" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Progress
              </span>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--accent)" }}>
                {progress} / {progressTotal} complete
              </span>
            </div>
            <div style={{ height: "4px", borderRadius: "4px", background: "var(--border-subtle)", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${(progress / progressTotal) * 100}%`,
                borderRadius: "4px",
                background: "linear-gradient(90deg, var(--accent), var(--purple))",
                transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
              }} />
            </div>
          </div>

          {/* Step 1 — Goal */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "clamp(14px, 2vw, 20px)", padding: "clamp(18px, 3vw, 28px)", marginBottom: "16px", backdropFilter: "blur(16px)", animation: "fadeInUp 0.5s 0.15s ease both" }}>
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
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "clamp(14px, 2vw, 20px)", padding: "clamp(18px, 3vw, 28px)", marginBottom: "16px", backdropFilter: "blur(16px)", animation: "fadeInUp 0.5s 0.2s ease both" }}>
            <StepHeader number={2} title="How long do you plan to stay invested?" done={!!duration} />
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {DURATIONS.map((d) => (
                <OptionCard
                  key={d.id}
                  selected={duration === d.id}
                  onClick={() => {
                    setDuration(d.id);
                    if (investmentType === "monthly") {
                      setInvestmentMonths(String(DEFAULT_SIP_MONTHS[d.id]));
                    }
                  }}
                  label={d.label}
                  sub={d.sub}
                />
              ))}
            </div>
          </div>

          {/* Step 3 — Risk */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "clamp(14px, 2vw, 20px)", padding: "clamp(18px, 3vw, 28px)", marginBottom: "16px", backdropFilter: "blur(16px)", animation: "fadeInUp 0.5s 0.25s ease both" }}>
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
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "clamp(14px, 2vw, 20px)", padding: "clamp(18px, 3vw, 28px)", marginBottom: "24px", backdropFilter: "blur(16px)", animation: "fadeInUp 0.5s 0.3s ease both" }}>
            <StepHeader number={4} title="How much do you want to invest?" done={budgetStepDone} />

            {/* Investment type toggle */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "20px", background: "var(--input-bg)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "4px" }}>
              {["one-time", "monthly"].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setInvestmentType(type);
                    if (type === "monthly") {
                      const nextDuration = duration || "medium";
                      setDuration(nextDuration);
                      setInvestmentMonths(String(DEFAULT_SIP_MONTHS[nextDuration]));
                    }
                  }}
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
                    background: investmentType === type ? "var(--accent-dim)" : "transparent",
                    color: investmentType === type ? "var(--accent)" : "var(--text-secondary)",
                    boxShadow: investmentType === type ? "0 2px 8px var(--shadow-card)" : "none",
                  }}
                >
                  {type === "one-time" ? "💰 Lump Sum" : "📅 Monthly SIP"}
                </button>
              ))}
            </div>

            {/* Amount input */}
            <div style={{ background: "var(--input-bg)", border: "1.5px solid var(--border-subtle)", borderRadius: "14px", padding: "18px 20px", marginBottom: "14px", transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.5rem", color: "var(--accent)", fontWeight: 700 }}>₹</span>
                <input
                  type="number"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  placeholder={investmentType === "one-time" ? "e.g. 500000" : "e.g. 10000"}
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "var(--text-primary)",
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    fontFamily: "'Space Grotesk', sans-serif",
                    flex: 1,
                    minWidth: 0,
                  }}
                  onFocus={e => { e.currentTarget.parentElement.parentElement.style.borderColor = "var(--accent)"; }}
                  onBlur={e => { e.currentTarget.parentElement.parentElement.style.borderColor = "var(--border-subtle)"; }}
                />
                {investmentType === "monthly" && (
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>/month</span>
                )}
              </div>
            </div>

            {investmentType === "monthly" && (
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "12px", alignItems: "center", background: "var(--input-bg)", border: "1.5px solid var(--border-subtle)", borderRadius: "14px", padding: "14px 16px", marginBottom: "14px" }}>
                <div>
                  <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>
                    SIP Duration
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    Total planned investment: &#8377;{totalInvestment.toLocaleString("en-IN")}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="number"
                    min="1"
                    value={investmentMonths}
                    onChange={e => {
                      const value = e.target.value;
                      setInvestmentMonths(value);
                      const months = parseInt(value, 10);
                      if (months > 0) {
                        setDuration(durationFromMonths(months));
                      }
                    }}
                    placeholder="36"
                    style={{
                      width: "90px",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "var(--text-primary)",
                      fontSize: "1.15rem",
                      fontWeight: 800,
                      fontFamily: "'Space Grotesk', sans-serif",
                      textAlign: "right",
                    }}
                  />
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>months</span>
                </div>
              </div>
            )}

            {duration && (
              <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "14px", fontWeight: 600 }}>
                This horizon will generate about {suggestedStockCount} stock picks.
              </p>
            )}

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
                      border: "1px solid var(--accent-glow)",
                      background: "var(--accent-dim)",
                      color: "var(--accent)",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--hover-overlay)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "var(--accent-dim)"; e.currentTarget.style.borderColor = "var(--accent-glow)"; }}
                  >
                    ₹{val.toLocaleString("en-IN")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: "var(--red-dim)", border: "1px solid var(--red-dim)", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", color: "var(--red)", fontSize: "0.875rem", fontWeight: 600, animation: "fadeIn 0.3s ease" }}>
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
              background: loading ? "var(--accent-dim)" : "linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%)",
              color: "var(--bg-primary)",
              fontWeight: 800,
              fontSize: "1rem",
              fontFamily: "inherit",
              letterSpacing: "0.01em",
              transition: "all 0.25s",
              boxShadow: loading ? "none" : "0 8px 32px var(--accent-glow)",
              marginBottom: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              opacity: loading ? 0.7 : 1,
              animation: "fadeInUp 0.5s 0.35s ease both",
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px var(--accent-glow)"; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 32px var(--accent-glow)"; }}
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
              <p style={{ color: "var(--text-secondary)", fontWeight: 500, marginBottom: "4px" }}>
                Checking RSI, sentiment, and momentum for your picks…
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                This takes about 5 – 10 seconds.
              </p>
            </div>
          )}

          {/* Results */}
          {results && results.length > 0 && (
            <div>
              <PortfolioSummary
                stocks={results}
                budget={parsedBudget}
                investmentType={investmentType}
                investmentMonths={parsedMonths}
              />

              <div style={{ marginBottom: "20px" }}>
                <p className="section-label">AI Recommendations</p>
                <h2 style={{
                  fontSize: "1.4rem",
                  fontWeight: 800,
                  fontFamily: "'Space Grotesk', sans-serif",
                  background: "linear-gradient(90deg, var(--accent), var(--purple))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  Your Personalised Picks
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
                {results.map((stock, i) => (
                  <RecoCard key={i} stock={stock} rank={i + 1} totalBudget={totalInvestment} />
                ))}
              </div>

              {/* Disclaimer */}
              <div style={{ background: "var(--red-dim)", border: "1px solid var(--red-dim)", borderRadius: "14px", padding: "16px 20px", fontSize: "0.8rem", color: "var(--red)" }}>
                ⚠️ <strong>Disclaimer:</strong> These picks are AI-generated for educational purposes only and are <strong>not financial advice</strong>. Always consult a SEBI-registered investment advisor before investing.
              </div>
            </div>
          )}

          {results && results.length === 0 && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "18px", padding: "48px 24px", textAlign: "center" }}>
              <p style={{ fontSize: "3rem", marginBottom: "12px" }}>🔍</p>
              <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
                No suitable stocks found for your criteria. Try adjusting your preferences.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
