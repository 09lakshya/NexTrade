import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Navbar from "../components/Navbar";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const SETTINGS_KEY = "ntrade_settings_v1";
const AVATAR_KEY = "ntrade_profile_photo";

const defaultSettings = {
  trading: {
    chartType: "candlestick",
    timeframe: "1D",
    riskPreference: "balanced",
    currency: "INR",
  },
  notifications: {
    tradeAlerts: true,
    courseUpdates: true,
    emailNotifications: true,
    pushNotifications: false,
  },
  security: {
    twoFactorEnabled: false,
    loginAlerts: true,
  },
  appearance: {
    density: "comfortable",
  },
  privacy: {
    profileVisible: true,
    dataUsage: true,
  },
};

function ToggleRow({ label, description, checked, onChange, disabled }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 0",
        borderBottom: "1px solid var(--border-subtle)",
        gap: "16px",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.95rem" }}>{label}</p>
        {description && (
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "4px", lineHeight: "1.4" }}>{description}</p>
        )}
      </div>
      <button
        disabled={disabled}
        onClick={onChange}
        style={{
          width: "48px",
          height: "26px",
          borderRadius: "26px",
          border: checked ? "1px solid var(--accent)" : "1px solid var(--border-medium)",
          background: checked ? "var(--accent)" : "var(--bg-card)",
          cursor: disabled ? "not-allowed" : "pointer",
          position: "relative",
          transition: "all 0.3s ease",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: checked ? "var(--bg-primary)" : "var(--text-muted)",
            position: "absolute",
            top: "2px",
            left: checked ? "24px" : "2px",
            transition: "all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)",
            boxShadow: checked ? "none" : "0 2px 4px rgba(0,0,0,0.2)",
          }}
        />
      </button>
    </div>
  );
}

