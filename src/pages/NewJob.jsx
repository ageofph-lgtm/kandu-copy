import React, { useState, useEffect } from "react";
import { useTheme } from "@/lib/ThemeContext";
import LoadingScreen from "@/components/LoadingScreen";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Check, MapPin, Info } from "lucide-react";

import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CATEGORIES = [
  { name: "Pintura", icon: "🎨" },
  { name: "Eletricidade", icon: "⚡" },
  { name: "Canalização", icon: "🔧" },
  { name: "Alvenaria", icon: "🧱" },
  { name: "Ladrilhador", icon: "🔲" },
  { name: "Carpintaria", icon: "🪚" },
  { name: "Climatização", icon: "❄️" },
  { name: "Isolamentos", icon: "🏗️" },
  { name: "Pavimentos", icon: "🏠" },
  { name: "Telhados", icon: "🏘️" },
];

const LOCATION_COORDS = {
  "Lisboa - Centro": { lat: 38.713, lon: -9.139 },
  "Lisboa - Arroios": { lat: 38.73, lon: -9.135 },
  "Lisboa - Estrela": { lat: 38.712, lon: -9.16 },
  "Lisboa - Baixa": { lat: 38.71, lon: -9.138 },
  "Lisboa - Chiado": { lat: 38.711, lon: -9.143 },
  "Lisboa - Bairro Alto": { lat: 38.712, lon: -9.145 },
  "Lisboa - Príncipe Real": { lat: 38.716, lon: -9.15 },
  "Lisboa - Campo de Ourique": { lat: 38.715, lon: -9.165 },
  "Lisboa - Avenidas Novas": { lat: 38.736, lon: -9.153 },
  "Porto - Centro": { lat: 41.15, lon: -8.61 },
  "Braga": { lat: 41.55, lon: -8.42 },
  "Coimbra": { lat: 40.21, lon: -8.42 },
  "Aveiro": { lat: 40.64, lon: -8.65 }
};

const PRICE_SUGGESTIONS = {
  "Pintura":     { min: 300,  max: 2000, avg: 800  },
  "Eletricidade":{ min: 150,  max: 1500, avg: 500  },
  "Canalização": { min: 200,  max: 2000, avg: 600  },
  "Alvenaria":   { min: 500,  max: 5000, avg: 1500 },
  "Ladrilhador": { min: 300,  max: 3000, avg: 800  },
  "Carpintaria": { min: 200,  max: 2500, avg: 700  },
  "Climatização":{ min: 400,  max: 3000, avg: 1000 },
  "Isolamentos": { min: 500,  max: 4000, avg: 1200 },
  "Pavimentos":  { min: 800,  max: 6000, avg: 2000 },
  "Telhados":    { min: 1000, max: 8000, avg: 3000 },
};

const STEP_LABELS = ["O Quê", "Onde & Quando", "Orçamento", "Revisão"];

