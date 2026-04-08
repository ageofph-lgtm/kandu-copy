import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

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
        <div className="w-8 h-8 border-4 border-[#FF6600] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-between overflow-hidden relative" style={{ background: '#1A1A1A', padding: '28px' }}>
      {/* Hex pattern */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.04 }}>
        <defs>
          <pattern id="hex-w" x="0" y="0" width="56" height="97" patternUnits="userSpaceOnUse">
            <polygon points="28,1 55,15.5 55,44.5 28,59 1,44.5 1,15.5" fill="none" stroke="#FF6600" strokeWidth="1" />
            <polygon points="28,49.5 55,64 55,93 28,107.5 1,93 1,64" fill="none" stroke="#FF6600" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-w)" />
      </svg>

      {/* Top spacer */}
      <div />

      {/* Center content */}
      <div className="relative flex flex-col items-center gap-4 w-full max-w-sm">
        {/* Logo */}
        <img
          src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/002158942_Gemini_Generated_Image_5.png"
          alt="KANDU"
          style={{ width: 200, marginBottom: 24 }}
        />

        {/* Headline */}
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#FFFFFF', textAlign: 'center', margin: 0 }}>
          Find work. Find workers.
        </h1>
        <p style={{ fontSize: 15, color: '#AAAAAA', textAlign: 'center', margin: 0 }}>
          Lisboa e arredores
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-4 w-full mt-4">
          <button
            onClick={() => base44.auth.redirectToLogin(createPageUrl("SetupProfile") + "?type=professional")}
            style={{
              width: '100%', borderRadius: 14, padding: '16px',
              background: '#FF6600', color: '#fff', fontWeight: 700,
              fontSize: 16, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
            }}
          >
            <span>🔧</span> Sou Profissional
          </button>
          <button
            onClick={() => base44.auth.redirectToLogin(createPageUrl("SetupProfile") + "?type=employer")}
            style={{
              width: '100%', borderRadius: 14, padding: '16px',
              background: 'transparent', color: '#fff', fontWeight: 700,
              fontSize: 16, border: '2px solid #FF6600', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
            }}
          >
            <span>💼</span> Preciso de Profissional
          </button>
        </div>
      </div>

      {/* Footer */}
      <p style={{ fontSize: 11, color: '#666', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        Ao continuar, aceitas os Termos e Política de Privacidade (RGPD)
      </p>
    </div>
  );
}