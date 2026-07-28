import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { useLanguage, SUPPORTED_LANGUAGES } from "@/lib/LanguageContext";
import LoadingScreen from "@/components/LoadingScreen";
import { supabase } from "@/api/supabaseClient";
import { Application } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import {
  Edit2, LogOut, MapPin, Briefcase, Award, Phone, Globe, Mail, Building2, Lock, Trash2,
} from "lucide-react";
import ProfileForm from "../components/profile/ProfileForm";
import ReviewsSection from "../components/profile/ReviewsSection";
import PortfolioGallery from "../components/profile/PortfolioGallery";
import DocumentsList from "../components/profile/DocumentsList";
import VerificationPanel from "../components/profile/VerificationPanel";
import { VERIFICATION_LEVELS, computeVerificationLevel } from "@/lib/verification";
import { validateFile, resizeImage, IMAGE_MIME_TYPES } from "@/lib/validation";
import { errorMessage } from "@/lib/net";

const OR = "#F4621F";

/** Mascara o NIF — só o próprio vê o número completo (RGPD). */
const maskNif = (nif) => (nif ? `••• ••• ${String(nif).slice(-3)}` : null);

export default function Profile() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { lang, setLang } = useLanguage();
  const [user, setUser] = useState(null);
  const [viewer, setViewer] = useState(null);           // quem está a ver
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [canSeeContacts, setCanSeeContacts] = useState(false);
  const avatarInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const viewingUserId = urlParams.get("userId");
  const isOwnProfile = !viewingUserId || viewingUserId === viewer?.id;

  const bg = "var(--base)";
  const surface = "var(--surface2)";
  const text = "var(--text)";
  const subtext = "var(--text2)";
  const border = "var(--hair)";

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user && !viewingUserId) { navigate(createPageUrl("Login")); return; }

      const myId = session?.user?.id;
      const targetId = viewingUserId || myId;

      const [{ data: target }, { data: me }] = await Promise.all([
        supabase.from("users").select("*").eq("id", targetId).maybeSingle(),
        myId ? supabase.from("users").select("*").eq("id", myId).maybeSingle() : Promise.resolve({ data: null }),
      ]);

      setViewer(me ? { ...me, email: session?.user?.email } : null);

      if (target) {
        setUser({ ...target, email: target.email || (targetId === myId ? session?.user?.email : null) });
      } else if (!viewingUserId && session?.user) {
        const now = new Date().toISOString();
        const basic = {
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.email,
          user_type: "worker",
          created_at: now, updated_at: now,
        };
        await supabase.from("users").upsert(basic, { onConflict: "id" });
        setUser(basic);
      }

      // #67 — os contactos só ficam visíveis depois de uma relação formal
      // (candidatura aceite / obra em curso ou concluída) entre as partes.
      if (targetId && myId && targetId !== myId) {
        try {
          const [asWorker, asEmployer] = await Promise.all([
            Application.filter({ worker_id: targetId, employer_id: myId }),
            Application.filter({ worker_id: myId, employer_id: targetId }),
          ]);
          const linked = [...asWorker, ...asEmployer].some(a =>
            ["accepted", "completed"].includes(a.status)
          );
          setCanSeeContacts(linked);
        } catch { setCanSeeContacts(false); }
      } else {
        setCanSeeContacts(true);
      }
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível carregar o perfil.");
    } finally {
      setLoading(false);
    }
  }, [viewingUserId, navigate]);

  useEffect(() => { loadUser(); }, [loadUser]);

  const handleSave = async (profileData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { error } = await supabase.from("users")
        .update({ ...profileData, updated_at: new Date().toISOString() })
        .eq("id", session.user.id);
      // FIX #38: o erro era engolido — a bio parecia guardar mas não guardava.
      if (error) throw error;
      toast.success("Perfil atualizado ✓");
      await loadUser();
      setIsEditing(false);
    } catch (e) {
      console.error("Profile save error:", e);
      toast.error("Erro ao guardar o perfil: " + errorMessage(e));
    }
  };

  // FIX #1000 — a foto de perfil não persistia:
  //  · o erro do upload/update era silenciado
  //  · o browser servia a imagem antiga da cache
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;

    const check = validateFile(file, { accept: IMAGE_MIME_TYPES });
    if (!check.ok) { toast.error(check.error); return; }

    setIsUploading(true);
    const preview = URL.createObjectURL(file);
    setUser(prev => ({ ...prev, avatar_url: preview }));
    try {
      const resized = await resizeImage(file, { maxSize: 512, quality: 0.9 });
      const name = `avatars/${user.id}_${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("kandu-uploads").upload(name, resized, { upsert: true, contentType: "image/jpeg" });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from("kandu-uploads").getPublicUrl(name);
      // cache-buster: sem isto o <img> continuava a mostrar a foto anterior
      const busted = `${publicUrl}?t=${Date.now()}`;

      const { error: updErr } = await supabase.from("users")
        .update({ avatar_url: busted, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (updErr) throw updErr;

      setUser(prev => ({ ...prev, avatar_url: busted }));
      toast.success("Foto de perfil atualizada ✓");
    } catch (err) {
      console.error("Avatar upload error:", err);
      toast.error("Não foi possível atualizar a foto: " + errorMessage(err));
      await loadUser();
    } finally {
      URL.revokeObjectURL(preview);
      setIsUploading(false);
    }
  };

  // #62 — logo da empresa redimensionado antes do upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;

    const check = validateFile(file, { accept: IMAGE_MIME_TYPES });
    if (!check.ok) { toast.error(check.error); return; }

    setIsUploading(true);
    try {
      const resized = await resizeImage(file, { maxSize: 400, quality: 0.92, mime: "image/png" });
      const name = `logos/${user.id}_${Date.now()}.png`;
      const { error: upErr } = await supabase.storage
        .from("kandu-uploads").upload(name, resized, { upsert: true, contentType: "image/png" });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("kandu-uploads").getPublicUrl(name);
      const busted = `${publicUrl}?t=${Date.now()}`;
      const { error: updErr } = await supabase.from("users")
        .update({ company_logo_url: busted, updated_at: new Date().toISOString() }).eq("id", user.id);
      if (updErr) throw updErr;
      setUser(prev => ({ ...prev, company_logo_url: busted }));
      toast.success("Logótipo atualizado ✓");
    } catch (err) {
      toast.error("Erro ao enviar o logótipo: " + errorMessage(err));
    } finally {
      setIsUploading(false);
    }
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

  // #46 — desativação / eliminação de conta + política de retenção
  const handleDeactivate = async () => {
    if (!window.confirm(
      "Desativar a conta?\n\nO teu perfil deixa de aparecer nas pesquisas e não recebes novas propostas. " +
      "Podes reativar a qualquer momento entrando de novo."
    )) return;
    try {
      await supabase.from("users")
        .update({ status: "inactive", updated_at: new Date().toISOString() }).eq("id", user.id);
      toast.success("Conta desativada.");
      await supabase.auth.signOut();
      navigate(createPageUrl("Welcome"));
    } catch (e) { toast.error("Erro ao desativar: " + errorMessage(e)); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(
      "Eliminar a conta definitivamente?\n\n" +
      "Os dados de perfil são anonimizados de imediato. O histórico de obras e avaliações é " +
      "conservado 5 anos por obrigação legal/fiscal e depois eliminado (RGPD, art. 17.º).\n\n" +
      "Esta ação não pode ser revertida."
    )) return;
    const confirmation = window.prompt('Escreve ELIMINAR para confirmar:');
    if (confirmation !== "ELIMINAR") { toast.info("Eliminação cancelada."); return; }
    try {
      await supabase.from("users").update({
        status: "deleted",
        deleted_at: new Date().toISOString(),
        full_name: "Utilizador removido",
        avatar_url: null, phone: null, nif: null, bio: null,
        id_document_url: null, portfolio: [], documents: [], certifications: [],
        updated_at: new Date().toISOString(),
      }).eq("id", user.id);
      toast.success("Conta eliminada. Os teus dados pessoais foram anonimizados.");
      await supabase.auth.signOut();
      navigate(createPageUrl("Welcome"));
    } catch (e) { toast.error("Erro ao eliminar: " + errorMessage(e)); }
  };

  if (loading) return <LoadingScreen label="A carregar..." />;

  if (!user) return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: text, marginBottom: 16 }}>Perfil não encontrado</p>
        <button onClick={() => navigate(createPageUrl("Login"))}
          style={{ padding: "12px 28px", background: OR, border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
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

  const isEmployer = user.user_type === "employer";
  const isWorker = user.user_type === "worker";
  const typeLabel = isEmployer
    ? (user.employer_type === "cia" ? "Cia Employer" : "Empregador")
    : isWorker ? "Profissional" : "Utilizador";
  const typeColor = isEmployer ? "#3B82F6" : OR;
  const initials = (user.full_name || user.email || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const vLevel = computeVerificationLevel(user);
  const vInfo = VERIFICATION_LEVELS[vLevel];

  const portfolio = Array.isArray(user.portfolio) ? user.portfolio : [];
  const documents = Array.isArray(user.documents) ? user.documents : [];

  const tabs = [
    { id: "info", label: "Informação" },
    ...(isWorker ? [{ id: "portfolio", label: "Portfólio" }] : []),
    { id: "reviews", label: "Avaliações" },
    ...(isOwnProfile ? [{ id: "account", label: "Conta" }] : []),
  ];

  const cardStyle = {
    background: surface, borderRadius: 14, border: `1px solid ${border}`,
    boxShadow: "inset 0 1.5px 0 var(--edge-hi), 0 8px 24px -16px var(--shadow)", padding: 16,
  };

  return (
    <div style={{ background: bg, minHeight: "100vh", paddingBottom: 80 }}>
      <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} style={{ display: "none" }} accept="image/jpeg,image/png,image/webp" />
      <input type="file" ref={logoInputRef} onChange={handleLogoUpload} style={{ display: "none" }} accept="image/jpeg,image/png,image/webp" />

      {/* Header */}
      <div style={{ background: surface, padding: "50px 20px 24px", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: text }}>←</button>
          {isOwnProfile && (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setIsEditing(true)}
                style={{ padding: "8px 16px", background: OR, border: "none", borderRadius: 10, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Edit2 size={14} /> Editar
              </button>
              <button onClick={handleLogout} aria-label="Terminar sessão"
                style={{ padding: "8px 12px", background: bg, border: `1px solid ${border}`, borderRadius: 10, color: subtext, cursor: "pointer" }}>
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Avatar + nome */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="Foto de perfil"
                style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `3px solid ${typeColor}` }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: typeColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: "#fff", border: `3px solid ${typeColor}` }}>
                {initials}
              </div>
            )}
            {isOwnProfile && (
              <button onClick={() => avatarInputRef.current?.click()} disabled={isUploading} aria-label="Alterar foto"
                style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: "50%", background: OR, border: `2px solid ${surface}`, cursor: isUploading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>
                {isUploading ? "⏳" : "📷"}
              </button>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ color: text, fontWeight: 800, fontSize: 20, margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.full_name || user.email}
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              <span style={{ background: typeColor + "22", color: typeColor, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                {typeLabel}
              </span>
              {/* Badge de verificação (#1, #3) */}
              <span style={{ background: vInfo.color + "22", color: vInfo.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                {vInfo.emoji} {isWorker ? vInfo.labelPro : vInfo.label}
              </span>
            </div>
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
            { label: "Avaliações", value: user.total_reviews || 0 },
            { label: "Trabalhos", value: user.completed_jobs || 0 },
            { label: "XP", value: user.xp || 0 },
          ].map(stat => (
            <div key={stat.label} style={{ flex: 1, background: bg, borderRadius: 12, padding: "10px 8px", textAlign: "center", border: `1px solid ${border}` }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: text }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: subtext, marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${border}`, background: bg, position: "sticky", top: 0, zIndex: 5 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: "14px 8px", border: "none", background: "none", cursor: "pointer",
              color: activeTab === tab.id ? OR : subtext,
              fontWeight: activeTab === tab.id ? 700 : 400,
              borderBottom: activeTab === tab.id ? `2px solid ${OR}` : "2px solid transparent",
              fontSize: 14,
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div style={{ padding: "20px 16px" }}>
        {activeTab === "info" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Empresa (#51 — perfil do Employer visível ao Profissional) */}
            {isEmployer && (user.company || user.employer_type) && (
              <div style={cardStyle}>
                <p style={{ color: subtext, fontSize: 12, marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Empresa</p>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {user.company_logo_url
                      ? <img src={user.company_logo_url} alt="Logótipo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      : <Building2 size={22} color={subtext} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: text, fontSize: 15, fontWeight: 700, margin: 0 }}>{user.company || "—"}</p>
                    <p style={{ color: subtext, fontSize: 12, margin: "2px 0 0" }}>
                      {user.employer_type === "cia" ? "Empresa registada" : "Cliente particular"}
                      {user.nif && ` · NIF ${isOwnProfile ? user.nif : maskNif(user.nif)}`}
                    </p>
                  </div>
                  {isOwnProfile && (
                    <button onClick={() => logoInputRef.current?.click()} disabled={isUploading}
                      style={{ background: "transparent", border: `1px solid ${border}`, borderRadius: 8, padding: "6px 10px", color: OR, fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                      {isUploading ? "..." : "Logótipo"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {user.bio && (
              <div style={cardStyle}>
                <p style={{ color: subtext, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Sobre</p>
                <p style={{ color: text, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{user.bio}</p>
              </div>
            )}

            {user.skills?.length > 0 && (
              <div style={cardStyle}>
                <p style={{ color: subtext, fontSize: 12, marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Competências</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {user.skills.map((s, i) => (
                    <span key={i} style={{ background: OR + "22", color: OR, padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {user.service_areas?.length > 0 && (
              <div style={cardStyle}>
                <p style={{ color: subtext, fontSize: 12, marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Áreas de atuação</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {user.service_areas.map((a, i) => (
                    <span key={i} style={{ background: bg, border: `1px solid ${border}`, color: text, padding: "4px 12px", borderRadius: 20, fontSize: 13 }}>📍 {a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Contactos — protegidos até haver relação formal (#67) */}
            {!canSeeContacts ? (
              <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 12 }}>
                <Lock size={18} color={subtext} />
                <div>
                  <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: 0 }}>Contactos protegidos</p>
                  <p style={{ color: subtext, fontSize: 12, margin: "2px 0 0", lineHeight: 1.5 }}>
                    O telemóvel e o email só ficam visíveis depois de a candidatura ser aceite.
                    Até lá, usa o chat da plataforma.
                  </p>
                </div>
              </div>
            ) : (
              [
                { icon: <Phone size={14} />, label: "Telefone", value: user.phone },
                { icon: <Mail size={14} />, label: "Email", value: user.email },
                { icon: <Globe size={14} />, label: "Idioma", value: user.language },
                { icon: <Briefcase size={14} />, label: "Experiência", value: user.experience_years ? `${user.experience_years} anos` : null },
                { icon: <Award size={14} />, label: "Nível XP", value: user.level },
              ].filter(f => f.value).map(f => (
                <div key={f.label} style={{ ...cardStyle, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: OR }}>{f.icon}</span>
                  <div>
                    <p style={{ color: subtext, fontSize: 11, margin: 0, fontWeight: 600 }}>{f.label}</p>
                    <p style={{ color: text, fontSize: 14, margin: "2px 0 0", fontWeight: 600 }}>{f.value}</p>
                  </div>
                </div>
              ))
            )}

            {/* Certificações / licenças */}
            {(isOwnProfile || documents.length > 0) && (
              <DocumentsList
                documents={documents}
                canEdit={isOwnProfile}
                onUpdate={(next) => setUser(prev => ({ ...prev, documents: next ?? prev.documents }))}
              />
            )}
          </div>
        )}

        {activeTab === "portfolio" && (
          <div style={cardStyle}>
            <PortfolioGallery
              images={portfolio}
              canEdit={isOwnProfile}
              onUpdate={(next) => setUser(prev => ({ ...prev, portfolio: next ?? prev.portfolio }))}
            />
          </div>
        )}

        {activeTab === "reviews" && <ReviewsSection userId={user.id} isDark={isDark} />}

        {activeTab === "account" && isOwnProfile && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <VerificationPanel user={user} onUpdate={(patch) => setUser(prev => ({ ...prev, ...patch }))} />

            <div style={cardStyle}>
              <p style={{ color: subtext, fontSize: 12, margin: "0 0 10px", fontWeight: 600 }}>Idioma da app</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(SUPPORTED_LANGUAGES || []).map(l => (
                  <button key={l.code} onClick={() => setLang(l.code)}
                    style={{
                      padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                      background: lang === l.code ? OR : border,
                      color: lang === l.code ? "#fff" : text, fontWeight: 600, fontSize: 13,
                    }}>
                    {l.flag || ""} {l.nativeName || l.label || l.name || l.code}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleChangeProfile}
              style={{ padding: 12, background: surface, border: `1px solid ${border}`, borderRadius: 12, color: subtext, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
              🔄 Mudar tipo de perfil
            </button>

            {/* #46 — desativação / eliminação e retenção de dados */}
            <div style={{ ...cardStyle, borderColor: "#EF444455" }}>
              <p style={{ color: "#EF4444", fontSize: 12, margin: "0 0 6px", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Zona sensível</p>
              <p style={{ color: subtext, fontSize: 12, margin: "0 0 12px", lineHeight: 1.5 }}>
                Podes desativar temporariamente a conta ou eliminá-la. Ao eliminar, os dados de perfil
                são anonimizados de imediato; o histórico de obras e faturação é conservado 5 anos por
                obrigação legal e depois eliminado (RGPD).
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={handleDeactivate}
                  style={{ flex: 1, padding: 11, background: "transparent", border: `1px solid ${border}`, borderRadius: 10, color: text, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  Desativar conta
                </button>
                <button onClick={handleDeleteAccount}
                  style={{ flex: 1, padding: 11, background: "#EF444418", border: "1px solid #EF444455", borderRadius: 10, color: "#EF4444", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Trash2 size={14} /> Eliminar conta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
