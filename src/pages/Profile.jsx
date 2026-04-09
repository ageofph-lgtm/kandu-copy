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

import { Job } from "@/entities/Job";
import ProfileForm from "../components/profile/ProfileForm";
import DocumentsList from "../components/profile/DocumentsList";
import VerificationBadge from "../components/profile/VerificationBadge";
import VerificationUpgrade from "../components/profile/VerificationUpgrade";
import XPDisplay from "../components/profile/XPDisplay";
import ReviewsSection from "../components/profile/ReviewsSection";
import { base44 } from "@/api/base44Client";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [noShowStats, setNoShowStats] = useState({ noShows: 0, totalJobs: 0 });
  const avatarInputRef = useRef(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      if (userData.user_type === 'worker') {
        const workerJobs = await Job.filter({ worker_id: userData.id });
        const noShows = workerJobs.filter(j => j.status === 'cancelled').length;
        const totalJobs = workerJobs.filter(j => ['completed', 'cancelled'].includes(j.status)).length;
        setNoShowStats({ noShows, totalJobs });
      }
      if (!userData.user_type) {
        setIsEditing(true);
      }
    } catch (error) {
      console.log("User not authenticated");
    }
    setLoading(false);
  };

  const syncToSupabase = async () => {
    try {
      await base44.functions.invoke('syncCurrentUserToSupabase', {});
    } catch (e) {
      console.error("Supabase sync error:", e);
    }
  };

  const handleSave = async (profileData) => {
    try {
      await User.updateMyUserData(profileData);
      await loadUser();
      setIsEditing(false);
      await syncToSupabase();
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
      await syncToSupabase();
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
    return (
      <div style={{minHeight:"100vh",background:"#1A1A1A",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Loader2 style={{width:40,height:40,color:"#FF6600",animation:"spin 1s linear infinite"}} />
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
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
          >
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div style={{padding:16,maxWidth:480,margin:"0 auto",background:"#1A1A1A",minHeight:"100vh"}}>
        <ProfileForm user={user} onSave={handleSave} onCancel={() => setIsEditing(false)} isFirstTime={!user.user_type} />
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

  const getNivelFromXP = (x = 0) => {
    if (x >= 5000) return "Mestre";
    if (x >= 2000) return "Avançado";
    if (x >= 500) return "Intermédio";
    return "Iniciante";
  };
  const xpNivelMin = (x = 0) => x >= 5000 ? 5000 : x >= 2000 ? 2000 : x >= 500 ? 500 : 0;
  const xpNivelMax = (x = 0) => x >= 5000 ? 10000 : x >= 2000 ? 5000 : x >= 500 ? 2000 : 500;
  const xp = user.xp || 0;
  const xpProgress = Math.min(100, ((xp - xpNivelMin(xp)) / (xpNivelMax(xp) - xpNivelMin(xp))) * 100);

  return (
    <div style={{background:"#1A1A1A",minHeight:"100vh",padding:"50px 20px 80px",overflowY:"auto"}}>
      <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />

      {/* Top Bar */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <img src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/f0a8b458b_Gemini_Generated_Image_nn24elnn24elnn24-Photoroom.png" style={{width:32, background:"white", borderRadius:6, padding:2}} alt="" /> alt="" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button style={{background:"none",border:"none",cursor:"pointer",fontSize:22}}>⚙️</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditing(true)}><Edit2 className="w-4 h-4 mr-2" /> Editar Perfil</DropdownMenuItem>
            <DropdownMenuItem onClick={handleChangeProfile}><RefreshCw className="w-4 h-4 mr-2" /> Trocar Perfil</DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-red-600"><LogOut className="w-4 h-4 mr-2" /> Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Avatar Hexagonal */}
      <div style={{width:100,height:100,clipPath:"polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)",overflow:"hidden",border:"4px solid #FF6600",margin:"0 auto 12px",cursor:"pointer"}} onClick={() => avatarInputRef.current?.click()}>
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="Avatar" style={{width:"100%",height:"100%",objectFit:"cover"}} />
        ) : (
          <div style={{width:"100%",height:"100%",background:"#FF6600",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF",fontSize:36,fontWeight:800}}>
            {user.full_name?.charAt(0) || "U"}
          </div>
        )}
      </div>

      {/* Nome e Tipo */}
      <p style={{fontWeight:800,fontSize:20,color:"#FFF",textAlign:"center",margin:"0 0 4px"}}>{user.full_name || "Nome não definido"}</p>
      <p style={{color:"#AAAAAA",textAlign:"center",marginBottom:10,fontSize:14}}>Profissional · {user.skills?.[0] || user.user_type}</p>

      {/* Badges */}
      <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {(user.verified_level === "verified" || user.verified_level === "ultra_verified") && (
          <span style={{background:"#FF660022",color:"#FF6600",border:"1px solid #FF660044",borderRadius:20,padding:"5px 14px",fontSize:13,fontWeight:600}}>✓ Verified</span>
        )}
        {user.verified_level === "ultra_verified" && (
          <span style={{background:"#FFAA0022",color:"#FFAA00",border:"1px solid #FFAA0044",borderRadius:20,padding:"5px 14px",fontSize:13,fontWeight:600}}>⭐ Ultra Verified</span>
        )}
      </div>

      {/* Grid Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
        <div style={{background:"#2A2A2A",borderRadius:14,padding:"14px 8px",textAlign:"center"}}>
          <p style={{fontWeight:800,fontSize:18,color:"#FFF",margin:0}}>{user.completed_jobs || 0}</p>
          <p style={{color:"#AAAAAA",fontSize:11,margin:0}}>Trabalhos</p>
        </div>
        <div style={{background:"#2A2A2A",borderRadius:14,padding:"14px 8px",textAlign:"center"}}>
          <p style={{fontWeight:800,fontSize:18,color:"#FF6600",margin:0}}>{user.rating?.toFixed(1) || "N/A"} ⭐</p>
          <p style={{color:"#AAAAAA",fontSize:11,margin:0}}>Avaliação</p>
        </div>
        <div style={{background:"#2A2A2A",borderRadius:14,padding:"14px 8px",textAlign:"center"}}>
          <p style={{fontWeight:800,fontSize:18,color:"#22C55E",margin:0}}>{user.attendance_rate || "—"}%</p>
          <p style={{color:"#AAAAAA",fontSize:11,margin:0}}>Presença</p>
        </div>
      </div>

      {/* Card XP */}
      <div style={{background:"#2A2A2A",borderRadius:16,padding:16,marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",marginBottom:10}}>
          <span style={{fontWeight:800,fontSize:20,color:"#FF6600"}}>{xp} XP</span>
          <span style={{color:"#AAAAAA",fontSize:13,marginLeft:"auto"}}>Nível: {getNivelFromXP(xp)}</span>
        </div>
        <div style={{background:"#333",height:8,borderRadius:8,overflow:"hidden"}}>
          <div style={{background:"#FF6600",height:"100%",borderRadius:8,width:`${xpProgress}%`,transition:"width 0.5s"}} />
        </div>
      </div>

      {/* Badge No-Show */}
      {user.user_type === 'worker' && (
        <div style={{display:"block",width:"fit-content",margin:"0 auto 12px",background:"#22C55E22",border:"1px solid #22C55E44",borderRadius:20,padding:"6px 16px"}}>
          <span style={{color:"#22C55E",fontWeight:600,fontSize:13}}>● No-show: {user.no_show_rate || 0}%</span>
        </div>
      )}

      {/* Especialidades */}
      {user.user_type === 'worker' && user.skills?.length > 0 && (
        <div style={{background:"#2A2A2A",borderRadius:16,padding:16,marginBottom:12}}>
          <p style={{fontWeight:700,fontSize:15,color:"#FFF",marginBottom:10}}>Especialidades</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {user.skills.map((skill, i) => (
              <span key={i} style={{background:"#FF6600",borderRadius:20,padding:"6px 14px",color:"#FFF",fontSize:13}}>{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* Sobre */}
      {user.bio && (
        <div style={{background:"#2A2A2A",borderRadius:16,padding:16,marginBottom:12}}>
          <p style={{fontWeight:700,fontSize:15,color:"#FFF",marginBottom:8}}>Sobre</p>
          <p style={{color:"#AAAAAA",fontSize:13,lineHeight:1.6}}>{user.bio}</p>
        </div>
      )}

      {/* Avaliações */}
      <div style={{background:"#2A2A2A",borderRadius:16,padding:16,marginBottom:12}}>
        <p style={{fontWeight:700,fontSize:15,color:"#FFF",marginBottom:12}}>Avaliações</p>
        <ReviewsSection userId={user.id} />
      </div>

      {/* Documentos */}
      <div style={{background:"#2A2A2A",borderRadius:16,padding:16,marginBottom:12}}>
        <DocumentsList documents={user.documents || []} onUpdate={loadUser} canEdit={true} />
      </div>

      {/* Upgrade Verificação */}
      <div style={{marginBottom:12}}>
        <VerificationUpgrade user={user} onUpdate={loadUser} />
      </div>
    </div>
  );
}