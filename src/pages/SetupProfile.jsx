
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User as UserIcon, 
  Building2, 
  MapPin,
  Hammer,
  Languages,
  ArrowRight,
  RefreshCw,
  Shield, // Added Shield icon for admin profile
  Settings // Add Settings icon
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
      
      // Se já tem user_type definido, redirecionar para dashboard
      if (userData.user_type) {
        navigate(createPageUrl("Dashboard"));
        return;
      }
      
      // Se já tem idioma definido, usar esse
      if (userData.language) {
        setSelectedLanguage(userData.language);
      }
    } catch (error) {
      // Usuário não autenticado
      setUser(null);
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    // Aguardar um pouco antes de verificar o usuário
    // para permitir que o logout seja processado completamente
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
      // Forçar login se o usuário não estiver autenticado ao clicar em continuar
      try {
        await User.loginWithRedirect(window.location.href);
      } catch (error) {
        console.error("Login error:", error);
        // Alternativa: tentar login direto
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
      // Fallback: tentar recarregar a página após um delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleForceRefresh = () => {
    // Limpar qualquer cache local e recarregar
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Settings className="w-12 h-12 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c6abd952b45c1542486306/b4f7a9bf2_ChatGPTImage15_09_202513_47_42.png" alt="Eos Logo" className="w-24 h-24 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('welcomeTitle')}
          </h1>
          <p className="text-gray-600">
            {user ? t('welcomeSubtitle') : "Para continuar, faça login com a sua conta Google."}
          </p>
        </div>

        {!user ? (
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <Button onClick={handleLogin} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg">
                Login com Google
              </Button>
              
              {/* Botão de emergência para problemas de login */}
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">
                  Problemas com o login?
                </p>
                <Button 
                  onClick={handleForceRefresh} 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Recarregar página
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Indicador de usuário logado */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <p className="text-green-800">
                  ✅ Logado como: <strong>{user.full_name || user.email}</strong>
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Agora escolha o tipo de perfil
                </p>
              </CardContent>
            </Card>

            {/* Seleção de idioma */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="w-5 h-5" />
                  {t('language')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={selectedLanguage === "PT" ? "default" : "outline"}
                    onClick={() => setSelectedLanguage("PT")}
                    className="h-12"
                  >
                    🇵🇹 {t('portuguese')}
                  </Button>
                  <Button
                    variant={selectedLanguage === "EN" ? "default" : "outline"}
                    onClick={() => setSelectedLanguage("EN")}
                    className="h-12"
                  >
                    🇬🇧 {t('english')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Seleção de tipo de perfil */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  {t('howToUse')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Profissional */}
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedType === "worker" 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedType("worker")}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Hammer className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {t('imProfessional')}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {t('professionalDesc')}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {t('painting')}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {t('electricity')}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {t('plumbing')}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">+</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Empregador */}
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedType === "employer" 
                      ? "border-purple-500 bg-purple-50" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedType("employer")}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {t('iNeedServices')}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {t('servicesDesc')}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {selectedLanguage === "PT" ? "Casa" : "Home"}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {selectedLanguage === "PT" ? "Escritório" : "Office"}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {selectedLanguage === "PT" ? "Loja" : "Store"}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">+</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Administrador */}
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedType === "admin" 
                      ? "border-red-500 bg-red-50" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedType("admin")}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Administrador
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Gestão completa da plataforma, supervisão e moderação
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                          Blacklist
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Supervisão
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Relatórios
                        </Badge>
                        <Badge variant="secondary" className="text-xs">+</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botão continuar */}
            <Button 
              onClick={handleCreateProfile}
              disabled={!selectedType || isCreating}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg"
            >
              {isCreating ? t('creatingProfile') : (
                <>
                  {t('continue')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
