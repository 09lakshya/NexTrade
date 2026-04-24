import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login, signup } = useAuth();

  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already logged in → go home
  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (mode === "signup") {
      // Validate email domain
      const domain = email.split("@")[1]?.toLowerCase();
      const allowedDomains = [
        "gmail.com", "googlemail.com", "yahoo.com", "yahoo.in", "yahoo.co.in",
        "yahoo.co.uk", "outlook.com", "hotmail.com", "live.com", "msn.com",
        "icloud.com", "me.com", "mac.com", "aol.com", "protonmail.com",
        "proton.me", "zoho.com", "zoho.in", "yandex.com", "mail.com",
        "gmx.com", "gmx.net", "tutanota.com", "tuta.io", "fastmail.com",
        "hey.com", "pm.me", "rediffmail.com", "in.com", "sify.com",
        "email.com", "usa.com", "inbox.com", "mail.ru", "rambler.ru",
        "cox.net", "sbcglobal.net", "att.net", "comcast.net", "verizon.net",
        "bellsouth.net", "charter.net", "earthlink.net", "optonline.net",
        "web.de", "t-online.de", "libero.it", "virgilio.it",
        "laposte.net", "orange.fr", "wanadoo.fr", "free.fr",
        "naver.com", "hanmail.net", "daum.net", "qq.com", "163.com",
        "126.com", "sina.com", "yeah.net",
      ];

      if (!domain || !allowedDomains.includes(domain)) {
        setError("Please use a valid email provider (e.g. Gmail, Yahoo, Outlook).");
        return;
      }

      if (password !== confirmPw) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (!name.trim()) {
        setError("Please enter your name.");
        return;
      }
      if (!age || parseInt(age) < 1 || parseInt(age) > 150) {
        setError("Please enter a valid age.");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password, rememberMe);
      } else {
        await signup(email, password, name.trim(), parseInt(age), rememberMe);
      }
      router.replace("/");
    } catch (err) {
      const msg =
        err?.response?.data?.detail || "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary, #060a14)",
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  if (user) return null; // redirect happening

  const inputStyle = {
    width: "100%",
    background: "var(--input-bg)",
    border: "1.5px solid var(--input-border)",
    borderRadius: "12px",
    padding: "14px 16px",
    color: "var(--text-primary)",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    outline: "none",
    transition: "all 0.25s",
  };

  const labelStyle = {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "8px",
  };

  return (
    <>
      <Head>
        <title>{mode === "login" ? "Sign In" : "Create Account"} — NexTrade</title>
        <meta name="description" content="Sign in to NexTrade to access your portfolio, AI advisor, and live market data." />
      </Head>

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary, #060a14)",
          padding: "24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background effects */}
        <div
          style={{
            position: "absolute",
            top: "-30%",
            left: "-10%",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)",
            filter: "blur(80px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "-10%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(224,64,251,0.05) 0%, transparent 70%)",
            filter: "blur(80px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            width: "100%",
            maxWidth: "440px",
            animation: "fadeInUp 0.5s ease forwards",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <img
                src="/logo-512.png"
                alt="NexTrade"
                width={44}
                height={44}
                style={{
                  width: "44px",
                  height: "44px",
                  filter: "drop-shadow(0 4px 16px rgba(0,229,255,0.3))",
                  objectFit: "contain",
                  borderRadius: "8px",
                }}
              />
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 800,
                  fontSize: "1.6rem",
                  background: "linear-gradient(90deg, #00e5ff, #40c4ff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "-0.02em",
                }}
              >
                NexTrade
              </span>
            </div>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.9rem",
                fontWeight: 400,
              }}
            >
              {mode === "login"
                ? "Welcome back. Sign in to continue."
                : "Create your account to get started."}
            </p>
          </div>

          {/* Card */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "24px",
              padding: "36px 32px",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: "var(--shadow-card)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Top accent line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                background: "linear-gradient(90deg, #00e5ff, #e040fb, transparent)",
              }}
            />

            {/* Heading */}
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800,
                fontSize: "1.3rem",
                color: "var(--text-primary)",
                marginBottom: "24px",
                letterSpacing: "-0.01em",
              }}
            >
              {mode === "login" ? "Sign In" : "Create Account"}
            </h2>

            <form onSubmit={handleSubmit}>
              {/* Name & Age — signup only */}
              {mode === "signup" && (
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginBottom: "18px",
                    animation: "fadeInUp 0.3s ease forwards",
                  }}
                >
                  <div style={{ flex: "2 1 0" }}>
                    <label style={labelStyle}>Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      style={inputStyle}
                      onFocus={(e) =>
                        (e.target.style.borderColor = "var(--accent)")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = "var(--input-border)")
                      }
                    />
                  </div>
                  <div style={{ flex: "1 1 0", minWidth: "80px" }}>
                    <label style={labelStyle}>Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="25"
                      min="1"
                      max="150"
                      style={inputStyle}
                      onFocus={(e) =>
                        (e.target.style.borderColor = "var(--accent)")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = "var(--input-border)")
                      }
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div style={{ marginBottom: "18px" }}>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  style={inputStyle}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "var(--accent)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "var(--input-border)")
                  }
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: mode === "signup" ? "18px" : "20px" }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    style={{ ...inputStyle, paddingRight: "46px" }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "var(--accent)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "var(--input-border)")
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    tabIndex={-1}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password — signup only */}
              {mode === "signup" && (
                <div
                  style={{
                    marginBottom: "20px",
                    animation: "fadeInUp 0.3s ease forwards",
                  }}
                >
                  <label style={labelStyle}>Confirm Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirmPw ? "text" : "password"}
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      style={{ ...inputStyle, paddingRight: "46px" }}
                      onFocus={(e) =>
                        (e.target.style.borderColor = "var(--accent)")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = "var(--input-border)")
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      style={{
                        position: "absolute",
                        right: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px",
                        color: "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                      tabIndex={-1}
                      title={showConfirmPw ? "Hide password" : "Show password"}
                    >
                      {showConfirmPw ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Remember me */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "24px",
                }}
              >
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "5px",
                    border: `1.5px solid ${
                      rememberMe
                        ? "var(--accent)"
                        : "var(--border-medium)"
                    }`,
                    background: rememberMe
                      ? "var(--accent-dim)"
                      : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }}
                >
                  {rememberMe && (
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#00e5ff"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span
                  onClick={() => setRememberMe(!rememberMe)}
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  Keep me signed in
                </span>
              </div>

              {/* Error */}
              {error && (
                <div
                  style={{
                    background: "rgba(255,23,68,0.08)",
                    border: "1px solid rgba(255,23,68,0.2)",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>⚠️</span>
                  <span
                    style={{
                      color: "#ff5252",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                    }}
                  >
                    {error}
                  </span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "15px 0",
                  borderRadius: "14px",
                  border: "none",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  fontWeight: 800,
                  fontSize: "1rem",
                  letterSpacing: "0.02em",
                  background: submitting
                    ? "rgba(0,229,255,0.3)"
                    : "linear-gradient(135deg, #00e5ff 0%, #0091ea 100%)",
                  color: "#080c1a",
                  boxShadow: submitting
                    ? "none"
                    : "0 8px 32px rgba(0,229,255,0.3)",
                  transition: "all 0.3s",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {submitting ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    {mode === "login" ? "Signing in…" : "Creating account…"}
                  </span>
                ) : mode === "login" ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            {/* Mode switch prompt */}
            <p
              style={{
                textAlign: "center",
                marginTop: "24px",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
              }}
            >
              {mode === "login"
                ? "Don't have an account? "
                : "Already have an account? "}
              <span
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError("");
                }}
                style={{
                  color: "#00e5ff",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {mode === "login" ? "Sign Up" : "Sign In"}
              </span>
            </p>
          </div>

          {/* Footer */}
          <p
            style={{
              textAlign: "center",
              marginTop: "28px",
              fontSize: "0.72rem",
              color: "var(--text-muted)",
            }}
          >
            By continuing, you agree to NexTrade's Terms of Service.
          </p>
        </div>
      </div>
    </>
  );
}
