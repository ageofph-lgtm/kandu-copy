import { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("login");
  const [checkingSession, setCheckingSession] = useState(true);

  // Se já tem sessão, redirecionar
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("users").select("user_type").eq("id", session.user.id).maybeSingle();
        navigate(createPageUrl(profile?.user_type ? "Home" : "SetupProfile"), { replace: true });
      } else {
        setCheckingSession(false);
      }
    });

    // Capturar callback OAuth (Google redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
        const { data: profile } = await supabase
          .from("users").select("user_type").eq("id", session.user.id).maybeSingle();
        navigate(createPageUrl(profile?.user_type ? "Home" : "SetupProfile"), { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + window.location.pathname,
      },
    });
    if (err) { setError(err.message); setGoogleLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        if (data?.user && !data?.session) {
          setError("Confirma o teu email antes de entrar.");
          setLoading(false);
          return;
        }
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("users").select("user_type").eq("id", session.user.id).maybeSingle();
        navigate(createPageUrl(profile?.user_type ? "Home" : "SetupProfile"), { replace: true });
      }
    } catch (err) {
      setError(err.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div style={{ minHeight: "100vh", background: "#111016", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#FFF" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #F4621F", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: "#888", fontSize: 14 }}>A verificar sessão...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#111016", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <img
            src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/90321a683_Gemini_Generated_Image_k4rh2gk4rh2gk4rh.png"
            style={{ height: 60, objectFit: "contain", marginBottom: 14 }}
            alt="KANDU"
          />
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#FFF", margin: 0, letterSpacing: 1 }}>KANDU</h1>
          <p style={{ color: "#888", marginTop: 6, fontSize: 14 }}>
            {mode === "login" ? "Bem-vindo de volta 👋" : "Cria a tua conta"}
          </p>
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          style={{
            width: "100%", padding: "13px 16px",
            background: "#fff", border: "none", borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            fontWeight: 700, fontSize: 15, cursor: "pointer",
            boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
            marginBottom: 20, opacity: googleLoading ? 0.7 : 1,
          }}
        >
          {/* Google SVG icon */}
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
          {googleLoading ? "A redirecionar..." : "Continuar com Google"}
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "#2a2836" }} />
          <span style={{ color: "#555", fontSize: 13 }}>ou com email</span>
          <div style={{ flex: 1, height: 1, background: "#2a2836" }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              padding: "13px 16px", borderRadius: 11,
              border: "1.5px solid #2a2836", background: "#1C1B22",
              color: "#FFF", fontSize: 15, outline: "none",
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{
              padding: "13px 16px", borderRadius: 11,
              border: "1.5px solid #2a2836", background: "#1C1B22",
              color: "#FFF", fontSize: 15, outline: "none",
            }}
          />

          {error && (
            <div style={{ background: "#2d1515", border: "1px solid #ef4444", borderRadius: 8, padding: "10px 14px" }}>
              <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>⚠️ {error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "14px", borderRadius: 12,
              background: loading ? "#555" : "#F4621F",
              color: "#FFF", fontWeight: 700, fontSize: 16,
              border: "none", cursor: loading ? "not-allowed" : "pointer",
              marginTop: 4,
              boxShadow: loading ? "none" : "0 4px 16px rgba(244,98,31,0.35)",
            }}
          >
            {loading ? "⏳ A processar..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 22, color: "#666", fontSize: 14 }}>
          {mode === "login" ? "Não tens conta? " : "Já tens conta? "}
          <span
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            style={{ color: "#F4621F", cursor: "pointer", fontWeight: 700 }}
          >
            {mode === "login" ? "Criar conta" : "Entrar"}
          </span>
        </p>
      </div>
    </div>
  );
}
