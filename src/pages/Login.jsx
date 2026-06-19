import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { createPageUrl } from "@/utils";

const DEV_EMAILS = [
  "ageofph@gmail.com",
  "lucasfelipesantos@gmail.com",
  "urielramoss@gmail.com",
  "phtoledo9@gmail.com",
];

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal de credenciados
  const [showDev, setShowDev] = useState(false);
  const [devEmail, setDevEmail] = useState("");
  const [devPassword, setDevPassword] = useState("");
  const [devLoading, setDevLoading] = useState(false);
  const [devError, setDevError] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
        const { data: profile } = await supabase
          .from("users").select("user_type").eq("id", session.user.id).maybeSingle();
        const dest = profile?.user_type === "admin"
          ? "AdminDashboard"
          : profile?.user_type
            ? "Home"
            : "SetupProfile";
        navigate(createPageUrl(dest), { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError("");
    const redirectUrl = window.location.origin + "/login";
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        queryParams: { access_type: "offline", prompt: "consent" },
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
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Login credenciado — verifica email e redireciona para DevPicker
  const handleDevLogin = async (e) => {
    e.preventDefault();
    setDevError("");
    if (!DEV_EMAILS.includes(devEmail.trim().toLowerCase())) {
      setDevError("Email não autorizado para acesso de teste.");
      return;
    }
    setDevLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: devEmail.trim().toLowerCase(),
        password: devPassword,
      });
      if (err) throw err;
      // Redirecionar directamente para DevPicker
      navigate(createPageUrl("DevPicker"), { replace: true });
    } catch (err) {
      setDevError("Credenciais inválidas. Usa a tua password real do Supabase.");
      setDevLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a0f 0%, #111016 60%, #1a0800 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, fontFamily: "'Chakra Petch', sans-serif", position: "relative",
    }}>
      {/* Hex background pattern */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.15, pointerEvents: "none",
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52'%3E%3Cpolygon points='30,2 58,17 58,47 30,62 2,47 2,17' fill='none' stroke='%23F4621F' stroke-width='0.5'/%3E%3C/svg%3E\")",
        backgroundRepeat: "repeat",
      }} />

      {/* Modal Credenciados */}
      {showDev && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }} onClick={(e) => e.target === e.currentTarget && setShowDev(false)}>
          <div style={{
            background: "#13131a", border: "1.5px solid #333",
            borderRadius: 20, padding: 32, width: "100%", maxWidth: 400,
            boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, color: "#fff", fontSize: 18, fontWeight: 700 }}>🧪 Acesso de Teste</h2>
                <p style={{ margin: "4px 0 0", color: "#666", fontSize: 12 }}>Só para emails credenciados</p>
              </div>
              <button onClick={() => setShowDev(false)} style={{
                background: "none", border: "none", color: "#666", fontSize: 22,
                cursor: "pointer", lineHeight: 1, padding: 4,
              }}>×</button>
            </div>

            <form onSubmit={handleDevLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="email"
                placeholder="O teu email credenciado"
                value={devEmail}
                onChange={e => setDevEmail(e.target.value)}
                required
                style={{
                  padding: "12px 14px", borderRadius: 10, border: "1.5px solid #333",
                  background: "#1a1a24", color: "#fff", fontFamily: "inherit", fontSize: 14, outline: "none",
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={devPassword}
                onChange={e => setDevPassword(e.target.value)}
                required
                style={{
                  padding: "12px 14px", borderRadius: 10, border: "1.5px solid #333",
                  background: "#1a1a24", color: "#fff", fontFamily: "inherit", fontSize: 14, outline: "none",
                }}
              />
              {devError && (
                <div style={{ color: "#f87171", fontSize: 12, padding: "8px 12px", background: "rgba(239,68,68,0.1)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)" }}>
                  ⚠️ {devError}
                </div>
              )}
              <button type="submit" disabled={devLoading} style={{
                padding: "13px", borderRadius: 10, border: "none",
                background: devLoading ? "#555" : "linear-gradient(135deg, #F4621F, #d44a0a)",
                color: "#fff", fontWeight: 700, fontSize: 15,
                cursor: devLoading ? "not-allowed" : "pointer", fontFamily: "inherit",
                marginTop: 4,
              }}>
                {devLoading ? "⏳ A entrar..." : "Entrar no Modo Teste"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Card principal */}
      <div style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24, padding: "36px 32px", width: "100%", maxWidth: 420,
        backdropFilter: "blur(12px)", position: "relative", zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img
            src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/90321a683_Gemini_Generated_Image_k4rh2gk4rh2gk4rh.png"
            style={{ height: 56, objectFit: "contain" }} alt="KANDU"
          />
        </div>

        <h1 style={{ textAlign: "center", color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>
          {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
        </h1>
        <p style={{ textAlign: "center", color: "#666", fontSize: 13, margin: "0 0 24px" }}>
          {mode === "login" ? "Entra na tua conta KANDU" : "Começa a usar o KANDU hoje"}
        </p>

        {/* Google */}
        <button onClick={handleGoogle} disabled={googleLoading} style={{
          width: "100%", padding: "12px 16px", borderRadius: 12,
          border: "1.5px solid #333", background: googleLoading ? "#1a1a24" : "#1e1e2e",
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          gap: 10, cursor: googleLoading ? "not-allowed" : "pointer",
          fontFamily: "inherit", fontSize: 14, fontWeight: 600, marginBottom: 16,
          transition: "border-color 0.2s",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {googleLoading ? "A redirecionar..." : "Continuar com Google"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: "#2a2a3a" }} />
          <span style={{ color: "#444", fontSize: 12 }}>ou</span>
          <div style={{ flex: 1, height: 1, background: "#2a2a3a" }} />
        </div>

        {error && (
          <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12, padding: "10px 14px", background: "rgba(239,68,68,0.1)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
            style={{ padding: "12px 14px", borderRadius: 10, border: "1.5px solid #333", background: "#1a1a24", color: "#fff", fontFamily: "inherit", fontSize: 14, outline: "none" }} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
            style={{ padding: "12px 14px", borderRadius: 10, border: "1.5px solid #333", background: "#1a1a24", color: "#fff", fontFamily: "inherit", fontSize: 14, outline: "none" }} />
          <button type="submit" disabled={loading} style={{
            padding: "13px", borderRadius: 10, border: "none",
            background: loading ? "#555" : "linear-gradient(135deg, #F4621F, #d44a0a)",
            color: "#fff", fontWeight: 700, fontSize: 15,
            cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
            boxShadow: loading ? "none" : "0 4px 16px rgba(244,98,31,0.35)",
          }}>
            {loading ? "⏳ A processar..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 18, color: "#666", fontSize: 14 }}>
          {mode === "login" ? "Não tens conta? " : "Já tens conta? "}
          <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            style={{ color: "#F4621F", cursor: "pointer", fontWeight: 700 }}>
            {mode === "login" ? "Criar conta" : "Entrar"}
          </span>
        </p>

        {/* Botão Credenciados — discreto no fundo */}
        <div style={{ textAlign: "center", marginTop: 24, paddingTop: 16, borderTop: "1px solid #1e1e2e" }}>
          <button onClick={() => { setShowDev(true); setDevError(""); setDevEmail(""); setDevPassword(""); }}
            style={{
              background: "none", border: "1px solid #2a2a3a", borderRadius: 8,
              color: "#444", fontSize: 12, padding: "7px 16px", cursor: "pointer",
              fontFamily: "inherit", transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.target.style.borderColor = "#F4621F"; e.target.style.color = "#F4621F"; }}
            onMouseLeave={e => { e.target.style.borderColor = "#2a2a3a"; e.target.style.color = "#444"; }}
          >
            🔑 Credenciados
          </button>
        </div>
      </div>
    </div>
  );
}
