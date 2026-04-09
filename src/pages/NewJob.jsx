import React, { useState, useEffect } from "react";
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

  const inputStyle = {width:"100%",padding:14,background:"#2A2A2A",border:"2px solid #FF6600",borderRadius:12,color:"#FFF",boxSizing:"border-box",fontSize:15,outline:"none"};
  const labelStyle = {color:"#AAAAAA",fontSize:13,fontWeight:600,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:8};
  const sectionStyle = {borderBottom:"3px solid #FF6600",padding:"16px 20px"};
  const FORM_CATS = ["Pintura","Eletricidade","Canalização","Alvenaria","Carpintaria","Pavimentos","Telhados","Remodeolação"];

  if (!user) {
    return (
      <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#1A1A1A"}}>
        <img src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png" style={{width:60,animation:"pulse 1.5s infinite"}} alt="" />
      </div>
    );
  }

  return (
    <div style={{background:"#1A1A1A",minHeight:"100vh",paddingBottom:100}}>

      {/* Top Bar */}
      <div style={{padding:"50px 20px 12px",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={() => navigate(-1)} style={{background:"none",border:"none",color:"#FF6600",fontSize:22,cursor:"pointer",padding:0}}>←</button>
        <h1 style={{fontWeight:700,color:"#FFF",flex:1,textAlign:"center",margin:0,fontSize:18}}>Nova Obra</h1>
        <span style={{width:22}} />
      </div>

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
              style={{background:formData.category===cat.name?"#FF6600":"#2A2A2A",color:formData.category===cat.name?"#FFF":"#AAAAAA",borderRadius:20,padding:"8px 14px",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Preço */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Tipo de Preço</label>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          {[{value:'fixed',label:'Projeto'},{value:'hourly',label:'Hora'},{value:'negotiable',label:'Negociável'}].map(pt => (
            <button key={pt.value} onClick={() => set("price_type",pt.value)}
              style={{flex:1,padding:"10px 0",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:formData.price_type===pt.value?"#FF6600":"#2A2A2A",color:formData.price_type===pt.value?"#FFF":"#AAAAAA"}}>
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
              <p style={{color:"#AAAAAA",fontSize:12,margin:0}}>Preço médio para {formData.category}: €{priceSuggestion.min}–€{priceSuggestion.max}</p>
              <button onClick={() => set("price",String(priceSuggestion.avg))} style={{background:"none",border:"none",color:"#FF6600",fontSize:12,fontWeight:600,cursor:"pointer",padding:0,marginTop:4}}>Usar média: €{priceSuggestion.avg}</button>
            </div>
          </div>
        )}
      </div>

      {/* Localização */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Localização</label>
        <div style={{display:"flex",alignItems:"center",gap:10,background:"#2A2A2A",border:"2px solid #FF6600",borderRadius:12,padding:"0 14px"}}>
          <span style={{color:"#FF6600",fontSize:18,flexShrink:0}}>📍</span>
          <select value={formData.location} onChange={e => set("location",e.target.value)}
            style={{flex:1,background:"transparent",border:"none",color:formData.location?"#FFF":"#888",fontSize:15,padding:"14px 0",outline:"none"}}>
            <option value="" style={{background:"#2A2A2A"}}>Selecione a localização</option>
            {Object.keys(LOCATION_COORDS).map(loc => (
              <option key={loc} value={loc} style={{background:"#2A2A2A"}}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Urgência */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Urgência</label>
        <div style={{display:"flex",gap:8}}>
          {[{value:'low',label:'🟢 Baixa'},{value:'medium',label:'🟡 Média'},{value:'high',label:'🔴 Alta'}].map(u => (
            <button key={u.value} onClick={() => set("urgency",u.value)}
              style={{flex:1,padding:"10px 0",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:formData.urgency===u.value?"#FF6600":"#2A2A2A",color:formData.urgency===u.value?"#FFF":"#AAAAAA"}}>
              {u.label}
            </button>
          ))}
        </div>
      </div>

      {/* Datas */}
      <div style={sectionStyle}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div>
            <label style={labelStyle}>Data Início</label>
            <input type="date" value={formData.start_date} onChange={e => set("start_date",e.target.value)} style={{...inputStyle,colorScheme:"dark"}} />
          </div>
          <div>
            <label style={labelStyle}>Data Fim</label>
            <input type="date" value={formData.end_date} onChange={e => set("end_date",e.target.value)} style={{...inputStyle,colorScheme:"dark"}} />
          </div>
        </div>
      </div>

      {/* Descrição */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Descrição</label>
        <textarea placeholder="Descreva em detalhe o trabalho a realizar..." value={formData.description} onChange={e => set("description",e.target.value)}
          style={{background:"#2A2A2A",border:"2px solid #FF6600",borderRadius:12,padding:14,color:"#FFF",resize:"none",height:100,width:"100%",boxSizing:"border-box",fontSize:15,outline:"none"}} />
      </div>

      {/* Sticky CTA */}
      <div style={{position:"sticky",bottom:0,background:"#1A1A1A",padding:"16px 20px"}}>
        <button onClick={handlePublish}
          disabled={!formData.title.trim() || !formData.category || !formData.location || !formData.price || isSubmitting}
          style={{width:"100%",padding:16,background:(!formData.title.trim()||!formData.category||!formData.location||!formData.price||isSubmitting)?"#333":"#FF6600",border:"none",borderRadius:14,color:"#FFF",fontWeight:700,fontSize:16,cursor:(!formData.title.trim()||!formData.category||!formData.location||!formData.price||isSubmitting)?"default":"pointer"}}>
          {isSubmitting ? "A publicar..." : "Publicar Obra"}
        </button>
      </div>
    </div>
  );
}