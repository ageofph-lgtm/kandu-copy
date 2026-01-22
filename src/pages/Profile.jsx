import React, { useState, useEffect, useRef } from "react";
import { User } from "@/entities/User";
import { UploadFile } from "@/integrations/Core";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
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
  User as UserIcon,
  Camera,
  LogOut,
  RefreshCw,
  Edit2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import ProfileForm from "../components/profile/ProfileForm";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      if (!userData.user_type) {
        setIsEditing(true);
      }
    } catch (error) {
      console.log("User not authenticated");
    }
    setLoading(false);
  };

  const handleSave = async (profileData) => {
    try {
      await User.updateMyUserData(profileData);
      await loadUser();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      await User.updateMyUserData({ avatar_url: file_url });
      await loadUser();
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      window.location.href = createPageUrl("SetupProfile");
    } catch (error) {
      window.location.href = createPageUrl("SetupProfile");
    }
  };

  const handleChangeProfile = async () => {
    try {
      await User.updateMyUserData({ user_type: null });
      navigate(createPageUrl("SetupProfile"));
    } catch (error) {
      console.error("Error changing profile:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#F26522] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500 mb-4">Não autenticado</p>
          <Button 
            className="bg-[#F26522] hover:bg-orange-600"
            onClick={() => User.loginWithRedirect(window.location.href)}
          >
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="p-4 max-w-md mx-auto bg-[#F8FAFC] min-h-screen">
        <ProfileForm
          user={user}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          isFirstTime={!user.user_type}
        />
      </div>
    );
  }

  const specialties = user.skills || ["Pintura", "Elétrica", "Encanamento", "Alvenaria", "Pisos", "Telhados"];
  
  const portfolioImages = user.portfolio_images || [
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1541123603104-512919d6a96c?w=200&h=200&fit=crop",
  ];

  const specIcons = {
    "Pintura": "🎨",
    "Elétrica": "⚡",
    "Eletricidade": "⚡",
    "Encanamento": "🔧",
    "Canalização": "🔧",
    "Alvenaria": "🧱",
    "Pisos": "🏠",
    "Pavimentos": "🏠",
    "Telhados": "🏗️",
    "Carpintaria": "🪚",
    "Climatização": "❄️",
    "Isolamentos": "🧱",
    "Ladrilhador": "🔲",
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] pb-4">
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarUpload}
        className="hidden"
        accept="image/*"
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200 px-4 py-3 flex justify-between items-center max-w-md mx-auto md:max-w-none">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#1E293B]" />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Perfil Profissional</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <MoreVertical className="w-5 h-5 text-[#1E293B]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Editar Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleChangeProfile}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Trocar Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="w-full max-w-md mx-auto px-4 pt-6">
        {/* Profile Card */}
        <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col items-center mb-8">
          {/* Hexagon Avatar */}
          <div className="relative w-32 h-36 mb-4 group">
            {/* Glow effect */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-[#F26522] to-orange-600 opacity-20"
              style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', transform: 'scale(1.05)' }}
            />
            {/* Border */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-[#F26522] to-orange-600"
              style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
            />
            {/* Image container */}
            <div 
              className="absolute inset-[3px] bg-gray-200 overflow-hidden flex items-center justify-center"
              style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
            >
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-[#F26522] animate-spin" />
              ) : user.avatar_url ? (
                <img 
                  src={user.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#F26522] to-orange-600 flex items-center justify-center text-white text-4xl font-bold">
                  {user.full_name?.charAt(0) || "U"}
                </div>
              )}
            </div>
            {/* Camera button */}
            <button 
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-1 right-1 bg-white text-[#1E293B] rounded-full p-1.5 border-2 border-white shadow-md hover:bg-gray-100 transition-colors z-20"
            >
              <Camera className="w-4 h-4" />
            </button>
            {/* Verified badge */}
            {user.verified && (
              <div className="absolute bottom-2 left-2 bg-green-500 text-white rounded-full p-1 border-2 border-white shadow-sm z-20">
                <Check className="w-3 h-3" />
              </div>
            )}
          </div>

          <h2 className="text-2xl font-bold text-[#1E293B] mb-1">
            {user.full_name || "Nome não definido"}
          </h2>
          <p className="text-[#F26522] font-semibold text-sm uppercase tracking-wider mb-3 flex items-center gap-1">
            <Check className="w-4 h-4" /> 
            {user.user_type === 'worker' ? 'Profissional Certificado' : 'Empregador Verificado'}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-6 mb-6 w-full justify-center">
            <div className="text-center">
              <div className="flex items-center justify-center text-yellow-400 font-bold text-lg">
                <span>{user.rating || '4.9'}</span>
                <Star className="w-4 h-4 ml-1 fill-yellow-400" />
              </div>
              <span className="text-xs text-[#64748B]">{user.reviews_count || '128'} Avaliações</span>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-center">
              <div className="font-bold text-lg text-[#1E293B]">{user.success_rate || '98'}%</div>
              <span className="text-xs text-[#64748B]">Taxa de Sucesso</span>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-center">
              <div className="font-bold text-lg text-[#1E293B]">{user.years_experience || '7'}+</div>
              <span className="text-xs text-[#64748B]">Anos Exp.</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full">
            <Button 
              onClick={() => setIsEditing(true)}
              className="flex-1 bg-[#F26522] hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-orange-500/20"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Mensagem
            </Button>
            <button className="bg-gray-100 text-[#1E293B] p-3 rounded-xl hover:bg-gray-200 transition-colors">
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Specialties Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1E293B]">Especialidades</h2>
            <button className="text-sm text-[#F26522] font-medium hover:underline">Ver todas</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {specialties.map((spec, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                style={{ 
                  clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)',
                  padding: '8px 20px'
                }}
              >
                <span>{specIcons[spec] || "🔧"}</span> {spec}
              </div>
            ))}
          </div>
        </section>

        {/* About Section */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#1E293B] mb-3">Sobre</h2>
          <p className="text-[#64748B] leading-relaxed text-sm">
            {user.bio || "Profissional dedicado com vasta experiência em reformas residenciais e comerciais. Foco na qualidade do acabamento e cumprimento rigoroso de prazos. Especialista em resolver problemas complexos de elétrica e hidráulica."}
          </p>
        </section>

        {/* Portfolio Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1E293B]">Portfólio Recente</h2>
            <span className="text-sm text-[#64748B]">{portfolioImages.length} Projetos</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {portfolioImages.slice(0, 5).map((img, idx) => (
              <div 
                key={idx}
                className="relative w-[100px] h-[110px] shadow-sm overflow-hidden group"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
              >
                <img 
                  src={img}
                  alt={`Portfolio ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews Section */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#1E293B] mb-4">Avaliações</h2>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                  <img 
                    alt="Reviewer" 
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
                  />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#1E293B]">Ana Souza</p>
                  <p className="text-xs text-[#64748B]">Há 2 dias</p>
                </div>
              </div>
              <div className="flex text-yellow-400 text-sm">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400" />
                ))}
              </div>
            </div>
            <p className="text-sm text-[#1E293B] mt-2">
              "O Carlos fez um trabalho excelente na pintura do meu apartamento. Muito cuidadoso com a mobília e o acabamento ficou perfeito. Recomendo!"
            </p>
          </div>
        </section>
      </main>


    </div>
  );
}