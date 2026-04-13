import { useEffect, useState, useRef } from "react";
import StockCard from "../components/StockCard";
import Navbar from "../components/Navbar";
import Head from "next/head";

// ── Market status indicator ───────────────────────────────────────────────
function MarketStatusBadge({ connected }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "5px 12px",
        borderRadius: "20px",
        background: connected ? "rgba(0,230,118,0.1)" : "rgba(255,193,7,0.1)",
        border: `1px solid ${connected ? "rgba(0,230,118,0.25)" : "rgba(255,193,7,0.25)"}`,
        fontSize: "0.72rem",
        fontWeight: 700,
        color: connected ? "#00e676" : "#ffc107",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: connected ? "#00e676" : "#ffc107",
          animation: connected ? "pulseGlow 2s ease-in-out infinite" : "none",
          boxShadow: connected ? "0 0 8px #00e676" : "none",
        }}
      />
      {connected ? "Live" : "Connecting…"}
    </div>
  );
}

// ── Ticker tape ───────────────────────────────────────────────────────────
function TickerTape({ stocks }) {
  const items = Object.entries(stocks).slice(0, 20);
  if (items.length === 0) return null;
  const doubled = [...items, ...items]; // loop

  return (
    <div
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(0,0,0,0.2)",
        overflow: "hidden",
        whiteSpace: "nowrap",
        height: "36px",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          gap: "40px",
          animation: "ticker 35s linear infinite",
        }}
      >
        {doubled.map(([sym, d], i) => {
          const pos = d?.percent >= 0;
          return (
            <span
              key={`${sym}-${i}`}
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.7)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                flexShrink: 0,
              }}
            >
              <span style={{ color: "#00e5ff" }}>{sym}</span>
              <span>₹{(d?.price || 0).toFixed(2)}</span>
              <span style={{ color: pos ? "#00e676" : "#ff1744", fontWeight: 700 }}>
                {pos ? "▲" : "▼"} {Math.abs(d?.percent || 0).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Index summary card ────────────────────────────────────────────────────
function IndexCard({ symbol, data, prevData }) {
  if (!data) return null;
  const prc = data.price || 0;
  const prevPrc = prevData?.price || prc;
  const isUp = data.percent >= 0;
  const flash = prc > prevPrc ? "up" : prc < prevPrc ? "down" : null;

  return (
    <div
      style={{
        background: "rgba(13,18,36,0.7)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "clamp(14px, 2vw, 20px)",
        padding: "clamp(16px, 3vw, 24px) clamp(18px, 3vw, 28px)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        flex: "1 1 200px",
        minWidth: "min(220px, 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: isUp
            ? "linear-gradient(90deg, #00e676, transparent)"
            : "linear-gradient(90deg, #ff1744, transparent)",
          borderRadius: "20px 20px 0 0",
        }}
      />

      <div style={{ marginBottom: "8px" }}>
        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {symbol === "NIFTY50" ? "NIFTY 50" : symbol === "SENSEX" ? "BSE SENSEX" : symbol}
        </span>
      </div>

      <p
        style={{
          fontSize: "clamp(1.4rem, 3vw, 2rem)",
          fontWeight: 800,
          color: flash === "up" ? "#00e676" : flash === "down" ? "#ff1744" : "#f1f5f9",
          transition: "color 0.4s",
          fontFamily: "'Space Grotesk', sans-serif",
          letterSpacing: "-0.03em",
          marginBottom: "8px",
        }}
      >
        {prc.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span
          style={{
            fontSize: "0.85rem",
            fontWeight: 700,
            color: isUp ? "#00e676" : "#ff1744",
          }}
        >
          {isUp ? "▲ +" : "▼ "}{(data.change || 0).toFixed(2)}
        </span>
        <span
          style={{
            padding: "2px 8px",
            borderRadius: "20px",
            background: isUp ? "rgba(0,230,118,0.12)" : "rgba(255,23,68,0.12)",
            color: isUp ? "#00e676" : "#ff1744",
            fontSize: "0.75rem",
            fontWeight: 700,
          }}
        >
          {isUp ? "+" : ""}{(data.percent || 0).toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      style={{
        background: "rgba(13,18,36,0.7)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "16px",
        padding: "20px",
        height: "130px",
      }}
    >
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
        <div className="skeleton" style={{ width: "60%", height: "14px" }} />
        <div className="skeleton" style={{ width: "20%", height: "14px", marginLeft: "auto" }} />
      </div>
      <div className="skeleton" style={{ width: "50%", height: "24px", marginBottom: "12px" }} />
      <div style={{ display: "flex", gap: "8px" }}>
        <div className="skeleton" style={{ width: "40px", height: "12px" }} />
        <div className="skeleton" style={{ width: "40px", height: "12px" }} />
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────
export default function Home() {
  const [stocks, setStocks] = useState({});
  const [prevStocks, setPrevStocks] = useState({});
  const [connected, setConnected] = useState(false);
  const [filterCategory, setFilterCategory] = useState("All");
  const [viewAll, setViewAll] = useState(false);

  const indexSymbols = ["NIFTY50", "SENSEX"];

  useEffect(() => {
    let ws;
    const connect = () => {
      ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/market/ws");
      ws.onopen = () => setConnected(true);
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          setStocks((prev) => { setPrevStocks(prev); return data; });
        } catch {}
      };
      ws.onclose = () => { setConnected(false); setTimeout(connect, 2000); };
      ws.onerror = () => ws.close();
    };
    connect();
    return () => { if (ws) ws.close(); };
  }, []);

  const entries = Object.entries(stocks || {});
  const indexEntries = entries.filter(([s]) => indexSymbols.includes(s));
  const stockEntries = entries
    .filter(([s]) => !indexSymbols.includes(s))
    .sort((a, b) => b[1].percent - a[1].percent);

  const gainers = stockEntries.filter(([, d]) => d.percent >= 0);
  const losers = stockEntries.filter(([, d]) => d.percent < 0).reverse();

  let displayed = [];
  if (filterCategory === "Gainers") {
    displayed = viewAll ? gainers : gainers.slice(0, 10);
  } else if (filterCategory === "Losers") {
    displayed = viewAll ? losers : losers.slice(0, 10);
  } else {
    const topGainers = gainers.slice(0, 10);
    const topLosers = losers.slice(0, 10);
    displayed = viewAll ? [...gainers, ...losers] : [...topGainers, ...topLosers];
  }

  const totalStocks = stockEntries.length;
  const gainersCount = gainers.length;
  const losersCount = losers.length;

  const isLoaded = stockEntries.length > 0;

  return (
    <>
      <Head>
        <title>NexTrade — Live Market Dashboard</title>
        <meta name="description" content="Real-time Indian stock market data, live prices, AI advisor, and portfolio tracker." />
      </Head>

      <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
        <Navbar />

        {/* Ticker tape */}
        {isLoaded && <TickerTape stocks={stocks} />}

        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "clamp(20px, 4vw, 32px) clamp(12px, 3vw, 24px) clamp(40px, 8vw, 64px)" }}>

          {/* ── Header ──────────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: "16px",
              marginBottom: "32px",
              animation: "fadeInUp 0.5s ease forwards",
            }}
          >
            <div>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
                Indian Stock Market
              </p>
              <h1
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  background: "linear-gradient(90deg, #00e5ff 0%, #40c4ff 40%, #e040fb 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  marginBottom: "8px",
                }}
              >
                Live Market
              </h1>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9rem", fontWeight: 400 }}>
                Real-time prices · Updated every second
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              {isLoaded && (
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "1.2rem", fontWeight: 800, color: "#00e676", fontFamily: "'Space Grotesk', sans-serif" }}>{gainersCount}</p>
                    <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Gainers</p>
                  </div>
                  <div style={{ width: "1px", background: "rgba(255,255,255,0.08)" }} />
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ff1744", fontFamily: "'Space Grotesk', sans-serif" }}>{losersCount}</p>
                    <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Losers</p>
                  </div>
                  <div style={{ width: "1px", background: "rgba(255,255,255,0.08)" }} />
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "1.2rem", fontWeight: 800, color: "#00e5ff", fontFamily: "'Space Grotesk', sans-serif" }}>{totalStocks}</p>
                    <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Stocks</p>
                  </div>
                </div>
              )}
              <MarketStatusBadge connected={connected} />
            </div>
          </div>

          {/* ── Index Cards ──────────────────────────────────────────── */}
          {indexEntries.length > 0 && (
            <div style={{ marginBottom: "32px", animation: "fadeInUp 0.5s 0.1s ease both" }}>
              <p className="section-label">Market Indices</p>
              <div style={{ display: "flex", gap: "clamp(10px, 2vw, 16px)", flexWrap: "wrap" }}>
                {indexEntries.map(([sym, data]) => (
                  <IndexCard key={sym} symbol={sym} data={data} prevData={prevStocks[sym]} />
                ))}
              </div>
            </div>
          )}

          {/* ── Market breadth bar ───────────────────────────────────── */}
          {isLoaded && (
            <div
              style={{
                background: "rgba(13,18,36,0.7)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "16px",
                padding: "16px 20px",
                marginBottom: "32px",
                backdropFilter: "blur(12px)",
                animation: "fadeInUp 0.5s 0.15s ease both",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Market Breadth
                </span>
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                  {gainersCount} gainers · {losersCount} losers
                </span>
              </div>
              <div style={{ display: "flex", height: "8px", borderRadius: "8px", overflow: "hidden", gap: "2px" }}>
                <div
                  style={{
                    flex: gainersCount,
                    background: "linear-gradient(90deg, #00e676, #69f0ae)",
                    borderRadius: "8px 0 0 8px",
                    transition: "flex 0.5s ease",
                  }}
                />
                <div
                  style={{
                    flex: losersCount,
                    background: "linear-gradient(90deg, #ff5252, #ff1744)",
                    borderRadius: "0 8px 8px 0",
                    transition: "flex 0.5s ease",
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Filter tabs ──────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "20px",
              animation: "fadeInUp 0.5s 0.2s ease both",
            }}
          >
            <p className="section-label" style={{ margin: 0 }}>
              Trending Stocks
            </p>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                onClick={() => setViewAll(!viewAll)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "9px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: viewAll ? "rgba(255,255,255,0.1)" : "transparent",
                  color: viewAll ? "#fff" : "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  transition: "all 0.2s"
                }}
              >
                {viewAll ? "Show Top 10" : "View All"}
              </button>
              <div style={{ display: "flex", gap: "6px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "4px" }}>
                {["All", "Gainers", "Losers"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "9px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                    background: filterCategory === cat
                      ? cat === "Gainers"
                        ? "rgba(0,230,118,0.15)"
                        : cat === "Losers"
                        ? "rgba(255,23,68,0.15)"
                        : "rgba(0,229,255,0.15)"
                      : "transparent",
                    color: filterCategory === cat
                      ? cat === "Gainers" ? "#00e676" : cat === "Losers" ? "#ff1744" : "#00e5ff"
                      : "rgba(255,255,255,0.45)",
                    boxShadow: filterCategory === cat ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
                  }}
                >
                  {cat}
                </button>
              ))}
              </div>
            </div>
          </div>

          {/* ── Stock Grid ───────────────────────────────────────────── */}
          {!isLoaded ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(220px, 100%), 1fr))",
                gap: "clamp(10px, 2vw, 16px)",
              }}
            >
              {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : displayed.length === 0 ? (
            <div
              style={{
                background: "rgba(13,18,36,0.7)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "20px",
                padding: "64px 24px",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "3rem", marginBottom: "16px" }}>📉</p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1rem" }}>
                No {filterCategory.toLowerCase()} stocks right now.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))",
                gap: "clamp(10px, 1.5vw, 14px)",
                animation: "fadeIn 0.4s ease forwards",
              }}
            >
              {displayed.map(([sym, current], idx) => {
                const prev = prevStocks[sym];
                const curPrc = current?.price || 0;
                const prevPrc = prev?.price || 0;
                let colorClass = "text-white";
                if (prev) {
                  colorClass = curPrc > prevPrc ? "text-green-premium" : curPrc < prevPrc ? "text-red-premium" : colorClass;
                }
                return (
                  <div
                    key={sym}
                    style={{ animation: `fadeInUp 0.4s ${idx * 0.03}s ease both` }}
                  >
                    <StockCard
                      symbol={sym}
                      price={curPrc}
                      change={current?.change}
                      percent={current?.percent}
                      color={colorClass}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Footer note ─────────────────────────────────────────── */}
          <div style={{ marginTop: "48px", textAlign: "center" }}>
            <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.2)", fontWeight: 500 }}>
              Data is for informational purposes only. Not financial advice. Prices may be delayed.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
