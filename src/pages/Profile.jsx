import React, { useState, useEffect, useRef } from "react";
import { User } from "@/entities/User";
import { UploadFile } from "@/integrations/Core";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Camera,
  FileText,
  Image as ImageIcon,
  LogOut,
  RefreshCw,
  Loader2,
  MessageCircle,
  Bookmark,
  ChevronRight,
  Shield,
  Award
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import ProfileForm from "../components/profile/ProfileForm";
import PortfolioGallery from "../components/profile/PortfolioGallery";
import DocumentsList from "../components/profile/DocumentsList";

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mb-4" />
        <p className="text-[var(--text-secondary)]">A carregar perfil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)]">
        <div className="w-16 h-16 hexagon bg-[var(--surface)] flex items-center justify-center mb-4">
          <span className="material-icons-round text-3xl text-[var(--text-muted)]">person</span>
        </div>
        <p className="text-[var(--text-secondary)] mb-4">Não autenticado</p>
        <Button onClick={() => User.loginWithRedirect(window.location.href)} className="btn-primary">
          Fazer Login
        </Button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4">
        <ProfileForm
          user={user}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          isFirstTime={!user.user_type}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarUpload}
        className="hidden"
        accept="image/*"
      />

      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-[var(--surface)] shadow-sm flex items-center justify-center">
          <span className="material-icons-round text-[var(--text-secondary)]">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-[var(--text-primary)]">Perfil Profissional</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-10 h-10 rounded-full bg-[var(--surface)] shadow-sm flex items-center justify-center">
              <span className="material-icons-round text-[var(--text-secondary)]">more_vert</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[var(--surface)] border-[var(--border)]">
            <DropdownMenuItem onClick={() => setIsEditing(true)} className="text-[var(--text-primary)]">
              <Edit2 className="w-4 h-4 mr-2" />
              Editar Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleChangeProfile} className="text-[var(--text-primary)]">
              <RefreshCw className="w-4 h-4 mr-2" />
              Trocar Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-red-500">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Profile Card */}
      <div className="px-6">
        <div className="bg-[var(--surface)] rounded-2xl shadow-sm p-6 relative">
          {/* Hexagon Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-28 h-32 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-amber-600 hexagon" />
                <div className="absolute inset-[3px] bg-[var(--surface)] hexagon overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                      {isUploading ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                      ) : (
                        <span className="material-icons-round text-4xl">person</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-gray-900 shadow-lg"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Name & Badge */}
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {user.full_name || "Nome não definido"}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              {user.verified && <Shield className="w-4 h-4 text-[var(--primary)]" />}
              <span className="text-[var(--primary)] text-sm font-semibold uppercase tracking-wider">
                {user.user_type === 'worker' ? 'Empreiteiro Certificado' : 'Empregador'}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-6 mt-6 w-full">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="font-bold text-lg text-[var(--text-primary)]">{user.rating || '4.9'}</span>
                  <Star className="w-4 h-4 text-[var(--primary)] fill-[var(--primary)]" />
                </div>
                <span className="text-xs text-[var(--text-muted)]">{user.reviews_count || 128} Avaliações</span>
              </div>
              <div className="w-px h-8 bg-[var(--border)]" />
              <div className="text-center">
                <div className="font-bold text-lg text-[var(--text-primary)]">98%</div>
                <span className="text-xs text-[var(--text-muted)]">Taxa de Sucesso</span>
              </div>
              <div className="w-px h-8 bg-[var(--border)]" />
              <div className="text-center">
                <div className="font-bold text-lg text-[var(--text-primary)]">7+</div>
                <span className="text-xs text-[var(--text-muted)]">Anos Exp.</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 w-full">
              <Button className="flex-1 btn-primary rounded-xl h-12">
                <MessageCircle className="w-5 h-5 mr-2" />
                Mensagem
              </Button>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-[var(--border)]">
                <Bookmark className="w-5 h-5 text-[var(--text-secondary)]" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      {user.user_type === 'worker' && user.skills && user.skills.length > 0 && (
        <div className="px-6 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[var(--text-primary)]">Especialidades</h3>
            <button className="text-[var(--primary)] text-sm font-medium">Ver todas</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.skills.map((skill, index) => (
              <span 
                key={index} 
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
              >
                <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bio */}
      {user.bio && (
        <div className="px-6 mt-6">
          <h3 className="font-bold text-[var(--text-primary)] mb-3">Sobre</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4">
            {user.bio}
          </p>
        </div>
      )}

      {/* Portfolio & Documents Tabs */}
      <div className="px-6 mt-6 pb-24">
        <Tabs defaultValue="portfolio" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 h-auto">
            <TabsTrigger 
              value="portfolio" 
              className="rounded-lg py-2 data-[state=active]:bg-[var(--primary)] data-[state=active]:text-gray-900"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Portfólio
            </TabsTrigger>
            <TabsTrigger 
              value="documents"
              className="rounded-lg py-2 data-[state=active]:bg-[var(--primary)] data-[state=active]:text-gray-900"
            >
              <FileText className="w-4 h-4 mr-2" />
              Documentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="mt-4">
            <PortfolioGallery
              images={user.portfolio_images || []}
              onUpdate={loadUser}
              canEdit={true}
            />
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <DocumentsList
              documents={user.documents || []}
              onUpdate={loadUser}
              canEdit={true}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}