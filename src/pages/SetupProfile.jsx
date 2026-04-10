import React, { useState, useEffect, useRef } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import { base44 } from "@/api/base44Client";
import GdprConsent from "@/components/GdprConsent";
import { Button } from "@/components/ui/button";
import { Briefcase, Wrench, Shield, CheckCircle, ChevronLeft, ChevronRight, Upload, BadgeCheck, ShieldCheck, X, Building2 } from "lucide-react";
import { UploadFile } from "@/api/integrations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const profileTypes = [
  {
    type: 'employer',
    icon: Briefcase,
    title: 'Empregador',
    description: 'Publique trabalhos e encontre profissionais qualificados',
    gradient: 'from-blue-500 to-blue-600',
    features: ['Publicar obras', 'Receber propostas', 'Avaliar profissionais']
  },
  {
    type: 'worker',
    icon: Wrench,
    title: 'Profissional',
    description: 'Encontre trabalhos e mostre as suas habilidades',
    gradient: 'from-[#F26522] to-orange-600',
    features: ['Candidatar-se a obras', 'Criar portfólio', 'Ganhar reputação']
  },
  {
    type: 'admin',
    icon: Shield,
    title: 'Administrador',
    description: 'Gerir plataforma, utilizadores e conteúdos',
    gradient: 'from-purple-500 to-purple-700',
    features: ['Gestão de utilizadores', 'Moderação de conteúdo', 'Estatísticas da plataforma'],
    adminOnly: true
  }
];

