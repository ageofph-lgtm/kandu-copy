import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Loader2,
  Briefcase,
  Wrench,
  Shield,
  CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SetupProfile() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true);
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        if (userData.user_type) {
          navigate(createPageUrl("Home"));
          return;
        }
      } catch (error) {
        console.log("User not authenticated or error:", error);
        setUser(null);
      }
      setLoading(false);
    };
    
    checkUser();
  }, [navigate]);

  const handleCreateProfile = async () => {
    if (!selectedType) {
      alert("Por favor, selecione o tipo de perfil");
      return;
    }

    if (!user) {
      try {
        await base44.auth.redirectToLogin(window.location.href);
      } catch (error) {
        console.error("Login error:", error);
      }
      return;
    }

    setIsCreating(true);
    try {
      await base44.auth.updateMe({ 
        user_type: selectedType,
        status: 'active'
      });
      
      window.location.href = createPageUrl("Home");
    } catch (error) {
      console.error("Error creating profile:", error);
      alert("Erro ao criar perfil. Tente novamente.");
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#F26522] animate-spin" />
      </div>
    );
  }

  const profileTypes = [
    {
      type: 'employer',
      icon: Briefcase,
      title: 'Empregador',
      description: 'Publique trabalhos e encontre profissionais qualificados',
      color: 'from-blue-500 to-blue-600',
      features: ['Publicar obras', 'Receber propostas', 'Avaliar profissionais']
    },
    {
      type: 'worker',
      icon: Wrench,
      title: 'Profissional',
      description: 'Encontre trabalhos e mostre suas habilidades',
      color: 'from-[#F26522] to-orange-600',
      features: ['Candidatar-se a obras', 'Criar portfólio', 'Ganhar reputação']
    },
    {
      type: 'admin',
      icon: Shield,
      title: 'Administrador',
      description: 'Gerir plataforma e usuários (apenas para testes)',
      color: 'from-purple-500 to-purple-600',
      features: ['Gestão de usuários', 'Moderação', 'Estatísticas']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bem-vindo ao <span className="text-[#F26522]">Eos</span>
          </h1>
          <p className="text-lg text-gray-600">
            Selecione o tipo de perfil que melhor se adequa a você
          </p>
          {user && (
            <p className="text-sm text-gray-500 mt-2">
              Logado como: <span className="font-medium">{user.email}</span>
            </p>
          )}
        </div>

        {/* Profile Type Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {profileTypes.map((profile) => (
            <Card
              key={profile.type}
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                selectedType === profile.type
                  ? 'ring-4 ring-[#F26522] shadow-2xl scale-105'
                  : 'hover:scale-102'
              }`}
              onClick={() => setSelectedType(profile.type)}
            >
              <CardContent className="p-6">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${profile.color} flex items-center justify-center mb-4 mx-auto`}>
                  <profile.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-center mb-2">
                  {profile.title}
                </h3>
                
                <p className="text-sm text-gray-600 text-center mb-4">
                  {profile.description}
                </p>

                <div className="space-y-2">
                  {profile.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>

                {selectedType === profile.type && (
                  <div className="mt-4 p-2 bg-[#F26522] bg-opacity-10 rounded-lg text-center">
                    <span className="text-sm font-medium text-[#F26522]">Selecionado</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Button */}
        <div className="text-center">
          <Button
            onClick={user ? handleCreateProfile : () => base44.auth.redirectToLogin(window.location.href)}
            disabled={isCreating || (!user && !selectedType)}
            className="bg-[#F26522] hover:bg-orange-600 text-white font-bold py-6 px-12 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            {isCreating ? (
              <><Loader2 className="w-6 h-6 animate-spin mr-2" /> Criando perfil...</>
            ) : user ? (
              selectedType ? `Continuar como ${profileTypes.find(p => p.type === selectedType)?.title}` : 'Selecione um tipo de perfil'
            ) : (
              'Fazer Login'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}