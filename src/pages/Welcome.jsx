import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";
import { SUPPORTED_LANGUAGES } from "@/lib/LanguageContext";
import { supabase } from "@/api/supabaseClient";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

const DEV_USERS = [
  { name: "PH",        emoji: "👑", email: "ageofph@gmail.com",          password: "Kandu2026!Dev", color: "#F4621F" },
  { name: "Uri",       emoji: "🚀", email: "urielramoss@gmail.com",       password: "Kandu2026!Dev", color: "#8b5cf6" },
  { name: "Luquinhas", emoji: "⚡", email: "lucasfelipesantos@gmail.com", password: "Kandu2026!Dev", color: "#3b82f6" },
];

export default function Welcome() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const [showLangPicker, setShowLangPicker] = useState(() => !localStorage.getItem("kandu_lang"));
  const [checking, setChecking] = useState(true);
  const [showDev, setShowDev] = useState(false);
  const [devLoading, setDevLoading] = useState(null);

  useEffect(() => {
    const check = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: profile } = await supabase.from("users").select("user_type").eq("id", authUser.id).maybeSingle();
          navigate(createPageUrl(profile?.user_type === "admin" ? "AdminDashboard" : profile?.user_type ? "Home" : "SetupProfile"));
          return;
        }
      } catch {}
      setChecking(false);
    };
    check();
  }, [navigate]);

  const handleDevEnter = async (u) => {
    setDevLoading(u.email);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: u.email, password: u.password });
      if (err) throw err;
      navigate(createPageUrl("DevPicker"), { replace: true });
    } catch (e) {
      console.error(e);
      setDevLoading(null);
    }
  };

  // Loading spinner
  if (checking) {
    return (
      <div style={{ minHeight: "100vh", background: "#111016", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 48, height: 48, border: "3px solid #F4621F", borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Selector de idioma
  if (showLangPicker) {
    return (
      <div style={{ minHeight: "100vh", background: "#111016", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center", fontFamily: "'Chakra Petch', sans-serif" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#F4621F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 28, boxShadow: "0 0 32px rgba(244,98,31,0.4)" }}>K</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Choose your language</h1>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 32, maxWidth: 280 }}>Escolha · Select · Seleccione · Choisissez</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, width: "100%", maxWidth: 360 }}>
          {SUPPORTED_LANGUAGES.map((l) => (
            <button key={l.code} onClick={() => { setLang(l.code); setShowLangPicker(false); }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", borderRadius: 14, border: "1px solid #222", background: "#1a1a1a", color: "#ccc", fontSize: 14, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
              <span style={{ fontSize: 22 }}>{l.flag || "🌐"}</span>
              <div>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: 13 }}>{l.nativeName || l.name}</div>
                <div style={{ fontSize: 11, color: "#666" }}>{l.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Tela principal
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(900px 500px at 15% -8%, rgba(255,106,0,.13), transparent 55%), radial-gradient(800px 600px at 100% 0%, rgba(120,150,200,.06), transparent 55%), #0B0C0E",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "40px 24px", gap: 0, position: "relative", overflow: "hidden",
      fontFamily: "'Chakra Petch', sans-serif",
    }}>
      {/* Hex pattern fundo */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.15,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52'%3E%3Cpolygon points='30,2 58,17 58,47 30,62 2,47 2,17' fill='none' stroke='%23F4621F' stroke-width='0.6'/%3E%3C/svg%3E\")",
        backgroundRepeat: "repeat",
      }} />

      {/* Logo */}
      <img
        src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/90321a683_Gemini_Generated_Image_k4rh2gk4rh2gk4rh.png"
        style={{ height: 52, objectFit: "contain", position: "relative", zIndex: 1, marginBottom: 36 }}
        alt="KANDU"
      />

      {/* Headline */}
      <div style={{ textAlign: "center", position: "relative", zIndex: 1, marginBottom: 40 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#fff", margin: "0 0 10px", lineHeight: 1.2 }}>
          {t(lang, "findWorkTagline", "Encontra trabalho.\nEncontra profissionais.")}
        </h1>
        <p style={{ fontSize: 14, color: "#888", margin: 0 }}>
          {t(lang, "lisbonAndSurroundings", "Lisboa e arredores")}
        </p>
      </div>

      {/* Botões principais */}
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 14, position: "relative", zIndex: 1 }}>
        {/* Sou Profissional */}
        <button
          onClick={() => navigate(createPageUrl("Login"))}
          style={{
            width: "100%", padding: "17px 20px",
            background: "linear-gradient(135deg, #FFC489, #FF7A1A 42%, #E04E00)",
            border: "none", borderRadius: 16,
            color: "#2a1402", fontWeight: 800, fontSize: 17,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            boxShadow: "0 0 0 1px rgba(255,106,0,.20), 0 18px 40px -16px rgba(224,78,0,.55), inset 0 1px 0 rgba(255,255,255,.35)",
            fontFamily: "inherit",
          }}
        >
          ⛑️ {t(lang, "imProfessional", "Sou Profissional")}
        </button>

        {/* Sou Empregador */}
        <button
          onClick={() => navigate(createPageUrl("Login"))}
          style={{
            width: "100%", padding: "17px 20px",
            background: "linear-gradient(180deg, rgba(255,255,255,.085), rgba(255,255,255,.055))",
            border: "1px solid rgba(255,255,255,.10)",
            borderRadius: 16,
            color: "#F1F3F6", fontWeight: 700, fontSize: 17,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            boxShadow: "inset 0 1.5px 0 rgba(255,255,255,.24), 0 8px 24px -12px rgba(0,0,0,.72)",
            fontFamily: "inherit",
          }}
        >
          💼 {t(lang, "iNeedProfessional", "Sou Empregador")}
        </button>

        {/* Já tenho conta */}
        <button
          onClick={() => navigate(createPageUrl("Login"))}
          style={{
            width: "100%", padding: "12px 20px",
            background: "transparent", border: "none",
            color: "#888", fontSize: 14, cursor: "pointer",
            fontFamily: "inherit", textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          {t(lang, "alreadyHaveAccount", "Já tenho conta → Entrar")}
        </button>
      </div>

      {/* RGPD */}
      <p style={{ fontSize: 11, color: "#555", textAlign: "center", position: "relative", zIndex: 1, maxWidth: 300, marginTop: 20 }}>
        {t(lang, "acceptTermsNote", "Ao continuar, aceitas os nossos Termos e Política de Privacidade (RGPD)")}
      </p>

      {/* ─── Botão Credenciados ─── */}
      <div style={{ position: "relative", zIndex: 1, marginTop: 28 }}>
        <button
          onClick={() => setShowDev(v => !v)}
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,.085), rgba(255,255,255,.055))",
            border: `1px solid ${showDev ? "rgba(255,106,0,.55)" : "rgba(255,255,255,.10)"}`,
            borderRadius: 10, color: showDev ? "var(--or)" : "#8A909A",
            fontSize: 12, padding: "7px 18px",
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: "inset 0 1.5px 0 rgba(255,255,255,.24)",
            transition: "all 0.2s",
          }}
        >
          🔑 Credenciados
        </button>

        {/* Popover com os 3 devs */}
        {showDev && (
          <div style={{
            position: "absolute", bottom: "calc(100% + 10px)", left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(180deg, rgba(255,255,255,.085), rgba(255,255,255,.055))",
            backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)",
            border: "1px solid rgba(255,255,255,.10)",
            borderRadius: 16, padding: "16px 12px",
            display: "flex", gap: 10, zIndex: 50,
            boxShadow: "inset 0 1.5px 0 rgba(255,255,255,.24), 0 -8px 40px rgba(0,0,0,0.7)",
            minWidth: 260,
          }}>
            <div style={{ position: "absolute", bottom: -7, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 12, height: 12, background: "#13131a", border: "1.5px solid #2a2a3a", borderTop: "none", borderLeft: "none" }} />
            {DEV_USERS.map(u => (
              <button
                key={u.email}
                onClick={() => handleDevEnter(u)}
                disabled={!!devLoading}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 6, padding: "12px 8px", borderRadius: 12,
                  border: `1.5px solid ${devLoading === u.email ? u.color : "#2a2a3a"}`,
                  background: devLoading === u.email ? `${u.color}22` : "rgba(255,255,255,0.03)",
                  cursor: devLoading ? "not-allowed" : "pointer",
                  fontFamily: "inherit", opacity: devLoading && devLoading !== u.email ? 0.4 : 1,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 26 }}>{devLoading === u.email ? "⏳" : u.emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: devLoading === u.email ? u.color : "#ccc" }}>
                  {devLoading === u.email ? "..." : u.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
