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
  const [phoneNumber, setPhoneNumber] = useState('+351 ');
  // step: 0 = phone, 1 = choose type, 1.5 = employer subtype, 2 = verify identity
  const [step, setStep] = useState(0);
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
    if (step === 0) { setStep(1); return; }
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

  // ── Step 0: Phone Number ──
  if (step === 0 && !loading && user) {
    const darkBg = { minHeight: '100vh', background: '#1A1A1A', position: 'relative', overflow: 'hidden' };
    const hexBg = {
      position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none',
      backgroundImage: `url("data:image/svg+xml,${hexPattern}")`,
      backgroundRepeat: 'repeat'
    };
    return (
      <div style={darkBg}>
        <div style={hexBg} />
        {/* Top bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '50px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
          <img src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png" style={{ width: 40 }} alt="K" />
          <span style={{ background: '#FF6600', color: '#FFF', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>1 / 3</span>
        </div>
        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 20, padding: '28px', zIndex: 1, position: 'relative' }}>
          <div style={{ fontSize: 64, lineHeight: 1 }}>📞</div>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#FFF', textAlign: 'center', margin: 0 }}>O teu número, a tua identidade</p>
          <p style={{ fontSize: 14, color: '#AAAAAA', textAlign: 'center', margin: 0, maxWidth: 280 }}>Verificamos o teu número para garantir uma comunidade segura</p>
          <input
            type="tel"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            placeholder="+351 ___ ___ ___"
            style={{
              width: '100%', maxWidth: 380, background: '#2A2A2A', border: '2px solid #FF6600',
              borderRadius: 50, padding: '14px 20px', textAlign: 'center', color: '#FFF',
              fontSize: 18, outline: 'none', boxSizing: 'border-box'
            }}
          />
          <button
            onClick={async () => {
              if (phoneNumber.trim().length > 6) {
                await base44.auth.updateMe({ phone: phoneNumber.trim() });
              }
              setStep(1);
            }}
            style={{
              width: '90%', maxWidth: 380, padding: 16, background: '#FF6600', borderRadius: 50,
              fontWeight: 700, color: '#FFF', border: 'none', fontSize: 16, cursor: 'pointer'
            }}
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl font-bold text-[#F26522] animate-pulse select-none">φ</div>
          <p className="text-gray-500 mt-3">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-indigo-100 flex flex-col items-center justify-center px-6">
        <div className="text-center mb-10">
          <div className="text-7xl font-bold text-[#F26522] select-none mb-4">φ</div>
          <h1 className="text-3xl font-bold text-gray-900">KANDU</h1>
          <p className="text-gray-500 mt-2">A plataforma de profissionais de construção</p>
        </div>
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Entrar na plataforma</h2>
          <p className="text-sm text-gray-500 text-center mb-6">Faça login ou crie uma conta para continuar</p>
          <Button
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="w-full h-12 bg-[#F26522] hover:bg-orange-600 text-white font-bold rounded-2xl text-base shadow-lg shadow-[#F26522]/30"
          >
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

  // ── Step 1.5: Employer Subtype ──
  if (step === 1.5) {
    const darkBg = { minHeight: '100vh', background: '#1A1A1A', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' };
    const sectors = ['Construção', 'Imobiliário', 'Instalação', 'Limpeza', 'Manutenção', 'Reparações', 'Outro'];
    return (
      <div style={darkBg}>
        <GdprConsent open={showGdpr} onAccept={handleGdprAccept} />
        {/* Top bar */}
        <div style={{ padding: '50px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
          <button onClick={() => setStep(1)} style={{ fontSize: 22, color: '#FF6600', cursor: 'pointer', background: 'none', border: 'none' }}>←</button>
          <h1 style={{ fontWeight: 700, fontSize: 17, color: '#FFF', margin: 0 }}>Tipo de Empregador</h1>
          <span style={{ color: '#AAA', fontSize: 13 }}>2/3</span>
        </div>
        
        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '140px' }}>
          {/* Grid de cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '20px 20px 0', marginBottom: '16px' }}>
            {/* Simple Employer */}
            <button
              onClick={() => setEmployerType('simple')}
              style={{
                background: '#2A2A2A', borderRadius: 16, padding: 20, textAlign: 'center', border: employerType === 'simple' ? '2px solid #FF6600' : '2px solid #444',
                cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 40, color: '#888', marginBottom: 8 }}>👤</span>
              <p style={{ fontWeight: 700, color: '#FFF', margin: 0, fontSize: 15 }}>Simple Employer</p>
              <p style={{ color: '#AAA', fontSize: 12, margin: '4px 0 0 0' }}>Cliente Particular</p>
            </button>
            {/* Cia Employer */}
            <button
              onClick={() => setEmployerType('cia')}
              style={{
                background: '#2A2A2A', borderRadius: 16, padding: 20, textAlign: 'center', border: employerType === 'cia' ? '2px solid #FF6600' : '2px solid #444',
                cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 40, color: employerType === 'cia' ? '#FF6600' : '#888', marginBottom: 8 }}>🏢</span>
              <p style={{ fontWeight: 700, color: '#FFF', margin: 0, fontSize: 15 }}>Cia Employer</p>
              <p style={{ color: '#AAA', fontSize: 12, margin: '4px 0 0 0' }}>Empresa ou Organização</p>
            </button>
          </div>
          
          {/* Formulário expansível */}
          {employerType === 'cia' && (
            <div style={{ background: '#1E1E1E', borderTop: '3px solid #FF6600', borderRadius: '0 0 16px 16px', padding: 16, margin: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Nome da Empresa */}
              <div>
                <label style={{ color: '#AAA', fontSize: 12, display: 'block', marginBottom: 6 }}>Nome da Empresa</label>
                <input
                  type="text"
                  placeholder="Nome"
                  value={newClient.name}
                  onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))}
                  style={{ background: '#2A2A2A', border: '2px solid #FF6600', borderRadius: 10, padding: 12, color: '#FFF', width: 'calc(100% - 28px)', fontSize: 14 }}
                />
              </div>
              {/* NIF */}
              <div>
                <label style={{ color: '#AAA', fontSize: 12, display: 'block', marginBottom: 6 }}>NIF</label>
                <input
                  type="text"
                  placeholder="123456789"
                  value={newClient.nif}
                  onChange={e => setNewClient(p => ({ ...p, nif: e.target.value }))}
                  style={{ background: '#2A2A2A', border: '2px solid #444', borderRadius: 10, padding: 12, color: '#FFF', width: 'calc(100% - 28px)', fontSize: 14 }}
                />
              </div>
              {/* Setor de Atividade */}
              <div>
                <label style={{ color: '#AAA', fontSize: 12, display: 'block', marginBottom: 6 }}>Setor de Atividade</label>
                <select
                  value={newClient.contact}
                  onChange={e => setNewClient(p => ({ ...p, contact: e.target.value }))}
                  style={{ background: '#2A2A2A', border: '2px solid #444', borderRadius: 10, padding: 12, color: '#FFF', width: '100%', fontSize: 14 }}
                >
                  <option value="">Selecione...</option>
                  {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {/* Website */}
              <div>
                <label style={{ color: '#AAA', fontSize: 12, display: 'block', marginBottom: 6 }}>Website</label>
                <input
                  type="url"
                  placeholder="https://exemplo.com"
                  style={{ background: '#2A2A2A', border: '2px solid #444', borderRadius: 10, padding: 12, color: '#FFF', width: 'calc(100% - 28px)', fontSize: 14 }}
                />
              </div>
              {/* Banner */}
              <div style={{ background: '#FF6600', borderRadius: 8, padding: 10, color: '#FFF', fontWeight: 600, textAlign: 'center' }}>Empresas têm acesso a funcionalidades exclusivas</div>
            </div>
          )}
        </div>
        
        {/* Sticky button */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px', background: '#1A1A1A', borderTop: '1px solid #333' }}>
          <button
            onClick={handleEmployerContinue}
            disabled={!employerType}
            style={{
              width: 'calc(100% - 40px)', padding: 16, background: employerType ? '#FF6600' : '#666', borderRadius: 14,
              color: '#FFF', fontWeight: 700, border: 'none', cursor: employerType ? 'pointer' : 'not-allowed', fontSize: 16
            }}
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  // ── Step 2: Identity Verification ──
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-indigo-100 flex flex-col">
        <GdprConsent open={showGdpr} onAccept={handleGdprAccept} />
        <div className="text-center pt-12 pb-6 px-4">
          <div className="text-6xl font-bold text-[#F26522] select-none mb-3">φ</div>
          <h1 className="text-2xl font-bold text-gray-900">Verificar Identidade</h1>
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

          {/* Ultra Verified */}
          <div className="bg-white rounded-2xl border-2 border-green-300 p-5 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <BadgeCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Ultra Verificado</p>
                <p className="text-xs text-gray-500 mt-0.5">Submeta o seu documento de identidade (BI, Passaporte ou Carta). A análise é feita manualmente e por KYC.</p>
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />

            {idDocPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 mb-3">
                <img src={idDocPreview} alt="Documento" className="w-full h-36 object-cover" />
                <button onClick={() => { setIdDocFile(null); setIdDocPreview(null); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-green-300 rounded-xl p-6 flex flex-col items-center gap-2 text-green-600 hover:bg-green-50 transition-colors mb-3"
              >
                <Upload className="w-6 h-6" />
                <span className="text-sm font-medium">Carregar documento</span>
                <span className="text-xs text-gray-400">BI, Passaporte ou Carta de Condução</span>
              </button>
            )}
          </div>

          <Button
            onClick={() => handleFinish(false)}
            disabled={isCreating || !idDocFile}
            className="w-full h-13 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl mb-3 shadow-lg"
          >
            {isUploading ? 'A enviar documento...' : isCreating ? 'A criar perfil...' : 'Submeter e continuar'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleFinish(true)}
            disabled={isCreating}
            className="w-full text-gray-500 hover:text-gray-700"
          >
            Saltar por agora
          </Button>
        </div>
      </div>
    );
  }

  // ── Step 1: Profile Type Selection (Profissional vs Empregador) ──
  if (step === 1) {
    const darkBg = { minHeight: '100vh', background: '#1A1A1A', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' };
    const hexBg = {
      position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none',
      backgroundImage: `url("data:image/svg+xml,${hexPattern}")`,
      backgroundRepeat: 'repeat'
    };
    return (
      <div style={darkBg}>
        <div style={hexBg} />
        {/* Logo */}
        <img src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png" style={{ width: 50, marginTop: '60px', position: 'relative', zIndex: 1 }} alt="K" />
        {/* Title */}
        <p style={{ fontSize: 22, fontWeight: 800, color: '#FFF', textAlign: 'center', margin: '32px 0 20px', zIndex: 1 }}>Como vais usar o KANDU?</p>
        {/* Cards Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 20px', width: '100%', maxWidth: 380, zIndex: 1, flex: 1, justifyContent: 'center' }}>
          {/* Card: Sou Profissional */}
          <div
            onClick={() => { setActiveIndex(1); handleContinueToVerify(); }}
            style={{
              background: '#2A2A2A', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 16, borderLeft: '4px solid #FF6600',
              cursor: 'pointer', transition: 'all 0.2s', border: activeIndex === 1 ? '2px solid #FF6600' : 'none', borderLeftWidth: activeIndex === 1 ? 2 : 4
            }}
          >
            <span style={{ fontSize: 40 }}>\u26d1\ufe0f</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 'bold', fontSize: 17, color: '#FFF', margin: 0 }}>Sou Profissional</p>
              <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0 0' }}>Quero encontrar trabalho perto de mim</p>
            </div>
            <span style={{ color: '#FF6600', fontSize: 20 }}>›</span>
          </div>
          {/* Card: Preciso de Profissional */}
          <div
            onClick={() => { setActiveIndex(0); handleContinueToVerify(); }}
            style={{
              background: '#2A2A2A', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 16, borderLeft: '4px solid #FF6600',
              cursor: 'pointer', transition: 'all 0.2s', border: activeIndex === 0 ? '2px solid #FF6600' : 'none', borderLeftWidth: activeIndex === 0 ? 2 : 4
            }}
          >
            <span style={{ fontSize: 40 }}>\ud83d\udcbc</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 'bold', fontSize: 17, color: '#FFF', margin: 0 }}>Preciso de Profissional</p>
              <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0 0' }}>Quero contratar para a minha obra</p>
            </div>
            <span style={{ color: '#FF6600', fontSize: 20 }}>›</span>
          </div>
        </div>
        {/* Footer */}
        <p style={{ color: '#444', fontSize: 11, textAlign: 'center', marginTop: '20px', zIndex: 1 }}>Interface simples, gratuita, montada usando o KANDU</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-indigo-100 flex flex-col">
      <GdprConsent open={showGdpr} onAccept={handleGdprAccept} />
    </div>
  );
}