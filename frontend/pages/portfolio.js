import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";
import Head from "next/head";

// ── Mini donut for allocation ─────────────────────────────────────────────
function AllocationDonut({ holdings, size = 100 }) {
  if (!holdings || holdings.length === 0) return null;
  const total = holdings.reduce((s, h) => s + h.invested, 0);
  if (total === 0) return null;

  const colors = ["#00e5ff", "#00e676", "#e040fb", "#ffd740", "#ff9100", "#2979ff", "#ff1744", "#69f0ae"];
  let cumulative = 0;
  const r = 38, cx = 50, cy = 50, circumference = 2 * Math.PI * r;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
      {holdings.map((h, i) => {
        const frac = h.invested / total;
        const arc = frac * circumference;
        const offset = -cumulative * circumference;
        cumulative += frac;
        return (
          <circle
            key={h.id || i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={colors[i % colors.length]}
            strokeWidth="12"
            strokeDasharray={`${arc} ${circumference}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
      })}
      <text x={cx} y={cy + 5} textAnchor="middle" fill="#f1f5f9" fontSize="10" fontWeight="800" fontFamily="Space Grotesk, sans-serif">
        {holdings.length}
      </text>
    </svg>
  );
}

// ── Summary metric card ───────────────────────────────────────────────────
function MetricCard({ label, value, color = "#f1f5f9", icon, delta }) {
  return (
    <div
      style={{
        background: "rgba(13,18,36,0.7)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "clamp(14px, 2vw, 18px)",
        padding: "clamp(14px, 2.5vw, 20px) clamp(16px, 2.5vw, 22px)",
        backdropFilter: "blur(12px)",
        transition: "all 0.25s",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={e => { e.currentTarget.style.border = "1px solid rgba(0,229,255,0.2)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${color}, transparent)`, opacity: 0.6 }} />
      {icon && <p style={{ fontSize: "1.1rem", marginBottom: "8px" }}>{icon}</p>}
      <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>{label}</p>
      <p style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)", fontWeight: 900, color, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>{value}</p>
      {delta && <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginTop: "4px" }}>{delta}</p>}
    </div>
  );
}

// ── Holding row ───────────────────────────────────────────────────────────
function HoldingRow({ h, onRemove }) {
  const profit = h.pnl >= 0;
  const hasPrice = h.current_price > 0;
  const fmt = n => n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  const pnlColor = profit ? "#00e676" : "#ff1744";
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    await onRemove(h.id);
    setRemoving(false);
  };

  const pnlPct = hasPrice ? h.pnl_percent : null;

  return (
    <tr
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        transition: "background 0.2s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,229,255,0.025)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
    >
      {/* Stock */}
      <td style={{ padding: "16px 18px" }}>
        <p style={{ fontWeight: 800, color: "#00e5ff", fontSize: "0.9rem", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "2px" }}>{h.symbol}</p>
        <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}>{h.added_on}</p>
      </td>
      {/* Qty */}
      <td style={{ padding: "16px 18px", textAlign: "right", fontWeight: 600, color: "rgba(255,255,255,0.7)", fontSize: "0.875rem" }}>{h.quantity}</td>
      {/* Buy ₹ */}
      <td style={{ padding: "16px 18px", textAlign: "right", fontWeight: 600, color: "rgba(255,255,255,0.7)", fontSize: "0.875rem" }}>₹{h.buy_price}</td>
      {/* Current ₹ */}
      <td style={{ padding: "16px 18px", textAlign: "right", fontWeight: 700, color: "#f1f5f9", fontSize: "0.875rem" }}>
        {hasPrice ? `₹${h.current_price}` : <span style={{ color: "rgba(255,255,255,0.25)" }}>N/A</span>}
      </td>
      {/* Invested */}
      <td style={{ padding: "16px 18px", textAlign: "right", fontWeight: 600, color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>₹{fmt(h.invested)}</td>
      {/* Value */}
      <td style={{ padding: "16px 18px", textAlign: "right", fontWeight: 700, color: "#f1f5f9", fontSize: "0.875rem" }}>
        {hasPrice ? `₹${fmt(h.current_value)}` : <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}
      </td>
      {/* P&L */}
      <td style={{ padding: "16px 18px", textAlign: "right", fontWeight: 800, color: hasPrice ? pnlColor : "rgba(255,255,255,0.2)", fontSize: "0.875rem" }}>
        {hasPrice ? `${profit ? "+" : "−"}₹${fmt(Math.abs(h.pnl))}` : "—"}
      </td>
      {/* P&L % */}
      <td style={{ padding: "16px 18px", textAlign: "right", fontSize: "0.875rem" }}>
        {hasPrice ? (
          <span style={{
            padding: "3px 8px",
            borderRadius: "20px",
            background: profit ? "rgba(0,230,118,0.12)" : "rgba(255,23,68,0.12)",
            color: pnlColor,
            fontWeight: 800,
            fontSize: "0.78rem",
          }}>
            {profit ? "+" : ""}{pnlPct.toFixed(2)}%
          </span>
        ) : <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}
      </td>
      {/* Remove */}
      <td style={{ padding: "16px 18px", textAlign: "center" }}>
        <button
          onClick={handleRemove}
          disabled={removing}
          style={{
            background: "rgba(255,23,68,0.08)",
            border: "1px solid rgba(255,23,68,0.2)",
            borderRadius: "8px",
            padding: "5px 10px",
            cursor: "pointer",
            color: "#ff1744",
            fontSize: "0.8rem",
            transition: "all 0.2s",
            opacity: removing ? 0.5 : 1,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,23,68,0.18)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,23,68,0.08)"; }}
        >
          {removing ? "…" : "✕"}
        </button>
      </td>
    </tr>
  );
}

