import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import API from "../services/api";

const NAV_LINKS = [
  { href: "/",           label: "Dashboard", icon: "⬡" },
  { href: "/advisor",    label: "AI Advisor", icon: "◈" },
  { href: "/calculator", label: "Calculator", icon: "◎" },
  { href: "/portfolio",  label: "Portfolio",  icon: "◉" },
];

export default function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setResults([]);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = async (val) => {
    setQuery(val);
    if (!val.trim()) { setResults([]); return; }
    try {
      const res = await API.get(`/search?q=${val}`);
      setResults((res.data || []).slice(0, 8));
    } catch {
      setResults([]);
    }
  };

  const goToStock = (sym) => {
    setQuery(""); setResults([]); setMobileOpen(false);
    router.push(`/stock/${sym}`);
  };

  return (
    <>
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: scrolled
            ? "rgba(8, 12, 26, 0.95)"
            : "rgba(8, 12, 26, 0.8)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          transition: "background 0.3s ease",
          boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.4)" : "none",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0 clamp(12px, 3vw, 24px)",
            height: "clamp(52px, 8vw, 64px)",
            display: "flex",
            alignItems: "center",
            gap: "clamp(12px, 3vw, 32px)",
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none", flex: "0 0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #00e5ff 0%, #0091ea 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "16px",
                  color: "#080c1a",
                  boxShadow: "0 4px 16px rgba(0,229,255,0.4)",
                  flexShrink: 0,
                }}
              >
                N
              </div>
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(0.95rem, 1.5vw, 1.2rem)",
                  background: "linear-gradient(90deg, #00e5ff 0%, #40c4ff 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "-0.02em",
                }}
              >
                NexTrade
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              flex: "0 0 auto",
            }}
            className="hidden md:flex"
          >
            {NAV_LINKS.map(({ href, label }) => {
              const active = router.pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    textDecoration: "none",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: active ? "#00e5ff" : "rgba(255,255,255,0.55)",
                    background: active ? "rgba(0,229,255,0.08)" : "transparent",
                    border: active ? "1px solid rgba(0,229,255,0.2)" : "1px solid transparent",
                    transition: "all 0.2s ease",
                    letterSpacing: "0.01em",
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.color = "rgba(255,255,255,0.9)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Search Bar */}
          <div ref={searchRef} style={{ position: "relative", width: "clamp(160px, 20vw, 240px)", flexShrink: 1, minWidth: "120px" }} className="hidden sm:block">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                padding: "8px 14px",
                transition: "all 0.2s",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                value={query}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search stocks…"
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#e2e8f0",
                  fontSize: "0.875rem",
                  fontFamily: "inherit",
                  width: "100%",
                }}
                onFocus={e => {
                  e.currentTarget.parentElement.style.borderColor = "rgba(0,229,255,0.5)";
                  e.currentTarget.parentElement.style.background = "rgba(0,229,255,0.05)";
                }}
                onBlur={e => {
                  e.currentTarget.parentElement.style.borderColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.parentElement.style.background = "rgba(255,255,255,0.05)";
                }}
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); setResults([]); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: "14px", padding: 0 }}
                >✕</button>
              )}
            </div>

            {/* Dropdown */}
            {results.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  background: "rgba(8,12,26,0.98)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "14px",
                  overflow: "hidden",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                  zIndex: 200,
                }}
              >
                {results.map((sym) => (
                  <div
                    key={sym}
                    onClick={() => goToStock(sym)}
                    style={{
                      padding: "11px 16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      transition: "background 0.15s",
                      fontSize: "0.875rem",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(0,229,255,0.06)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: "rgba(0,229,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "9px",
                        fontWeight: 700,
                        color: "#00e5ff",
                        flexShrink: 0,
                      }}
                    >
                      {sym.slice(0, 2)}
                    </div>
                    <span style={{ fontWeight: 600, color: "#00e5ff" }}>{sym}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              padding: "8px 12px",
              cursor: "pointer",
              color: "rgba(255,255,255,0.7)",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            className="md:hidden"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            top: "64px",
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(8,12,26,0.98)",
            backdropFilter: "blur(20px)",
            zIndex: 99,
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
          className="md:hidden"
        >
          {NAV_LINKS.map(({ href, label, icon }) => {
            const active = router.pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                style={{
                  textDecoration: "none",
                  padding: "16px 20px",
                  borderRadius: "14px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: active ? "#00e5ff" : "rgba(255,255,255,0.7)",
                  background: active ? "rgba(0,229,255,0.1)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${active ? "rgba(0,229,255,0.25)" : "rgba(255,255,255,0.07)"}`,
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>{icon}</span>
                {label}
                {active && <span style={{ marginLeft: "auto", fontSize: "0.75rem", opacity: 0.7 }}>●</span>}
              </Link>
            );
          })}

          {/* Mobile Search */}
          <div style={{ marginTop: "16px", position: "relative" }} ref={searchRef}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "14px 16px" }}>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>🔍</span>
              <input
                type="text"
                value={query}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search stocks…"
                style={{ background: "transparent", border: "none", outline: "none", color: "#e2e8f0", fontSize: "1rem", fontFamily: "inherit", width: "100%" }}
              />
            </div>
            {results.length > 0 && (
              <div style={{ marginTop: "8px", background: "rgba(8,12,26,0.98)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", overflow: "hidden" }}>
                {results.map(sym => (
                  <div key={sym} onClick={() => goToStock(sym)} style={{ padding: "14px 16px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "#00e5ff", fontWeight: 600 }}>
                    {sym}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
