
import React, { useState, useEffect, useRef } from "react";
import { User } from "@/entities/User";
import { UploadFile } from "@/integrations/Core";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User as UserIcon,
  Shield,
  Star,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Settings,
  Camera,
  FileText,
  Image as ImageIcon,
  Award,
  Languages,
  MoreVertical,
  LogOut,
  RefreshCw,
  Loader2
} from "lucide-react";

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
      alert("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Erro ao atualizar perfil");
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
      alert("Erro ao enviar a imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      window.location.href = createPageUrl("SetupProfile");
    } catch (error) {
      console.error("Error logging out:", error);
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Settings className="w-12 h-12 mx-auto mb-3 text-gray-400 animate-spin" />
          <p className="text-gray-500">A carregar perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <UserIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">Não autenticado</p>
          <Button className="mt-3" onClick={() => User.loginWithRedirect(window.location.href)}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
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
    <div className="min-h-screen bg-gray-50">
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarUpload}
        className="hidden"
        accept="image/*"
      />
      {/* Mobile Header */}
      <div className="bg-white border-b">
        {/* Profile Header */}
        <div className="relative">
          {/* Cover Photo Placeholder */}
          <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>

          {/* Profile Info */}
          <div className="px-4 pb-4">
            {/* Avatar */}
            <div className="relative -mt-12 mb-4 w-fit">
              <Avatar className="w-24 h-24 border-4 border-white">
                <AvatarImage src={user.avatar_url} alt={user.full_name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                  {isUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : (user.full_name?.charAt(0) || <UserIcon className="w-12 h-12" />)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border-2"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploading}
              >
                <Camera className="w-4 h-4 text-gray-600" />
              </Button>
            </div>

            {/* Name and Type */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {user.full_name || "Nome não definido"}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={
                    user.user_type === 'worker'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }>
                    {user.user_type === 'worker' ? 'Profissional' : 'Empregador'}
                  </Badge>
                  {user.verified && (
                    <Shield className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" className="hidden md:flex" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-1" />
                  Editar
                </Button>

                {/* --- Mobile Menu --- */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="md:hidden" onClick={() => setIsEditing(true)}>
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
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-gray-600 text-sm mb-3">{user.bio}</p>
            )}

            {/* Contact Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {user.city && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{user.city}</span>
                </div>
              )}
              {user.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{user.phone}</span>
                </div>
              )}
              {user.email && (
                <div className="flex items-center gap-2 text-gray-600 col-span-2">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
              )}
            </div>

            {/* Rating (for workers AND employers) */}
            {(user.user_type === 'worker' || user.user_type === 'employer') && (
              <div className="flex items-center justify-center gap-4 mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-bold">{user.rating || '0.0'}</span>
                  </div>
                  <span className="text-xs text-gray-500">Avaliação</span>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-600">{user.xp || 0}</div>
                  <span className="text-xs text-gray-500">XP</span>
                </div>
                {user.company && user.user_type === 'employer' && (
                  <div className="text-center">
                    <div className="font-bold text-purple-600 truncate max-w-24">{user.company}</div>
                    <span className="text-xs text-gray-500">Empresa</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skills (for workers) */}
      {user.user_type === 'worker' && user.skills && user.skills.length > 0 && (
        <div className="bg-white border-b p-4">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Competências
          </h3>
          <div className="flex flex-wrap gap-2">
            {user.skills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Service Areas */}
      {user.service_areas && user.service_areas.length > 0 && (
        <div className="bg-white border-b p-4">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Áreas de Atuação
          </h3>
          <div className="flex flex-wrap gap-2">
            {user.service_areas.map((area, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {area}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Content */}
      <div className="flex-1">
        <Tabs defaultValue="portfolio" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white border-b">
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Portfólio
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="p-4">
            <PortfolioGallery
              images={user.portfolio_images || []}
              onUpdate={loadUser}
              canEdit={true}
            />
          </TabsContent>

          <TabsContent value="documents" className="p-4">
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