// ── Main Portfolio Page ───────────────────────────────────────────────────
export default function Portfolio() {
  const [userId, setUserId]       = useState(null);
  const [holdings, setHoldings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);

  const [searchQ, setSearchQ]         = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selSymbol, setSelSymbol]     = useState("");
  const [quantity, setQuantity]       = useState("");
  const [buyPrice, setBuyPrice]       = useState("");
  const [adding, setAdding]           = useState(false);
  const [formErr, setFormErr]         = useState("");

  useEffect(() => {
    let id = localStorage.getItem("ntrade_uid");
    if (!id) {
      id = "u_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
      localStorage.setItem("ntrade_uid", id);
    }
    setUserId(id);
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchPortfolio();
  }, [userId]);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/portfolio/${userId}`);
      setHoldings(Array.isArray(res.data) ? res.data : []);
    } catch {
      setHoldings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (q) => {
    setSearchQ(q);
    setSelSymbol("");
    if (!q) { setSearchResults([]); return; }
    try {
      const res = await API.get(`/search?q=${q}`);
      setSearchResults((res.data || []).slice(0, 6));
    } catch {
      setSearchResults([]);
    }
  };

  const selectStock = (sym) => {
    setSelSymbol(sym);
    setSearchQ(sym);
    setSearchResults([]);
  };

  const addHolding = async () => {
    if (!selSymbol || !quantity || !buyPrice) { setFormErr("Please fill in all three fields."); return; }
    if (parseFloat(quantity) <= 0 || parseFloat(buyPrice) <= 0) { setFormErr("Quantity and price must be greater than zero."); return; }
    setFormErr(""); setAdding(true);
    try {
      await API.post("/portfolio/add", {
        user_id: userId,
        symbol: selSymbol,
        company_name: selSymbol,
        quantity: parseFloat(quantity),
        buy_price: parseFloat(buyPrice),
      });
      setShowForm(false);
      setSearchQ(""); setSelSymbol(""); setQuantity(""); setBuyPrice("");
      await fetchPortfolio();
    } catch {
      setFormErr("Could not add holding. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const removeHolding = async (id) => {
    try {
      await API.delete(`/portfolio/${id}?user_id=${userId}`);
      await fetchPortfolio();
    } catch {
      alert("Failed to remove. Please try again.");
    }
  };

  // Summary
  const totalInvested = holdings.reduce((s, h) => s + h.invested, 0);
  const totalCurrent  = holdings.reduce((s, h) => s + (h.current_price > 0 ? h.current_value : h.invested), 0);
  const totalPnL      = totalCurrent - totalInvested;
  const totalPnLPct   = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const fmt           = n => n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  const isProfitable  = totalPnL >= 0;

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "12px 14px",
    color: "#f1f5f9",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    outline: "none",
    transition: "all 0.2s",
  };

  return (
    <>
      <Head>
        <title>Portfolio — NexTrade</title>
        <meta name="description" content="Track and manage your stock portfolio with real-time P&L calculations." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: "100vh" }}>
        <Navbar />

        <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "clamp(20px, 4vw, 40px) clamp(12px, 3vw, 24px) clamp(40px, 8vw, 80px)" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "clamp(12px, 2vw, 16px)", marginBottom: "clamp(24px, 4vw, 36px)", animation: "fadeInUp 0.5s ease forwards" }}>
            <div>
              <p className="section-label">Investments</p>
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
                  marginBottom: "6px",
                }}
              >
                My Portfolio
              </h1>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
                {holdings.length} holding{holdings.length !== 1 ? "s" : ""} tracked
              </p>
            </div>

            <div className="mb-6 p-3 glass border border-yellow-500 border-opacity-20 rounded-xl flex items-center gap-3">
              <span className="text-yellow-400 text-sm">⚠️</span>
              <p className="text-xs text-gray-400">
                Your portfolio is saved locally to this browser. 
                Clearing browser data will remove your holdings. 
                <span className="text-accent">Export feature coming soon.</span>
              </p>
            </div>

            <button
              onClick={() => { setShowForm(!showForm); setFormErr(""); }}
              style={{
                padding: "12px 24px",
                borderRadius: "12px",
                border: showForm ? "1px solid rgba(255,23,68,0.3)" : "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 700,
                fontSize: "0.9rem",
                background: showForm ? "rgba(255,23,68,0.08)" : "linear-gradient(135deg, #00e5ff 0%, #0091ea 100%)",
                color: showForm ? "#ff1744" : "#080c1a",
                boxShadow: showForm ? "none" : "0 6px 24px rgba(0,229,255,0.3)",
                transition: "all 0.25s",
              }}
            >
              {showForm ? "✕ Cancel" : "+ Add Stock"}
            </button>
          </div>

          {/* Add Stock Form */}
          {showForm && (
            <div
              style={{
                background: "rgba(13,18,36,0.8)",
                border: "1px solid rgba(0,229,255,0.15)",
                borderRadius: "20px",
                padding: "28px",
                marginBottom: "28px",
                backdropFilter: "blur(20px)",
                animation: "fadeInUp 0.3s ease forwards",
              }}
            >
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#f1f5f9", marginBottom: "20px" }}>
                Add a Stock to Your Portfolio
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "flex-end" }}>
                {/* Symbol */}
                <div style={{ position: "relative", flex: "2 1 180px" }}>
                  <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                    Stock Symbol
                  </label>
                  <input
                    type="text"
                    value={searchQ}
                    onChange={e => handleSearch(e.target.value)}
                    placeholder="e.g. RELIANCE"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = "rgba(0,229,255,0.5)"; }}
                    onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
                  />
                  {searchResults.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "rgba(8,12,26,0.98)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", zIndex: 50, marginTop: "6px", overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }}>
                      {searchResults.map(sym => (
                        <div
                          key={sym}
                          onClick={() => selectStock(sym)}
                          style={{ padding: "11px 14px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.875rem", transition: "background 0.15s", color: "#00e5ff", fontWeight: 600 }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(0,229,255,0.06)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          {sym}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Qty */}
                <div style={{ flex: "1 1 100px" }}>
                  <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                    Quantity
                  </label>
                  <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g. 10" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = "rgba(0,229,255,0.5)"; }}
                    onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
                  />
                </div>

                {/* Buy price */}
                <div style={{ flex: "1 1 120px" }}>
                  <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                    Buy Price (₹)
                  </label>
                  <input type="number" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} placeholder="e.g. 2500" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = "rgba(0,229,255,0.5)"; }}
                    onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
                  />
                </div>

                <button
                  onClick={addHolding}
                  disabled={adding}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "12px",
                    border: "none",
                    cursor: adding ? "not-allowed" : "pointer",
                    background: "linear-gradient(135deg, #00e5ff, #0091ea)",
                    color: "#080c1a",
                    fontWeight: 800,
                    fontFamily: "inherit",
                    fontSize: "0.9rem",
                    opacity: adding ? 0.7 : 1,
                    boxShadow: "0 4px 16px rgba(0,229,255,0.25)",
                    flex: "0 0 auto",
                    alignSelf: "flex-end",
                    minWidth: "110px",
                    transition: "all 0.2s",
                  }}
                >
                  {adding ? "Adding…" : "Add Stock"}
                </button>
              </div>

              {formErr && (
                <p style={{ color: "#ff1744", fontSize: "0.8rem", fontWeight: 600, marginTop: "12px" }}>⚠️ {formErr}</p>
              )}
            </div>
          )}

          {/* Summary cards */}
          {holdings.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))", gap: "clamp(10px, 1.5vw, 14px)", marginBottom: "clamp(20px, 3vw, 28px)", animation: "fadeInUp 0.5s 0.1s ease both" }}>
              <MetricCard label="Total Invested"  value={`₹${fmt(totalInvested)}`}  icon="💼" />
              <MetricCard label="Current Value"   value={`₹${fmt(totalCurrent)}`}   icon="📊" color="#00e5ff" />
              <MetricCard
                label="Total P&L"
                value={`${totalPnL >= 0 ? "+" : "−"}₹${fmt(Math.abs(totalPnL))}`}
                color={isProfitable ? "#00e676" : "#ff1744"}
                icon={isProfitable ? "📈" : "📉"}
              />
              <MetricCard
                label="Overall Return"
                value={`${totalPnLPct >= 0 ? "+" : ""}${totalPnLPct.toFixed(2)}%`}
                color={isProfitable ? "#00e676" : "#ff1744"}
                icon="🎯"
              />
            </div>
          )}

          {/* Allocation insight */}
          {holdings.length > 1 && (
            <div style={{ background: "rgba(13,18,36,0.6)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px", padding: "20px 24px", marginBottom: "24px", display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap", animation: "fadeInUp 0.5s 0.15s ease both" }}>
              <AllocationDonut holdings={holdings} size={80} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Allocation</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {holdings.slice(0, 6).map((h, i) => {
                    const colors = ["#00e5ff", "#00e676", "#e040fb", "#ffd740", "#ff9100", "#2979ff"];
                    const pct = ((h.invested / totalInvested) * 100).toFixed(1);
                    return (
                      <span key={h.id} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "20px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: colors[i % colors.length], flexShrink: 0 }} />
                        {h.symbol} · {pct}%
                      </span>
                    );
                  })}
                  {holdings.length > 6 && <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", padding: "4px 10px" }}>+{holdings.length - 6} more</span>}
                </div>
              </div>
            </div>
          )}

          {/* Holdings table / empty state */}
          {loading ? (
            <div style={{ background: "rgba(13,18,36,0.7)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "64px 24px", textAlign: "center" }}>
              <div className="spinner" style={{ margin: "0 auto 16px" }} />
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading your portfolio…</p>
            </div>
          ) : holdings.length === 0 ? (
            <div style={{ background: "rgba(13,18,36,0.7)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "80px 24px", textAlign: "center", animation: "fadeInUp 0.5s ease forwards" }}>
              <p style={{ fontSize: "3.5rem", marginBottom: "16px" }}>📂</p>
              <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "8px" }}>Portfolio is empty</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem", marginBottom: "24px" }}>
                Click <strong style={{ color: "#00e5ff" }}>+ Add Stock</strong> to start tracking your investments.
              </p>
              <button
                onClick={() => setShowForm(true)}
                style={{ padding: "12px 28px", borderRadius: "12px", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: "0.9rem", background: "linear-gradient(135deg, #00e5ff, #0091ea)", color: "#080c1a", boxShadow: "0 6px 24px rgba(0,229,255,0.3)" }}
              >
                + Add Your First Stock
              </button>
            </div>
          ) : (
            <div style={{ background: "rgba(13,18,36,0.7)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", overflow: "hidden", backdropFilter: "blur(12px)", animation: "fadeInUp 0.5s 0.2s ease both" }}>
              <div style={{ overflowX: "auto" }}>
                <table className="table-premium" style={{ minWidth: "600px" }}>
                  <thead style={{ background: "rgba(0,0,0,0.2)" }}>
                    <tr>
                      {["Stock", "Qty", "Buy ₹", "Current ₹", "Invested", "Value", "P&L", "P&L %", ""].map(h => (
                        <th key={h} style={{ padding: "14px 18px", textAlign: h === "Stock" || h === "" ? "left" : "right", fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map(h => (
                      <HoldingRow key={h.id} h={h} onRemove={removeHolding} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table footer */}
              <div style={{ padding: "clamp(10px, 2vw, 14px) clamp(12px, 2vw, 18px)", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "flex-end", gap: "clamp(12px, 2vw, 24px)", background: "rgba(0,0,0,0.1)", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
                  Total Invested: <strong style={{ color: "#f1f5f9" }}>₹{fmt(totalInvested)}</strong>
                </span>
                <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
                  Current Value: <strong style={{ color: "#00e5ff" }}>₹{fmt(totalCurrent)}</strong>
                </span>
                <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
                  Net P&L: <strong style={{ color: isProfitable ? "#00e676" : "#ff1744" }}>{isProfitable ? "+" : "−"}₹{fmt(Math.abs(totalPnL))}</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
