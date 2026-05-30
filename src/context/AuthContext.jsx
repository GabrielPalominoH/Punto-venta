import { createContext, useContext, useState, useEffect } from "react";

const MOCK_USERS = [
  { email: "admin@marlinposeidon.com", password: "admin123", name: "Carlos Méndez", role: "Store Manager" },
  { email: "vendedor@marlinposeidon.com", password: "vendedor123", name: "Lucía García", role: "Vendedor" },
];

function createToken(user) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: user.email,
      name: user.name,
      role: user.role,
      iat: Date.now(),
      exp: Date.now() + 24 * 60 * 60 * 1000,
    })
  );
  const signature = btoa("marlin-poseidon-secret");
  return `${header}.${payload}.${signature}`;
}

function decodeToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("marlin_token");
    if (token) {
      const payload = decodeToken(token);
      if (payload) {
        setUser({ name: payload.name, email: payload.sub, role: payload.role });
      } else {
        localStorage.removeItem("marlin_token");
      }
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const found = MOCK_USERS.find((u) => u.email === email && u.password === password);
    if (!found) return false;
    const token = createToken(found);
    localStorage.setItem("marlin_token", token);
    setUser({ name: found.name, email: found.email, role: found.role });
    return true;
  };

  const logout = () => {
    localStorage.removeItem("marlin_token");
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
