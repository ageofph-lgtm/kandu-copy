import { useState, useEffect, useRef } from "react";
import { supabase } from "@/api/supabaseClient";
import { Job, User } from "@/api/entities";
import { useTheme } from "@/lib/ThemeContext";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";
import LoadingScreen from "@/components/LoadingScreen";
import MapView from "@/components/dashboard/MapView";
import JobModal from "@/components/dashboard/JobModal";
import { Search, List, SlidersHorizontal, X, Star } from "lucide-react";
import { getFavorites, toggleFavorite } from "@/lib/favorites";
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

// Raios de pesquisa disponíveis (#35) — null = sem limite
const RADIUS_OPTIONS = [
  { value: 5,    labelKey: "radius5",   fallback: "5 km" },
  { value: 20,   labelKey: "radius20",  fallback: "20 km" },
  { value: 50,   labelKey: "radius50",  fallback: "50 km" },
  { value: null, labelKey: "radiusAll", fallback: "Todas" },
];

// Ordenação dos resultados (#37)
const SORT_OPTIONS = [
  { value: "recent",   labelKey: "sortRecent",   fallback: "Mais recentes" },
  { value: "price",    labelKey: "sortPrice",    fallback: "Melhor pago" },
  { value: "distance", labelKey: "sortDistance", fallback: "Mais perto" },
  { value: "employer", labelKey: "sortEmployer", fallback: "Empregador ⭐" },
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
  const [showFilters, setShowFilters] = useState(false);
  const [radiusKm, setRadiusKm] = useState(null);
  const [sortBy, setSortBy] = useState("recent");
  const [employersById, setEmployersById] = useState({});
  const [favorites, setFavorites] = useState(() => getFavorites(user.id));
  const [onlyFavorites, setOnlyFavorites] = useState(false);

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

  // ── Empregadores das obras listadas — para mostrar a reputação nos resultados ──
  useEffect(() => {
    const ids = [...new Set(jobs.map(j => j.employer_id).filter(Boolean))];
    const missing = ids.filter(id => !employersById[id]);
    if (!missing.length) return;
    Promise.all(missing.map(id => User.get(id).catch(() => null)))
      .then(list => {
        const found = Object.fromEntries(list.filter(Boolean).map(u => [u.id, u]));
        if (Object.keys(found).length) setEmployersById(prev => ({ ...prev, ...found }));
      });
  }, [jobs]);  // eslint-disable-line react-hooks/exhaustive-deps

  const distanceTo = (job) => (
    userLocation && job.latitude && job.longitude
      ? haversine(userLocation[0], userLocation[1], job.latitude, job.longitude)
      : null
  );

  // ── Pesquisa + categoria + raio + ordenação ──
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
    if (onlyFavorites) f = f.filter(j => favorites.includes(j.id));
    // O raio só se aplica quando sabemos onde o utilizador está
    if (radiusKm && userLocation) {
      f = f.filter(j => {
        const d = distanceTo(j);
        return d === null || d <= radiusKm;
      });
    }

    const employerRating = (j) => Number(employersById[j.employer_id]?.rating) || 0;
    f.sort((a, b) => {
      if (sortBy === "price") return (b.price || 0) - (a.price || 0);
      if (sortBy === "employer") return employerRating(b) - employerRating(a);
      if (sortBy === "distance") {
        const da = distanceTo(a), db = distanceTo(b);
        if (da === null && db === null) return 0;
        if (da === null) return 1;
        if (db === null) return -1;
        return da - db;
      }
      return new Date(b.created_at || b.created_date) - new Date(a.created_at || a.created_date);
    });

    setFilteredJobs(f);
  }, [jobs, selectedCategory, searchTerm, radiusKm, sortBy, userLocation, employersById, onlyFavorites, favorites]);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleFavorite = (jobId) => setFavorites(toggleFavorite(user.id, jobId));

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
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="k-search" style={{ flex: 1 }}>
            <Search size={16} color="var(--or)" />
            <input
              placeholder={t(lang,"searchPlaceholder")}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={showFilters || radiusKm || sortBy !== "recent" ? "k-pill k-pill-primary" : "k-pill k-pill-secondary"}
            style={{ flexShrink: 0 }}
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>

        {/* Barra de filtros — com botão de fechar (#1003) */}
        {showFilters && (
          <div style={{
            background: surfaceAlpha, border: "1px solid var(--hair)", borderRadius: 16,
            padding: "12px 14px", backdropFilter: "blur(12px)",
            boxShadow: "0 8px 24px -12px var(--shadow)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: text }}>{t(lang, "filters", "Filtros")}</span>
              <button onClick={() => setShowFilters(false)} aria-label={t(lang, "close", "Fechar")}
                style={{ background: "none", border: "none", cursor: "pointer", color: subtext, padding: 4, display: "flex" }}>
                <X size={16} />
              </button>
            </div>

            <p style={{ margin: "0 0 6px", fontSize: 11, color: subtext, fontWeight: 600 }}>
              {t(lang, "searchRadius", "Raio de pesquisa")}
              {!userLocation && ` · ${t(lang, "needsLocation", "requer localização")}`}
            </p>
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              {RADIUS_OPTIONS.map(opt => (
                <button key={String(opt.value)} onClick={() => setRadiusKm(opt.value)}
                  disabled={!userLocation && opt.value !== null}
                  className={radiusKm === opt.value ? "k-cat active" : "k-cat"}
                  style={{ opacity: !userLocation && opt.value !== null ? 0.4 : 1 }}>
                  {t(lang, opt.labelKey, opt.fallback)}
                </button>
              ))}
            </div>

            <button
              onClick={() => setOnlyFavorites(v => !v)}
              className={onlyFavorites ? "k-cat active" : "k-cat"}
              style={{ marginBottom: 12 }}
            >
              ★ {t(lang, "onlySaved", "Só guardadas")} ({favorites.length})
            </button>

            <p style={{ margin: "0 0 6px", fontSize: 11, color: subtext, fontWeight: 600 }}>
              {t(lang, "sortBy", "Ordenar por")}
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {SORT_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setSortBy(opt.value)}
                  disabled={opt.value === "distance" && !userLocation}
                  className={sortBy === opt.value ? "k-cat active" : "k-cat"}
                  style={{ opacity: opt.value === "distance" && !userLocation ? 0.4 : 1 }}>
                  {t(lang, opt.labelKey, opt.fallback)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.pt}
              onClick={() => setSelectedCategory(cat.pt)}
              className={selectedCategory === cat.pt ? "k-cat active" : "k-cat"}
            >
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
        // A folha não tinha fundo: a lista aparecia por cima do mapa e o
        // texto ficava ilegível em claro e em escuro
        background: surfaceAlpha,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid var(--hair)",
        boxShadow: "0 -8px 32px -12px var(--shadow)",
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
            const dist = distanceTo(job);
            const employer = employersById[job.employer_id];
            return (
              <div
                key={job.id}
                onClick={() => { handleJobClick(job); setShowList(false); }}
                className="k-job-card" style={{ marginBottom: 10, borderBottom: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div style={{ flex: 1, marginRight: 10, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: text }}>{job.title}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: subtext }}>
                    {job.location} · {job.category}
                    {dist !== null && <span style={{ color: "#FF6600", fontWeight: 600 }}> · {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`}</span>}
                  </p>
                  {employer && (
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: subtext }}>
                      👤 {employer.full_name}
                      {employer.rating
                        ? ` · ⭐ ${Number(employer.rating).toFixed(1)}`
                        : ` · ${t(lang, "noRatingYet", "sem avaliações")}`}
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <p style={{ margin: 0, fontWeight: 800, color: "#FF6600", fontSize: 15 }}>
                    €{job.price}{job.price_type === "hourly" ? "/h" : ""}
                  </p>
                  {/* Guardar obra (#40) */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleFavorite(job.id); }}
                    aria-label={t(lang, "saveJob", "Guardar obra")}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color: favorites.includes(job.id) ? "#FBBF24" : subtext }}
                  >
                    <Star size={16} fill={favorites.includes(job.id) ? "#FBBF24" : "none"} />
                  </button>
                </div>
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
      <div style={{
        padding: "32px 24px 28px",
        background: "linear-gradient(180deg, #0d0f12 0%, #111318 100%)",
        borderBottom: "1px solid rgba(255,255,255,.08)"
      }}>
        {/* Logo grande à direita + saudação à esquerda */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#FF9944", fontWeight: 600 }}>{t(lang,"welcome","Bem-vindo")} 👋</p>
            <h1 style={{ margin: "4px 0 6px", fontSize: 28, fontWeight: 900, color: "#FFFFFF", letterSpacing: -0.5 }}>
              {firstName}
            </h1>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#8A909A" }}>
              {t(lang,"whatDoYouNeed","O que precisa?")}
            </p>
          </div>
          <img
            src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/90321a683_Gemini_Generated_Image_k4rh2gk4rh2gk4rh.png"
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