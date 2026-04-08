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

  return (
    <div className="min-h-screen flex flex-col overflow-hidden" style={{ background: '#1A1A1A', color: '#FFFFFF' }}>

      {/* Hero */}
      <div className="relative flex flex-col items-center text-center px-6 pt-16 pb-20 overflow-hidden">
        {/* glow orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: '#FF6600' }} />

        {/* Hexagon logo */}
        <div
          className="w-24 h-28 flex items-center justify-center shadow-2xl mb-6 relative z-10"
          style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', background: '#FF6600' }}
        >
          <span className="text-5xl font-black text-white select-none">φ</span>
        </div>

        <h1 className="text-5xl font-black tracking-tight mb-2" style={{ color: '#FFFFFF' }}>KANDU</h1>
        <p className="text-base font-semibold mb-1" style={{ color: '#FF6600' }}>A plataforma de obras e serviços</p>
        <p className="text-sm max-w-xs leading-relaxed" style={{ color: '#AAAAAA' }}>
          Ligue empregadores a profissionais qualificados de construção civil em Portugal
        </p>
      </div>

      {/* Features */}
      <div className="flex-1 px-6">
        <h2 className="text-base font-bold text-center mb-4" style={{ color: '#AAAAAA' }}>Tudo o que precisa numa só plataforma</h2>
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-8">
          {features.map((f, i) => (
            <div key={i} className="rounded-2xl p-4 flex flex-col gap-2 border" style={{ background: '#2A2A2A', borderColor: '#333333' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,102,0,0.15)' }}>
                <f.icon className="w-5 h-5" style={{ color: '#FF6600' }} />
              </div>
              <p className="font-semibold text-sm" style={{ color: '#FFFFFF' }}>{f.label}</p>
              <p className="text-xs leading-snug" style={{ color: '#AAAAAA' }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="flex justify-center gap-6 mb-10 text-center">
          <div>
            <p className="text-2xl font-black" style={{ color: '#FF6600' }}>2k+</p>
            <p className="text-xs" style={{ color: '#AAAAAA' }}>Profissionais</p>
          </div>
          <div className="w-px" style={{ background: '#333333' }} />
          <div>
            <p className="text-2xl font-black" style={{ color: '#FF6600' }}>5k+</p>
            <p className="text-xs" style={{ color: '#AAAAAA' }}>Obras concluídas</p>
          </div>
          <div className="w-px" style={{ background: '#333333' }} />
          <div>
            <p className="text-2xl font-black" style={{ color: '#FF6600' }}>4.9★</p>
            <p className="text-xs" style={{ color: '#AAAAAA' }}>Avaliação média</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-12 space-y-3 max-w-sm mx-auto w-full">
        <button
          onClick={() => base44.auth.redirectToLogin(createPageUrl("SetupProfile"))}
          className="w-full h-14 font-bold rounded-2xl text-base flex items-center justify-center gap-2 shadow-2xl transition-opacity hover:opacity-90"
          style={{ background: '#FF6600', color: '#FFFFFF' }}
        >
          Entrar na plataforma
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => base44.auth.redirectToLogin(createPageUrl("SetupProfile"))}
          className="w-full h-12 font-bold rounded-2xl text-base border-2 transition-opacity hover:opacity-80"
          style={{ borderColor: '#FF6600', color: '#FF6600', background: 'transparent' }}
        >
          Criar conta gratuita
        </button>
        <p className="text-center text-xs" style={{ color: '#555555' }}>
          Ao continuar, aceita os nossos <span className="underline cursor-pointer" style={{ color: '#AAAAAA' }}>Termos de Serviço</span>
        </p>
      </div>
    </div>
  );
}