import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import GdprConsent from "@/components/GdprConsent";
import { Button } from "@/components/ui/button";
import { Briefcase, Wrench, Shield, CheckCircle, ChevronLeft, ChevronRight, Upload, BadgeCheck, ShieldCheck, X, Building2 } from "lucide-react";
import { UploadFile } from "@/integrations/Core";
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl font-bold text-[#F26522] animate-pulse select-none">φ</div>
          <p className="text-gray-500 mt-3">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center px-6">
        <div className="text-center mb-10">
          <div className="text-7xl font-bold text-[#F26522] select-none mb-4">φ</div>
          <h1 className="text-3xl font-black text-white">KANDU</h1>
          <p className="text-gray-500 mt-2">A plataforma de profissionais de construção</p>
        </div>
        <div className="w-full max-w-sm bg-[#1f1f1f] border border-[#2a2a2a] rounded-3xl p-8">
          <h2 className="text-xl font-bold text-white mb-2 text-center">Entrar na plataforma</h2>
          <p className="text-sm text-gray-500 text-center mb-6">Faça login ou crie uma conta para continuar</p>
          <Button onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="w-full h-12 bg-[#F26522] hover:bg-orange-600 text-white font-bold rounded-2xl text-base">
            Entrar / Criar Conta
          </Button>
        </div>
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

  if (step === 1.5) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
        <GdprConsent open={showGdpr} onAccept={handleGdprAccept} />
        <div className="text-center pt-12 pb-6 px-4">
          <p className="text-gray-500 text-sm mb-1">2/3</p>
          <h1 className="text-2xl font-black text-white">Tipo de Empregador</h1>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 pb-32 max-w-sm mx-auto w-full gap-4">
          {/* Cards side by side */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setEmployerType('simple')}
              className={`rounded-2xl border-2 p-5 text-center transition-all ${
                employerType === 'simple' ? 'border-[#F26522] bg-[#F26522]/10' : 'border-[#3a3a3a] bg-[#2a2a2a]'
              }`}>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-[#333] rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-gray-400" />
                </div>
                <p className="font-bold text-white text-sm">Simple Employer</p>
                <p className="text-xs text-gray-500">Cliente Particular</p>
              </div>
              {employerType === 'simple' && <CheckCircle className="w-5 h-5 text-[#F26522] mx-auto mt-2" />}
            </button>

            <button onClick={() => setEmployerType('cia')}
              className={`rounded-2xl border-2 p-5 text-center transition-all ${
                employerType === 'cia' ? 'border-[#F26522] bg-[#F26522]/10' : 'border-[#3a3a3a] bg-[#2a2a2a]'
              }`}>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-[#F26522]/20 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-[#F26522]" />
                </div>
                <p className="font-bold text-[#F26522] text-sm">Cia Employer</p>
                <p className="text-xs text-gray-500">Empresa ou Organização</p>
              </div>
              {employerType === 'cia' && <CheckCircle className="w-5 h-5 text-[#F26522] mx-auto mt-2" />}
            </button>
          </div>

          {/* placeholder to satisfy closing button */}
          <div style={{display:'none'}}>

          </div>

          {/* Cia form */}
          {employerType === 'cia' && (
            <div className="bg-[#2a2a2a] border border-[#F26522]/40 rounded-2xl p-5 space-y-3">
              <input className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#F26522] placeholder:text-gray-600" placeholder="Nome da Empresa" />
              <input className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#F26522] placeholder:text-gray-600" placeholder="NIF" />
              <select className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl px-4 py-3 text-gray-400 text-sm outline-none focus:border-[#F26522]">
                <option>Setor de Atividade</option>
                <option>Construção</option><option>Remodelarão</option><option>Elétrica</option>
              </select>
              <input className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#F26522] placeholder:text-gray-600" placeholder="Website" />
              <div className="bg-[#F26522]/20 border border-[#F26522]/40 rounded-xl px-3 py-2">
                <p className="text-[#F26522] text-xs font-semibold">Empresas têm acesso a funcionalidades exclusivas</p>
              </div>
            </div>
          )}

          <Button onClick={handleEmployerContinue}
            disabled={!employerType}
            className="w-full h-14 bg-[#F26522] hover:bg-orange-600 text-white font-bold rounded-2xl text-base shadow-xl shadow-[#F26522]/30"
          >
            Continuar
          </Button>
          <Button variant="ghost" onClick={() => setStep(1)} className="w-full text-gray-500">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
        <GdprConsent open={showGdpr} onAccept={handleGdprAccept} />
        <div className="text-center pt-12 pb-6 px-4">
          <h1 className="text-2xl font-black text-white">Verificação de Identidade</h1>
          <p className="text-gray-500 mt-1 text-sm">Opcional — pode fazê-lo mais tarde no perfil</p>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 pb-32 max-w-sm mx-auto w-full">
          {/* Verified - already done */}
          <div className="bg-white rounded-2xl border-2 border-blue-300 p-5 mb-4 flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 flex items-center gap-2">Verificado <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">✓ Ativo</span></p>
              <p className="text-xs text-gray-500 mt-0.5">Email/telefone confirmados pelo sistema de autenticação.</p>
            </div>
          </div>

          <div className="mb-6">
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />
            <div className="grid grid-cols-2 gap-3">
              {[{label:'Frente do BI/CC', idx:0}, {label:'Verso do BI/CC', idx:1}].map(({label}) => (
                <button key={label} onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#F26522]/60 rounded-2xl p-6 flex flex-col items-center gap-2 bg-[#2a2a2a] text-gray-400 hover:bg-[#333] transition-colors">
                  <span className="text-2xl">📷</span>
                  <span className="text-xs font-medium text-center">{label}</span>
                </button>
              ))}
            </div>
            {idDocPreview && <img src={idDocPreview} className="mt-3 w-full h-32 object-cover rounded-xl border border-[#F26522]/40" />}
            <p className="text-center text-xs text-gray-600 mt-3">De acordo con RGPD, os teus dados estãn protegidos.</p>
          </div>

          <Button onClick={() => handleFinish(false)}
            disabled={isCreating}
            className="w-full h-14 bg-[#F26522] hover:bg-orange-600 text-white font-bold rounded-2xl mb-3"
          >
            {isUploading ? 'A enviar documento...' : isCreating ? 'A criar perfil...' : 'Submeter e continuar'}
          </Button>
          <Button variant="ghost" onClick={() => handleFinish(true)} disabled={isCreating} className="w-full text-gray-500">
            Saltar por agora
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      <GdprConsent open={showGdpr} onAccept={handleGdprAccept} />
      {/* Header */}
      <div className="text-center pt-12 pb-6 px-4">
        <h1 className="text-2xl font-black text-white">Como vais usar o KANDU?</h1>
        {user && <p className="text-xs text-gray-600 mt-1">{user.email}</p>}
      </div>

      {/* Cards */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-32 max-w-sm mx-auto w-full gap-4">
        <button
          onClick={() => { setActiveIndex(visibleProfiles.findIndex(p => p.type === 'worker')); }}
          className={`w-full bg-[#2a2a2a] rounded-2xl p-5 text-left flex items-center gap-4 border-l-4 border-[#F26522] transition-all ${
            visibleProfiles[activeIndex]?.type === 'worker' ? 'ring-2 ring-[#F26522]' : ''
          }`}
        >
          <div className="w-14 h-14 flex items-center justify-center shrink-0">
            <Wrench className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <p className="font-black text-white text-lg">Sou Profissional</p>
            <p className="text-sm text-gray-400">Quero encontrar trabalho perto de mim</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#F26522] shrink-0" />
        </button>

        <button
          onClick={() => { setActiveIndex(visibleProfiles.findIndex(p => p.type === 'employer')); }}
          className={`w-full bg-[#2a2a2a] rounded-2xl p-5 text-left flex items-center gap-4 border-l-4 border-[#F26522] transition-all ${
            visibleProfiles[activeIndex]?.type === 'employer' ? 'ring-2 ring-[#F26522]' : ''
          }`}
        >
          <div className="w-14 h-14 flex items-center justify-center shrink-0">
            <Briefcase className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <p className="font-black text-white text-lg">Preciso de Profissional</p>
            <p className="text-sm text-gray-400">Quero contratar para a minha obra</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#F26522] shrink-0" />
        </button>

        {isAdmin && (
          <button
            onClick={() => { setActiveIndex(visibleProfiles.findIndex(p => p.type === 'admin')); }}
            className="w-full bg-[#2a2a2a] rounded-2xl p-5 text-left flex items-center gap-4 border-l-4 border-purple-500"
          >
            <div className="w-14 h-14 flex items-center justify-center shrink-0">
              <Shield className="w-10 h-10 text-purple-400" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="font-black text-white text-lg">Administrador</p>
              <p className="text-sm text-gray-400">Gerir plataforma</p>
            </div>
            <ChevronRight className="w-5 h-5 text-purple-400 shrink-0" />
          </button>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/80 to-transparent">
        <Button
          onClick={handleContinueToVerify}
          disabled={isCreating}
          className="w-full h-14 bg-[#F26522] hover:bg-orange-600 text-white font-bold rounded-2xl text-base shadow-xl shadow-[#F26522]/30"
        >
          {user ? `Continuar como ${profile.title}` : 'Fazer Login'}
        </Button>
      </div>
    </div>
  );
}