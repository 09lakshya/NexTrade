import { useState } from "react";
import Navbar from "../components/Navbar";
import Head from "next/head";

const INFLATION_RATE = 6;

// ── Donut chart (SVG) ─────────────────────────────────────────────────────
function DonutChart({ invested, profit, size = 140 }) {
  const r = 50;
  const cx = 70, cy = 70;
  const total = invested + profit;
  const circumference = 2 * Math.PI * r;
  const investedArc = (invested / total) * circumference;
  const profitArc   = circumference - investedArc;

  return (
    <svg width={size} height={size} viewBox="0 0 140 140">
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="14" />
      {/* Invested */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="var(--accent-glow)"
        strokeWidth="14"
        strokeDasharray={`${investedArc} ${circumference}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* Profit */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="var(--green)"
        strokeWidth="14"
        strokeDasharray={`${profitArc} ${circumference}`}
        strokeDashoffset={-investedArc}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* Center text */}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--text-primary)" fontSize="12" fontWeight="800" fontFamily="Space Grotesk, sans-serif">
        {((profit / total) * 100).toFixed(0)}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontWeight="600">
        RETURN
      </text>
    </svg>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, color = "var(--text-primary)", icon, sub }) {
  return (
    <div
      style={{
        background: "var(--bg-primary)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "clamp(10px, 1.5vw, 14px)",
        padding: "clamp(14px, 2vw, 18px) clamp(16px, 2.5vw, 20px)",
        transition: "all 0.2s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent-glow)"; e.currentTarget.style.background = "var(--accent-dim)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.background = "var(--bg-primary)"; }}
    >
      {icon && <p style={{ fontSize: "1.2rem", marginBottom: "8px" }}>{icon}</p>}
      <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>{label}</p>
      <p style={{ fontSize: "clamp(1rem, 2vw, 1.4rem)", fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>{value}</p>
      {sub && <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>{sub}</p>}
    </div>
  );
}

export default function Calculator() {
  const [calcPrincipal, setCalcPrincipal] = useState("");
  const [calcRate, setCalcRate] = useState("12");
  const [calcYears, setCalcYears] = useState("3");
  const [calcResult, setCalcResult] = useState(null);
  const [calcType, setCalcType] = useState("lumpsum");
  const [loading, setLoading] = useState(false);

  const calculateReturns = (type, values) => {
    const P = parseFloat(values.principal);
    const r_annual = parseFloat(values.rate) / 100;
    const years = parseInt(values.years);
    const n_months = years * 12;

    let futureValue, totalInvested, cagr;

    if (type === "lumpsum") {
      futureValue = P * Math.pow(1 + r_annual, years);
      totalInvested = P;
    } else {
      const r_monthly = r_annual / 12;
      if (r_monthly === 0) {
        futureValue = P * n_months;
      } else {
        futureValue = P * (((Math.pow(1 + r_monthly, n_months) - 1) / r_monthly) * (1 + r_monthly));
      }
      totalInvested = P * n_months;
    }

    const profit = futureValue - totalInvested;
    const returnPercentage = (profit / totalInvested) * 100;
    cagr = (Math.pow(futureValue / totalInvested, 1 / years) - 1) * 100;

    const inflationFactor = Math.pow(1 + INFLATION_RATE / 100, years);
    const realValue = futureValue / inflationFactor;
    const realProfit = realValue - totalInvested;
    const realReturnPercentage = (realProfit / totalInvested) * 100;
    const realCagr = (Math.pow(realValue / totalInvested, 1 / years) - 1) * 100;

    setCalcResult({
      future_value: Math.round(futureValue),
      profit: Math.round(profit),
      return_percentage: returnPercentage.toFixed(2),
      cagr: cagr.toFixed(2),
      real_return_percentage: realReturnPercentage.toFixed(2),
      real_cagr: realCagr.toFixed(2),
      total_invested: Math.round(totalInvested),
      inflation_adjusted_value: Math.round(realValue),
      monthly_investment: type === "sip" ? P : undefined,
      is_sip: type === "sip",
    });
  };

  const handleCalculateClick = () => {
    if (!calcPrincipal || parseFloat(calcPrincipal) <= 0) {
      alert("Please enter a valid investment amount");
      return;
    }
    setLoading(true);
    setCalcResult(null);
    setTimeout(() => {
      calculateReturns(calcType, { principal: calcPrincipal, rate: calcRate, years: calcYears });
      setLoading(false);
    }, 400);
  };

  const principalLabel = calcType === "lumpsum" ? "Investment Amount (₹)" : "Monthly Investment (₹)";
  const principalPlaceholder = calcType === "lumpsum" ? "500000" : "10000";
  const principalHelper = calcType === "lumpsum" ? "How much will you invest at once?" : "How much will you invest every month?";

  const inputStyle = {
    width: "100%",
    background: "var(--input-bg)",
    border: "1.5px solid var(--border-subtle)",
    borderRadius: "12px",
    padding: "14px 16px",
    color: "var(--text-primary)",
    fontSize: "1rem",
    fontFamily: "inherit",
    fontWeight: 600,
    outline: "none",
    transition: "all 0.2s",
  };

  return (
    <>
      <Head>
        <title>Calculator — NexTrade</title>
        <meta name="description" content="Calculate investment returns with compound interest, SIP, and inflation adjustments." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: "100vh" }}>
        <Navbar />

        <div style={{ maxWidth: "860px", margin: "0 auto", padding: "clamp(20px, 4vw, 40px) clamp(12px, 3vw, 24px) clamp(40px, 8vw, 80px)" }}>

          {/* Header */}
          <div style={{ marginBottom: "36px", animation: "fadeInUp 0.5s ease forwards" }}>
            <p className="section-label">Financial Tools</p>
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
              Investment Calculator
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Calculate returns with compound interest and real inflation adjustments.
            </p>
          </div>

          {/* Type toggle */}
          <div style={{ background: "var(--input-bg)", border: "1px solid var(--border-subtle)", borderRadius: "14px", padding: "4px", marginBottom: "24px", display: "flex", gap: "4px", animation: "fadeInUp 0.5s 0.1s ease both" }}>
            {[
              { id: "lumpsum", label: "💰 Lump Sum", sub: "One-time investment" },
              { id: "sip",     label: "📅 Monthly SIP", sub: "Regular investment" },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { setCalcType(id); setCalcResult(null); }}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: "11px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  transition: "all 0.2s",
                  background: calcType === id ? "var(--accent-dim)" : "transparent",
                  color: calcType === id ? "var(--accent)" : "var(--text-secondary)",
                  boxShadow: calcType === id ? "0 2px 12px var(--shadow-card)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Input card */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "clamp(14px, 2vw, 20px)", padding: "clamp(18px, 3vw, 28px)", marginBottom: "24px", backdropFilter: "blur(16px)", animation: "fadeInUp 0.5s 0.15s ease both" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))", gap: "clamp(14px, 2.5vw, 20px)", marginBottom: "24px" }}>
              {/* Principal */}
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                  {principalLabel}
                </label>
                <input
                  type="number"
                  value={calcPrincipal}
                  onChange={e => setCalcPrincipal(e.target.value)}
                  placeholder={principalPlaceholder}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.background = "var(--bg-primary)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--border-subtle)"; e.target.style.background = "var(--input-bg)"; }}
                />
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "6px" }}>{principalHelper}</p>
              </div>

              {/* Rate */}
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                  Expected Annual Return (%)
                </label>
                <input
                  type="number"
                  value={calcRate}
                  onChange={e => setCalcRate(e.target.value)}
                  placeholder="12"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.background = "var(--bg-primary)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--border-subtle)"; e.target.style.background = "var(--input-bg)"; }}
                />
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "6px" }}>Blue chips: 10% · Mid-caps: 14% · Small-caps: 20%</p>
              </div>

              {/* Years */}
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                  Time Period (Years)
                </label>
                <input
                  type="number"
                  value={calcYears}
                  onChange={e => setCalcYears(e.target.value)}
                  placeholder="3"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.background = "var(--bg-primary)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--border-subtle)"; e.target.style.background = "var(--input-bg)"; }}
                />
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "6px" }}>Short: 1yr · Medium: 3yrs · Long: 5+ yrs</p>
              </div>
            </div>

            <button
              onClick={handleCalculateClick}
              disabled={loading}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: "14px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                background: "linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%)",
                color: "var(--bg-primary)",
                fontWeight: 800,
                fontSize: "1rem",
                fontFamily: "inherit",
                boxShadow: "0 8px 28px var(--accent-glow)",
                transition: "all 0.25s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 36px var(--accent-glow)"; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 28px var(--accent-glow)"; }}
            >
              {loading ? (
                <><div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} /> Computing…</>
              ) : "Calculate Returns →"}
            </button>
          </div>

          {/* Results */}
          {calcResult && (
            <div style={{ animation: "fadeInUp 0.5s ease forwards" }}>
              {/* Hero result */}
              <div style={{ background: "var(--green-dim)", border: "1px solid var(--green-dim)", borderRadius: "clamp(14px, 2vw, 20px)", padding: "clamp(20px, 3vw, 32px)", marginBottom: "16px", display: "flex", gap: "clamp(16px, 3vw, 32px)", flexWrap: "wrap", alignItems: "center" }}>
                <DonutChart
                  invested={calcResult.total_invested || (calcResult.future_value - calcResult.profit)}
                  profit={calcResult.profit}
                />
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--green)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>
                    💹 Nominal Returns
                  </p>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.4rem, 3vw, 2.2rem)", fontWeight: 900, color: "var(--green)", letterSpacing: "-0.03em", marginBottom: "4px" }}>
                    ₹{calcResult.future_value.toLocaleString("en-IN")}
                  </p>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    Returns: <span style={{ color: "var(--green)", fontWeight: 700 }}>+₹{calcResult.profit.toLocaleString("en-IN")}</span>
                    {" "}({calcResult.return_percentage}%)
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "8px" }}>
                    CAGR: <strong style={{ color: "var(--accent)" }}>{calcResult.cagr}%</strong>
                  </p>
                </div>
              </div>

              {/* Nominal stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(130px, 100%), 1fr))", gap: "clamp(8px, 1.5vw, 12px)", marginBottom: "16px" }}>
                <StatCard
                  label={calcType === "lumpsum" ? "Amount Invested" : "Total Invested"}
                  value={`₹${(calcResult.total_invested || calcResult.future_value - calcResult.profit).toLocaleString("en-IN")}`}
                />
                <StatCard label="Returns Earned" value={`₹${calcResult.profit.toLocaleString("en-IN")}`} color="var(--green)" />
                <StatCard label="Total Value" value={`₹${calcResult.future_value.toLocaleString("en-IN")}`} color="var(--green)" />
                <StatCard label="Absolute Return" value={`${calcResult.return_percentage}%`} color="var(--green)" />
                <StatCard label="CAGR" value={`${calcResult.cagr}%`} color="var(--accent)" />
              </div>

              {/* Real returns */}
              <div style={{ background: "var(--purple-dim)", border: "1px solid var(--purple-dim)", borderRadius: "clamp(14px, 2vw, 20px)", padding: "clamp(16px, 3vw, 24px)", marginBottom: "16px" }}>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--purple)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "16px" }}>
                  🎯 Real Returns — Inflation-Adjusted @ {INFLATION_RATE}% Per Year
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(120px, 100%), 1fr))", gap: "clamp(8px, 1.5vw, 12px)" }}>
                  <StatCard
                    label={calcType === "lumpsum" ? "Amount Invested" : "Total Invested"}
                    value={`₹${(calcResult.total_invested || calcResult.future_value - calcResult.profit).toLocaleString("en-IN")}`}
                  />
                  <StatCard
                    label="Real Returns"
                    value={`₹${Math.round((calcResult.inflation_adjusted_value || calcResult.future_value * 0.85) - (calcResult.total_invested || calcResult.future_value - calcResult.profit)).toLocaleString("en-IN")}`}
                    color={parseFloat(calcResult.real_return_percentage) > 0 ? "var(--purple)" : "var(--red)"}
                  />
                  <StatCard
                    label="Real Value"
                    value={`₹${(calcResult.inflation_adjusted_value || calcResult.future_value * 0.85).toLocaleString("en-IN")}`}
                    color="var(--purple)"
                  />
                  <StatCard
                    label="Real Return %"
                    value={`${calcResult.real_return_percentage}%`}
                    color={parseFloat(calcResult.real_return_percentage) > 0 ? "var(--purple)" : "var(--red)"}
                  />
                  <StatCard
                    label="Real CAGR"
                    value={`${calcResult.real_cagr}%`}
                    color={parseFloat(calcResult.real_cagr) > 0 ? "var(--purple)" : "var(--red)"}
                  />
                </div>
              </div>

              {/* CAGR explanation */}
              <div style={{ background: "var(--gold-dim)", border: "1px solid var(--gold-dim)", borderRadius: "14px", padding: "16px 20px", marginBottom: "16px" }}>
                <p style={{ fontSize: "0.85rem", color: "var(--gold)", lineHeight: 1.7 }}>
                  <strong>What is CAGR?</strong> Compound Annual Growth Rate shows average annual return if your investment grows at a steady rate each year. Real CAGR accounts for inflation erosion.
                </p>
              </div>

              {/* Tips */}
              <div style={{ background: "var(--accent-dim)", border: "1px solid var(--border-subtle)", borderRadius: "14px", padding: "20px" }}>
                <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>💬 Quick Tips</p>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    ["Lump Sum", "Best if you have large capital to deploy immediately."],
                    ["SIP",      "Ideal for building wealth gradually, reducing market timing risk."],
                    ["Inflation","10% returns after 6% inflation leaves only ~4% real gain."],
                    ["Time",    "Even small amounts compound heavily over 10+ years."],
                  ].map(([bold, text]) => (
                    <li key={bold} style={{ fontSize: "0.82rem", color: "var(--text-muted)", display: "flex", gap: "8px" }}>
                      <span style={{ color: "var(--accent)", flexShrink: 0 }}>✓</span>
                      <span><strong style={{ color: "var(--text-primary)" }}>{bold}:</strong> {text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
