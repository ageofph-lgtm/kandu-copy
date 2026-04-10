import React, { useEffect, useState } from "react";
import { useTheme } from "@/lib/ThemeContext";
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
  const { isDark } = useTheme();
  const bg = isDark ? "#111016" : "#FFFFFF";
  const text = isDark ? "#FFFFFF" : "#111016";
  const subtext = isDark ? "#AAAAAA" : "#666666";
  const logoH = isDark
    ? "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/90321a683_Gemini_Generated_Image_k4rh2gk4rh2gk4rh.png"
    : "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/002158942_Gemini_Generated_Image_5.png";
  const logoIcon = isDark
    ? "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/f0a8b458b_Gemini_Generated_Image_nn24elnn24elnn24-Photoroom.png"
    : "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png";
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
      <div style={{minHeight:"100vh", background:bg, display:"flex", alignItems:"center", justifyContent:"center"}}>
        <img src={logoIcon} style={{width:80, height:80, objectFit:"contain", borderRadius:12, animation:"spin 2s linear infinite"}} alt="KANDU" />
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh", background:bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:28, gap:20, position:"relative", overflow:"hidden"}}>
      {/* Hex pattern fundo */}
      <div style={{position:"absolute", inset:0, backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52'%3E%3Cpolygon points='30,2 58,17 58,47 30,62 2,47 2,17' fill='none' stroke='%23FF6600' stroke-width='0.5' opacity='0.3'/%3E%3C/svg%3E\")", backgroundRepeat:"repeat", opacity:0.4, pointerEvents:"none"}} />

      {/* Logo */}
      <img src={logoH} style={{height:44, maxWidth:200, objectFit:"contain", position:"relative", zIndex:1}} alt="KANDU" />

      {/* Headline */}
      <div style={{textAlign:"center", position:"relative", zIndex:1}}>
        <h1 style={{fontSize:28, fontWeight:800, color:text, margin:"0 0 8px"}}>Find work. Find workers.</h1>
        <p style={{fontSize:15, color:subtext, margin:0}}>Lisboa e arredores</p>
      </div>

      {/* Botões */}
      <div style={{width:"100%", maxWidth:400, display:"flex", flexDirection:"column", gap:12, position:"relative", zIndex:1}}>
        <button
          onClick={() => base44.auth.redirectToLogin(createPageUrl("SetupProfile"))}
          style={{width:"100%", padding:16, background:"#FF6600", border:"none", borderRadius:14, color:"#FFF", fontWeight:700, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10}}
        >
          🔧 Sou Profissional
        </button>
        <button
          onClick={() => base44.auth.redirectToLogin(createPageUrl("SetupProfile"))}
          style={{width:"100%", padding:16, background:"transparent", border:"2px solid #FF6600", borderRadius:14, color:"#FFF", fontWeight:700, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10}}
        >
          💼 Preciso de Profissional
        </button>
      </div>

      {/* RGPD */}
      <p style={{fontSize:11, color:"#555", textAlign:"center", position:"relative", zIndex:1, maxWidth:300}}>
        Ao continuar, aceitas os Termos e Política de Privacidade (RGPD)
      </p>
    </div>
  );
}