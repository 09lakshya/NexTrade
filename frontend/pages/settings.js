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
        padding: "14px 0",
        borderBottom: "1px solid var(--border-subtle)",
        gap: "12px",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div>
        <p style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.92rem" }}>{label}</p>
        {description && (
          <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "4px" }}>{description}</p>
        )}
      </div>
      <button
        disabled={disabled}
        onClick={onChange}
        style={{
          width: "50px",
          height: "28px",
          borderRadius: "20px",
          border: "1px solid var(--border-medium)",
          background: checked ? "var(--accent-dim)" : "var(--bg-card)",
          cursor: disabled ? "not-allowed" : "pointer",
          position: "relative",
          transition: "all 0.2s",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: checked ? "var(--accent)" : "var(--text-muted)",
            position: "absolute",
            top: "3px",
            left: checked ? "25px" : "3px",
            transition: "all 0.2s",
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
        borderRadius: "18px",
        padding: "22px",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <h2 style={{ color: "var(--text-primary)", fontSize: "1.05rem", fontWeight: 700 }}>{title}</h2>
      {subtitle && <p style={{ color: "var(--text-muted)", marginTop: "6px", fontSize: "0.82rem" }}>{subtitle}</p>}
      <div style={{ marginTop: "14px" }}>{children}</div>
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
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 16px 60px" }}>
          <div style={{ marginBottom: "22px" }}>
            <p className="section-label">Preferences</p>
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Settings
            </h1>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "14px" }}>
            <Section title="Account" subtitle="Keep your profile details updated.">
              <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
                <div
                  style={{
                    width: "54px",
                    height: "54px",
                    borderRadius: "14px",
                    background: avatar ? `url(${avatar}) center / cover no-repeat` : "linear-gradient(135deg, #00e5ff, #0091ea)",
                    border: "1px solid var(--border-medium)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#08101e",
                    fontWeight: 800,
                    fontSize: "1rem",
                  }}
                >
                  {!avatar ? (user?.name?.charAt(0)?.toUpperCase() || "U") : ""}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                    Profile Photo
                  </label>
                  <div style={{ marginTop: "6px" }}>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} />
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Name</label>
                  <input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    style={{
                      marginTop: "6px",
                      width: "100%",
                      background: "var(--input-bg)",
                      border: "1px solid var(--input-border)",
                      borderRadius: "10px",
                      padding: "11px 12px",
                      color: "var(--text-primary)",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Email</label>
                  <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      value={user?.email || ""}
                      disabled
                      style={{
                        flex: 1,
                        background: "var(--input-bg)",
                        border: "1px solid var(--input-border)",
                        borderRadius: "10px",
                        padding: "11px 12px",
                        color: "var(--text-muted)",
                        fontFamily: "inherit",
                      }}
                    />
                    <span style={{ padding: "6px 10px", borderRadius: "20px", background: "var(--green-dim)", color: "var(--green)", fontSize: "0.72rem", fontWeight: 700 }}>
                      Verified
                    </span>
                  </div>
                </div>

                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Member since: {memberSince}</p>

                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  style={{
                    width: "fit-content",
                    padding: "10px 16px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #00e5ff, #0091ea)",
                    color: "#08101e",
                    fontWeight: 700,
                    cursor: savingProfile ? "not-allowed" : "pointer",
                    opacity: savingProfile ? 0.7 : 1,
                  }}
                >
                  {savingProfile ? "Saving..." : "Save Profile"}
                </button>

                {!!profileMessage && <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{profileMessage}</p>}
              </div>
            </Section>

            <Section title="Security" subtitle="Protect your account and sessions.">
              <div style={{ display: "grid", gap: "10px" }}>
                <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Current Password</label>
                <input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, current_password: e.target.value }))}
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: "10px", padding: "11px 12px", color: "var(--text-primary)", fontFamily: "inherit" }}
                />
                <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>New Password</label>
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, new_password: e.target.value }))}
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: "10px", padding: "11px 12px", color: "var(--text-primary)", fontFamily: "inherit" }}
                />
                <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Confirm Password</label>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: "10px", padding: "11px 12px", color: "var(--text-primary)", fontFamily: "inherit" }}
                />
                <button
                  onClick={handleChangePassword}
                  disabled={passwordSaving}
                  style={{
                    width: "fit-content",
                    padding: "10px 16px",
                    borderRadius: "10px",
                    border: "none",
                    background: "var(--accent-dim)",
                    color: "var(--accent)",
                    fontWeight: 700,
                    cursor: passwordSaving ? "not-allowed" : "pointer",
                  }}
                >
                  {passwordSaving ? "Updating..." : "Change Password"}
                </button>
                {!!passwordMessage && <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{passwordMessage}</p>}
              </div>

              <ToggleRow
                label="Two-Factor Authentication (2FA)"
                description="Enable an additional verification step at login."
                checked={settings.security.twoFactorEnabled}
                onChange={() => updateNested("security", "twoFactorEnabled", !settings.security.twoFactorEnabled)}
              />

              <ToggleRow
                label="Login Alerts"
                description="Get alerts when your account signs in on a new device."
                checked={settings.security.loginAlerts}
                onChange={() => updateNested("security", "loginAlerts", !settings.security.loginAlerts)}
              />

              <div style={{ marginTop: "12px" }}>
                <button
                  onClick={handleLogoutAll}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,23,68,0.25)",
                    background: "rgba(255,23,68,0.08)",
                    color: "#ff5252",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Log Out All Sessions
                </button>
              </div>
            </Section>

            <Section title="Trading Preferences" subtitle="Set your default trading workspace.">
              <div style={{ display: "grid", gap: "12px" }}>
                <label style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Default Chart Type</label>
                <select value={settings.trading.chartType} onChange={(e) => updateNested("trading", "chartType", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--input-border)", borderRadius: "10px", padding: "10px" }}>
                  <option value="candlestick">Candlestick</option>
                  <option value="line">Line</option>
                </select>

                <label style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Default Timeframe</label>
                <select value={settings.trading.timeframe} onChange={(e) => updateNested("trading", "timeframe", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--input-border)", borderRadius: "10px", padding: "10px" }}>
                  <option>1D</option>
                  <option>1W</option>
                  <option>1M</option>
                  <option>3M</option>
                  <option>1Y</option>
                </select>

                <label style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Risk Preference</label>
                <select value={settings.trading.riskPreference} onChange={(e) => updateNested("trading", "riskPreference", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--input-border)", borderRadius: "10px", padding: "10px" }}>
                  <option value="conservative">Conservative</option>
                  <option value="balanced">Balanced</option>
                  <option value="aggressive">Aggressive</option>
                </select>

                <label style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Currency</label>
                <select value={settings.trading.currency} onChange={(e) => updateNested("trading", "currency", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--input-border)", borderRadius: "10px", padding: "10px" }}>
                  <option value="INR">INR</option>
                </select>
              </div>
            </Section>

            <Section title="Notifications" subtitle="Choose what you want to hear about.">
              <ToggleRow label="Trade Alerts" checked={settings.notifications.tradeAlerts} onChange={() => updateNested("notifications", "tradeAlerts", !settings.notifications.tradeAlerts)} />
              <ToggleRow label="Course Updates" checked={settings.notifications.courseUpdates} onChange={() => updateNested("notifications", "courseUpdates", !settings.notifications.courseUpdates)} />
              <ToggleRow label="Email Notifications" checked={settings.notifications.emailNotifications} onChange={() => updateNested("notifications", "emailNotifications", !settings.notifications.emailNotifications)} />
              <ToggleRow
                label="Push Notifications"
                description="Mobile push support will be available soon."
                checked={settings.notifications.pushNotifications}
                disabled
                onChange={() => {}}
              />
            </Section>

            <Section title="Appearance" subtitle="Keep your interface clean and comfortable.">
              <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
                {["dark", "light"].map((mode) => {
                  const active = theme === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setThemeMode(mode)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: active ? "1px solid var(--accent-glow)" : "1px solid var(--border-subtle)",
                        background: active ? "var(--accent-dim)" : "transparent",
                        color: active ? "var(--accent)" : "var(--text-muted)",
                        cursor: "pointer",
                        fontWeight: 700,
                        textTransform: "capitalize",
                      }}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                {["compact", "comfortable"].map((density) => {
                  const active = settings.appearance.density === density;
                  return (
                    <button
                      key={density}
                      onClick={() => updateNested("appearance", "density", density)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: active ? "1px solid var(--accent-glow)" : "1px solid var(--border-subtle)",
                        background: active ? "var(--accent-dim)" : "transparent",
                        color: active ? "var(--accent)" : "var(--text-muted)",
                        cursor: "pointer",
                        fontWeight: 700,
                        textTransform: "capitalize",
                      }}
                    >
                      {density}
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title="Privacy" subtitle="Manage visibility and data usage.">
              <ToggleRow
                label="Profile Visibility"
                description="Allow your profile identity to be visible in social areas."
                checked={settings.privacy.profileVisible}
                onChange={() => updateNested("privacy", "profileVisible", !settings.privacy.profileVisible)}
              />
              <ToggleRow
                label="Data Usage"
                description="Allow usage analytics to improve recommendations."
                checked={settings.privacy.dataUsage}
                onChange={() => updateNested("privacy", "dataUsage", !settings.privacy.dataUsage)}
              />
              <div style={{ marginTop: "12px" }}>
                <button
                  onClick={handleLogoutAll}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,23,68,0.25)",
                    background: "rgba(255,23,68,0.08)",
                    color: "#ff5252",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Logout All Sessions
                </button>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </>
  );
}
