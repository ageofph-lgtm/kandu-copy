import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/api/supabaseClient";
import { Job, User } from "@/api/entities";
import { useTheme } from "@/lib/ThemeContext";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";
import LoadingScreen from "@/components/LoadingScreen";
import MapView from "@/components/dashboard/MapView";
import JobModal from "@/components/dashboard/JobModal";
import { Search, List, Map as MapIcon, SlidersHorizontal, X, Star, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toggleFavorite, listFavoriteIds } from "@/lib/favorites";
import { toast } from "sonner";

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

/** #35 — filtro de raio pedido no wireframe (slides 12–13) */
const RADIUS_OPTIONS = [
  { value: 0,  label: "Tudo" },
  { value: 5,  label: "5 km" },
  { value: 20, label: "20 km" },
  { value: 50, label: "50 km" },
];

/** #37 — ordenação */
const SORT_OPTIONS = [
  { value: "latest",   label: "Mais recentes" },
  { value: "pay",      label: "Melhor pago" },
  { value: "distance", label: "Mais perto" },
  { value: "rating",   label: "Ranking do empregador" },
];

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const fmtDist = (d) => (d == null ? null : d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`);

/* ─────────────────────────
   WORKER HOME — mapa + lista com filtros completos
───────────────────────────*/
function WorkerHome({ user, isDark }) {
  const { lang } = useLanguage();
  const [jobs, setJobs] = useState([]);
  const [employersById, setEmployersById] = useState({});
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobDistance, setSelectedJobDistance] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [radiusKm, setRadiusKm] = useState(0);
  const [sortBy, setSortBy] = useState("latest");
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState("map");           // "map" | "list" — vista própria (#UX)
  const [favorites, setFavorites] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [geoStatus, setGeoStatus] = useState("loading");
  const [loading, setLoading] = useState(true);

  // ── Geolocalização contínua ──
  const lastGeoSync = useRef(0);
  useEffect(() => {
    if (!navigator.geolocation) { setGeoStatus("error"); return; }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setGeoStatus("ok");
        const now = Date.now();
        if (now - lastGeoSync.current > 120000) {
          lastGeoSync.current = now;
          User.update(user.id, { latitude: pos.coords.latitude, longitude: pos.coords.longitude }).catch(() => {});
        }
      },
      () => setGeoStatus("error"),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [user.id]);

  // ── Carregar obras abertas + empregadores (para o ranking) ──
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const all = await Job.list("-created_at");
        if (!alive) return;
        const open = all.filter(j => j.status === "open" && !j.blocked_by_complaint);
        setJobs(open);

        const employerIds = [...new Set(open.map(j => j.employer_id).filter(Boolean))];
        const employers = await Promise.all(employerIds.map(id => User.get(id).catch(() => null)));
        if (!alive) return;
        const map = {};
        employers.filter(Boolean).forEach(e => { map[e.id] = e; });
        setEmployersById(map);
      } catch (e) {
        console.error("Home load error:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    listFavoriteIds(user.id, "job").then(setFavorites).catch(() => {});
    return () => { alive = false; };
  }, [user.id]);

  // ── Filtro + ordenação ──
  const filteredJobs = useMemo(() => {
    const withDistance = jobs.map(j => ({
      ...j,
      _distance: userLocation && j.latitude && j.longitude
        ? haversine(userLocation[0], userLocation[1], j.latitude, j.longitude)
        : null,
      _employer: employersById[j.employer_id] || null,
    }));

    let f = withDistance;
    if (selectedCategory !== "ALL") f = f.filter(j => j.category === selectedCategory);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      f = f.filter(j =>
        j.title?.toLowerCase().includes(term) ||
        j.location?.toLowerCase().includes(term) ||
        j.category?.toLowerCase().includes(term) ||
        j.description?.toLowerCase().includes(term)
      );
    }

    // #35 — raio (só aplica se soubermos onde está o utilizador)
    if (radiusKm > 0 && userLocation) {
      f = f.filter(j => j._distance !== null && j._distance <= radiusKm);
    }

    // #37 — ordenação
    const sorted = [...f];
    if (sortBy === "pay") {
      sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === "distance") {
      sorted.sort((a, b) => (a._distance ?? Infinity) - (b._distance ?? Infinity));
    } else if (sortBy === "rating") {
      sorted.sort((a, b) => (Number(b._employer?.rating) || 0) - (Number(a._employer?.rating) || 0));
    } else {
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return sorted;
  }, [jobs, employersById, selectedCategory, searchTerm, radiusKm, sortBy, userLocation]);

  const activeFilterCount =
    (selectedCategory !== "ALL" ? 1 : 0) + (radiusKm > 0 ? 1 : 0) + (sortBy !== "latest" ? 1 : 0);

  const handleJobClick = async (job) => {
    try { await Job.update(job.id, { views: (job.views || 0) + 1 }); } catch { /* contador é best-effort */ }
    setSelectedJobDistance(job._distance ?? null);
    setSelectedJob({ ...job, views: (job.views || 0) + 1 });
  };

  const handleToggleFavorite = async (jobId) => {
    try {
      const nowFav = await toggleFavorite(user.id, "job", jobId);
      setFavorites(prev => (nowFav ? [...prev, jobId] : prev.filter(id => id !== jobId)));
      toast.success(nowFav ? "Obra guardada em Trabalho ❤️" : "Removida dos guardados");
    } catch (e) {
      toast.error("Não foi possível guardar: " + (e.message || ""));
    }
  };

  const mapCenter = userLocation
    || (user?.latitude && user?.longitude ? [user.latitude, user.longitude] : LISBON_COORDS);

  if (loading) return <LoadingScreen />;

  const resetFilters = () => { setSelectedCategory("ALL"); setRadiusKm(0); setSortBy("latest"); setSearchTerm(""); };

  // ── Cartão de obra (usado na lista) — contraste corrigido para claro/escuro ──
  const JobRow = ({ job }) => {
    const employer = job._employer;
    const isFav = favorites.includes(job.id);
    return (
      <div
        onClick={() => handleJobClick(job)}
        style={{
          background: "var(--surface2)",
          border: "1px solid var(--hair)",
          borderRadius: 14, padding: "14px 16px", marginBottom: 10, cursor: "pointer",
          display: "flex", gap: 12, alignItems: "flex-start",
          boxShadow: "0 4px 16px -12px var(--shadow)",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "var(--text)", lineHeight: 1.3 }}>
            {job.title}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text2)" }}>
            {job.location} · {job.category}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8, alignItems: "center" }}>
            {job._distance !== null && (
              <span style={{ background: "var(--surface)", border: "1px solid var(--hair)", color: "var(--text2)", borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 600 }}>
                📍 {fmtDist(job._distance)}
              </span>
            )}
            {employer && (
              <span style={{ background: "var(--surface)", border: "1px solid var(--hair)", color: "var(--text2)", borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
                <Star size={10} color="#FBBF24" fill="#FBBF24" />
                {employer.rating ? Number(employer.rating).toFixed(1) : "novo"}
                {employer.company ? ` · ${employer.company}` : ""}
              </span>
            )}
            {job.urgency === "high" && (
              <span style={{ background: "#EF444422", color: "#EF4444", borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>
                🔥 Urgente
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
          <p style={{ margin: 0, fontWeight: 800, color: "#FF6600", fontSize: 17 }}>
            €{job.price}{job.price_type === "hourly" ? "/h" : ""}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleFavorite(job.id); }}
            aria-label={isFav ? "Remover dos guardados" : "Guardar obra"}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, lineHeight: 0 }}
          >
            <Heart size={18} color={isFav ? "#EF4444" : "var(--text2)"} fill={isFav ? "#EF4444" : "none"} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: "relative", height: "calc(100vh - 60px)", overflow: "hidden", background: "var(--base)" }}>

      {/* ── BARRA SUPERIOR: pesquisa + toggle vista + filtros ── */}
      <div style={{
        position: view === "map" ? "absolute" : "relative",
        top: view === "map" ? 16 : 0, left: view === "map" ? 16 : 0, right: view === "map" ? 16 : 0,
        zIndex: 20, display: "flex", flexDirection: "column", gap: 8,
        padding: view === "map" ? 0 : "12px 16px 0",
      }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="k-search" style={{ flex: 1 }}>
            <Search size={16} color="var(--or)" />
            <input
              placeholder={t(lang, "searchPlaceholder", "Pesquisar obras...")}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            aria-label="Filtros"
            style={{
              flexShrink: 0, width: 42, borderRadius: 12, cursor: "pointer", position: "relative",
              border: `1px solid ${showFilters ? "#FF6600" : "var(--hair)"}`,
              background: showFilters ? "#FF660022" : "var(--surface2)",
              color: showFilters ? "#FF6600" : "var(--text2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <SlidersHorizontal size={17} />
            {activeFilterCount > 0 && (
              <span style={{ position: "absolute", top: -5, right: -5, background: "#FF6600", color: "#fff", borderRadius: "50%", width: 17, height: 17, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* ── PAINEL DE FILTROS (#1003: tem botão de fechar) ── */}
        {showFilters && (
          <div style={{
            background: "var(--surface2)", border: "1px solid var(--hair)", borderRadius: 16,
            padding: 14, boxShadow: "0 12px 32px -18px var(--shadow)",
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 14, color: "var(--text)", flex: 1 }}>Filtros</span>
              <button onClick={resetFilters}
                style={{ background: "none", border: "none", color: "var(--text2)", fontSize: 12, cursor: "pointer", marginRight: 8, textDecoration: "underline" }}>
                Limpar
              </button>
              <button onClick={() => setShowFilters(false)} aria-label="Fechar filtros"
                style={{ background: "var(--surface)", border: "1px solid var(--hair)", borderRadius: 8, width: 26, height: 26, cursor: "pointer", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={14} />
              </button>
            </div>

            {/* Categoria */}
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.6 }}>Categoria</p>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.pt} onClick={() => setSelectedCategory(cat.pt)}
                  style={{
                    flexShrink: 0, padding: "6px 12px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 600,
                    border: `1px solid ${selectedCategory === cat.pt ? "#FF6600" : "var(--hair)"}`,
                    background: selectedCategory === cat.pt ? "#FF6600" : "var(--surface)",
                    color: selectedCategory === cat.pt ? "#fff" : "var(--text2)",
                  }}>
                  {cat.icon} {t(lang, cat.key, cat.pt === "ALL" ? "Todas" : cat.pt)}
                </button>
              ))}
            </div>

            {/* Raio (#35) */}
            <p style={{ margin: "8px 0 6px", fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.6 }}>
              Raio de distância
            </p>
            {/* #35 — banner visível quando localização não está disponível */}
            {!userLocation && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                background: "#fffbeb", border: "1px solid #fbbf24",
                borderRadius: 10, padding: "8px 10px", marginBottom: 8,
              }}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>📍</span>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#92400e" }}>
                    Localização não disponível
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#b45309", lineHeight: 1.4 }}>
                    Permite o acesso à localização no browser para filtrar por raio e ver obras perto de ti.
                  </p>
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              {RADIUS_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setRadiusKm(opt.value)}
                  disabled={opt.value > 0 && !userLocation}
                  title={opt.value > 0 && !userLocation ? "Ativa a localização para filtrar por distância" : undefined}
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 700,
                    cursor: opt.value > 0 && !userLocation ? "not-allowed" : "pointer",
                    opacity: opt.value > 0 && !userLocation ? 0.45 : 1,
                    border: `1px solid ${radiusKm === opt.value ? "#FF6600" : "var(--hair)"}`,
                    background: radiusKm === opt.value ? "#FF6600" : "var(--surface)",
                    color: radiusKm === opt.value ? "#fff" : "var(--text2)",
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Ordenação (#37) */}
            <p style={{ margin: "12px 0 6px", fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.6 }}>
              Ordenar por
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {SORT_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setSortBy(opt.value)}
                  disabled={opt.value === "distance" && !userLocation}
                  style={{
                    padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 700,
                    cursor: opt.value === "distance" && !userLocation ? "not-allowed" : "pointer",
                    opacity: opt.value === "distance" && !userLocation ? 0.45 : 1,
                    border: `1px solid ${sortBy === opt.value ? "#FF6600" : "var(--hair)"}`,
                    background: sortBy === opt.value ? "#FF6600" : "var(--surface)",
                    color: sortBy === opt.value ? "#fff" : "var(--text2)",
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── MAPA ── */}
      {view === "map" && (
        <>
          <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
            <MapView
              jobs={filteredJobs}
              onJobClick={handleJobClick}
              center={mapCenter}
              userLocation={userLocation}
            />
          </div>

          <div style={{ position: "absolute", bottom: 80, left: 16, zIndex: 20 }}>
            <div className="k-geo" style={{
              color: geoStatus === "ok" ? "#4ADE80" : geoStatus === "error" ? "#F87171" : "#FBBF24",
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                background: geoStatus === "ok" ? "#16A34A" : geoStatus === "error" ? "#EF4444" : "#F59E0B",
              }} />
              {geoStatus === "loading" ? t(lang, "locating", "A localizar...")
                : geoStatus === "error" ? t(lang, "noLocation", "Sem localização")
                : `📍 ${t(lang, "online", "Online")}`}
            </div>
          </div>
        </>
      )}

      {/* ── LISTA (vista própria, legível em claro e escuro) ── */}
      {view === "list" && (
        <div style={{ height: "100%", overflowY: "auto", padding: "12px 16px 100px", background: "var(--base)" }}>
          <p style={{ margin: "0 0 12px", color: "var(--text2)", fontSize: 13, fontWeight: 600 }}>
            {filteredJobs.length} {filteredJobs.length === 1 ? "obra encontrada" : "obras encontradas"}
            {radiusKm > 0 && ` num raio de ${radiusKm} km`}
          </p>
          {filteredJobs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🔍</div>
              <p style={{ color: "var(--text)", fontWeight: 700, margin: "0 0 6px" }}>
                {t(lang, "noJobsFound", "Nenhuma obra encontrada")}
              </p>
              <p style={{ color: "var(--text2)", fontSize: 13, margin: 0 }}>Experimenta alargar o raio ou limpar os filtros.</p>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters}
                  style={{ marginTop: 14, background: "#FF6600", border: "none", borderRadius: 12, padding: "10px 20px", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                  Limpar filtros
                </button>
              )}
            </div>
          ) : filteredJobs.map(job => <JobRow key={job.id} job={job} />)}
        </div>
      )}

      {/* ── CONTADOR + TOGGLE MAPA/LISTA ── */}
      <div style={{
        position: "absolute", bottom: 80, right: 16, zIndex: 20,
        display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6,
      }}>
        {view === "map" && (
          <div className="k-badge" style={{ fontSize: 11 }}>
            {filteredJobs.length} {filteredJobs.length === 1 ? "obra" : "obras"}
          </div>
        )}
        <button
          onClick={() => setView(v => (v === "map" ? "list" : "map"))}
          className="k-pill k-pill-primary"
        >
          {view === "map" ? <><List size={14} /> Lista</> : <><MapIcon size={14} /> Mapa</>}
        </button>
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
            if (!window.confirm(t(lang, "confirmDeleteJob", "Apagar esta obra?"))) return;
            try {
              await Job.delete(jobId);
              setJobs(prev => prev.filter(j => j.id !== jobId));
              setSelectedJob(null);
            } catch (e) { toast.error("Erro ao apagar: " + (e.message || "")); }
          }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────
   EMPLOYER HOME
───────────────────────────*/
function EmployerHome({ user }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const text = "var(--text)";
  const subtext = "var(--text2)";
  const firstName = user.full_name?.split(" ")[0] || t(lang, "userGeneric", "Utilizador");

  return (
    <div className="k-bg" style={{ minHeight: "100vh", paddingBottom: 80 }}>
      <div style={{
        padding: "32px 24px 28px",
        background: "linear-gradient(180deg, #0d0f12 0%, #111318 100%)",
        borderBottom: "1px solid rgba(255,255,255,.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#FF9944", fontWeight: 600 }}>{t(lang, "welcome", "Bem-vindo")} 👋</p>
            <h1 style={{ margin: "4px 0 6px", fontSize: 28, fontWeight: 900, color: "#FFFFFF", letterSpacing: -0.5 }}>
              {firstName}
            </h1>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#8A909A" }}>
              {t(lang, "whatDoYouNeed", "O que precisa?")}
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
        <button onClick={() => navigate(createPageUrl("NewJob"))}
          className="k-hero" style={{ width: "100%", border: "none", cursor: "pointer", marginBottom: 16, display: "block", textAlign: "left", padding: 0 }}>
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>🏗️ {t(lang, "announceJob", "Anunciar a sua Obra")}</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.85 }}>{t(lang, "findProInMinutes", "Encontra o profissional certo em minutos")}</p>
          </div>
          <span style={{ fontSize: 36 }}>→</span>
        </button>

        <button onClick={() => navigate(createPageUrl("Workers"))}
          className="k-tile" style={{ width: "100%", border: "none", cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px" }}>
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 13, color: "#F4621F", fontWeight: 700 }}>🔍 Novo</p>
            <p style={{ margin: "4px 0 2px", fontSize: 19, fontWeight: 900, color: text }}>Encontrar Profissionais</p>
            <p style={{ margin: 0, fontSize: 12, color: subtext }}>Pesquisa por skill, rating, XP e mais</p>
          </div>
          <span style={{ fontSize: 36 }}>👷</span>
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { icon: "📋", label: t(lang, "work", "Trabalho"),  desc: t(lang, "pendingActiveJobs", "Obras pendentes e activas"), to: "MyJobs" },
            { icon: "📊", label: "Dashboard",                    desc: "Volume, gastos e calendário",                            to: "Dashboard" },
            { icon: "👥", label: t(lang, "applications"),        desc: t(lang, "seeWhoWantsToWork", "Veja quem quer trabalhar"), to: "Applications" },
            { icon: "💬", label: t(lang, "chat"),                desc: t(lang, "talkToPros", "Fale com profissionais"),          to: "Chat" },
            { icon: "📅", label: "Calendário",                   desc: "Datas de início e fim das obras",                        to: "Calendar" },
            { icon: "👤", label: t(lang, "profile"),             desc: t(lang, "editYourData", "Edite os seus dados"),            to: "Profile" },
          ].map(({ icon, label, desc, to }) => (
            <button key={to} onClick={() => navigate(createPageUrl(to))} className="k-grid-card">
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
