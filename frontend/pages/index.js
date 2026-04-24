import { useEffect, useState, useRef } from "react";
import StockCard from "../components/StockCard";
import Navbar from "../components/Navbar";
import Head from "next/head";

// ── Market hours helper (NSE: Mon–Fri 9:15–15:30 IST) ────────────────────
function isMarketOpen() {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 3600000);
  const day = ist.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  const mins = ist.getHours() * 60 + ist.getMinutes();
  return mins >= 555 && mins < 930; // 9:15=555, 15:30=930
}

// ── Market status indicator ───────────────────────────────────────────────
function MarketStatusBadge({ connected }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(isMarketOpen());
    const id = setInterval(() => setOpen(isMarketOpen()), 30000); // check every 30s
    return () => clearInterval(id);
  }, []);

  const live = connected && open;
  const label = !connected ? "Connecting…" : open ? "Live" : "Market Closed";
  const color = !connected ? "var(--gold)" : open ? "var(--green)" : "var(--text-muted)";
  const bg = !connected
    ? "rgba(255,193,7,0.1)"
    : open
    ? "var(--green-dim)"
    : "var(--bg-card)";
  const borderColor = !connected
    ? "rgba(255,193,7,0.25)"
    : open
    ? "rgba(0,230,118,0.25)"
    : "var(--border-subtle)";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "5px 12px",
        borderRadius: "20px",
        background: bg,
        border: `1px solid ${borderColor}`,
        fontSize: "0.72rem",
        fontWeight: 700,
        color: color,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: color,
          animation: live ? "pulseGlowGreen 2s ease-in-out infinite" : "none",
          boxShadow: live ? "0 0 8px var(--green)" : "none",
        }}
      />
      {label}
    </div>
  );
}

