import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Wrench, Briefcase, Star, Shield, ArrowRight, CheckCircle } from "lucide-react";

const features = [
  { icon: Briefcase, label: "Publique obras", desc: "Encontre o profissional certo para cada trabalho" },
  { icon: Wrench, label: "Seja contratado", desc: "Candidate-se a obras e mostre o seu talento" },
  { icon: Star, label: "Avaliações reais", desc: "Transparência e confiança em cada projeto" },
  { icon: Shield, label: "Plataforma segura", desc: "Pagamentos e dados protegidos" },
];

export default function Welcome() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const user = await base44.auth.me();
          if (user?.user_type) {
            navigate(createPageUrl("Home"));
          } else {
            navigate(createPageUrl("SetupProfile"));
          }
          return;
        }
      } catch {}
      setChecking(false);
    };
    check();
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1A1A1A' }}>
        <div
          className="w-20 h-24 flex items-center justify-center animate-pulse"
          style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', background: '#FF6600' }}
        >
          <span className="text-4xl font-black text-white select-none">φ</span>
        </div>
      </div>
    );
  }

  const hexPattern = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='104'><polygon points='60,2 118,32 118,72 60,102 2,72 2,32' fill='none' stroke='%23FF6600' stroke-width='1'/></svg>`;

  const handleChoice = (type) => {
    sessionStorage.setItem('pendingUserType', type);
    base44.auth.redirectToLogin(createPageUrl("SetupProfile"));
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#1A1A1A', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '28px', gap: '16px', position: 'relative', overflow: 'hidden'
    }}>
      {/* Hex pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,${hexPattern}")`,
        backgroundRepeat: 'repeat'
      }} />

      {/* Logo */}
      <img
        src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/002158942_Gemini_Generated_Image_5.png"
        alt="KANDU"
        style={{ width: 200, marginBottom: 24, position: 'relative', zIndex: 1 }}
      />

      {/* Headline */}
      <p style={{ fontSize: 28, fontWeight: 800, color: '#FFFFFF', textAlign: 'center', margin: 0, zIndex: 1 }}>
        Find work. Find workers.
      </p>
      <p style={{ fontSize: 15, color: '#AAAAAA', textAlign: 'center', margin: 0, zIndex: 1 }}>
        Lisboa e arredores
      </p>

      <div style={{ height: 16 }} />

      {/* Button 1 */}
      <button
        onClick={() => handleChoice('worker')}
        style={{
          width: '100%', maxWidth: 380, padding: '16px', borderRadius: 14,
          background: '#FF6600', color: '#FFF', fontWeight: 700, border: 'none',
          fontSize: 17, cursor: 'pointer', zIndex: 1
        }}
      >
        🔧&nbsp;&nbsp;Sou Profissional
      </button>

      {/* Button 2 */}
      <button
        onClick={() => handleChoice('employer')}
        style={{
          width: '100%', maxWidth: 380, padding: '16px', borderRadius: 14,
          background: 'transparent', border: '2px solid #FF6600', color: '#FFF',
          fontWeight: 700, fontSize: 17, cursor: 'pointer', zIndex: 1
        }}
      >
        💼&nbsp;&nbsp;Preciso de Profissional
      </button>

      {/* Footer */}
      <p style={{ fontSize: 11, color: '#666', textAlign: 'center', marginTop: 8, zIndex: 1, maxWidth: 300 }}>
        Ao continuar, aceitas os Termos e Política de Privacidade (RGPD)
      </p>
    </div>
  );
}