function Section({ title, children, subtitle }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "20px",
        padding: "28px",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ color: "var(--text-primary)", fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</h2>
        {subtitle && <p style={{ color: "var(--text-muted)", marginTop: "6px", fontSize: "0.85rem" }}>{subtitle}</p>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, refreshUser, logout } = useAuth();
  const { theme, setThemeMode } = useTheme();

  const [settings, setSettings] = useState(defaultSettings);
  const [avatar, setAvatar] = useState("");
  const [profileName, setProfileName] = useState(user?.name || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    setProfileName(user?.name || "");
  }, [user?.name]);

  useEffect(() => {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setSettings({
          ...defaultSettings,
          ...parsed,
          trading: { ...defaultSettings.trading, ...(parsed.trading || {}) },
          notifications: { ...defaultSettings.notifications, ...(parsed.notifications || {}) },
          security: { ...defaultSettings.security, ...(parsed.security || {}) },
          appearance: { ...defaultSettings.appearance, ...(parsed.appearance || {}) },
          privacy: { ...defaultSettings.privacy, ...(parsed.privacy || {}) },
        });
      } catch {
        setSettings(defaultSettings);
      }
    }

    const savedAvatar = localStorage.getItem(AVATAR_KEY);
    if (savedAvatar) setAvatar(savedAvatar);
  }, []);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    document.documentElement.setAttribute("data-density", settings.appearance.density);
  }, [settings]);

  const memberSince = useMemo(() => {
    if (!user?.created_at) return "Recently";
    const d = new Date(user.created_at);
    if (Number.isNaN(d.getTime())) return user.created_at;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }, [user?.created_at]);

  const updateNested = (section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result || "");
      setAvatar(data);
      localStorage.setItem(AVATAR_KEY, data);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setProfileMessage("");
    if (!profileName.trim()) {
      setProfileMessage("Name is required.");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await API.patch("/auth/profile", { name: profileName.trim() });
      setUser(res.data);
      setProfileMessage("Profile updated.");
      await refreshUser();
    } catch (err) {
      setProfileMessage(err?.response?.data?.detail || "Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage("");
    if (!passwordForm.current_password || !passwordForm.new_password) {
      setPasswordMessage("Please fill in all password fields.");
      return;
    }
    if (passwordForm.new_password.length < 6) {
      setPasswordMessage("New password must be at least 6 characters.");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm) {
      setPasswordMessage("New password and confirmation do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      await API.post("/auth/change-password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ current_password: "", new_password: "", confirm: "" });
      setPasswordMessage("Password changed successfully.");
    } catch (err) {
      setPasswordMessage(err?.response?.data?.detail || "Unable to change password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogoutAll = () => {
    logout();
    router.replace("/login");
  };

  return (
    <>
      <Head>
        <title>Settings - NexTrade</title>
        <meta name="description" content="Manage your NexTrade account, security, preferences, and privacy." />
      </Head>

      <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
        <Navbar />
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 16px 80px" }}>
          <div style={{ marginBottom: "32px", textAlign: "center" }}>
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "clamp(2rem, 5vw, 3rem)",
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Settings
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "1rem", marginTop: "8px" }}>Manage your account, appearance, and preferences.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Theme & Appearance */}
            <Section title="Appearance" subtitle="Customize the interface to your liking.">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                <div>
                  <p style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.95rem" }}>Theme Mode</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "4px" }}>Switch between light and dark themes.</p>
                </div>
                <div style={{ display: "flex", gap: "8px", background: "var(--input-bg)", padding: "4px", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
                  {["dark", "light"].map((mode) => {
                    const active = theme === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => setThemeMode(mode)}
                        style={{
                          padding: "8px 20px",
                          borderRadius: "8px",
                          border: "none",
                          background: active ? "var(--accent)" : "transparent",
                          color: active ? "var(--bg-primary)" : "var(--text-secondary)",
                          cursor: "pointer",
                          fontWeight: 600,
                          textTransform: "capitalize",
                          transition: "all 0.2s",
                          boxShadow: active ? "0 2px 8px var(--accent-glow)" : "none",
                        }}
                      >
                        {mode}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0" }}>
                <div>
                  <p style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.95rem" }}>Display Density</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "4px" }}>Adjust the spacing and size of elements.</p>
                </div>
                <div style={{ display: "flex", gap: "8px", background: "var(--input-bg)", padding: "4px", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
                  {["compact", "comfortable"].map((density) => {
                    const active = settings.appearance.density === density;
                    return (
                      <button
                        key={density}
                        onClick={() => updateNested("appearance", "density", density)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border: "none",
                          background: active ? "var(--bg-card)" : "transparent",
                          color: active ? "var(--text-primary)" : "var(--text-secondary)",
                          cursor: "pointer",
                          fontWeight: 600,
                          textTransform: "capitalize",
                          transition: "all 0.2s",
                          boxShadow: active ? "var(--shadow-card)" : "none",
                          border: active ? "1px solid var(--border-subtle)" : "1px solid transparent",
                        }}
                      >
                        {density}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Section>

            {/* Account Profile */}
            <Section title="Account Profile" subtitle="Update your personal information.">
              <div style={{ display: "flex", gap: "20px", alignItems: "center", marginBottom: "20px" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "16px",
                    background: avatar ? `url(${avatar}) center / cover no-repeat` : "linear-gradient(135deg, var(--accent), var(--purple))",
                    border: "1px solid var(--border-medium)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--bg-primary)",
                    fontWeight: 800,
                    fontSize: "1.2rem",
                  }}
                >
                  {!avatar ? (user?.name?.charAt(0)?.toUpperCase() || "U") : ""}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Profile Photo
                  </label>
                  <div style={{ marginTop: "8px" }}>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }} />
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Full Name</label>
                  <input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    style={{
                      marginTop: "8px",
                      width: "100%",
                      background: "var(--input-bg)",
                      border: "1px solid var(--input-border)",
                      borderRadius: "12px",
                      padding: "12px 16px",
                      color: "var(--text-primary)",
                      fontFamily: "inherit",
                      fontSize: "0.95rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Address</label>
                  <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <input
                      value={user?.email || ""}
                      disabled
                      style={{
                        flex: 1,
                        background: "var(--input-bg)",
                        border: "1px solid var(--input-border)",
                        borderRadius: "12px",
                        padding: "12px 16px",
                        color: "var(--text-muted)",
                        fontFamily: "inherit",
                        fontSize: "0.95rem",
                      }}
                    />
                    <span style={{ padding: "6px 12px", borderRadius: "20px", background: "var(--green-dim)", color: "var(--green)", fontSize: "0.75rem", fontWeight: 700 }}>
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Member since: <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{memberSince}</span></p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {!!profileMessage && <p style={{ color: "var(--accent)", fontSize: "0.85rem", fontWeight: 600 }}>{profileMessage}</p>}
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    style={{
                      padding: "10px 24px",
                      borderRadius: "12px",
                      border: "none",
                      background: "linear-gradient(135deg, var(--accent), var(--purple))",
                      color: "var(--bg-primary)",
                      fontWeight: 700,
                      cursor: savingProfile ? "not-allowed" : "pointer",
                      opacity: savingProfile ? 0.7 : 1,
                      boxShadow: "0 4px 12px var(--accent-glow)",
                      transition: "opacity 0.2s",
                    }}
                  >
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </div>
            </Section>

            {/* Trading Preferences */}
            <Section title="Trading Setup" subtitle="Configure your default trading environment.">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "8px" }}>Chart Type</label>
                  <select value={settings.trading.chartType} onChange={(e) => updateNested("trading", "chartType", e.target.value)} style={{ width: "100%", background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--input-border)", borderRadius: "12px", padding: "12px 16px", fontFamily: "inherit" }}>
                    <option value="candlestick">Candlestick</option>
                    <option value="line">Line Graph</option>
                  </select>
                </div>

                <div>
                  <label style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "8px" }}>Timeframe</label>
                  <select value={settings.trading.timeframe} onChange={(e) => updateNested("trading", "timeframe", e.target.value)} style={{ width: "100%", background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--input-border)", borderRadius: "12px", padding: "12px 16px", fontFamily: "inherit" }}>
                    <option>1D</option>
                    <option>1W</option>
                    <option>1M</option>
                    <option>3M</option>
                    <option>1Y</option>
                  </select>
                </div>

                <div>
                  <label style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "8px" }}>Risk Model</label>
                  <select value={settings.trading.riskPreference} onChange={(e) => updateNested("trading", "riskPreference", e.target.value)} style={{ width: "100%", background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--input-border)", borderRadius: "12px", padding: "12px 16px", fontFamily: "inherit" }}>
                    <option value="conservative">Conservative</option>
                    <option value="balanced">Balanced</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </div>

                <div>
                  <label style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "8px" }}>Currency</label>
                  <select value={settings.trading.currency} onChange={(e) => updateNested("trading", "currency", e.target.value)} style={{ width: "100%", background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--input-border)", borderRadius: "12px", padding: "12px 16px", fontFamily: "inherit" }}>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>
            </Section>

            {/* Notifications */}
            <Section title="Notifications" subtitle="Control how we communicate with you.">
              <ToggleRow label="Trade Alerts" description="Get instant alerts for significant market movements." checked={settings.notifications.tradeAlerts} onChange={() => updateNested("notifications", "tradeAlerts", !settings.notifications.tradeAlerts)} />
              <ToggleRow label="Course Updates" description="Be notified when new educational content is added." checked={settings.notifications.courseUpdates} onChange={() => updateNested("notifications", "courseUpdates", !settings.notifications.courseUpdates)} />
              <ToggleRow label="Email Newsletters" description="Receive our weekly market summary via email." checked={settings.notifications.emailNotifications} onChange={() => updateNested("notifications", "emailNotifications", !settings.notifications.emailNotifications)} />
              <ToggleRow
                label="Push Notifications"
                description="Mobile app push support will be available soon."
                checked={settings.notifications.pushNotifications}
                disabled
                onChange={() => {}}
              />
            </Section>

            {/* Privacy & Security */}
            <Section title="Privacy & Security" subtitle="Protect your account and control your data.">
              <ToggleRow
                label="Two-Factor Authentication (2FA)"
                description="Require an additional verification step when logging in."
                checked={settings.security.twoFactorEnabled}
                onChange={() => updateNested("security", "twoFactorEnabled", !settings.security.twoFactorEnabled)}
              />
              <ToggleRow
                label="Login Alerts"
                description="Get notified immediately if a new device accesses your account."
                checked={settings.security.loginAlerts}
                onChange={() => updateNested("security", "loginAlerts", !settings.security.loginAlerts)}
              />
              <ToggleRow
                label="Public Profile"
                description="Allow your identity to be visible on the leaderboard."
                checked={settings.privacy.profileVisible}
                onChange={() => updateNested("privacy", "profileVisible", !settings.privacy.profileVisible)}
              />
              <ToggleRow
                label="Data Analytics"
                description="Share anonymous usage data to help us improve the platform."
                checked={settings.privacy.dataUsage}
                onChange={() => updateNested("privacy", "dataUsage", !settings.privacy.dataUsage)}
              />

              <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--border-subtle)" }}>
                <h3 style={{ color: "var(--text-primary)", fontSize: "1rem", fontWeight: 700, marginBottom: "16px" }}>Change Password</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, current_password: e.target.value }))}
                      style={{ marginTop: "8px", width: "100%", background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: "12px", padding: "12px 16px", color: "var(--text-primary)", fontFamily: "inherit" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>New Password</label>
                    <input
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, new_password: e.target.value }))}
                      style={{ marginTop: "8px", width: "100%", background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: "12px", padding: "12px 16px", color: "var(--text-primary)", fontFamily: "inherit" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Confirm Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                      style={{ marginTop: "8px", width: "100%", background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: "12px", padding: "12px 16px", color: "var(--text-primary)", fontFamily: "inherit" }}
                    />
                  </div>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  {!!passwordMessage && <p style={{ color: "var(--accent)", fontSize: "0.85rem", fontWeight: 600 }}>{passwordMessage}</p>}
                  <button
                    onClick={handleChangePassword}
                    disabled={passwordSaving}
                    style={{
                      padding: "10px 24px",
                      borderRadius: "12px",
                      border: "none",
                      background: "var(--accent-dim)",
                      color: "var(--accent)",
                      fontWeight: 700,
                      cursor: passwordSaving ? "not-allowed" : "pointer",
                      marginLeft: "auto",
                    }}
                  >
                    {passwordSaving ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>

              <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={handleLogoutAll}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "12px",
                    border: "1px solid var(--red-dim)",
                    background: "var(--red-dim)",
                    color: "var(--red)",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Log Out All Sessions
                </button>
              </div>
            </Section>

          </div>
        </div>
      </div>
    </>
  );
}
