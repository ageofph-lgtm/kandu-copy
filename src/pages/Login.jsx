import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";
import { useTheme } from "@/lib/ThemeContext";

export default function Login() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("login"); // "login" | "signup"

  const bg = isDark ? "#111016" : "#fff";
  const text = isDark ? "#fff" : "#111016";
  const inputBg = isDark ? "#1c1b22" : "#f5f5f5";
  const border = isDark ? "#333" : "#ddd";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
      }
      // Aguardar sessão e navegar
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('users').select('user_type').eq('id', user.id).maybeSingle();
        if (profile?.user_type) {
          navigate(createPageUrl("Home"));
        } else {
          navigate(createPageUrl("SetupProfile"));
        }
      }
    } catch (err) {
      setError(err.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F4621F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: "#fff", margin: "0 auto 16px", boxShadow: "0 0 24px rgba(244,98,31,0.4)" }}>K</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: text, margin: 0 }}>KANDU</h1>
          <p style={{ color: "#888", marginTop: 4, fontSize: 14 }}>{mode === "login" ? "Entrar na plataforma" : "Criar conta"}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ padding: "12px 16px", borderRadius: 10, border: `1px solid ${border}`, background: inputBg, color: text, fontSize: 15, outline: "none" }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ padding: "12px 16px", borderRadius: 10, border: `1px solid ${border}`, background: inputBg, color: text, fontSize: 15, outline: "none" }}
          />
          {error && <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ padding: "13px", borderRadius: 10, background: "#F4621F", color: "#fff", fontWeight: 700, fontSize: 16, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, color: "#888", fontSize: 14 }}>
          {mode === "login" ? "Não tens conta? " : "Já tens conta? "}
          <span
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            style={{ color: "#F4621F", cursor: "pointer", fontWeight: 600 }}
          >
            {mode === "login" ? "Criar conta" : "Entrar"}
          </span>
        </p>

        <p style={{ textAlign: "center", marginTop: 12, fontSize: 13 }}>
          <span onClick={() => navigate(-1)} style={{ color: "#888", cursor: "pointer" }}>← Voltar</span>
        </p>
      </div>
    </div>
  );
}
