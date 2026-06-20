import { useState, useEffect, useRef } from "react";
import { supabase } from "@/api/supabaseClient";
import { Job, User } from "@/api/entities";
import { useTheme } from "@/lib/ThemeContext";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";
import LoadingScreen from "@/components/LoadingScreen";
import MapView from "@/components/dashboard/MapView";
import JobModal from "@/components/dashboard/JobModal";
import { Search, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const LISBON_COORDS = [38.7223, -9.1393];
// pt = valor canónico guardado em Job.category (a DB está em PT);
// key = chave i18n usada só para exibição. "ALL" é sentinela do filtro.
const CATEGORIES = [
  { key: "allCategories", pt: "ALL",            icon: "🔍" },
  { key: "painting",      pt: "Pintura",         icon: "🎨" },
  { key: "electricity",   pt: "Eletricidade",    icon: "⚡" },
  { key: "plumbing",      pt: "Canalização",     icon: "🔧" },
  { key: "masonry",       pt: "Alvenaria",       icon: "🧱" },
  { key: "tiling",        pt: "Azulejista",      icon: "🔲" },
  { key: "carpentry",     pt: "Carpintaria",     icon: "🪚" },
  { key: "hvac",          pt: "Climatização",    icon: "❄️" },
  { key: "metalwork",     pt: "Serralharia",     icon: "🔩" },
  { key: "gardening",     pt: "Jardinagem",      icon: "🌿" },
  { key: "waterproofing", pt: "Impermeabilizador",icon: "💧" },
  { key: "plastering",    pt: "Estucador",       icon: "🏗️" },
  { key: "scaffolding",   pt: "Montador de Andaimes", icon: "🏛️" },
];

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ─────────────────────────
   WORKER HOME
   Mapa fullscreen + geo real-time
   Sem filtro de raio — mostra todas as obras
   Distância calculada ao abrir cada obra
───────────────────────────*/
function WorkerHome({ user, isDark }) {
  const { lang } = useLanguage();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobDistance, setSelectedJobDistance] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  // guarda o valor canónico PT (o que está em Job.category), não o traduzido
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [showList, setShowList] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [geoStatus, setGeoStatus] = useState("loading"); // "loading" | "ok" | "error"
  const [loading, setLoading] = useState(true);

  const text = "var(--text)";
  const subtext = "var(--text2)";
  const surface = "var(--surface2)";
  const surfaceAlpha = isDark ? "rgba(20,22,26,0.95)" : "rgba(234,237,240,0.95)";

  // ── Geolocalização contínua ──
  const lastGeoSync = useRef(0);
  useEffect(() => {
    if (!navigator.geolocation) { setGeoStatus("error"); return; }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        setGeoStatus("ok");
        // Gravar a posição no backend no máximo a cada 2 min — sem este
        // throttle, cada tick do GPS gerava um write na API.
        const now = Date.now();
        if (now - lastGeoSync.current > 120000) {
          lastGeoSync.current = now;
          User.update(user.id, { latitude: pos.coords.latitude, longitude: pos.coords.longitude }).catch(() => {});
        }
      },
      () => setGeoStatus("error"),
      // Para ver obras próximas no mapa não é precisa precisão de GPS alta
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [user.id]);

  // ── Carregar TODAS as obras abertas ──
  useEffect(() => {
    Job.list("-created_at")
      .then(all => { setJobs(all.filter(j => j.status === "open")); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // ── Filtrar apenas por pesquisa + categoria (sem raio) ──
  useEffect(() => {
    let f = [...jobs];
    if (selectedCategory !== "ALL") f = f.filter(j => j.category === selectedCategory);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      f = f.filter(j =>
        j.title?.toLowerCase().includes(term) ||
        j.location?.toLowerCase().includes(term) ||
        j.category?.toLowerCase().includes(term)
      );
    }
    setFilteredJobs(f);
  }, [jobs, selectedCategory, searchTerm]);

  const handleJobClick = async (job) => {
    try { await Job.update(job.id, { views: (job.views || 0) + 1 }); } catch {}
    // Calcular distância se tiver localização e a obra tiver coords
    let dist = null;
    if (userLocation && job.latitude && job.longitude) {
      dist = haversine(userLocation[0], userLocation[1], job.latitude, job.longitude);
    }
    setSelectedJobDistance(dist);
    setSelectedJob({ ...job, views: (job.views || 0) + 1 });
  };

  const mapCenter = userLocation
    || (user?.latitude && user?.longitude ? [user.latitude, user.longitude] : LISBON_COORDS);

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ position: "relative", height: "calc(100vh - 60px)", overflow: "hidden" }}>

      {/* ── MAPA BASE ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <MapView
          jobs={filteredJobs}
          onJobClick={handleJobClick}
          center={mapCenter}
          userLocation={userLocation}
        />
      </div>

      {/* ── SEARCH + CATEGORIAS (topo flutuante) ── */}
      <div style={{ position: "absolute", top: 16, left: 16, right: 16, zIndex: 20, display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="k-search">
          <Search size={16} color="var(--or)" />
          <input
            placeholder={t(lang,"searchPlaceholder")}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {CATEGORIES.map(cat => (
            <button key={cat.pt} onClick={() => setSelectedCategory(cat.pt)} style={{
              flexShrink: 0, padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer",
              className: selectedCategory === cat.pt ? "k-cat active" : "k-cat"
            }}>
              {t(lang, cat.key, cat.pt === "ALL" ? "Todas" : cat.pt)}
            </button>
          ))}
        </div>
      </div>

      {/* ── STATUS GEO (fundo esquerdo) ── */}
      <div style={{
        position: "absolute",
        bottom: showList ? "calc(50% + 12px)" : 80,
        left: 16, zIndex: 20, transition: "bottom 0.3s ease"
      }}>
        <div className="k-geo" style={{
          color: geoStatus === "ok" ? "#4ADE80" : geoStatus === "error" ? "#F87171" : "#FBBF24"
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
            background: geoStatus === "ok" ? "#16A34A" : geoStatus === "error" ? "#EF4444" : "#F59E0B"
          }} />
          {geoStatus === "loading" ? t(lang,"locating","A localizar...") : geoStatus === "error" ? t(lang,"noLocation","Sem localização") : `📍 ${t(lang,"online","Online")}`}
        </div>
      </div>

      {/* ── CONTADOR + BOTÃO LISTA (fundo direito) ── */}
      <div style={{
        position: "absolute",
        bottom: showList ? "calc(50% + 12px)" : 80,
        right: 16, zIndex: 20,
        display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6,
        transition: "bottom 0.3s ease"
      }}>
        <div className="k-badge" style={{ fontSize: 11 }}>
          {(filteredJobs.length !== 1 ? t(lang,"jobsCount","{count} obras") : t(lang,"jobCount","{count} obra")).replace("{count}", filteredJobs.length)}
        </div>
        <button
          onClick={() => setShowList(v => !v)}
          className={showList ? "k-pill k-pill-primary" : "k-pill k-pill-secondary"}
        >
          <List size={14} /> {t(lang, "list")}
        </button>
      </div>

      {/* ── SHEET LISTA (slide-up) ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 15,
        borderRadius: "24px 24px 0 0",
        transform: showList ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
        maxHeight: "50vh", display: "flex", flexDirection: "column"
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div className="k-sheet-handle" />
        </div>
        <div style={{ overflowY: "auto", padding: "0 16px 80px", flex: 1 }}>
          {filteredJobs.length === 0 ? (
            <p style={{ textAlign: "center", color: subtext, padding: "24px 0", fontSize: 14 }}>
              {t(lang, "noJobsFound")}
            </p>
          ) : filteredJobs.map(job => {
            const dist = userLocation && job.latitude && job.longitude
              ? haversine(userLocation[0], userLocation[1], job.latitude, job.longitude)
              : null;
            return (
              <div
                key={job.id}
                onClick={() => { handleJobClick(job); setShowList(false); }}
                className="k-job-card" style={{ marginBottom: 10, borderBottom: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div style={{ flex: 1, marginRight: 10 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: text }}>{job.title}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: subtext }}>
                    {job.location} · {job.category}
                    {dist !== null && <span style={{ color: "#FF6600", fontWeight: 600 }}> · {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`}</span>}
                  </p>
                </div>
                <p style={{ margin: 0, fontWeight: 800, color: "#FF6600", fontSize: 15, flexShrink: 0 }}>
                  €{job.price}{job.price_type === "hourly" ? "/h" : ""}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── JOB MODAL ── */}
      {selectedJob && (
        <JobModal
          job={selectedJob}
          user={user}
          distanceKm={selectedJobDistance}
          onClose={() => { setSelectedJob(null); setSelectedJobDistance(null); }}
          onApply={() => { setSelectedJob(null); setSelectedJobDistance(null); }}
          onDelete={async (jobId) => {
            if (!window.confirm(t(lang,"confirmDeleteJob","Apagar esta obra?"))) return;
            try { await Job.delete(jobId); setSelectedJob(null); } catch {}
          }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────
   EMPLOYER HOME
───────────────────────────*/
function EmployerHome({ user, isDark }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const bg = "var(--base)";
  const surface = "var(--surface2)";
  const text = "var(--text)";
  const subtext = "var(--text2)";
  const border = "var(--hair)";
  const firstName = user.full_name?.split(" ")[0] || t(lang,"userGeneric","Utilizador");

  return (
    <div className="k-bg" style={{ minHeight: "100vh", paddingBottom: 80 }}>
      <div style={{ padding: "32px 24px 28px", borderBottom: `1px solid var(--hair)` }}>
        {/* Logo grande à direita + saudação à esquerda */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, color: isDark ? "#FF9944" : "#FF6600", fontWeight: 600 }}>{t(lang,"welcome","Bem-vindo")} 👋</p>
            <h1 style={{ margin: "4px 0 6px", fontSize: 28, fontWeight: 900, color: isDark ? "#FFFFFF" : "#111016", letterSpacing: -0.5 }}>
              {firstName}
            </h1>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: isDark ? "#AAAAAA" : "#444444" }}>
              {t(lang,"whatDoYouNeed","O que precisa?")}
            </p>
          </div>
          <img
            src={isDark
              ? "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/90321a683_Gemini_Generated_Image_k4rh2gk4rh2gk4rh.png"
              : "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png"}
            alt="KANDU"
            style={{ height: 48, objectFit: "contain", flexShrink: 0, maxWidth: 140 }}
          />
        </div>
      </div>

      <div style={{ padding: "24px 20px" }}>
        <button
          onClick={() => navigate(createPageUrl("NewJob"))}
          className="k-hero" style={{
            width: "100%", border: "none", cursor: "pointer", marginBottom: 16,
            display: "block", textAlign: "left", padding: 0
          }}
        >
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>🏗️ {t(lang,"announceJob","Anunciar a sua Obra")}</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.85 }}>{t(lang,"findProInMinutes","Encontra o profissional certo em minutos")}</p>
          </div>
          <span style={{ fontSize: 36 }}>→</span>
        </button>

        {/* Botão destaque — Encontrar Profissionais */}
        <button
          onClick={() => navigate(createPageUrl("Workers"))}
          className="k-tile" style={{
            width: "100%", border: "none", cursor: "pointer", marginBottom: 12,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "20px 24px"
          }}
        >
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 13, color: "#F4621F", fontWeight: 700 }}>🔍 Novo</p>
            <p style={{ margin: "4px 0 2px", fontSize: 19, fontWeight: 900, color: text }}>Encontrar Profissionais</p>
            <p style={{ margin: 0, fontSize: 12, color: subtext }}>Pesquisa por skill, rating, XP e mais</p>
          </div>
          <span style={{ fontSize: 36 }}>👷</span>
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { icon: "📋", label: t(lang,"work","Trabalho"),     desc: t(lang,"pendingActiveJobs","Obras pendentes e activas"), to: "MyJobs" },
            { icon: "👥", label: t(lang,"applications"), desc: t(lang,"seeWhoWantsToWork","Veja quem quer trabalhar"),  to: "Applications" },
            { icon: "💬", label: t(lang,"chat"),          desc: t(lang,"talkToPros","Fale com profissionais"),   to: "Chat" },
            { icon: "👤", label: t(lang,"profile"),        desc: t(lang,"editYourData","Edite os seus dados"),      to: "Profile" },
          ].map(({ icon, label, desc, to }) => (
            <button
              key={to}
              onClick={() => navigate(createPageUrl(to))}
              className="k-grid-card" style={{}}
            >
              <span style={{ fontSize: 28 }}>{icon}</span>
              <p style={{ margin: "8px 0 2px", fontWeight: 700, fontSize: 14, color: text }}>{label}</p>
              <p style={{ margin: 0, fontSize: 11, color: subtext, lineHeight: 1.4 }}>{desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────
   RAIZ
───────────────────────────*/
export default function Home() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate(createPageUrl("Welcome")); return; }
      const u = await User.me();
      if (!u?.user_type) { navigate(createPageUrl("SetupProfile")); return; }
      setUser(u);
      setLoading(false);
    };
    init();
  }, [navigate]);

  if (loading) return <LoadingScreen />;
  if (!user) return null;

  if (user.user_type === "worker")   return <WorkerHome   user={user} isDark={isDark} />;
  if (user.user_type === "employer") return <EmployerHome user={user} isDark={isDark} />;
  return null;
}