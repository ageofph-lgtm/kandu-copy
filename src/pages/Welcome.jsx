import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Wrench, Briefcase } from "lucide-react";

// Hexagon pattern background SVG
const HexBg = () => (
  <div className="absolute inset-0 opacity-[0.07] pointer-events-none overflow-hidden">
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="hex" x="0" y="0" width="56" height="100" patternUnits="userSpaceOnUse">
          <polygon points="28,2 54,16 54,44 28,58 2,44 2,16" fill="none" stroke="#F26522" strokeWidth="1"/>
          <polygon points="0,58 26,72 26,100 0,114 -26,100 -26,72" fill="none" stroke="#F26522" strokeWidth="1"/>
          <polygon points="56,58 82,72 82,100 56,114 30,100 30,72" fill="none" stroke="#F26522" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex)"/>
    </svg>
  </div>
);

export default function Welcome() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const user = await base44.auth.me();
          if (user?.user_type) { navigate(createPageUrl("Home")); return; }
          navigate(createPageUrl("SetupProfile")); return;
        }
      } catch {}
      setChecking(false);
    };
    check();
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center">
        <HexBg />
        {/* Logo hexagon */}
        <div className="relative mb-4">
          <svg width="96" height="110" viewBox="0 0 96 110">
            <polygon points="48,4 92,28 92,76 48,100 4,76 4,28" fill="#1a1a1a" stroke="#F26522" strokeWidth="3"/>
            <text x="48" y="62" textAnchor="middle" fill="white" fontSize="38" fontWeight="900" fontFamily="system-ui">K</text>
            <circle cx="35" cy="34" r="5" fill="#F26522"/>
          </svg>
        </div>
        <p className="text-2xl font-black text-white tracking-widest">KANDU</p>
        <div className="mt-6 w-32 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
          <div className="h-full bg-[#F26522] rounded-full animate-pulse" style={{width:'60%'}} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <HexBg />

      {/* Logo */}
      <div className="relative mb-6">
        <svg width="96" height="110" viewBox="0 0 96 110">
          <polygon points="48,4 92,28 92,76 48,100 4,76 4,28" fill="#1a1a1a" stroke="#F26522" strokeWidth="3"/>
          <polygon points="48,18 80,36 80,72 48,90 16,72 16,36" fill="#111"/>
          <text x="52" y="68" textAnchor="middle" fill="white" fontSize="44" fontWeight="900" fontFamily="system-ui">K</text>
          <circle cx="36" cy="34" r="6" fill="#F26522"/>
        </svg>
      </div>

      <h1 className="text-3xl font-black text-white tracking-widest mb-1">KANDU</h1>
      <p className="text-base font-bold text-white mb-1">Find work. Find workers.</p>
      <p className="text-sm text-gray-400 mb-12">Lisboa e arredores</p>

      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={() => base44.auth.redirectToLogin(createPageUrl("SetupProfile") + "?type=worker")}
          className="w-full h-14 bg-[#F26522] hover:bg-orange-600 text-white font-bold rounded-2xl text-base flex items-center px-6 gap-4 transition-colors shadow-lg shadow-orange-900/30"
        >
          <Wrench className="w-6 h-6 shrink-0" />
          <span>Sou Profissional</span>
        </button>

        <button
          onClick={() => base44.auth.redirectToLogin(createPageUrl("SetupProfile") + "?type=employer")}
          className="w-full h-14 bg-[#2a2a2a] hover:bg-[#333] border-2 border-[#3a3a3a] text-white font-bold rounded-2xl text-base flex items-center px-6 gap-4 transition-colors"
        >
          <Briefcase className="w-6 h-6 shrink-0" />
          <span>Preciso de Profissional</span>
        </button>
      </div>

      <p className="text-xs text-gray-600 mt-10 text-center">
        Interface 100% gratuita. Montelo usado pelo KANDU.
      </p>
    </div>
  );
}