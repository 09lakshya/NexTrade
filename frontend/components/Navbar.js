import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const NAV_LINKS = [
  { href: "/", label: "Dashboard", icon: "D" },
  { href: "/advisor", label: "AI Advisor", icon: "A" },
  { href: "/calculator", label: "Calculator", icon: "C" },
  { href: "/portfolio", label: "Portfolio", icon: "P" },
  { href: "/settings", label: "Settings", icon: "S" },
];

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setResults([]);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
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
          background: scrolled ? "var(--nav-bg-scrolled)" : "var(--nav-bg)",
          backdropFilter: "blur(24px) saturate(200%)",
          WebkitBackdropFilter: "blur(24px) saturate(200%)",
          borderBottom: "1px solid var(--border-subtle)",
          transition: "background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
          boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.15), 0 1px 0 var(--border-subtle)" : "none",
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
              <img
                src="/logo-512.png"
                alt="NexTrade"
                width={36}
                height={36}
                style={{
                  width: "36px",
                  height: "36px",
                  flexShrink: 0,
                  filter: "drop-shadow(0 2px 8px rgba(0,229,255,0.3))",
                  objectFit: "contain",
                  borderRadius: "6px",
                  aspectRatio: "1 / 1",
                }}
              />
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
                    color: active ? "var(--accent)" : "var(--text-muted)",
                    background: active ? "var(--accent-dim)" : "transparent",
                    border: active ? "1px solid var(--accent-glow)" : "1px solid transparent",
                    transition: "all 0.2s ease",
                    letterSpacing: "0.01em",
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.color = "var(--text-primary)";
                      e.currentTarget.style.background = "var(--hover-overlay)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.color = "var(--text-muted)";
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
                background: "var(--search-bg)",
                border: "1px solid var(--search-border)",
                borderRadius: "12px",
                padding: "8px 14px",
                transition: "all 0.2s",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5">
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
                  color: "var(--text-primary)",
                  fontSize: "0.875rem",
                  fontFamily: "inherit",
                  width: "100%",
                }}
                onFocus={e => {
                  e.currentTarget.parentElement.style.borderColor = "var(--accent)";
                  e.currentTarget.parentElement.style.background = "var(--accent-dim)";
                }}
                onBlur={e => {
                  e.currentTarget.parentElement.style.borderColor = "var(--search-border)";
                  e.currentTarget.parentElement.style.background = "var(--search-bg)";
                }}
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); setResults([]); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "14px", padding: 0 }}
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
                  background: "var(--dropdown-bg)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "14px",
                  overflow: "hidden",
                  boxShadow: "var(--shadow-dropdown)",
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
                      borderBottom: "1px solid var(--border-subtle)",
                      transition: "background 0.15s",
                      fontSize: "0.875rem",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--hover-overlay)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: "var(--accent-dim)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "9px",
                        fontWeight: 700,
                        color: "var(--accent)",
                        flexShrink: 0,
                      }}
                    >
                      {sym.slice(0, 2)}
                    </div>
                    <span style={{ fontWeight: 600, color: "var(--accent)" }}>{sym}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Menu / Login */}
          {user ? (
            <div ref={userMenuRef} style={{ position: "relative", flexShrink: 0 }}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "var(--search-bg)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "12px",
                  padding: "6px 14px 6px 6px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent-glow)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-medium)"; }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #00e5ff 0%, #0091ea 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    color: "#080c1a",
                    fontFamily: "'Space Grotesk', sans-serif",
                    flexShrink: 0,
                  }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    maxWidth: "100px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  className="hidden sm:inline"
                >
                  {user.name || "User"}
                </span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: "240px",
                    background: "var(--dropdown-bg)",
                    border: "1px solid var(--border-medium)",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "var(--shadow-dropdown)",
                    zIndex: 200,
                    animation: "fadeInUp 0.2s ease forwards",
                  }}
                >
                  {/* User info */}
                  <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border-subtle)" }}>
                    <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem", marginBottom: "3px" }}>
                      {user.name}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {user.email}
                    </p>
                  </div>
                                    {/* Settings */}
                  <button
                    onClick={() => { setUserMenuOpen(false); router.push('/settings'); }}
                    style={{
                      width: "100%",
                      padding: "14px 18px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      transition: "background 0.15s",
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--hover-overlay)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>S</span>
                    Settings
                  </button>
                  {/* Theme toggle */}
                  <button
                    onClick={toggleTheme}
                    style={{
                      width: "100%",
                      padding: "14px 18px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: isDark ? "rgba(255,255,255,0.7)" : "#475569",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      transition: "background 0.15s",
                      borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {isDark ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="5"/>
                        <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                        <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                      </svg>
                    )}
                    {isDark ? "Light Mode" : "Dark Mode"}
                  </button>
                  {/* Logout */}
                  <button
                    onClick={() => { setUserMenuOpen(false); logout(); router.replace("/login"); }}
                    style={{
                      width: "100%",
                      padding: "14px 18px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#ff5252",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,23,68,0.06)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ fontSize: "1rem" }}>⏻</span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Theme toggle for non-logged-in */}
              <button
                onClick={toggleTheme}
                style={{
                  background: "var(--search-bg)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "10px",
                  padding: "8px",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
              </button>
              <Link
                href="/login"
                style={{
                  padding: "8px 20px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #00e5ff 0%, #0091ea 100%)",
                  color: "#080c1a",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  textDecoration: "none",
                  boxShadow: "0 4px 16px rgba(0,229,255,0.25)",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                Sign In
              </Link>
            </>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: "var(--search-bg)",
              border: "1px solid var(--border-medium)",
              borderRadius: "10px",
              padding: "8px 12px",
              cursor: "pointer",
              color: "var(--text-secondary)",
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
            background: "var(--mobile-menu-bg)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            zIndex: 99,
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            animation: "fadeIn 0.2s ease forwards",
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
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  background: active ? "var(--accent-dim)" : "var(--hover-overlay)",
                  border: `1px solid ${active ? "var(--accent-glow)" : "var(--border-subtle)"}`,
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>{icon}</span>
                {label}
                {active && <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--accent)", opacity: 0.7 }}>●</span>}
              </Link>
            );
          })}

          {/* Mobile Search */}
          <div style={{ marginTop: "16px", position: "relative" }} ref={searchRef}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--search-bg)", border: "1px solid var(--search-border)", borderRadius: "14px", padding: "14px 16px" }}>
              <span style={{ color: "var(--text-muted)" }}>🔍</span>
              <input
                type="text"
                value={query}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search stocks…"
                style={{ background: "transparent", border: "none", outline: "none", color: "var(--text-primary)", fontSize: "1rem", fontFamily: "inherit", width: "100%" }}
              />
            </div>
            {results.length > 0 && (
              <div style={{ marginTop: "8px", background: "var(--dropdown-bg)", border: "1px solid var(--border-medium)", borderRadius: "14px", overflow: "hidden", boxShadow: "var(--shadow-dropdown)" }}>
                {results.map(sym => (
                  <div key={sym} onClick={() => goToStock(sym)} style={{ padding: "14px 16px", cursor: "pointer", borderBottom: "1px solid var(--border-subtle)", color: "var(--accent)", fontWeight: 600 }}>
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



