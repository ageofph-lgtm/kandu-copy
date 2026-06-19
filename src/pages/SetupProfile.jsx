import { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";

export default function SetupProfile() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState("");

  const profiles = [
    {
      type: "worker",
      emoji: "⛑️",
      title: "Profissional",
      desc: "Candidate-se a obras e mostre as suas habilidades",
    },
    {
      type: "employer",
      emoji: "💼",
      title: "Empregador",
      desc: "Publique trabalhos e encontre profissionais qualificados",
    },
  ];

  useEffect(() => {
    // Escutar auth state — apanha sessão mesmo após redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }
      const authUser = session.user;
      // Verificar se já tem perfil completo
      const { data: profile } = await supabase
        .from("users")
        .select("user_type")
        .eq("id", authUser.id)
        .maybeSingle();
      if (profile?.user_type) {
        navigate(createPageUrl("Home"));
        return;
      }
      setUser(authUser);
      setLoading(false);
    });

    // Verificar sessão imediatamente (não esperar pelo evento)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleConfirm = async () => {
    if (!user) { navigate(createPageUrl("Login")); return; }
    setSaving(true);
    setError("");
    try {
      const selectedType = profiles[activeIndex].type;
      const now = new Date().toISOString();
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email;
      const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

      // Upsert directo no Supabase (RLS desactivado para MVP)
      const { error: upsertErr } = await supabase.from("users").upsert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        avatar_url: avatarUrl,
        user_type: selectedType,
        status: "active",
        gdpr_accepted: true,
        gdpr_accepted_at: now,
        created_at: now,
        updated_at: now,
      }, { onConflict: "id" });

      if (upsertErr) {
        // Fallback: UPDATE por email (conta Google pode ter ID diferente)
        const { error: updateErr } = await supabase.from("users")
          .update({ user_type: selectedType, status: "active", updated_at: now })
          .eq("email", user.email);
        if (updateErr) throw new Error(updateErr.message);
      }

      navigate(createPageUrl("Home"));
    } catch (e) {
      console.error("SetupProfile error:", e);
      setError("Erro ao guardar perfil. Tenta novamente.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#111016", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#FFF" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
          <p style={{ color: "#AAA" }}>A verificar sessão...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#111016", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <h2 style={{ color: "#FFF", fontWeight: 800, marginBottom: 8 }}>Sessão não encontrada</h2>
        <p style={{ color: "#AAA", marginBottom: 24 }}>Faz login para continuar</p>
        <button onClick={() => navigate(createPageUrl("Login"))}
          style={{ padding: "14px 40px", background: "#F4621F", border: "none", borderRadius: 13, color: "#FFF", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
          Ir para Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#111016", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      {/* Logo */}
      <img
        src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/90321a683_Gemini_Generated_Image_k4rh2gk4rh2gk4rh.png"
        style={{ height: 56, objectFit: "contain", marginBottom: 28 }}
        alt="KANDU"
      />

      <h2 style={{ color: "#FFF", fontWeight: 800, fontSize: 22, marginBottom: 6, textAlign: "center" }}>
        Como vais usar o KANDU?
      </h2>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 32, textAlign: "center" }}>{user.email}</p>

      {/* Cards de escolha */}
      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
        {profiles.map((p, idx) => (
          <div
            key={p.type}
            onClick={() => setActiveIndex(idx)}
            style={{
              background: activeIndex === idx ? "#1f1d2b" : "#161520",
              border: activeIndex === idx ? "2px solid #F4621F" : "2px solid #2a2836",
              borderRadius: 16,
              padding: "20px 22px",
              display: "flex",
              alignItems: "center",
              gap: 18,
              cursor: "pointer",
              transition: "all 0.15s",
              boxShadow: activeIndex === idx ? "0 0 20px rgba(244,98,31,0.15)" : "none",
            }}
          >
            <span style={{ fontSize: 40 }}>{p.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#FFF", marginBottom: 4 }}>{p.title}</div>
              <div style={{ fontSize: 13, color: "#888" }}>{p.desc}</div>
            </div>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              border: "2px solid " + (activeIndex === idx ? "#F4621F" : "#444"),
              background: activeIndex === idx ? "#F4621F" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {activeIndex === idx && <span style={{ color: "#FFF", fontSize: 12, fontWeight: 900 }}>✓</span>}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p style={{ color: "#ef4444", marginBottom: 16, fontSize: 13 }}>{error}</p>
      )}

      {/* Botão */}
      <button
        onClick={handleConfirm}
        disabled={saving}
        style={{
          width: "100%", maxWidth: 420,
          padding: "16px",
          background: saving ? "#555" : "#F4621F",
          border: "none", borderRadius: 14,
          color: "#FFF", fontWeight: 700, fontSize: 17,
          cursor: saving ? "not-allowed" : "pointer",
          boxShadow: "0 4px 20px rgba(244,98,31,0.3)",
        }}
      >
        {saving ? "⏳ A guardar..." : `Continuar como ${profiles[activeIndex].title}`}
      </button>

      <p style={{ color: "#555", fontSize: 11, marginTop: 20, textAlign: "center", maxWidth: 320 }}>
        Ao continuar aceitas os Termos e Política de Privacidade (RGPD)
      </p>
    </div>
  );
}
