import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import GdprConsent from "@/components/GdprConsent";
import { Button } from "@/components/ui/button";
import { Briefcase, Wrench, Shield, CheckCircle, ChevronLeft, ChevronRight, Upload, BadgeCheck, ShieldCheck, X } from "lucide-react";
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
  const [step, setStep] = useState(1); // 1 = choose type, 2 = verify identity
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
    // Admin goes straight through, no verification step
    if (visibleProfiles[activeIndex]?.type === 'admin') {
      handleFinish(true);
      return;
    }
    setStep(2);
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl font-bold text-[#F26522] animate-pulse select-none">φ</div>
          <p className="text-gray-500 mt-3">A carregar...</p>
        </div>
      </div>
    );
  }

  // Não autenticado — mostrar ecrã de login
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-indigo-100 flex flex-col">
      <GdprConsent open={showGdpr} onAccept={handleGdprAccept} />
      {/* Header */}
      <div className="text-center pt-12 pb-6 px-4">
        <div className="text-6xl font-bold text-[#F26522] select-none mb-3">φ</div>
        <h1 className="text-2xl font-bold text-gray-900">Bem-vindo ao KANDU</h1>
        <p className="text-gray-600 mt-1 text-sm">Selecione o tipo de perfil</p>
        {user && <p className="text-xs text-gray-400 mt-1">{user.email}</p>}
      </div>

      {/* Carousel */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-32">
        {/* Cards */}
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4" style={{ scrollbarWidth: 'none' }}>
            {visibleProfiles.map((p, idx) => (
              <div
                key={p.type}
                className={`flex-shrink-0 w-72 snap-center cursor-pointer transition-all duration-300 ${
                  activeIndex === idx ? 'scale-100 opacity-100' : 'scale-95 opacity-60'
                }`}
                style={{ scrollSnapAlign: 'center' }}
                onClick={() => setActiveIndex(idx)}
              >
                <div className={`bg-white rounded-3xl shadow-xl border-2 p-6 relative ${
                  activeIndex === idx ? 'border-[#F26522] shadow-[#F26522]/20' : 'border-transparent'
                }`}>
                  {activeIndex === idx && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle className="w-6 h-6 text-[#F26522]" />
                    </div>
                  )}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${p.gradient} flex items-center justify-center mb-4 mx-auto shadow-lg`}>
                    <p.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-center text-gray-900 mb-2">{p.title}</h3>
                  <p className="text-sm text-gray-500 text-center mb-5">{p.description}</p>
                  <div className="space-y-2">
                    {p.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        {feat}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="p-2 rounded-full bg-white shadow disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex gap-2">
            {visibleProfiles.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${activeIndex === idx ? 'bg-[#F26522] w-6' : 'bg-gray-300'}`}
              />
            ))}
          </div>
          <button
            onClick={() => setActiveIndex(Math.min(visibleProfiles.length - 1, activeIndex + 1))}
            disabled={activeIndex === profileTypes.length - 1}
            className="p-2 rounded-full bg-white shadow disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4 bg-gradient-to-t from-white/95 via-white/80 to-transparent">
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