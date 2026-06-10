import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";
import LanguageSelector from "@/components/utils/LanguageSelector";
import { SUPPORTED_LANGUAGES } from "@/lib/LanguageContext";
import { useTheme } from "@/lib/ThemeContext";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Wrench, Briefcase, Star, Shield } from "lucide-react";

const features = [
  { icon: Briefcase, label: "Publique obras", desc: "Encontre o profissional certo para cada trabalho" },
  { icon: Wrench, label: "Seja contratado", desc: "Candidate-se a obras e mostre o seu talento" },
  { icon: Star, label: "Avaliações reais", desc: "Transparência e confiança em cada projeto" },
  { icon: Shield, label: "Plataforma segura", desc: "Pagamentos e dados protegidos" },
];

export default function Welcome() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { lang, setLang } = useLanguage();
  const [showLangPicker, setShowLangPicker] = useState(() => !localStorage.getItem("kandu_lang"));
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

  // Mostrar selector de idioma se o utilizador ainda não escolheu
  if (showLangPicker) {
    return (
      <div style={{minHeight:"100vh",background:"#111016",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",textAlign:"center"}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:"#F4621F",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,fontWeight:900,color:"#fff",marginBottom:28,boxShadow:"0 0 32px rgba(244,98,31,0.4)"}}>K</div>
        <h1 style={{fontSize:26,fontWeight:800,color:"#fff",marginBottom:8}}>{t(lang,"chooseLanguage")}</h1>
        <p style={{fontSize:13,color:"#666",marginBottom:36,maxWidth:280}}>Escolha · Select · Seleccione · Choisissez · Wählen Sie · भाषा चुनें · زبان چنیں</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,width:"100%",maxWidth:360}}>
          {SUPPORTED_LANGUAGES.map((l) => (
            <button key={l.code} onClick={() => { setLang(l.code); setShowLangPicker(false); }}
              style={{display:"flex",alignItems:"center",gap:10,padding:"13px 14px",borderRadius:14,border:"1px solid #222",background:"#1a1a1a",color:"#ccc",fontSize:14,cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all 0.18s"}}
              onMouseOver={e=>{e.currentTarget.style.borderColor="#F4621F";e.currentTarget.style.color="#F4621F";}}
              onMouseOut={e=>{e.currentTarget.style.borderColor="#222";e.currentTarget.style.color="#ccc";}}
            >
              <span style={{fontSize:22,flexShrink:0}}>{l.flag}</span>
              <div><div style={{fontWeight:700,fontSize:13,lineHeight:1.2}}>{l.label}</div></div>
            </button>
          ))}
        </div>
      </div>
    );
  }

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
        <h1 style={{fontSize:28, fontWeight:800, color:text, margin:"0 0 8px"}}>{t(lang,"welcomeTagline")}</h1>
        <p style={{fontSize:15, color:subtext, margin:0}}>{t(lang,"lisboaArea")}</p>
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