export default function NewJob() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const bg = isDark ? "#111016" : "#FFFFFF";
  const surface = isDark ? "#1C1B22" : "#F5F5F5";
  const text = isDark ? "#FFFFFF" : "#111016";
  const subtext = isDark ? "#AAAAAA" : "#666666";
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "", category: "", description: "",
    location: "", start_date: "", end_date: "",
    price_type: "fixed", price: "", urgency: "medium"
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await User.me();
        if (userData.user_type !== 'employer' && userData.user_type !== 'admin') {
          navigate(createPageUrl("Home"));
          return;
        }
        setUser(userData);
      } catch {
        navigate(createPageUrl("Home"));
      }
    };
    loadUser();
  }, [navigate]);

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const canGoNext = () => {
    if (step === 1) return formData.title.trim() && formData.category && formData.description.trim();
    if (step === 2) return !!formData.location;
    if (step === 3) return !!formData.price;
    return true;
  };

  const handlePublish = () => {
    handleSubmit();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const coords = LOCATION_COORDS[formData.location];
      await Job.create({
        ...formData,
        price: parseFloat(formData.price),
        employer_id: user.id,
        latitude: coords.lat + (Math.random() - 0.5) * 0.005,
        longitude: coords.lon + (Math.random() - 0.5) * 0.005,
        views: 0,
        status: "open"
      });
      navigate(createPageUrl("MyJobs"));
    } catch (error) {
      console.error("Error:", error);
      alert("Erro ao publicar obra.");
    }
    setIsSubmitting(false);
  };

  const priceSuggestion = formData.category ? PRICE_SUGGESTIONS[formData.category] : null;
  const catIcon = CATEGORIES.find(c => c.name === formData.category)?.icon || "";

  const inputStyle = {width:"100%",padding:14,background:surface,border:"2px solid #FF6600",borderRadius:12,color:text,boxSizing:"border-box",fontSize:15,outline:"none"};
  const labelStyle = {color:subtext,fontSize:13,fontWeight:600,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:8};
  const sectionStyle = {borderBottom:`3px solid #FF6600`,padding:"16px 20px"};
  const FORM_CATS = ["Pintura","Eletricidade","Canalização","Alvenaria","Carpintaria","Pavimentos","Telhados","Remodeolação"];

  if (!user) {
    return <LoadingScreen label="A carregar..." />;
  }

  return (
    <div style={{background:bg,minHeight:"100vh",paddingBottom:100}}>
      <style>{`
        input::placeholder, textarea::placeholder { color: ${isDark ? "#666" : "#AAAAAA"} !important; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: ${isDark ? "invert(1)" : "none"}; }
        select option { background: ${surface}; color: ${text}; }
      `}</style>

      {/* Top Bar */}
      <div style={{padding:"14px 20px 8px"}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:8}}>
          <img src={isDark ? "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/90321a683_Gemini_Generated_Image_k4rh2gk4rh2gk4rh.png" : "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/002158942_Gemini_Generated_Image_5.png"} alt="KANDU" style={{height:24,objectFit:"contain"}} />
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
        <button onClick={() => navigate(-1)} style={{background:"none",border:"none",color:"#FF6600",fontSize:22,cursor:"pointer",padding:0}}>←</button>
        <h1 style={{fontWeight:700,color:text,flex:1,textAlign:"center",margin:0,fontSize:18}}>Nova Obra</h1>
        <span style={{width:22}} />
      </div>
      </div>

      {/* Progress Bar */}
      <div style={{padding:"8px 20px 16px"}}>
        <div style={{display:"flex",gap:6,marginBottom:6}}>
          {STEP_LABELS.map((label,i) => (
            <div key={i} style={{flex:1,height:4,borderRadius:4,background:i<step?"#FF6600":i===step-1?"#FF6600":isDark?"#333":"#DDDDDD"}} />
          ))}
        </div>
        <p style={{color:subtext,fontSize:12,textAlign:"center"}}>Passo {step} de {STEP_LABELS.length}: <strong style={{color:"#FF6600"}}>{STEP_LABELS[step-1]}</strong></p>
      </div>

      {/* Step 1: O Quê */}
      {step === 1 && (
        <>
          {/* Título */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Título da Obra</label>
            <input placeholder="Ex: Pintar apartamento T2" value={formData.title} onChange={e => set("title",e.target.value)} style={inputStyle} />
          </div>

          {/* Categoria */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Categoria</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {CATEGORIES.map(cat => (
                <button key={cat.name} onClick={() => set("category",cat.name)}
                  style={{background:formData.category===cat.name?"#FF6600":surface,color:formData.category===cat.name?"#FFF":subtext,borderRadius:20,padding:"8px 14px",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Descrição</label>
            <textarea placeholder="Descreva em detalhe o trabalho a realizar..." value={formData.description} onChange={e => set("description",e.target.value)}
              style={{background:surface,border:"2px solid #FF6600",borderRadius:12,padding:14,color:text,resize:"none",height:100,width:"100%",boxSizing:"border-box",fontSize:15,outline:"none"}} />
          </div>
        </>
      )}

      {/* Step 2: Onde & Quando */}
      {step === 2 && (
        <>
          {/* Localização */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Localização</label>
            <div style={{display:"flex",alignItems:"center",gap:10,background:surface,border:"2px solid #FF6600",borderRadius:12,padding:"0 14px"}}>
              <span style={{color:"#FF6600",fontSize:18,flexShrink:0}}>📍</span>
              <select value={formData.location} onChange={e => set("location",e.target.value)}
                style={{flex:1,background:"transparent",border:"none",color:formData.location?text:subtext,fontSize:15,padding:"14px 0",outline:"none"}}>
                <option value="" style={{background:surface,color:text}}>Selecione a localização</option>
                {Object.keys(LOCATION_COORDS).map(loc => (
                  <option key={loc} value={loc} style={{background:surface,color:text}}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Datas */}
          <div style={sectionStyle}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <label style={labelStyle}>Data Início</label>
                <input type="date" value={formData.start_date} onChange={e => set("start_date",e.target.value)} style={{...inputStyle,colorScheme:isDark?"dark":"light"}} />
              </div>
              <div>
                <label style={labelStyle}>Data Fim</label>
                <input type="date" value={formData.end_date} onChange={e => set("end_date",e.target.value)} style={{...inputStyle,colorScheme:isDark?"dark":"light"}} />
              </div>
            </div>
          </div>

          {/* Urgência */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Urgência</label>
            <div style={{display:"flex",gap:8}}>
              {[{value:'low',label:'🟢 Baixa'},{value:'medium',label:'🟡 Média'},{value:'high',label:'🔴 Alta'}].map(u => (
                <button key={u.value} onClick={() => set("urgency",u.value)}
                  style={{flex:1,padding:"10px 0",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:formData.urgency===u.value?"#FF6600":surface,color:formData.urgency===u.value?"#FFF":subtext}}>
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Step 3: Orçamento */}
      {step === 3 && (
        <div style={sectionStyle}>
          <label style={labelStyle}>Tipo de Preço</label>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            {[{value:'fixed',label:'Projeto'},{value:'hourly',label:'Hora'},{value:'negotiable',label:'Negociável'}].map(pt => (
              <button key={pt.value} onClick={() => set("price_type",pt.value)}
                style={{flex:1,padding:"10px 0",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:formData.price_type===pt.value?"#FF6600":surface,color:formData.price_type===pt.value?"#FFF":subtext}}>
                {pt.label}
              </button>
            ))}
          </div>
          <label style={labelStyle}>Valor (€){formData.price_type==='hourly'?' / hora':''}</label>
          <input type="number" inputMode="numeric" placeholder="0" value={formData.price} onChange={e => set("price",e.target.value)} style={inputStyle} />
          {priceSuggestion && (
            <div style={{background:"#FF660011",border:"1px solid #FF660033",borderRadius:10,padding:12,display:"flex",gap:8,marginTop:10,alignItems:"flex-start"}}>
              <span style={{fontSize:16}}>&#x2139;&#xFE0F;</span>
              <div>
                <p style={{color:subtext,fontSize:12,margin:0}}>Preço médio para {formData.category}: €{priceSuggestion.min}–€{priceSuggestion.max}</p>
                <button onClick={() => set("price",String(priceSuggestion.avg))} style={{background:"none",border:"none",color:"#FF6600",fontSize:12,fontWeight:600,cursor:"pointer",padding:0,marginTop:4}}>Usar média: €{priceSuggestion.avg}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Revisão */}
      {step === 4 && (
        <div style={{padding:"20px"}}>
          <div style={{background:surface,borderRadius:16,padding:20,marginBottom:20}}>
            <h2 style={{color:text,fontWeight:700,fontSize:18,margin:"0 0 16px"}}>Revisão da Obra</h2>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div>
                <p style={{color:subtext,fontSize:12,margin:"0 0 4px"}}>Título</p>
                <p style={{color:text,fontWeight:600,fontSize:15,margin:0}}>{formData.title}</p>
              </div>
              <div>
                <p style={{color:subtext,fontSize:12,margin:"0 0 4px"}}>Categoria</p>
                <p style={{color:text,fontWeight:600,fontSize:15,margin:0}}>{formData.category}</p>
              </div>
              <div>
                <p style={{color:subtext,fontSize:12,margin:"0 0 4px"}}>Localização</p>
                <p style={{color:text,fontWeight:600,fontSize:15,margin:0}}>{formData.location}</p>
              </div>
              <div>
                <p style={{color:subtext,fontSize:12,margin:"0 0 4px"}}>Preço</p>
                <p style={{color:"#FF6600",fontWeight:700,fontSize:16,margin:0}}>€{formData.price} {formData.price_type==='hourly'?'/h':''}</p>
              </div>
              <div>
                <p style={{color:subtext,fontSize:12,margin:"0 0 4px"}}>Urgência</p>
                <p style={{color:text,fontWeight:600,fontSize:15,margin:0}}>{formData.urgency==='low'?'🟢 Baixa':formData.urgency==='high'?'🔴 Alta':'🟡 Média'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{padding:"16px 20px",position:"sticky",bottom:0,background:bg,borderTop:"1px solid #333",display:"flex",gap:12}}>
        {step > 1 && (
          <button onClick={() => setStep(s => s-1)}
            style={{flex:1,padding:"14px 0",background:"transparent",border:`1px solid ${isDark?"#444":"#CCCCCC"}`,borderRadius:14,color:subtext,fontWeight:700,fontSize:15,cursor:"pointer"}}>
            ← Anterior
          </button>
        )}
        {step < 4 ? (
          <button onClick={() => canGoNext() && setStep(s => s+1)} disabled={!canGoNext()}
            style={{flex:1,padding:"14px 0",background:canGoNext()?"#FF6600":"#333",border:"none",borderRadius:14,color:canGoNext()?"#FFF":"#555",fontWeight:700,fontSize:15,cursor:canGoNext()?"pointer":"not-allowed"}}>
            Próximo →
          </button>
        ) : (
          <button onClick={handlePublish} disabled={isSubmitting}
            style={{flex:1,padding:"14px 0",background:isSubmitting?"#555":"#FF6600",border:"none",borderRadius:14,color:"#FFF",fontWeight:700,fontSize:15,cursor:isSubmitting?"not-allowed":"pointer"}}>
            {isSubmitting ? "A publicar..." : "🚀 Publicar Obra"}
          </button>
        )}
      </div>
    </div>
  );
}