export default function SetupProfile() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGdpr, setShowGdpr] = useState(false);
  // step: 1 = choose type, 1.5 = employer subtype, 2 = verify identity
  const [step, setStep] = useState(1);
  const [employerType, setEmployerType] = useState(null); // 'simple' | 'cia'
  const [companyClients, setCompanyClients] = useState([]);
  const [newClient, setNewClient] = useState({ name: '', contact: '', nif: '' });
  const [idDocFile, setIdDocFile] = useState(null);
  const [idDocPreview, setIdDocPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true);
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          setUser(null);
          setLoading(false);
          return;
        }
        const userData = await base44.auth.me();
        setUser(userData);
        if (userData?.user_type) {
          navigate(createPageUrl("Home"));
          return;
        }
      } catch {
        setUser(null);
      }
      setLoading(false);
    };
    checkUser();
  }, [navigate]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIdDocFile(file);
    setIdDocPreview(URL.createObjectURL(file));
  };

  const doCreateProfile = async (idDocUrl = null) => {
    const selectedType = visibleProfiles[activeIndex].type;
    const profileData = {
      user_type: selectedType,
      status: 'active',
      verified_level: selectedType === 'admin' ? 'ultra_verified' : (idDocUrl ? 'ultra_verified' : 'verified'),
    };
    if (selectedType === 'employer') {
      profileData.employer_type = employerType || 'simple';
      if (employerType === 'cia' && companyClients.length > 0) {
        profileData.company_clients = companyClients;
      }
    }
    if (idDocUrl) {
      profileData.id_document_url = idDocUrl;
      profileData.id_document_status = 'pending';
    }
    await base44.auth.updateMe(profileData);
    window.location.href = createPageUrl("Home");
  };

  const isAdmin = user?.role === 'admin';
  const visibleProfiles = profileTypes.filter(p => !p.adminOnly || isAdmin);

  const handleContinueToVerify = () => {
    if (!user) { base44.auth.redirectToLogin(window.location.href); return; }
    if (!user.gdpr_accepted) { setShowGdpr(true); return; }
    const selectedType = visibleProfiles[activeIndex]?.type;
    if (selectedType === 'admin') { handleFinish(true); return; }
    if (selectedType === 'employer') { setStep(1.5); return; }
    setStep(2);
  };

  const handleEmployerContinue = () => {
    if (!employerType) return;
    setStep(2);
  };

  const addClient = () => {
    if (!newClient.name) return;
    setCompanyClients(prev => [...prev, { ...newClient }]);
    setNewClient({ name: '', contact: '', nif: '' });
  };

  const removeClient = (idx) => {
    setCompanyClients(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFinish = async (skipDoc = false) => {
    setIsCreating(true);
    try {
      let idDocUrl = null;
      if (!skipDoc && idDocFile) {
        setIsUploading(true);
        const { file_url } = await UploadFile({ file: idDocFile });
        idDocUrl = file_url;
        setIsUploading(false);
      }
      await doCreateProfile(idDocUrl);
    } catch {
      alert("Erro ao criar perfil. Tente novamente.");
      setIsCreating(false);
      setIsUploading(false);
    }
  };

  const hexBg = {position:"absolute",inset:0,backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52'%3E%3Cpolygon points='30,2 58,17 58,47 30,62 2,47 2,17' fill='none' stroke='%23FF6600' stroke-width='0.5' opacity='0.3'/%3E%3C/svg%3E\")",backgroundRepeat:"repeat",opacity:0.3,pointerEvents:"none"};

  if (loading) {
    return <LoadingScreen label="A carregar..." />;
  }

  // Não autenticado — mostrar ecrã de login
  if (!user) {
    return (
      <div style={{minHeight:"100vh",background:"#1A1A1A",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,position:"relative",overflow:"hidden"}}>
        <div style={hexBg} />
        <img src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/90321a683_Gemini_Generated_Image_k4rh2gk4rh2gk4rh.png" style={{height:36, objectFit:"contain", maxWidth:160}} alt="KANDU" />
        <h2 style={{color:"#FFF",fontWeight:800,fontSize:22,marginBottom:8,position:"relative",zIndex:1}}>Entrar na plataforma</h2>
        <p style={{color:"#AAAAAA",fontSize:14,marginBottom:24,position:"relative",zIndex:1}}>Faz login para continuares</p>
        <button onClick={() => base44.auth.redirectToLogin(window.location.href)}
          style={{padding:"16px 40px",background:"#FF6600",border:"none",borderRadius:14,color:"#FFF",fontWeight:700,fontSize:16,cursor:"pointer",position:"relative",zIndex:1}}>
          Entrar / Criar Conta
        </button>
      </div>
    );
  }

  const handleGdprAccept = async () => {
    await base44.auth.updateMe({ gdpr_accepted: true, gdpr_accepted_at: new Date().toISOString() });
    setUser(prev => ({ ...prev, gdpr_accepted: true }));
    setShowGdpr(false);
    setStep(2);
  };

  const profile = visibleProfiles[activeIndex] || visibleProfiles[0];

  // ── Step 1.5: Employer Subtype ──
  if (step === 1.5) {
    return (
      <div style={{minHeight:"100vh",background:"#1A1A1A",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
        <GdprConsent open={showGdpr} onAccept={handleGdprAccept} />
        <div style={hexBg} />
        <div style={{flex:1,padding:"50px 20px 20px",position:"relative",zIndex:1}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,maxWidth:420,margin:"0 auto 24px"}}>
            <button onClick={() => setStep(1)} style={{background:"none",border:"none",color:"#FF6600",fontSize:22,cursor:"pointer"}}>←</button>
            <span style={{fontWeight:700,color:"#FFF",fontSize:17}}>Tipo de Empregador</span>
            <span style={{color:"#AAAAAA",fontSize:13}}>2/3</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16,maxWidth:420,margin:"0 auto 16px"}}>
            {["simple","cia"].map(type => (
              <div key={type} onClick={() => setEmployerType(type)}
                style={{background:"#2A2A2A",borderRadius:16,padding:20,textAlign:"center",border:employerType===type?"2px solid #FF6600":"2px solid transparent",cursor:"pointer"}}>
                <div style={{fontSize:36,marginBottom:8}}>{type==="cia" ? "🏢" : "👤"}</div>
                <div style={{fontWeight:700,color:"#FFF",fontSize:14}}>{type==="cia" ? "Cia Employer" : "Simple Employer"}</div>
                <div style={{color:"#AAAAAA",fontSize:12,marginTop:4}}>{type==="cia" ? "Empresa ou Organização" : "Cliente Particular"}</div>
              </div>
            ))}
          </div>
          {employerType === "cia" && (
            <div style={{background:"#1E1E1E",borderTop:"3px solid #FF6600",borderRadius:"0 0 16px 16px",padding:16,display:"flex",flexDirection:"column",gap:12,maxWidth:420,margin:"0 auto 16px"}}>
              {[{label:"Nome da Empresa",key:"name"},{label:"Contacto",key:"contact"},{label:"NIF",key:"nif"}].map(({label,key}) => (
                <div key={key}>
                  <label style={{color:"#AAAAAA",fontSize:13,display:"block",marginBottom:6}}>{label}</label>
                  <input placeholder={label} value={newClient[key]} onChange={e => setNewClient(p => ({...p,[key]:e.target.value}))}
                    style={{width:"100%",padding:12,background:"#2A2A2A",border:"2px solid #FF6600",borderRadius:10,color:"#FFF",boxSizing:"border-box",outline:"none"}} />
                </div>
              ))}
              <button onClick={addClient} disabled={!newClient.name}
                style={{padding:10,background:newClient.name?"#FF6600":"#333",border:"none",borderRadius:10,color:"#FFF",fontWeight:600,cursor:newClient.name?"pointer":"default"}}>
                + Adicionar cliente
              </button>
              {companyClients.map((c,i) => (
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#2A2A2A",borderRadius:10,padding:"8px 12px"}}>
                  <div>
                    <div style={{color:"#FFF",fontSize:14,fontWeight:600}}>{c.name}</div>
                    <div style={{color:"#AAAAAA",fontSize:12}}>{c.contact}{c.nif ? ` · NIF ${c.nif}` : ""}</div>
                  </div>
                  <button onClick={() => removeClient(i)} style={{background:"none",border:"none",color:"#EF4444",cursor:"pointer",fontSize:18}}>×</button>
                </div>
              ))}
            </div>
          )}
          <div style={{maxWidth:420,margin:"0 auto"}}>
            <button onClick={handleEmployerContinue} disabled={!employerType}
              style={{width:"100%",padding:16,background:employerType?"#FF6600":"#333",border:"none",borderRadius:14,color:"#FFF",fontWeight:700,fontSize:16,cursor:employerType?"pointer":"default"}}>
              Continuar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Identity Verification ──
  if (step === 2) {
    return (
      <div style={{minHeight:"100vh",background:"#1A1A1A",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
        <GdprConsent open={showGdpr} onAccept={handleGdprAccept} />
        <div style={hexBg} />
        <div style={{flex:1,padding:"50px 20px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:20,position:"relative",zIndex:1}}>
          <div style={{display:"flex",alignItems:"center",width:"100%",maxWidth:420,justifyContent:"space-between"}}>
            <button onClick={() => setStep(visibleProfiles[activeIndex]?.type==="employer" ? 1.5 : 1)} style={{background:"none",border:"none",color:"#FF6600",fontSize:22,cursor:"pointer"}}>←</button>
            <span style={{fontWeight:700,color:"#FFF",fontSize:17}}>Verificação de Identidade</span>
            <span style={{width:22}} />
          </div>
          <span style={{background:"#22C55E",color:"#FFF",padding:"8px 20px",borderRadius:20,fontWeight:700,fontSize:14}}>✓ Verified</span>
          <div style={{width:160,height:160,clipPath:"polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)",background:"#1A1A1A",border:"4px solid #FF6600",boxShadow:"0 0 30px #FF660066",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <img src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/90321a683_Gemini_Generated_Image_k4rh2gk4rh2gk4rh.png" style={{height:36, objectFit:"contain", maxWidth:160}} alt="" />
            <span style={{fontWeight:900,color:"#FFF",fontSize:15,marginTop:4}}>Ultra</span>
            <span style={{fontWeight:900,color:"#FFF",fontSize:15}}>Verified</span>
          </div>
          <p style={{color:"#AAAAAA",fontSize:14,textAlign:"center",maxWidth:300}}>Submete o teu documento de identidade para ganhar o badge máximo de confiança</p>
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" style={{display:"none"}} onChange={handleFileSelect} />
          {idDocPreview ? (
            <div style={{position:"relative",width:"100%",maxWidth:420,borderRadius:12,overflow:"hidden",border:"2px solid #FF6600"}}>
              <img src={idDocPreview} alt="Documento" style={{width:"100%",height:140,objectFit:"cover"}} />
              <button onClick={() => { setIdDocFile(null); setIdDocPreview(null); }} style={{position:"absolute",top:8,right:8,background:"#EF4444",border:"none",borderRadius:"50%",width:28,height:28,color:"#FFF",cursor:"pointer",fontWeight:700}}>×</button>
            </div>
          ) : (
            <div style={{display:"flex",gap:12,width:"100%",maxWidth:420}}>
              {["Frente do BI/CC","Verso do BI/CC"].map(label => (
                <div key={label} onClick={() => fileInputRef.current?.click()}
                  style={{flex:1,height:100,background:"#2A2A2A",border:"2px dashed #FF6600",borderRadius:12,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",gap:6}}>
                  <span style={{fontSize:28,color:"#FF6600"}}>📷</span>
                  <span style={{fontSize:12,color:"#AAAAAA"}}>{label}</span>
                </div>
              ))}
            </div>
          )}
          <p style={{fontSize:11,color:"#555",textAlign:"center"}}>De acordo com RGPD, os teus dados estão protegidos.</p>
          <button onClick={() => handleFinish(false)} disabled={isCreating || !idDocFile}
            style={{width:"100%",maxWidth:420,padding:16,background:idDocFile?"#FF6600":"#333",border:"none",borderRadius:14,color:"#FFF",fontWeight:700,fontSize:16,cursor:idDocFile?"pointer":"default"}}>
            {isUploading ? "A carregar..." : isCreating ? "A criar perfil..." : "Submeter Documentos"}
          </button>
          <button onClick={() => handleFinish(true)} disabled={isCreating} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:14}}>Fazer mais tarde</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:"#1A1A1A",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
      <GdprConsent open={showGdpr} onAccept={handleGdprAccept} />
      <div style={hexBg} />
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"60px 20px 100px",gap:24,position:"relative",zIndex:1}}>
        <img src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/90321a683_Gemini_Generated_Image_k4rh2gk4rh2gk4rh.png" style={{height:36, objectFit:"contain", maxWidth:160}} alt="KANDU" />
        <div style={{textAlign:"center"}}>
          <h2 style={{fontSize:22,fontWeight:800,color:"#FFF",margin:"0 0 6px"}}>Como vais usar o KANDU?</h2>
          {user && <p style={{fontSize:12,color:"#AAAAAA",margin:0}}>{user.email}</p>}
        </div>
        <div style={{width:"100%",maxWidth:420,display:"flex",flexDirection:"column",gap:14}}>
          {visibleProfiles.map((profile, idx) => (
            <div key={profile.type} onClick={() => setActiveIndex(idx)}
              style={{background:"#2A2A2A",borderRadius:16,padding:20,borderLeft:"4px solid #FF6600",border:activeIndex===idx?"2px solid #FF6600":"2px solid transparent",borderLeft:"4px solid #FF6600",cursor:"pointer",display:"flex",alignItems:"center",gap:16}}>
              <span style={{fontSize:38}}>{profile.type==="worker" ? "⛑️" : profile.type==="employer" ? "💼" : "🛡️"}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:17,color:"#FFF"}}>{profile.title}</div>
                <div style={{fontSize:13,color:"#AAAAAA",marginTop:4}}>{profile.description}</div>
              </div>
              <span style={{color:activeIndex===idx?"#FF6600":"#555",fontSize:22}}>›</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{position:"fixed",bottom:0,left:0,right:0,padding:"12px 20px 28px",background:"linear-gradient(to top, #1A1A1A 70%, transparent)",zIndex:10}}>
        <button onClick={handleContinueToVerify} disabled={isCreating}
          style={{width:"100%",maxWidth:420,display:"block",margin:"0 auto",padding:16,background:"#FF6600",border:"none",borderRadius:14,color:"#FFF",fontWeight:700,fontSize:16,cursor:"pointer"}}>
          {user ? `Continuar como ${visibleProfiles[activeIndex]?.title}` : 'Fazer Login'}
        </button>
      </div>
    </div>
  );
}