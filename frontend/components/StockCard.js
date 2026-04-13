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
  const color = positive ? "#00e676" : "#ff1744";
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
  const isPositive = change >= 0;
  const [sparkData] = useState(() => genSparkline(price, change));
  const [hovered, setHovered] = useState(false);
  const prevPriceRef = useRef(price);
  const [flash, setFlash] = useState(null); // "up" | "down" | null

  useEffect(() => {
    if (prevPriceRef.current !== price) {
      setFlash(price > prevPriceRef.current ? "up" : "down");
      prevPriceRef.current = price;
      const t = setTimeout(() => setFlash(null), 700);
      return () => clearTimeout(t);
    }
  }, [price]);

  const flashBg =
    flash === "up"
      ? "rgba(0, 230, 118, 0.08)"
      : flash === "down"
      ? "rgba(255, 23, 68, 0.08)"
      : "transparent";

  const pct = typeof percent === "number" ? percent : 0;
  const chg = typeof change === "number" ? change : 0;
  const prc = typeof price === "number" ? price : 0;

  return (
    <div
      onClick={() => router.push(`/stock/${symbol}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: flash === "up"
          ? "rgba(0, 100, 60, 0.6)"
          : flash === "down"
          ? "rgba(120, 20, 35, 0.6)"
          : hovered
          ? "rgba(13,18,36,0.95)"
          : "rgba(13,18,36,0.7)",
        border: `1px solid ${hovered ? "rgba(0,229,255,0.25)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: "clamp(12px, 2vw, 16px)",
        padding: small ? "clamp(12px, 2vw, 16px)" : "clamp(14px, 2.5vw, 20px)",
        cursor: "pointer",
        transition: "all 0.25s ease",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered ? "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,229,255,0.1)" : "0 4px 24px rgba(0,0,0,0.3)",
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
            background: "radial-gradient(ellipse at top left, rgba(0,229,255,0.04) 0%, transparent 60%)",
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
                background: "linear-gradient(90deg, #00e5ff, #40c4ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: "2px",
                letterSpacing: "-0.01em",
              }}
            >
              {symbol}
            </p>
            <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
              NSE
            </p>
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              padding: "3px 8px",
              borderRadius: "20px",
              fontSize: "0.65rem",
              fontWeight: 700,
              background: isPositive ? "rgba(0,230,118,0.12)" : "rgba(255,23,68,0.12)",
              color: isPositive ? "#00e676" : "#ff1744",
              border: `1px solid ${isPositive ? "rgba(0,230,118,0.2)" : "rgba(255,23,68,0.2)"}`,
              letterSpacing: "0.03em",
            }}
          >
            {isPositive ? "▲" : "▼"}
          </span>
        </div>

        {/* Price */}
        <p
          style={{
            fontSize: small ? "clamp(1rem, 2vw, 1.25rem)" : "clamp(1.1rem, 2.5vw, 1.5rem)",
            fontWeight: 800,
            color: flash === "up" ? "#00e676" : flash === "down" ? "#ff1744" : "#f1f5f9",
            transition: "color 0.3s",
            letterSpacing: "-0.02em",
            marginBottom: "8px",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          ₹{prc.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>

        {/* Change row + Sparkline */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <p
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: isPositive ? "#00e676" : "#ff1744",
                marginBottom: "2px",
              }}
            >
              {isPositive ? "+" : ""}{chg.toFixed(2)}
            </p>
            <p
              style={{
                fontSize: "0.75rem",
                color: isPositive ? "rgba(0,230,118,0.7)" : "rgba(255,23,68,0.7)",
                fontWeight: 500,
              }}
            >
              {isPositive ? "+" : ""}{pct.toFixed(2)}%
            </p>
          </div>

          <Sparkline data={sparkData} positive={isPositive} width={60} height={24} />
        </div>
      </div>
    </div>
  );
}
