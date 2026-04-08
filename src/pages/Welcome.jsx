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
      <div className="min-h-screen bg-[#F26522] flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl font-bold text-white animate-pulse select-none">φ</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-hidden">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-[#F26522] via-orange-500 to-orange-700 px-6 pt-16 pb-24 flex flex-col items-center text-center overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        {/* Hexagon logo */}
        <div className="relative mb-6">
          <div
            className="w-24 h-28 bg-white/20 flex items-center justify-center shadow-2xl"
            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
          >
            <span className="text-5xl font-black text-white select-none">φ</span>
          </div>
        </div>

        <h1 className="text-4xl font-black text-white tracking-tight mb-2">KANDU</h1>
        <p className="text-orange-100 text-lg font-medium mb-1">A plataforma de obras e serviços</p>
        <p className="text-orange-200 text-sm max-w-xs">
          Ligue empregadores a profissionais qualificados de construção civil em Portugal
        </p>
      </div>

      {/* Wave divider */}
      <div className="relative -mt-8 bg-white">
        <svg viewBox="0 0 1440 80" className="w-full fill-white" preserveAspectRatio="none" style={{ marginTop: '-2px' }}>
          <path d="M0,80 C360,0 1080,0 1440,80 L1440,80 L0,80 Z" />
        </svg>
      </div>

      {/* Features */}
      <div className="flex-1 px-6 -mt-4">
        <h2 className="text-xl font-bold text-gray-900 mb-5 text-center">Tudo o que precisa numa só plataforma</h2>
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-8">
          {features.map((f, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-2 border border-gray-100">
              <div className="w-10 h-10 bg-[#F26522]/10 rounded-xl flex items-center justify-center">
                <f.icon className="w-5 h-5 text-[#F26522]" />
              </div>
              <p className="font-semibold text-sm text-gray-900">{f.label}</p>
              <p className="text-xs text-gray-500 leading-snug">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="flex justify-center gap-6 mb-10 text-center">
          <div>
            <p className="text-2xl font-black text-[#F26522]">2k+</p>
            <p className="text-xs text-gray-500">Profissionais</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div>
            <p className="text-2xl font-black text-[#F26522]">5k+</p>
            <p className="text-xs text-gray-500">Obras concluídas</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div>
            <p className="text-2xl font-black text-[#F26522]">4.9★</p>
            <p className="text-xs text-gray-500">Avaliação média</p>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="px-6 pb-10 space-y-3 max-w-sm mx-auto w-full">
        <Button
          onClick={() => base44.auth.redirectToLogin(createPageUrl("SetupProfile"))}
          className="w-full h-14 bg-[#F26522] hover:bg-orange-600 text-white font-bold rounded-2xl text-base shadow-xl shadow-[#F26522]/30 flex items-center justify-center gap-2"
        >
          Entrar na plataforma
          <ArrowRight className="w-5 h-5" />
        </Button>
        <Button
          onClick={() => base44.auth.redirectToLogin(createPageUrl("SetupProfile"))}
          variant="outline"
          className="w-full h-12 border-2 border-[#F26522] text-[#F26522] font-bold rounded-2xl text-base hover:bg-orange-50"
        >
          Criar conta gratuita
        </Button>
        <p className="text-center text-xs text-gray-400 mt-2">
          Ao continuar, aceita os nossos <span className="underline cursor-pointer">Termos de Serviço</span>
        </p>
      </div>
    </div>
  );
}