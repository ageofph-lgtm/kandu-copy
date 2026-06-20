import { toast } from "sonner";
import { Job, User } from "@/api/entities";
import { useState, useEffect } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";
import LoadingScreen from "@/components/LoadingScreen";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

// pt = valor canónico do enum Job.category na entidade (a DB está em PT);
// key = chave i18n usada apenas para exibição.
const CATEGORY_KEYS = [
  { key: "painting",      pt: "Pintura",              icon: "🎨" },
  { key: "electricity",   pt: "Eletricidade",         icon: "⚡" },
  { key: "plumbing",      pt: "Canalização",          icon: "🔧" },
  { key: "masonry",       pt: "Alvenaria",             icon: "🧱" },
  { key: "tiling",        pt: "Azulejista",            icon: "🔲" },
  { key: "carpentry",     pt: "Carpintaria",           icon: "🪚" },
  { key: "hvac",          pt: "Climatização",          icon: "❄️" },
  { key: "metalwork",     pt: "Serralharia",           icon: "🔩" },
  { key: "gardening",     pt: "Jardinagem",            icon: "🌿" },
  { key: "waterproofing", pt: "Impermeabilizador",     icon: "💧" },
  { key: "plastering",    pt: "Estucador",             icon: "🏗️" },
  { key: "scaffolding",   pt: "Montador de Andaimes",  icon: "🏛️" },
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

const LOCATION_LIST = Object.keys(LOCATION_COORDS);

const PRICE_SUGGESTIONS_BY_KEY = {
  painting:     { min: 300,  max: 2000, avg: 800  },
  electricity:  { min: 150,  max: 1500, avg: 500  },
  plumbing:     { min: 200,  max: 2000, avg: 600  },
  masonry:      { min: 500,  max: 5000, avg: 1500 },
  tiling:       { min: 300,  max: 3000, avg: 800  },
  carpentry:    { min: 200,  max: 2500, avg: 700  },
  hvac:         { min: 400,  max: 3000, avg: 1000 },
  insulation:   { min: 500,  max: 4000, avg: 1200 },
  flooring:     { min: 800,  max: 6000, avg: 2000 },
  roofing:      { min: 1000, max: 8000, avg: 3000 },
};

const STEP_LABELS = [
  { key: "stepWhat", pt: "O Quê" },
  { key: "stepWhereWhen", pt: "Onde & Quando" },
  { key: "stepBudget", pt: "Orçamento" },
  { key: "stepReview", pt: "Revisão" },
];

// ─── Modal de Confirmação custom (substitui window.confirm) ───────────────────
function ConfirmPublishModal({ job, onConfirm, onCancel, isDark, text, subtext }) {
  const { lang } = useLanguage();
  const bg = "var(--surface2)";
  const surface = isDark ? "#2A2A2A" : "#F5F5F5";
  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:9999,
      display:"flex",alignItems:"center",justifyContent:"center",padding:20
    }}>
      <div style={{background:bg,borderRadius:20,padding:24,maxWidth:360,width:"100%",border:"1px solid #FF6600"}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <span style={{fontSize:40}}>🚀</span>
          <h2 style={{color:text,fontWeight:700,fontSize:18,margin:"10px 0 6px"}}>{t(lang,"jobTitle")}?</h2>
          <p style={{color:subtext,fontSize:14,margin:0}}>{t(lang,"jobVisibleToAll","A obra ficará visível para todos os profissionais na plataforma.")}</p>
        </div>
        <div style={{background:surface,borderRadius:12,padding:14,marginBottom:20}}>
          <p style={{fontWeight:700,color:"#FF6600",margin:"0 0 4px",fontSize:15}}>{job.title}</p>
          <p style={{color:subtext,fontSize:13,margin:0}}>📍 {job.location} · 💶 €{job.price}</p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onCancel}
            style={{flex:1,padding:"12px 0",background:"transparent",border:"1px solid #444",borderRadius:12,color:subtext,fontWeight:600,fontSize:14,cursor:"pointer"}}>
            {t(lang,"review","Rever")}
          </button>
          <button onClick={onConfirm}
            style={{flex:1,padding:"12px 0",background:"#FF6600",border:"none",borderRadius:12,color:"#FFF",fontWeight:700,fontSize:14,cursor:"pointer"}}>
            {t(lang,"publish","Publicar")} ✓
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewJob() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { lang } = useLanguage();
  const bg = "var(--base)";
  const surface = "var(--surface2)";
  const text = "var(--text)";
  const subtext = "var(--text2)";
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    title: "", category: "", categoryKey: "", description: "",
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

  // BUG FIX: status agora é "open" para aparecer na busca dos profissionais
  const handleSubmit = async () => {
    setShowConfirm(false);
    setIsSubmitting(true);
    try {
      const coords = LOCATION_COORDS[formData.location];
      // categoryKey é só estado de UI — não pertence à entidade Job
      const { categoryKey: _categoryKey, ...jobData } = formData;
      await Job.create({
        ...jobData,
        price: parseFloat(formData.price),
        employer_id: user.id,
        latitude: coords.lat + (Math.random() - 0.5) * 0.005,
        longitude: coords.lon + (Math.random() - 0.5) * 0.005,
        views: 0,
        status: "open"  // FIX: era "pending_employer", profissionais não viam a obra
      });
      navigate(createPageUrl("MyJobs"));
    } catch (error) {
      console.error("Error:", error);
      toast.error(t(lang,"errorPublishingJob","Erro ao publicar obra."));
    }
    setIsSubmitting(false);
  };

  const CATEGORIES = CATEGORY_KEYS.map(c => ({ name: t(lang, c.key, c.pt), pt: c.pt, icon: c.icon, key: c.key }));
  const priceSuggestion = formData.categoryKey ? PRICE_SUGGESTIONS_BY_KEY[formData.categoryKey] : null;
  const selectedCat = CATEGORIES.find(c => c.pt === formData.category);
  const catIcon = selectedCat?.icon || "";

  const inputStyle = {width:"100%",padding:14,background:surface,border:"2px solid #FF6600",borderRadius:12,color:text,boxSizing:"border-box",fontSize:15,outline:"none"};
  const labelStyle = {color:subtext,fontSize:13,fontWeight:600,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:8};
  const sectionStyle = {borderBottom:`1px solid ${isDark?"#222":"#EEEEEE"}`,padding:"16px 20px"};

  if (!user) {
    return <LoadingScreen label={t(lang,"loading")} />;
  }

  return (
    <div style={{background:bg,minHeight:"100vh",paddingBottom:100}}>
      {showConfirm && (
        <ConfirmPublishModal
          job={formData}
          onConfirm={handleSubmit}
          onCancel={() => setShowConfirm(false)}
          isDark={isDark} text={text} subtext={subtext}
        />
      )}

      <style>{`
        input::placeholder, textarea::placeholder { color: ${isDark ? "#666" : "#AAAAAA"} !important; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: ${isDark ? "invert(1)" : "none"}; }
      `}</style>

      {/* Top Bar */}
      <div style={{padding:"14px 20px 8px"}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:8}}>
          <img src={isDark ? "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/90321a683_Gemini_Generated_Image_k4rh2gk4rh2gk4rh.png" : "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/002158942_Gemini_Generated_Image_5.png"} alt="KANDU" style={{height:24,objectFit:"contain"}} />
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={() => navigate(-1)} style={{background:"none",border:"none",color:"#FF6600",fontSize:22,cursor:"pointer",padding:0}}>←</button>
          <h1 style={{fontWeight:700,color:text,flex:1,textAlign:"center",margin:0,fontSize:18}}>{t(lang,"jobTitle")}</h1>
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
        <p style={{color:subtext,fontSize:12,textAlign:"center"}}>{t(lang,"stepXofY","Passo {step} de {total}").replace("{step}", step).replace("{total}", STEP_LABELS.length)}: <strong style={{color:"#FF6600"}}>{t(lang, STEP_LABELS[step-1].key, STEP_LABELS[step-1].pt)}</strong></p>
      </div>

      {/* Step 1: O Quê */}
      {step === 1 && (
        <>
          <div style={sectionStyle}>
            <label style={labelStyle}>{t(lang,"jobTitle","Título da Obra")}</label>
            <input placeholder={t(lang,"jobTitlePlaceholder","Ex: Pintar apartamento T2")} value={formData.title} onChange={e => set("title",e.target.value)} style={inputStyle} />
          </div>
          <div style={sectionStyle}>
            <label style={labelStyle}>{t(lang,"category")}</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {CATEGORIES.map(cat => (
                <button key={cat.pt} onClick={() => { set("category", cat.pt); set("categoryKey", cat.key); }}
                  style={{background:formData.category===cat.pt?"#FF6600":surface,color:formData.category===cat.pt?"#FFF":subtext,borderRadius:20,padding:"8px 14px",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>
          <div style={sectionStyle}>
            <label style={labelStyle}>{t(lang,"description")}</label>
            <textarea placeholder={t(lang,"jobDescriptionPlaceholder","Descreva em detalhe o trabalho a realizar...")} value={formData.description} onChange={e => set("description",e.target.value)}
              style={{background:surface,border:"2px solid #FF6600",borderRadius:12,padding:14,color:text,resize:"none",height:100,width:"100%",boxSizing:"border-box",fontSize:15,outline:"none"}} />
          </div>
        </>
      )}

      {/* Step 2: Onde & Quando — FIX: botões em vez de <select> nativo */}
      {step === 2 && (
        <>
          <div style={sectionStyle}>
            <label style={labelStyle}>📍 {t(lang,"location")}</label>
            <p style={{color:subtext,fontSize:13,margin:"0 0 12px"}}>{t(lang,"tapToSelectZone","Toque para selecionar a zona da obra:")}</p>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {LOCATION_LIST.map(loc => (
                <button key={loc} onClick={() => set("location", loc)}
                  style={{
                    padding:"14px 16px",
                    background:formData.location===loc?"#FF6600":surface,
                    border: formData.location===loc?"2px solid #FF6600":`2px solid ${isDark?"#333":"#DDDDDD"}`,
                    borderRadius:12,
                    color:formData.location===loc?"#FFF":text,
                    fontWeight:formData.location===loc?700:400,
                    fontSize:15,
                    cursor:"pointer",
                    textAlign:"left",
                    display:"flex",
                    alignItems:"center",
                    gap:10
                  }}>
                  <span style={{fontSize:16}}>📍</span>
                  {loc}
                  {formData.location===loc && <span style={{marginLeft:"auto",fontSize:18}}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <label style={labelStyle}>{t(lang,"startDate")}</label>
                <input type="date" value={formData.start_date} onChange={e => set("start_date",e.target.value)} style={{...inputStyle,colorScheme:isDark?"dark":"light"}} />
              </div>
              <div>
                <label style={labelStyle}>{t(lang,"endDate","Data Fim")}</label>
                <input type="date" value={formData.end_date} onChange={e => set("end_date",e.target.value)} style={{...inputStyle,colorScheme:isDark?"dark":"light"}} />
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <label style={labelStyle}>{t(lang,"urgency","Urgência")}</label>
            <div style={{display:"flex",gap:8}}>
              {[{value:'low',label:`🟢 ${t(lang,"urgencyLow","Baixa")}`},{value:'medium',label:`🟡 ${t(lang,"urgencyMedium","Média")}`},{value:'high',label:`🔴 ${t(lang,"urgencyHigh","Alta")}`}].map(u => (
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
          <label style={labelStyle}>{t(lang,"priceType","Tipo de Preço")}</label>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            {[{value:'fixed',label:t(lang,"priceProject","Projeto")},{value:'hourly',label:t(lang,"priceHour","Hora")},{value:'negotiable',label:t(lang,"priceNegotiable","Negociável")}].map(pt => (
              <button key={pt.value} onClick={() => set("price_type",pt.value)}
                style={{flex:1,padding:"10px 0",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:formData.price_type===pt.value?"#FF6600":surface,color:formData.price_type===pt.value?"#FFF":subtext}}>
                {pt.label}
              </button>
            ))}
          </div>
          <label style={labelStyle}>{t(lang,"priceValue","Valor (€)")}{formData.price_type==='hourly'?` ${t(lang,"perHour","/ hora")}`:''}</label>
          <input type="number" inputMode="numeric" placeholder="0" value={formData.price} onChange={e => set("price",e.target.value)} style={inputStyle} />
          {priceSuggestion && (
            <div style={{background:"#FF660011",border:"1px solid #FF660033",borderRadius:10,padding:12,display:"flex",gap:8,marginTop:10,alignItems:"flex-start"}}>
              <span style={{color:"#FF6600",fontSize:16,flexShrink:0}}>💡</span>
              <div>
                <p style={{color:"#FF6600",fontWeight:700,fontSize:13,margin:"0 0 4px"}}>{t(lang,"avgPriceFor","Preço médio para {category}").replace("{category}", selectedCat?.name || formData.category)}</p>
                <p style={{color:subtext,fontSize:12,margin:0}}>{t(lang,"priceRangeHint","Mín: €{min} · Médio: €{avg} · Máx: €{max}").replace("{min}", priceSuggestion.min).replace("{avg}", priceSuggestion.avg).replace("{max}", priceSuggestion.max)}</p>
                <button onClick={() => set("price", priceSuggestion.avg.toString())}
                  style={{marginTop:6,background:"#FF6600",color:"#FFF",border:"none",borderRadius:8,padding:"4px 10px",fontSize:12,cursor:"pointer",fontWeight:600}}>
                  {t(lang,"usePriceSuggestion","Usar €{price}").replace("{price}", priceSuggestion.avg)}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Revisão */}
      {step === 4 && (
        <div style={{padding:"16px 20px"}}>
          <div style={{background:surface,borderRadius:16,padding:20,border:"1px solid #FF660044"}}>
            <p style={{color:"#FF6600",fontWeight:700,fontSize:14,margin:"0 0 16px",textTransform:"uppercase",letterSpacing:1}}>{t(lang,"jobSummary","Resumo da Obra")}</p>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {[
                {label:t(lang,"title","Título"),value:formData.title},
                {label:t(lang,"category"),value:`${catIcon} ${selectedCat?.name || formData.category}`},
                {label:t(lang,"location"),value:formData.location},
                {label:t(lang,"price"),value:`€${formData.price}${formData.price_type==='hourly'?'/h':''}`,highlight:true},
                {label:t(lang,"urgency","Urgência"),value:formData.urgency==='low'?`🟢 ${t(lang,"urgencyLow","Baixa")}`:formData.urgency==='high'?`🔴 ${t(lang,"urgencyHigh","Alta")}`:`🟡 ${t(lang,"urgencyMedium","Média")}`},
              ].map(item => (
                <div key={item.label} style={{borderBottom:`1px solid ${isDark?"#333":"#EEE"}`,paddingBottom:10}}>
                  <p style={{color:subtext,fontSize:12,margin:"0 0 2px"}}>{item.label}</p>
                  <p style={{color:item.highlight?"#FF6600":text,fontWeight:item.highlight?700:600,fontSize:15,margin:0}}>{item.value}</p>
                </div>
              ))}
            </div>
            <div style={{background:"#FF660011",borderRadius:10,padding:12,marginTop:8}}>
              <p style={{color:subtext,fontSize:13,margin:0}}>📝 <strong style={{color:text}}>{t(lang,"description")}:</strong> {formData.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{padding:"16px 20px",position:"sticky",bottom:0,background:bg,borderTop:`1px solid ${isDark?"#333":"#EEEEEE"}`,display:"flex",gap:12}}>
        {step > 1 && (
          <button onClick={() => setStep(s => s-1)}
            style={{flex:1,padding:"14px 0",background:"transparent",border:`1px solid ${isDark?"#444":"#CCCCCC"}`,borderRadius:14,color:subtext,fontWeight:700,fontSize:15,cursor:"pointer"}}>
            ← {t(lang,"previousStep","Anterior")}
          </button>
        )}
        {step < 4 ? (
          <button onClick={() => canGoNext() && setStep(s => s+1)} disabled={!canGoNext()}
            style={{flex:1,padding:"14px 0",background:canGoNext()?"#FF6600":"#333",border:"none",borderRadius:14,color:canGoNext()?"#FFF":"#555",fontWeight:700,fontSize:15,cursor:canGoNext()?"pointer":"not-allowed",transition:"background 0.2s"}}>
            {t(lang,"nextStep","Próximo")} →
          </button>
        ) : (
          <button onClick={() => setShowConfirm(true)} disabled={isSubmitting}
            style={{flex:1,padding:"14px 0",background:isSubmitting?"#555":"#FF6600",border:"none",borderRadius:14,color:"#FFF",fontWeight:700,fontSize:15,cursor:isSubmitting?"not-allowed":"pointer"}}>
            {isSubmitting ? t(lang,"publishing","A publicar...") : `🚀 ${t(lang,"publishJob","Publicar Obra")}`}
          </button>
        )}
      </div>
    </div>
  );
}