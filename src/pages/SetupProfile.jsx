import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  MoreVertical,
  MessageSquare,
  Bookmark,
  Star,
  Check,
  Loader2,
  Home,
  Search,
  Plus,
  User as UserIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { translations } from "../components/utils/translations";

export default function SetupProfile() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("PT");
  const [isCreating, setIsCreating] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const t = (key) => translations[selectedLanguage]?.[key] || translations.PT[key] || key;

  const checkUser = React.useCallback(async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);
      
      if (userData.user_type) {
                    navigate(createPageUrl("Home"));
                    return;
                  }
      
      if (userData.language) {
        setSelectedLanguage(userData.language);
      }
    } catch (error) {
      setUser(null);
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkUser();
    }, 500);
    return () => clearTimeout(timer);
  }, [checkUser]);

  const handleCreateProfile = async () => {
    if (!selectedType) {
      alert(t('selectProfileType') || "Por favor, selecione o tipo de perfil");
      return;
    }

    if (!user) {
      try {
        await User.loginWithRedirect(window.location.href);
      } catch (error) {
        window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.href);
      }
      return;
    }

    setIsCreating(true);
    try {
      await User.updateMyUserData({ 
                    user_type: selectedType,
                    language: selectedLanguage 
                  });
                  navigate(createPageUrl("Home"));
    } catch (error) {
      alert(t('errorCreatingProfile') || "Erro ao criar perfil. Tente novamente.");
    }
    setIsCreating(false);
  };
  
  const handleLogin = async () => {
    try {
      await User.loginWithRedirect(window.location.href);
    } catch (error) {
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7f6] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#ec7f13] animate-spin" />
      </div>
    );
  }

  const specialties = [
    { icon: "🎨", name: "Pintura" },
    { icon: "⚡", name: "Elétrica" },
    { icon: "🔧", name: "Encanamento" },
    { icon: "🧱", name: "Alvenaria" },
    { icon: "🏠", name: "Pisos" },
    { icon: "🏗️", name: "Telhados" },
  ];

  const portfolioImages = [
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=200&h=200&fit=crop",
  ];

  return (
    <div className="min-h-screen bg-[#f8f7f6] text-gray-900 pb-24">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 px-4 py-3 flex justify-between items-center">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold tracking-tight">Perfil Profissional</h1>
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-700" />
          </button>
        </header>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mx-4 mt-6 p-6">
          {/* Hexagon Avatar */}
          <div className="flex flex-col items-center mb-4">
            <div className="relative w-32 h-36 mb-4">
              {/* Glow effect */}
              <div 
                className="absolute inset-0 bg-gradient-to-br from-[#ec7f13] to-orange-600 opacity-20 blur-xl"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
              />
              {/* Border */}
              <div 
                className="absolute inset-0 bg-gradient-to-br from-[#ec7f13] to-orange-600 p-[3px]"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
              >
                {/* Image container */}
                <div 
                  className="w-full h-full bg-gray-200 overflow-hidden"
                  style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                >
                  <img 
                    src={user?.avatar_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {/* Verified badge */}
              <div className="absolute bottom-0 right-2 bg-green-500 text-white rounded-full p-1 border-2 border-white shadow-sm">
                <Check className="w-3 h-3" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900">
              {user?.full_name || "Carlos Mendes"}
            </h2>
            <p className="text-[#ec7f13] font-semibold text-sm uppercase tracking-wider flex items-center gap-1 mt-1">
              <Check className="w-4 h-4" /> EMPREITEIRO CERTIFICADO
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center text-yellow-500 font-bold text-lg">
                <span>4.9</span>
                <Star className="w-4 h-4 ml-1 fill-yellow-500" />
              </div>
              <span className="text-xs text-gray-500">128 Avaliações</span>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-center">
              <div className="font-bold text-lg text-gray-900">98%</div>
              <span className="text-xs text-gray-500">Taxa de Sucesso</span>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-center">
              <div className="font-bold text-lg text-gray-900">7+</div>
              <span className="text-xs text-gray-500">Anos Exp.</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={user ? handleCreateProfile : handleLogin}
              disabled={isCreating}
              className="flex-1 bg-[#ec7f13] hover:bg-[#d66c0a] text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-[#ec7f13]/20"
            >
              {isCreating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <MessageSquare className="w-5 h-5 mr-2" />
                  {user ? "Continuar" : "Login"}
                </>
              )}
            </Button>
            <button className="bg-gray-100 text-gray-700 p-3 rounded-xl hover:bg-gray-200 transition-colors">
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Specialties Section */}
        <section className="mx-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Especialidades</h3>
            <button className="text-sm text-[#ec7f13] font-medium hover:underline">Ver todas</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {specialties.map((spec, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedType(spec.name.toLowerCase())}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                  ${selectedType === spec.name.toLowerCase() 
                    ? 'bg-[#ec7f13] text-white shadow-md' 
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-[#ec7f13] hover:text-[#ec7f13]'
                  }`}
              >
                <span>{spec.icon}</span>
                {spec.name}
              </button>
            ))}
          </div>
        </section>

        {/* About Section */}
        <section className="mx-4 mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Sobre</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Profissional dedicado com vasta experiência em reformas residenciais e comerciais. 
            Foco na qualidade do acabamento e cumprimento rigoroso de prazos. 
            Especialista em resolver problemas complexos de elétrica e hidráulica.
          </p>
        </section>

        {/* Portfolio Section */}
        <section className="mx-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Portfólio Recente</h3>
            <span className="text-sm text-[#ec7f13] font-medium">24 Projetos</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {portfolioImages.map((img, idx) => (
              <div 
                key={idx}
                className="relative aspect-square overflow-hidden"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
              >
                <img 
                  src={img}
                  alt={`Portfolio ${idx + 1}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Reviews Section */}
        <section className="mx-4 mt-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Avaliações</h3>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">AS</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">Ana Souza</h4>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2">Há 2 dias</p>
                <p className="text-sm text-gray-600">
                  "O Carlos fez um trabalho excelente na pintura do meu apartamento. 
                  Muito cuidadoso com a mobília e o acabamento ficou perfeito. Recomendo!"
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <Home className="w-6 h-6" />
            <span className="text-xs">Início</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <Search className="w-6 h-6" />
            <span className="text-xs">Buscar</span>
          </button>
          <button className="w-14 h-14 -mt-6 bg-[#ec7f13] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#ec7f13]/30">
            <Plus className="w-8 h-8" />
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <MessageSquare className="w-6 h-6" />
            <span className="text-xs">Chat</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#ec7f13]">
            <UserIcon className="w-6 h-6" />
            <span className="text-xs font-medium">Perfil</span>
          </button>
        </div>
      </nav>
    </div>
  );
}