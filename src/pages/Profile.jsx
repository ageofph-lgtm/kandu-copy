import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@/lib/ThemeContext";
import LoadingScreen from "@/components/LoadingScreen";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Edit2, LogOut, RefreshCw, FileText, Image as ImageIcon, Award, MapPin as MapPinIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileForm from "../components/profile/ProfileForm";
import ReviewsSection from "../components/profile/ReviewsSection";
import PortfolioGallery from "../components/profile/PortfolioGallery";
import DocumentsList from "../components/profile/DocumentsList";

export default function Profile() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const avatarInputRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const viewingUserId = urlParams.get('userId');
  const isOwnProfile = !viewingUserId;

  const bg = isDark ? "#1A1A1A" : "#FFFFFF";
  const surface = isDark ? "#2A2A2A" : "#F5F5F5";
  const text = isDark ? "#FFFFFF" : "#1A1A1A";
  const subtext = isDark ? "#AAAAAA" : "#666666";
  const border = isDark ? "#333333" : "#E5E5E5";

  useEffect(() => {
    loadUser();
  }, [viewingUserId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      let userData;
      if (viewingUserId) {
        const users = await base44.entities.User.filter({ id: viewingUserId });
        userData = users[0];
      } else {
        userData = await base44.auth.me();
      }
      if (!userData) throw new Error('User not found');
      setUser(userData);
      if (!userData.user_type) {
        setIsEditing(true);
      }
    } catch (error) {
      console.error("Error loading user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (profileData) => {
    try {
      await base44.auth.updateMe(profileData);
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
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ avatar_url: file_url });
      await loadUser();
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const handleChangeProfile = async () => {
    try {
      await base44.auth.updateMe({ user_type: null });
      window.location.href = createPageUrl("SetupProfile");
    } catch (error) {
      console.error("Error changing profile:", error);
    }
  };

  if (loading) {
    return <LoadingScreen label="A carregar..." />;
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: text, fontSize: 16, marginBottom: 16 }}>Não autenticado</p>
          <Button 
            style={{ background: "#F26522" }}
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
          >
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  if (isEditing && isOwnProfile) {
    return (
      <div style={{ padding: 16, maxWidth: 480, margin: "0 auto", background: bg, minHeight: "100vh" }}>
        <ProfileForm user={user} onSave={handleSave} onCancel={() => setIsEditing(false)} isFirstTime={!user.user_type} />
      </div>
    );
  }

  const xp = user.xp || 0;
  const getNivelFromXP = (x) => {
    if (x >= 5000) return "Mestre";
    if (x >= 2000) return "Avançado";
    if (x >= 500) return "Intermédio";
    return "Iniciante";
  };

  return (
    <div style={{ background: bg, minHeight: "100vh", padding: "50px 20px 80px", overflowY: "auto" }}>
      <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />

      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }}>←</button>
        {isOwnProfile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 8, display:"flex", alignItems:"center", justifyContent:"center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}><Edit2 className="w-4 h-4 mr-2" /> Editar Perfil</DropdownMenuItem>
              <DropdownMenuItem onClick={handleChangeProfile}><RefreshCw className="w-4 h-4 mr-2" /> Trocar Perfil</DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600"><LogOut className="w-4 h-4 mr-2" /> Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button style={{ background: "#FF6600", border: "none", borderRadius: 8, padding: "8px 16px", color: "#FFF", fontWeight: 600, cursor: "pointer", fontSize: 13 }} onClick={() => navigate(createPageUrl("Chat") + `?userId=${user.id}`)}>
            💬 Contactar
          </button>
        )}
      </div>


      {/* KANDU Logo */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
        <img
          src={isDark
            ? "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/90321a683_Gemini_Generated_Image_k4rh2gk4rh2gk4rh.png"
            : "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/002158942_Gemini_Generated_Image_5.png"}
          alt="KANDU" style={{ height: 26, objectFit: "contain" }}
        />
      </div>
      {/* Avatar */}
      <div 
        style={{ 
          width: 100, 
          height: 100, 
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", 
          overflow: "hidden", 
          border: "4px solid #FF6600", 
          margin: "0 auto 12px", 
          cursor: isOwnProfile ? "pointer" : "default",
          background: "#FF6600",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFF",
          fontSize: 36,
          fontWeight: 800,
          flexShrink: 0
        }} 
        onClick={() => isOwnProfile && avatarInputRef.current?.click()}
      >
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          user?.full_name?.charAt(0) || "U"
        )}
      </div>

      {/* Nome */}
      <p style={{ fontWeight: 800, fontSize: 20, color: text, textAlign: "center", margin: "0 0 4px" }}>
        {user?.full_name || "Nome não definido"}
      </p>
      <p style={{ color: subtext, textAlign: "center", marginBottom: 16, fontSize: 14 }}>
        {user?.user_type || "Tipo não definido"}
      </p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div style={{ background: surface, borderRadius: 14, padding: "14px 8px", textAlign: "center" }}>
          <p style={{ fontWeight: 800, fontSize: 18, color: text, margin: 0 }}>{user?.completed_jobs || 0}</p>
          <p style={{ color: subtext, fontSize: 11, margin: 0 }}>Trabalhos</p>
        </div>
        <div style={{ background: surface, borderRadius: 14, padding: "14px 8px", textAlign: "center" }}>
          <p style={{ fontWeight: 800, fontSize: 18, color: "#FF6600", margin: 0 }}>{user?.rating?.toFixed(1) || "N/A"} ⭐</p>
          <p style={{ color: subtext, fontSize: 11, margin: 0 }}>Avaliação</p>
        </div>
        <div style={{ background: surface, borderRadius: 14, padding: "14px 8px", textAlign: "center" }}>
          <p style={{ fontWeight: 800, fontSize: 18, color: "#22C55E", margin: 0 }}>{user?.attendance_rate || "—"}%</p>
          <p style={{ color: subtext, fontSize: 11, margin: 0 }}>Presença</p>
        </div>
      </div>

      {/* XP Card */}
      <div style={{ background: surface, borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontWeight: 800, fontSize: 20, color: "#FF6600" }}>{xp} XP</span>
          <span style={{ color: "#AAAAAA", fontSize: 13, marginLeft: "auto" }}>Nível: {getNivelFromXP(xp)}</span>
        </div>
        <div style={{ background: border, height: 8, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ background: "#FF6600", height: "100%", borderRadius: 8, width: "50%", transition: "width 0.5s" }} />
        </div>
      </div>

      {/* Skills — só para workers */}
      {user?.user_type === 'worker' && user?.skills && user.skills.length > 0 && (
        <div style={{ background: surface, borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Award style={{ width: 16, height: 16, color: "#FF6600" }} />
            <p style={{ fontWeight: 700, fontSize: 15, color: text, margin: 0 }}>Competências</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {user.skills.map((skill, i) => (
              <span key={i} style={{ background: isDark ? "#333" : "#E5E5E5", color: text, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Áreas de Atuação — só para workers */}
      {user?.user_type === 'worker' && user?.service_areas && user.service_areas.length > 0 && (
        <div style={{ background: surface, borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <MapPinIcon style={{ width: 16, height: 16, color: "#FF6600" }} />
            <p style={{ fontWeight: 700, fontSize: 15, color: text, margin: 0 }}>Áreas de Atuação</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {user.service_areas.map((area, i) => (
              <span key={i} style={{ background: "transparent", border: "1px solid #FF6600", color: "#FF6600", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                {area}
              </span>
            ))}
          </div>
        </div>
      )}



      {/* Avaliações */}
      <div style={{ background: surface, borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: text, marginBottom: 12 }}>Avaliações</p>
        <ReviewsSection userId={user?.id} />
      </div>

      {/* Tabs Portfólio / Documentos — só para workers */}
      {user?.user_type === 'worker' && isOwnProfile && (
        <div style={{ background: surface, borderRadius: 16, marginBottom: 12, overflow: "hidden" }}>
          <Tabs defaultValue="portfolio">
            <TabsList style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: isDark ? "#222" : "#EEEEEE", margin: "0", borderRadius: "16px 16px 0 0", padding: 4, gap: 4 }}>
              <TabsTrigger value="portfolio" style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 12, fontSize: 13, fontWeight: 600 }}>
                <ImageIcon style={{ width: 14, height: 14 }} />
                Portfólio
              </TabsTrigger>
              <TabsTrigger value="documents" style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 12, fontSize: 13, fontWeight: 600 }}>
                <FileText style={{ width: 14, height: 14 }} />
                Documentos
              </TabsTrigger>
            </TabsList>
            <TabsContent value="portfolio" style={{ padding: 16 }}>
              <PortfolioGallery
                images={user?.portfolio_images || []}
                onUpdate={loadUser}
                canEdit={isOwnProfile}
              />
            </TabsContent>
            <TabsContent value="documents" style={{ padding: 16 }}>
              <DocumentsList
                documents={user?.documents || []}
                onUpdate={loadUser}
                canEdit={isOwnProfile}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}