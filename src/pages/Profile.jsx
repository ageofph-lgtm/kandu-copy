import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { useLanguage, SUPPORTED_LANGUAGES } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";
import LoadingScreen from "@/components/LoadingScreen";
import { supabase } from "@/api/supabaseClient";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Edit2, LogOut, Star, MapPin, Briefcase, Award, Phone, Globe } from "lucide-react";
import ProfileForm from "../components/profile/ProfileForm";
import ReviewsSection from "../components/profile/ReviewsSection";

export default function Profile() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { lang, setLang } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const avatarInputRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const viewingUserId = urlParams.get("userId");
  const isOwnProfile = !viewingUserId;

  const bg = isDark ? "#111016" : "#FFFFFF";
  const surface = isDark ? "#1C1B22" : "#F5F5F5";
  const text = isDark ? "#FFFFFF" : "#111016";
  const subtext = isDark ? "#AAAAAA" : "#666666";
  const border = isDark ? "#2a2836" : "#E5E5E5";

  useEffect(() => { loadUser(); }, [viewingUserId]);

  const loadUser = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user && !viewingUserId) {
        navigate(createPageUrl("Login")); return;
      }
      const targetId = viewingUserId || session?.user?.id;
      const { data } = await supabase.from("users").select("*").eq("id", targetId).maybeSingle();
      if (data) {
        setUser({ ...data, email: data.email || session?.user?.email });
      } else if (!viewingUserId) {
        // Criar perfil básico se não existe
        const now = new Date().toISOString();
        const basic = {
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.email,
          user_type: "worker",
          created_at: now, updated_at: now
        };
        await supabase.from("users").upsert(basic, { onConflict: "id" });
        setUser(basic);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (profileData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      await supabase.from("users")
        .update({ ...profileData, updated_at: new Date().toISOString() })
        .eq("id", session.user.id);
      await loadUser();
      setIsEditing(false);
    } catch (e) { console.error(e); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const preview = URL.createObjectURL(file);
    setUser(prev => ({ ...prev, avatar_url: preview }));
    try {
      const ext = file.name.split(".").pop();
      const name = `avatars/${user.id}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("kandu-uploads").upload(name, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("kandu-uploads").getPublicUrl(name);
      await supabase.from("users").update({ avatar_url: publicUrl, updated_at: new Date().toISOString() }).eq("id", user.id);
      setUser(prev => ({ ...prev, avatar_url: publicUrl }));
      URL.revokeObjectURL(preview);
    } catch (err) { console.error(err); await loadUser(); }
    finally { setIsUploading(false); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate(createPageUrl("Login"));
  };

  const handleChangeProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) await supabase.from("users").update({ user_type: null }).eq("id", session.user.id);
    navigate(createPageUrl("SetupProfile"));
  };

  if (loading) return <LoadingScreen label="A carregar..." />;

  if (!user) return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: text, marginBottom: 16 }}>Sessão não encontrada</p>
        <button onClick={() => navigate(createPageUrl("Login"))}
          style={{ padding: "12px 28px", background: "#F4621F", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
          Fazer Login
        </button>
      </div>
    </div>
  );

  if (isEditing && isOwnProfile) return (
    <div style={{ padding: 16, maxWidth: 480, margin: "0 auto", background: bg, minHeight: "100vh" }}>
      <ProfileForm user={user} onSave={handleSave} onCancel={() => setIsEditing(false)} isFirstTime={!user.user_type} />
    </div>
  );

  const typeLabel = user.user_type === "employer" ? "Empregador" : user.user_type === "worker" ? "Profissional" : "Utilizador";
  const typeColor = user.user_type === "employer" ? "#3B82F6" : "#F4621F";
  const initials = (user.full_name || user.email || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{ background: bg, minHeight: "100vh", paddingBottom: 80 }}>
      <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} style={{ display: "none" }} accept="image/*" />

      {/* Header */}
      <div style={{ background: isDark ? "#1C1B22" : "#F5F5F5", padding: "50px 20px 24px", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: text }}>←</button>
          {isOwnProfile && (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setIsEditing(true)}
                style={{ padding: "8px 16px", background: "#F4621F", border: "none", borderRadius: 10, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Edit2 size={14} /> Editar
              </button>
              <button onClick={handleLogout}
                style={{ padding: "8px 12px", background: surface, border: `1px solid ${border}`, borderRadius: 10, color: subtext, cursor: "pointer" }}>
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Avatar + nome */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="avatar"
                style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `3px solid ${typeColor}` }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: typeColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: "#fff", border: `3px solid ${typeColor}` }}>
                {initials}
              </div>
            )}
            {isOwnProfile && (
              <button onClick={() => avatarInputRef.current?.click()}
                style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: "50%", background: "#F4621F", border: "2px solid " + bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>
                {isUploading ? "⏳" : "📷"}
              </button>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ color: text, fontWeight: 800, fontSize: 20, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.full_name || user.email}
            </h2>
            <span style={{ background: typeColor + "22", color: typeColor, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              {typeLabel}
            </span>
            {user.city && (
              <p style={{ color: subtext, fontSize: 13, margin: "6px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={12} /> {user.city}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          {[
            { label: "Rating", value: user.rating ? `${Number(user.rating).toFixed(1)} ⭐` : "—" },
            { label: "Trabalhos", value: user.completed_jobs || 0 },
            { label: "XP", value: user.xp || 0 },
          ].map(stat => (
            <div key={stat.label} style={{ flex: 1, background: surface, borderRadius: 12, padding: "10px 8px", textAlign: "center", border: `1px solid ${border}` }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: text }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: subtext, marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${border}`, background: bg, position: "sticky", top: 0, zIndex: 5 }}>
        {[
          { id: "info", label: "Informação" },
          { id: "reviews", label: "Avaliações" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flex: 1, padding: "14px 8px", border: "none", background: "none", cursor: "pointer",
              color: activeTab === tab.id ? "#F4621F" : subtext,
              fontWeight: activeTab === tab.id ? 700 : 400,
              borderBottom: activeTab === tab.id ? "2px solid #F4621F" : "2px solid transparent",
              fontSize: 14 }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "20px 16px" }}>
        {activeTab === "info" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {user.bio && (
              <div style={{ background: surface, borderRadius: 14, padding: 16, border: `1px solid ${border}` }}>
                <p style={{ color: subtext, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Sobre</p>
                <p style={{ color: text, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{user.bio}</p>
              </div>
            )}
            {user.skills?.length > 0 && (
              <div style={{ background: surface, borderRadius: 14, padding: 16, border: `1px solid ${border}` }}>
                <p style={{ color: subtext, fontSize: 12, marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Competências</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {user.skills.map((s, i) => (
                    <span key={i} style={{ background: "#F4621F22", color: "#F4621F", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            {[
              { icon: <Phone size={14}/>, label: "Telefone", value: user.phone },
              { icon: <Globe size={14}/>, label: "Idioma", value: user.language },
              { icon: <Briefcase size={14}/>, label: "Experiência", value: user.experience_years ? `${user.experience_years} anos` : null },
              { icon: <Award size={14}/>, label: "Nível", value: user.level },
            ].filter(f => f.value).map(f => (
              <div key={f.label} style={{ background: surface, borderRadius: 14, padding: "12px 16px", border: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: "#F4621F" }}>{f.icon}</span>
                <div>
                  <p style={{ color: subtext, fontSize: 11, margin: 0, fontWeight: 600 }}>{f.label}</p>
                  <p style={{ color: text, fontSize: 14, margin: "2px 0 0", fontWeight: 600 }}>{f.value}</p>
                </div>
              </div>
            ))}
            {isOwnProfile && (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={handleChangeProfile}
                  style={{ padding: "12px", background: surface, border: `1px solid ${border}`, borderRadius: 12, color: subtext, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
                  🔄 Mudar tipo de perfil
                </button>
                <div style={{ background: surface, borderRadius: 14, padding: 14, border: `1px solid ${border}` }}>
                  <p style={{ color: subtext, fontSize: 12, margin: "0 0 10px", fontWeight: 600 }}>Idioma da app</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(SUPPORTED_LANGUAGES || [{ code: "pt", label: "PT" }, { code: "en", label: "EN" }]).map(l => (
                      <button key={l.code} onClick={() => setLang(l.code)}
                        style={{ padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                          background: lang === l.code ? "#F4621F" : border,
                          color: lang === l.code ? "#fff" : text, fontWeight: 600, fontSize: 13 }}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === "reviews" && <ReviewsSection userId={user.id} isDark={isDark} />}
      </div>
    </div>
  );
}
