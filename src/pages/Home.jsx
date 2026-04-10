import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/ThemeContext";
import LoadingScreen from "@/components/LoadingScreen";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import MapView from "@/components/dashboard/MapView";
import JobModal from "@/components/dashboard/JobModal";
import { Search, List, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const LISBON_COORDS = [38.7223, -9.1393];
const CATEGORIES = ["Todos", "Pintura", "Eletricidade", "Canalização", "Alvenaria", "Ladrilhador", "Carpintaria", "Climatização", "Isolamentos", "Pavimentos", "Telhados"];

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
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobDistance, setSelectedJobDistance] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [showList, setShowList] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [geoStatus, setGeoStatus] = useState("loading"); // "loading" | "ok" | "error"
  const [loading, setLoading] = useState(true);

  const text = isDark ? "#FFFFFF" : "#1A1A1A";
  const subtext = isDark ? "#AAAAAA" : "#666666";
  const surface = isDark ? "#1C1C1C" : "#FFFFFF";
  const surfaceAlpha = isDark ? "rgba(28,28,28,0.95)" : "rgba(255,255,255,0.95)";

  // ── Geolocalização contínua ──
  useEffect(() => {
    if (!navigator.geolocation) { setGeoStatus("error"); return; }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        setGeoStatus("ok");
        User.update(user.id, { latitude: pos.coords.latitude, longitude: pos.coords.longitude }).catch(() => {});
      },
      () => setGeoStatus("error"),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 20000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [user.id]);

  // ── Carregar TODAS as obras abertas ──
  useEffect(() => {
    Job.list("-created_date")
      .then(all => { setJobs(all.filter(j => j.status === "open")); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // ── Filtrar apenas por pesquisa + categoria (sem raio) ──
  useEffect(() => {
    let f = [...jobs];
    if (selectedCategory !== "Todos") f = f.filter(j => j.category === selectedCategory);
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      f = f.filter(j =>
        j.title?.toLowerCase().includes(t) ||
        j.location?.toLowerCase().includes(t) ||
        j.category?.toLowerCase().includes(t)
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
        <div style={{ background: surfaceAlpha, borderRadius: 14, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
          <Search size={16} color="#FF6600" />
          <input
            placeholder="Pesquisar obras..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ background: "none", border: "none", outline: "none", color: text, fontSize: 14, flex: 1 }}
          />
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} style={{
              flexShrink: 0, padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer",
              background: selectedCategory === cat ? "#FF6600" : surfaceAlpha,
              color: selectedCategory === cat ? "#FFF" : subtext,
              fontWeight: selectedCategory === cat ? 700 : 500, fontSize: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)", transition: "all 0.15s"
            }}>
              {cat}
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
        <div style={{
          background: surfaceAlpha, borderRadius: 20, padding: "5px 12px",
          fontSize: 11, fontWeight: 600, boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
          color: geoStatus === "ok" ? "#16A34A" : geoStatus === "error" ? "#EF4444" : "#F59E0B",
          display: "flex", alignItems: "center", gap: 5
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
            background: geoStatus === "ok" ? "#16A34A" : geoStatus === "error" ? "#EF4444" : "#F59E0B"
          }} />
          {geoStatus === "loading" ? "A localizar..." : geoStatus === "error" ? "Sem localização" : "📍 Online"}
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
        <div style={{ background: surfaceAlpha, borderRadius: 20, padding: "5px 12px", fontSize: 11, fontWeight: 700, color: "#FF6600", boxShadow: "0 2px 10px rgba(0,0,0,0.15)" }}>
          {filteredJobs.length} obra{filteredJobs.length !== 1 ? "s" : ""}
        </div>
        <button
          onClick={() => setShowList(v => !v)}
          style={{
            background: showList ? "#FF6600" : surfaceAlpha,
            color: showList ? "#FFF" : "#FF6600",
            border: "none", borderRadius: 20, padding: "7px 14px",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
            display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s"
          }}
        >
          <List size={14} /> Lista
        </button>
      </div>

      {/* ── SHEET LISTA (slide-up) ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 15,
        background: surface, borderRadius: "20px 20px 0 0",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
        transform: showList ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
        maxHeight: "50vh", display: "flex", flexDirection: "column"
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: isDark ? "#444" : "#DDD" }} />
        </div>
        <div style={{ overflowY: "auto", padding: "0 16px 80px", flex: 1 }}>
          {filteredJobs.length === 0 ? (
            <p style={{ textAlign: "center", color: subtext, padding: "24px 0", fontSize: 14 }}>
              Nenhuma obra encontrada.
            </p>
          ) : filteredJobs.map(job => {
            const dist = userLocation && job.latitude && job.longitude
              ? haversine(userLocation[0], userLocation[1], job.latitude, job.longitude)
              : null;
            return (
              <div
                key={job.id}
                onClick={() => { handleJobClick(job); setShowList(false); }}
                style={{ padding: "12px 0", borderBottom: `1px solid ${isDark ? "#333" : "#F0F0F0"}`, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
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
            if (!window.confirm("Apagar esta obra?")) return;
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
  const navigate = useNavigate();
  const bg = isDark ? "#1A1A1A" : "#F5F5F5";
  const surface = isDark ? "#2A2A2A" : "#FFFFFF";
  const text = isDark ? "#FFFFFF" : "#1A1A1A";
  const subtext = isDark ? "#AAAAAA" : "#666666";
  const border = isDark ? "#333" : "#E5E5E5";
  const firstName = user.full_name?.split(" ")[0] || "Utilizador";

  return (
    <div style={{ minHeight: "100vh", background: bg, paddingBottom: 80 }}>
      <div style={{
        background: isDark
          ? "linear-gradient(135deg, #1F1108 0%, #2A1A0A 100%)"
          : "linear-gradient(135deg, #FF6600 0%, #FF8C00 100%)",
        padding: "40px 24px 32px"
      }}>
        <p style={{ margin: 0, fontSize: 14, color: isDark ? "#FF9944" : "rgba(255,255,255,0.8)", fontWeight: 500 }}>Bem-vindo 👋</p>
        <h1 style={{ margin: "4px 0 6px", fontSize: 30, fontWeight: 900, color: isDark ? "#FF6600" : "#FFF", letterSpacing: -0.5 }}>
          {firstName}
        </h1>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.9)" }}>
          O que precisa?
        </p>
      </div>

      <div style={{ padding: "24px 20px" }}>
        <button
          onClick={() => navigate(createPageUrl("NewJob"))}
          style={{
            width: "100%", background: "#FF6600", color: "#FFF",
            border: "none", borderRadius: 20, padding: "22px 24px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer", marginBottom: 16,
            boxShadow: "0 8px 24px rgba(255,102,0,0.35)"
          }}
        >
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>+ Publicar Nova Obra</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.85 }}>Encontra o profissional certo em minutos</p>
          </div>
          <span style={{ fontSize: 36 }}>🏗️</span>
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { icon: "📋", label: "Trabalho",     desc: "Obras pendentes e activas", to: "MyJobs" },
            { icon: "👥", label: "Candidaturas", desc: "Veja quem quer trabalhar",  to: "Applications" },
            { icon: "💬", label: "Chat",          desc: "Fale com profissionais",   to: "Chat" },
            { icon: "👤", label: "Perfil",        desc: "Edite os seus dados",      to: "Profile" },
          ].map(({ icon, label, desc, to }) => (
            <button
              key={to}
              onClick={() => navigate(createPageUrl(to))}
              style={{
                background: surface, border: `1px solid ${border}`, borderRadius: 16,
                padding: "18px 16px", textAlign: "left", cursor: "pointer",
              }}
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
    User.me().then(u => {
      if (!u) { navigate(createPageUrl("Welcome")); return; }
      if (!u.user_type) { navigate(createPageUrl("SetupProfile")); return; }
      setUser(u);
      setLoading(false);
    }).catch(() => navigate(createPageUrl("Welcome")));
  }, [navigate]);

  if (loading) return <LoadingScreen />;
  if (!user) return null;

  if (user.user_type === "worker")   return <WorkerHome   user={user} isDark={isDark} />;
  if (user.user_type === "employer") return <EmployerHome user={user} isDark={isDark} />;
  return null;
}