// ── Ticker tape ───────────────────────────────────────────────────────────
function TickerTape({ stocks }) {
  const items = Object.entries(stocks).slice(0, 20);
  if (items.length === 0) return null;
  const doubled = [...items, ...items];

  return (
    <div
      className="ticker-wrap"
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        borderTop: "1px solid var(--border-subtle)",
        background: "var(--breadth-bg)",
        backdropFilter: "blur(12px)",
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
                color: "var(--text-secondary)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                flexShrink: 0,
              }}
            >
              <span style={{ color: "var(--accent)", fontWeight: 700 }}>{sym}</span>
              <span>₹{(d?.price || 0).toFixed(2)}</span>
              <span style={{ color: pos ? "var(--green)" : "var(--red)", fontWeight: 700 }}>
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
        background: "var(--bg-card)",
        backdropFilter: "blur(24px) saturate(200%)",
        WebkitBackdropFilter: "blur(24px) saturate(200%)",
        border: `1px solid ${flash === "up" ? "rgba(0,230,118,0.3)" : flash === "down" ? "rgba(255,23,68,0.3)" : "var(--border-subtle)"}`,
        borderRadius: "clamp(14px, 2vw, 20px)",
        padding: "clamp(16px, 3vw, 24px) clamp(18px, 3vw, 28px)",
        flex: "1 1 200px",
        minWidth: "min(220px, 100%)",
        position: "relative",
        overflow: "hidden",
        boxShadow: flash === "up"
          ? "0 0 24px rgba(0,230,118,0.15), var(--shadow-card)"
          : flash === "down"
          ? "0 0 24px rgba(255,23,68,0.15), var(--shadow-card)"
          : "var(--shadow-card)",
        animation: flash === "up"
          ? "flashPriceUp 0.8s ease forwards"
          : flash === "down"
          ? "flashPriceDown 0.8s ease forwards"
          : "none",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      {/* Glass shimmer */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />
      {/* Decorative accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: isUp
            ? "linear-gradient(90deg, var(--green), transparent)"
            : "linear-gradient(90deg, var(--red), transparent)",
          borderRadius: "20px 20px 0 0",
        }}
      />

      <div style={{ marginBottom: "8px" }}>
        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {symbol === "NIFTY50" ? "NIFTY 50" : symbol === "SENSEX" ? "BSE SENSEX" : symbol}
        </span>
      </div>

      <p
        style={{
          fontSize: "clamp(1.4rem, 3vw, 2rem)",
          fontWeight: 800,
          color: flash === "up" ? "var(--green)" : flash === "down" ? "var(--red)" : "var(--text-primary)",
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
            color: isUp ? "var(--green)" : "var(--red)",
          }}
        >
          {isUp ? "▲ +" : "▼ "}{(data.change || 0).toFixed(2)}
        </span>
        <span
          style={{
            padding: "2px 8px",
            borderRadius: "20px",
            background: isUp ? "var(--green-dim)" : "var(--red-dim)",
            color: isUp ? "var(--green)" : "var(--red)",
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
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
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
              <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
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
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 400 }}>
                Real-time prices · Updated every ~15 seconds
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              {isLoaded && (
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--green)", fontFamily: "'Space Grotesk', sans-serif" }}>{gainersCount}</p>
                    <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Gainers</p>
                  </div>
                  <div style={{ width: "1px", background: "var(--border-subtle)" }} />
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--red)", fontFamily: "'Space Grotesk', sans-serif" }}>{losersCount}</p>
                    <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Losers</p>
                  </div>
                  <div style={{ width: "1px", background: "var(--border-subtle)" }} />
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--accent)", fontFamily: "'Space Grotesk', sans-serif" }}>{totalStocks}</p>
                    <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Stocks</p>
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

          {/* ── Market breadth bar ─────────────────────────────────── */}
          {isLoaded && (
            <div
              style={{
                background: "var(--bg-card)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "16px",
                padding: "16px 20px",
                marginBottom: "32px",
                boxShadow: gainersCount > losersCount
                  ? "0 0 32px rgba(0,230,118,0.06), var(--shadow-card)"
                  : "var(--shadow-card)",
                animation: "fadeInUp 0.5s 0.15s ease both",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Market Breadth
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
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
                    boxShadow: gainersCount > losersCount ? "0 0 12px rgba(0,230,118,0.4)" : "none",
                  }}
                />
                <div
                  style={{
                    flex: losersCount,
                    background: "linear-gradient(90deg, #ff5252, #ff1744)",
                    borderRadius: "0 8px 8px 0",
                    transition: "flex 0.5s ease",
                    boxShadow: losersCount > gainersCount ? "0 0 12px rgba(255,23,68,0.4)" : "none",
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Filter tabs ──────────────────────────────────────── */}
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
                  padding: "6px 14px",
                  borderRadius: "9px",
                  border: "1px solid var(--border-medium)",
                  background: viewAll ? "var(--accent-dim)" : "transparent",
                  color: viewAll ? "var(--accent)" : "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  transition: "all 0.2s"
                }}
              >
                {viewAll ? "Show Top 10" : "View All"}
              </button>
              <div style={{ display: "flex", gap: "4px", background: "var(--filter-tab-bg)", border: "1px solid var(--filter-tab-border)", borderRadius: "12px", padding: "4px" }}>
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
                        ? "linear-gradient(135deg, rgba(0,230,118,0.2), rgba(0,230,118,0.08))"
                        : cat === "Losers"
                        ? "linear-gradient(135deg, rgba(255,23,68,0.2), rgba(255,23,68,0.08))"
                        : "linear-gradient(135deg, var(--accent-dim), rgba(0,145,234,0.05))"
                      : "transparent",
                    color: filterCategory === cat
                      ? cat === "Gainers" ? "var(--green)" : cat === "Losers" ? "var(--red)" : "var(--accent)"
                      : "var(--filter-tab-inactive)",
                    boxShadow: filterCategory === cat ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
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
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "20px",
                padding: "64px 24px",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "3rem", marginBottom: "16px" }}>📉</p>
              <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
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
                    style={{ animation: `dealIn 0.5s ${idx * 0.04}s cubic-bezier(0.22, 1, 0.36, 1) both` }}
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

          {/* ── Footer note ─────────────────────────────────── */}
          <div style={{ marginTop: "48px", textAlign: "center" }}>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500 }}>
              Data is for informational purposes only. Not financial advice. Prices may be delayed.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
