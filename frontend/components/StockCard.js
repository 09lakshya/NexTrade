import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";

// Tiny sparkline SVG generator
function Sparkline({ data, positive, width = 80, height = 32 }) {
  if (!data || data.length < 2) {
    return <svg width={width} height={height} />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const pathD = `M ${pts.join(" L ")}`;
  const fillPts = `M 0,${height} L ${pts.join(" L ")} L ${width},${height} Z`;
  const color = positive ? "var(--green)" : "var(--red)";
  const fadeId = `fade-${Math.random().toString(36).substr(2, 6)}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <defs>
        <linearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPts} fill={`url(#${fadeId})`} />
      <path d={pathD} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Generate fake sparkline data based on price + change
function genSparkline(price, change, n = 20) {
  const pts = [];
  let val = price - change * (Math.random() * 3 + 1);
  for (let i = 0; i < n; i++) {
    val += (Math.random() - 0.48) * (Math.abs(change) * 0.3 + 1);
    pts.push(val);
  }
  pts.push(price);
  return pts;
}

export default function StockCard({ symbol, price, change, percent, color, small }) {
  const router = useRouter();
  const prc = typeof price === "number" && Number.isFinite(price) ? price : 0;
  const chg = typeof change === "number" && Number.isFinite(change) ? change : 0;
  const pct = typeof percent === "number" && Number.isFinite(percent) ? percent : 0;
  const hasData = prc > 0;
  const isPositive = hasData ? chg >= 0 : false;
  const [sparkData] = useState(() => (hasData ? genSparkline(prc, chg) : []));
  const [hovered, setHovered] = useState(false);
  const prevPriceRef = useRef(prc);
  const [flash, setFlash] = useState(null); // "up" | "down" | null

  useEffect(() => {
    if (hasData && prevPriceRef.current !== prc) {
      setFlash(prc > prevPriceRef.current ? "up" : "down");
      prevPriceRef.current = prc;
      const t = setTimeout(() => setFlash(null), 700);
      return () => clearTimeout(t);
    }
  }, [prc, hasData]);

  const flashBg =
    flash === "up"
      ? "var(--green-dim)"
      : flash === "down"
      ? "var(--red-dim)"
      : "transparent";

  return (
    <div
      onClick={() => router.push(`/stock/${symbol}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: flash === "up"
          ? "var(--green-dim)"
          : flash === "down"
          ? "var(--red-dim)"
          : hovered
          ? "var(--bg-card)"
          : "var(--bg-card)",
        border: `1px solid ${hovered ? "var(--accent-glow)" : "var(--border-subtle)"}`,
        borderRadius: "clamp(12px, 2vw, 16px)",
        padding: small ? "clamp(12px, 2vw, 16px)" : "clamp(14px, 2.5vw, 20px)",
        cursor: "pointer",
        transition: "all 0.25s ease",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered ? "var(--shadow-card), 0 0 0 1px var(--accent-dim)" : "var(--shadow-card)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow on hover */}
      {hovered && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at top left, var(--accent-dim) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div>
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: small ? "0.9rem" : "1rem",
                color: "var(--accent)",
                marginBottom: "2px",
                letterSpacing: "-0.01em",
              }}
            >
              {symbol}
            </p>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 500 }}>
              NSE
            </p>
          </div>

          {hasData ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                padding: "3px 8px",
                borderRadius: "20px",
                fontSize: "0.65rem",
                fontWeight: 700,
                background: isPositive ? "var(--green-dim)" : "var(--red-dim)",
                color: isPositive ? "var(--green)" : "var(--red)",
                border: `1px solid ${isPositive ? "var(--green-dim)" : "var(--red-dim)"}`,
                letterSpacing: "0.03em",
              }}
            >
              {isPositive ? "?" : "?"}
            </span>
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "3px 8px",
                borderRadius: "20px",
                fontSize: "0.62rem",
                fontWeight: 700,
                background: "var(--red-dim)",
                color: "var(--red)",
                border: "1px solid var(--red-dim)",
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}
            >
              Data Unavailable
            </span>
          )}
        </div>

        {/* Price */}
        {hasData ? (
          <p
            style={{
              fontSize: small ? "clamp(1rem, 2vw, 1.25rem)" : "clamp(1.1rem, 2.5vw, 1.5rem)",
              fontWeight: 800,
              color: flash === "up" ? "var(--green)" : flash === "down" ? "var(--red)" : "var(--text-primary)",
              transition: "color 0.3s",
              letterSpacing: "-0.02em",
              marginBottom: "8px",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {"\u20B9"}{prc.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        ) : (
          <p
            style={{
              fontSize: small ? "0.9rem" : "1rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              letterSpacing: "-0.01em",
              marginBottom: "10px",
            }}
          >
            Data unavailable
          </p>
        )}

        {/* Change row + Sparkline */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            {hasData ? (
              <>
                <p
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: isPositive ? "var(--green)" : "var(--red)",
                    marginBottom: "2px",
                  }}
                >
                  {isPositive ? "+" : ""}{chg.toFixed(2)}
                </p>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: isPositive ? "var(--green)" : "var(--red)",
                    fontWeight: 500,
                    opacity: 0.75,
                  }}
                >
                  {isPositive ? "+" : ""}{pct.toFixed(2)}%
                </p>
              </>
            ) : (
              <>
                <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "2px" }}>
                  --
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500, opacity: 0.75 }}>
                  --
                </p>
              </>
            )}
          </div>

          {hasData ? (
            <Sparkline data={sparkData} positive={isPositive} width={60} height={24} />
          ) : (
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", opacity: 0.85 }}>
              Waiting for feed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
