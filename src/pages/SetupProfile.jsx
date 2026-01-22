import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  Hammer,
  Star,
  Calendar,
  MessageSquare,
  ShoppingBag,
  BarChart3,
  Bell,
  ArrowRight,
  RefreshCw,
  Shield,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { translations } from "../components/utils/translations";

// Hexagon component
const Hexagon = ({ children, active, color = "gray", onClick, label }) => {
  const colorClasses = {
    gray: "bg-white dark:bg-[#2d241b] border-gray-200 dark:border-[#3a2e24]",
    orange: "bg-[#ec7f13] border-[#ec7f13] shadow-lg shadow-[#ec7f13]/30",
    yellow: "bg-[#ec7f13] border-[#ec7f13]",
    blue: "bg-blue-500 border-blue-500",
    purple: "bg-purple-500 border-purple-500",
    green: "bg-green-500 border-green-500",
    red: "bg-red-500 border-red-500",
  };

  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-2 group focus:outline-none transition-transform active:scale-95"
    >
      <div className="relative w-24 h-28">
        {/* Border/glow layer */}
        <div 
          className={`absolute inset-0 ${active ? 'bg-[#ec7f13]/50 blur-[2px]' : 'bg-gray-300 dark:bg-[#3a2e24]'}`}
          style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
        />
        {/* Main hexagon */}
        <div 
          className={`absolute inset-[2px] flex items-center justify-center transition-all
            ${active ? 'bg-[#ec7f13] shadow-lg shadow-[#ec7f13]/30' : 'bg-white dark:bg-[#2d241b] group-hover:bg-gray-50 dark:group-hover:bg-[#3a2e24]'}
          `}
          style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
        >
          <div className={active ? 'text-white' : 'text-gray-500 dark:text-gray-400'}>
            {children}
          </div>
        </div>
      </div>
      <span className={`text-xs font-medium text-center leading-tight ${active ? 'text-[#ec7f13] font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
        {label}
      </span>
    </button>
  );
};

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
        navigate(createPageUrl("Dashboard"));
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
        console.error("Login error:", error);
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
      
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Error creating profile:", error);
      alert(t('errorCreatingProfile') || "Erro ao criar perfil. Tente novamente.");
    }
    setIsCreating(false);
  };
  
  const handleLogin = async () => {
    try {
      await User.loginWithRedirect(window.location.href);
    } catch (error) {
      console.error("Login error:", error);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleForceRefresh = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7f6] dark:bg-[#221910] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#ec7f13] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7f6] dark:bg-[#221910] text-gray-900 dark:text-white">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 pt-12 pb-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              {user ? t('welcomeBack') || 'Bem-vindo,' : 'Bem-vindo ao'}
            </p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user ? user.full_name || 'KANDU' : 'KANDU'}
            </h1>
          </div>
          <div className="relative">
            <button className="w-10 h-10 rounded-full bg-white dark:bg-[#2d241b] shadow-sm flex items-center justify-center text-gray-600 dark:text-gray-300">
              <Bell className="w-5 h-5" />
            </button>
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#f8f7f6] dark:border-[#221910]"></span>
          </div>
        </header>

        {/* Search Bar */}
        <div className="px-6 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Encontre profissionais ou serviços..."
              className="w-full py-3 pl-10 pr-4 bg-white dark:bg-[#2d241b] border-none rounded-xl shadow-sm text-sm focus:ring-2 focus:ring-[#ec7f13] dark:text-white placeholder-gray-400"
              disabled={!user}
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {!user ? (
          /* Login Section */
          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
            <div className="w-32 h-32 bg-[#ec7f13] rounded-full flex items-center justify-center shadow-lg shadow-[#ec7f13]/30">
              <Briefcase className="w-16 h-16 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Conecte-se ao KANDU</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Para continuar, faça login com a sua conta Google.
              </p>
            </div>
            <Button 
              onClick={handleLogin} 
              className="w-full h-14 bg-[#ec7f13] hover:bg-[#d66c0a] text-white text-lg font-semibold rounded-xl shadow-lg shadow-[#ec7f13]/30"
            >
              Login com Google
            </Button>
            <button 
              onClick={handleForceRefresh}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#ec7f13] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Problemas com login?
            </button>
          </div>
        ) : (
          <>
            {/* Logged in indicator */}
            <div className="px-6 mb-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 dark:text-green-400">
                  Logado como <strong>{user.full_name || user.email}</strong>
                </span>
              </div>
            </div>

            {/* Language Selection */}
            <div className="px-6 mb-6">
              <h3 className="text-lg font-bold mb-3">Idioma</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedLanguage("PT")}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    selectedLanguage === "PT" 
                      ? "bg-[#ec7f13] text-white shadow-lg shadow-[#ec7f13]/30" 
                      : "bg-white dark:bg-[#2d241b] text-gray-700 dark:text-gray-300"
                  }`}
                >
                  🇵🇹 Português
                </button>
                <button
                  onClick={() => setSelectedLanguage("EN")}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    selectedLanguage === "EN" 
                      ? "bg-[#ec7f13] text-white shadow-lg shadow-[#ec7f13]/30" 
                      : "bg-white dark:bg-[#2d241b] text-gray-700 dark:text-gray-300"
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>

            {/* Profile Type Selection - Honeycomb Style */}
            <div className="px-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Selecione o seu perfil</h3>
              
              <div className="flex flex-col items-center gap-1">
                {/* First row - 2 hexagons */}
                <div className="flex gap-4 mb-[-20px]">
                  <Hexagon 
                    active={selectedType === "worker"} 
                    onClick={() => setSelectedType("worker")}
                    label="Profissional"
                  >
                    <Hammer className="w-8 h-8" />
                  </Hexagon>
                  <Hexagon 
                    active={selectedType === "employer"} 
                    onClick={() => setSelectedType("employer")}
                    label="Empregador"
                  >
                    <Briefcase className="w-8 h-8" />
                  </Hexagon>
                </div>
                
                {/* Second row - 2 hexagons offset */}
                <div className="flex gap-4 mb-[-20px]">
                  <Hexagon 
                    active={selectedType === "admin"} 
                    onClick={() => setSelectedType("admin")}
                    label="Administrador"
                  >
                    <Shield className="w-8 h-8" />
                  </Hexagon>
                  <Hexagon 
                    active={false} 
                    onClick={() => {}}
                    label="Em breve"
                  >
                    <Star className="w-8 h-8" />
                  </Hexagon>
                </div>
              </div>

              {/* Selected type description */}
              {selectedType && (
                <div className="mt-8 p-4 bg-white dark:bg-[#2d241b] rounded-xl border border-gray-200 dark:border-[#3a2e24]">
                  <h4 className="font-semibold text-[#ec7f13] mb-1">
                    {selectedType === "worker" && "Profissional"}
                    {selectedType === "employer" && "Empregador"}
                    {selectedType === "admin" && "Administrador"}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedType === "worker" && "Encontre trabalhos na área da construção e faça propostas para projetos."}
                    {selectedType === "employer" && "Publique projetos e encontre os melhores profissionais para o seu trabalho."}
                    {selectedType === "admin" && "Gestão completa da plataforma, supervisão e moderação de utilizadores."}
                  </p>
                </div>
              )}
            </div>

            {/* Recent Updates Section */}
            <div className="px-6 mb-6 flex-1">
              <h3 className="text-lg font-bold mb-3">Atualizações Recentes</h3>
              <div className="space-y-3">
                <div className="flex gap-3 p-3 bg-white dark:bg-[#2d241b] rounded-xl">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#3a2e24] flex-shrink-0">
                    <div 
                      className="w-full h-full"
                      style={{ 
                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                        background: 'linear-gradient(135deg, #ec7f13, #fbbf24)'
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">Novos Projetos</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Descubra oportunidades na sua área
                    </p>
                    <span className="text-xs text-[#ec7f13]">Novo</span>
                  </div>
                </div>

                <div className="flex gap-3 p-3 bg-white dark:bg-[#2d241b] rounded-xl">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">Sistema de Avaliações</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Construa a sua reputação
                    </p>
                    <span className="text-xs text-gray-400">Em breve</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <div className="px-6 pb-8">
              <Button 
                onClick={handleCreateProfile}
                disabled={!selectedType || isCreating}
                className="w-full h-14 bg-[#ec7f13] hover:bg-[#d66c0a] disabled:bg-gray-300 dark:disabled:bg-[#3a2e24] text-white text-lg font-semibold rounded-xl shadow-lg shadow-[#ec7f13]/30 disabled:shadow-none transition-all"
              >
                {isCreating ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Bottom Navigation Preview */}
        <nav className="sticky bottom-0 bg-white dark:bg-[#2d241b] border-t border-gray-200 dark:border-[#3a2e24] px-6 py-3">
          <div className="flex justify-around items-center">
            <button className="flex flex-col items-center gap-1 text-[#ec7f13]">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              <span className="text-xs font-medium">Início</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-gray-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs">Buscar</span>
            </button>
            <button className="w-14 h-14 -mt-6 bg-[#ec7f13] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#ec7f13]/30">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button className="flex flex-col items-center gap-1 text-gray-400">
              <MessageSquare className="w-6 h-6" />
              <span className="text-xs">Chat</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-gray-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs">Perfil</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}