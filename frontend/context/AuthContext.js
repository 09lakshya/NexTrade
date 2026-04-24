import { createContext, useContext, useState, useEffect } from "react";
import API from "../services/api";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const stored =
      localStorage.getItem("ntrade_token") ||
      sessionStorage.getItem("ntrade_token");

    if (!stored) return null;

    const res = await API.get("/auth/me", {
      headers: { Authorization: `Bearer ${stored}` },
    });
    setUser(res.data);
    setToken(stored);
    return res.data;
  };

  // On mount, restore session from localStorage or sessionStorage
  useEffect(() => {
    const stored =
      localStorage.getItem("ntrade_token") ||
      sessionStorage.getItem("ntrade_token");

    if (!stored) {
      setLoading(false);
      return;
    }

    // Validate token with backend
    API.get("/auth/me", {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then((res) => {
        setUser(res.data);
        setToken(stored);
      })
      .catch(() => {
        // Token invalid or expired; clear it
        localStorage.removeItem("ntrade_token");
        sessionStorage.removeItem("ntrade_token");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password, rememberMe = false) => {
    const res = await API.post("/auth/login", { email, password });
    const { token: tk, user: u } = res.data;
    setToken(tk);
    setUser(u);
    if (rememberMe) {
      localStorage.setItem("ntrade_token", tk);
    } else {
      sessionStorage.setItem("ntrade_token", tk);
    }
    return u;
  };

  const signup = async (email, password, name, age, rememberMe = false) => {
    const res = await API.post("/auth/signup", { email, password, name, age });
    const { token: tk, user: u } = res.data;
    setToken(tk);
    setUser(u);
    if (rememberMe) {
      localStorage.setItem("ntrade_token", tk);
    } else {
      sessionStorage.setItem("ntrade_token", tk);
    }
    return u;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("ntrade_token");
    sessionStorage.removeItem("ntrade_token");
    // Also clear old portfolio uid if present
    localStorage.removeItem("ntrade_uid");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, signup, logout, refreshUser, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
