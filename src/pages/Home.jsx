import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/ThemeContext";
import LoadingScreen from "@/components/LoadingScreen";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Application } from "@/entities/Application";
import MapView from "@/components/dashboard/MapView";
import JobModal from "@/components/dashboard/JobModal";
import { Search, Plus, List, MapIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const LISBON_COORDS = [38.7223, -9.1393];
const CATEGORIES = ["Todos", "Pintura", "Eletricidade", "Canalização", "Alvenaria", "Ladrilhador", "Carpintaria", "Climatização", "Isolamentos", "Pavimentos", "Telhados"];

/* ─────────────────────────────────────────────
   HOME DO PROFISSIONAL  (worker)
   Primário: mapa fullscreen + sheet de lista
───────────────────────────────────────────── */
function WorkerHome({ user, isDark }) {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [showList, setShowList] = useState(false);
  const [loading, setLoading] = useState(true);

  const text = isDark ? "#FFFFFF" : "#1A1A1A";
  const subtext = isDark ? "#AAAAAA" : "#666666";
  const surface = isDark ? "#1E1E1E" : "#FFFFFF";
  const border = isDark ? "#333" : "#E5E5E5";

  useEffect(() => {
    Job.list("-created_date").then(all => {
      const open = all.filter(j => j.status === "open");
      setJobs(open);
      setFilteredJobs(open);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

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
    setSelectedJob({ ...job, views: (job.views || 0) + 1 });
  };

  const center = user?.latitude && user?.longitude
    ? [user.latitude, user.longitude]
    : LISBON_COORDS;

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ position: "relative", height: "calc(100vh - 60px)", overflow: "hidden" }}>

      {/* ── MAPA (base layer, sempre visível) ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <MapView jobs={filteredJobs} onJobClick={handleJobClick} center={center} radius={15000} />
      </div>

      {/* ── SEARCH + CATEGORIAS (flutuante em cima do mapa) ── */}
      <div style={{
        position: "absolute", top: 16, left: 16, right: 16, zIndex: 20,
        display: "flex", flexDirection: "column", gap: 8
      }}>
        {/* Search */}
        <div style={{
          background: surface, borderRadius: 14, padding: "8px 14px",
          display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 4px 20px rgba(0,0,0,0.18)"
        }}>
          <Search size={16} color="#FF6600" />
          <input
            placeholder="Pesquisar obras..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              background: "none", border: "none", outline: "none",
              color: text, fontSize: 14, flex: 1
            }}
          />
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                flexShrink: 0, padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer",
                background: selectedCategory === cat ? "#FF6600" : (isDark ? "rgba(30,30,30,0.92)" : "rgba(255,255,255,0.92)"),
                color: selectedCategory === cat ? "#FFF" : subtext,
                fontWeight: selectedCategory === cat ? 700 : 500, fontSize: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)", transition: "all 0.15s"
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTADOR + BOTÃO LISTA ── */}
      <div style={{
        position: "absolute", bottom: showList ? "52%" : 24, left: "50%", transform: "translateX(-50%)",
        zIndex: 20, display: "flex", alignItems: "center", gap: 8, transition: "bottom 0.3s ease"
      }}>
        <div style={{
          background: surface, borderRadius: 20, padding: "6px 14px",
          fontSize: 12, fontWeight: 700, color: "#FF6600",
          boxShadow: "0 2px 12px rgba(0,0,0,0.2)"
        }}>
          {filteredJobs.length} obra{filteredJobs.length !== 1 ? "s" : ""}
        </div>
        <button
          onClick={() => setShowList(v => !v)}
          style={{
            background: showList ? "#FF6600" : surface, color: showList ? "#FFF" : "#FF6600",
            border: "none", borderRadius: 20, padding: "6px 14px",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
            display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s"
          }}
        >
          <List size={14} /> Lista
        </button>
      </div>

      {/* ── SHEET DE LISTA (slide-up) ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10,
        background: surface, borderRadius: "20px 20px 0 0",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
        transform: showList ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
        maxHeight: "50vh", display: "flex", flexDirection: "column"
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: isDark ? "#444" : "#DDD" }} />
        </div>
        <div style={{ overflowY: "auto", padding: "0 16px 16px", flex: 1 }}>
          {filteredJobs.length === 0 ? (
            <p style={{ textAlign: "center", color: subtext, padding: "20px 0", fontSize: 14 }}>
              Nenhuma obra encontrada.
            </p>
          ) : filteredJobs.map(job => (
            <div
              key={job.id}
              onClick={() => { handleJobClick(job); setShowList(false); }}
              style={{
                padding: "12px 0", borderBottom: `1px solid ${border}`, cursor: "pointer",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}
            >
              <div style={{ flex: 1, marginRight: 10 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: text }}>{job.title}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: subtext }}>{job.location} · {job.category}</p>
              </div>
              <p style={{ margin: 0, fontWeight: 800, color: "#FF6600", fontSize: 15, flexShrink: 0 }}>
                €{job.price}{job.price_type === "hourly" ? "/h" : ""}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Job Modal */}
      {selectedJob && (
        <JobModal
          job={selectedJob}
          user={user}
          onClose={() => setSelectedJob(null)}
          onApply={() => setSelectedJob(null)}
          onDelete={async (jobId) => {
            if (!window.confirm("Apagar esta obra?")) return;
            try { await Job.delete(jobId); setSelectedJob(null); } catch {}
          }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   HOME DO EMPREGADOR
   Painel simples: saudação + acções rápidas
───────────────────────────────────────────── */
function EmployerHome({ user, isDark }) {
  const navigate = useNavigate();
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const bg = isDark ? "#1A1A1A" : "#F5F5F5";
  const surface = isDark ? "#2A2A2A" : "#FFFFFF";
  const text = isDark ? "#FFFFFF" : "#1A1A1A";
  const subtext = isDark ? "#AAAAAA" : "#666666";
  const border = isDark ? "#333" : "#E5E5E5";

  useEffect(() => {
    Job.filter({ employer_id: user.id }).then(jobs => {
      setMyJobs(jobs.filter(j => ["open", "in_progress"].includes(j.status)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user.id]);

  const firstName = user.full_name?.split(" ")[0] || "Utilizador";

  const QUICK_ACTIONS = [
    {
      icon: "🏗️", label: "Publicar\nObra",
      desc: "Encontra o profissional certo",
      action: () => navigate(createPageUrl("NewJob")),
      primary: true
    },
    {
      icon: "📋", label: "As Minhas\nObras",
      desc: "Gere os seus trabalhos",
      action: () => navigate(createPageUrl("MyJobs")),
      primary: false
    },
    {
      icon: "👥", label: "Candidaturas",
      desc: "Veja quem quer trabalhar",
      action: () => navigate(createPageUrl("Applications")),
      primary: false
    },
    {
      icon: "💬", label: "Chat",
      desc: "Fale com profissionais",
      action: () => navigate(createPageUrl("Chat")),
      primary: false
    },
  ];

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ minHeight: "100vh", background: bg, paddingBottom: 80 }}>

      {/* Header de saudação */}
      <div style={{
        background: isDark
          ? "linear-gradient(135deg, #1A1A1A 0%, #2A1A0A 100%)"
          : "linear-gradient(135deg, #FF6600 0%, #FF8C00 100%)",
        padding: "32px 24px 28px"
      }}>
        <p style={{ margin: 0, fontSize: 14, color: isDark ? "#FF8844" : "rgba(255,255,255,0.8)", fontWeight: 500 }}>
          Bem-vindo de volta 👋
        </p>
        <h1 style={{ margin: "4px 0 8px", fontSize: 28, fontWeight: 900, color: isDark ? "#FF6600" : "#FFFFFF", letterSpacing: -0.5 }}>
          {firstName}
        </h1>
        <p style={{
          margin: 0, fontSize: 18, fontWeight: 700,
          color: isDark ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.9)"
        }}>
          O que precisa hoje?
        </p>

        {/* Mini stats */}
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <div style={{
            background: "rgba(255,255,255,0.15)", borderRadius: 12,
            padding: "10px 16px", backdropFilter: "blur(8px)", flex: 1, textAlign: "center"
          }}>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#FFF" }}>{myJobs.length}</p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.8)" }}>Obras Activas</p>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.15)", borderRadius: 12,
            padding: "10px 16px", backdropFilter: "blur(8px)", flex: 1, textAlign: "center"
          }}>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#FFF" }}>
              {myJobs.filter(j => j.status === "in_progress").length}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.8)" }}>Em Curso</p>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 20px" }}>

        {/* Acção principal em destaque */}
        <button
          onClick={() => navigate(createPageUrl("NewJob"))}
          style={{
            width: "100%", background: "#FF6600", color: "#FFF",
            border: "none", borderRadius: 20, padding: "22px 24px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer", marginBottom: 16,
            boxShadow: "0 8px 24px rgba(255,102,0,0.35)",
            transition: "transform 0.15s, box-shadow 0.15s"
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>+ Publicar Nova Obra</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.85 }}>Encontra o profissional certo em minutos</p>
          </div>
          <span style={{ fontSize: 36 }}>🏗️</span>
        </button>

        {/* Grid de acções secundárias */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { icon: "📋", label: "Minhas Obras", desc: "Gere os seus trabalhos", to: "MyJobs" },
            { icon: "👥", label: "Candidaturas", desc: "Veja quem quer trabalhar", to: "Applications" },
            { icon: "💬", label: "Chat", desc: "Fale com profissionais", to: "Chat" },
            { icon: "👤", label: "Perfil", desc: "Edite os seus dados", to: "Profile" },
          ].map(({ icon, label, desc, to }) => (
            <button
              key={to}
              onClick={() => navigate(createPageUrl(to))}
              style={{
                background: surface, border: `1px solid ${border}`, borderRadius: 16,
                padding: "18px 16px", textAlign: "left", cursor: "pointer",
                transition: "transform 0.15s, box-shadow 0.15s"
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(255,102,0,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <span style={{ fontSize: 28 }}>{icon}</span>
              <p style={{ margin: "8px 0 2px", fontWeight: 700, fontSize: 14, color: text }}>{label}</p>
              <p style={{ margin: 0, fontSize: 11, color: subtext, lineHeight: 1.4 }}>{desc}</p>
            </button>
          ))}
        </div>

        {/* Obras activas recentes */}
        {myJobs.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: text }}>Obras Activas</p>
              <button
                onClick={() => navigate(createPageUrl("MyJobs"))}
                style={{ background: "none", border: "none", color: "#FF6600", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                Ver todas →
              </button>
            </div>
            {myJobs.slice(0, 3).map(job => (
              <div
                key={job.id}
                onClick={() => navigate(createPageUrl("MyJobs"))}
                style={{
                  background: surface, border: `1px solid ${border}`, borderRadius: 14,
                  padding: "12px 16px", marginBottom: 8, cursor: "pointer",
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: text }}>{job.title}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: subtext }}>{job.location}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontWeight: 800, color: "#FF6600", fontSize: 14 }}>€{job.price}</p>
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    color: job.status === "in_progress" ? "#3b82f6" : "#22c55e"
                  }}>
                    {job.status === "in_progress" ? "● Em curso" : "● Aberta"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */
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

  if (user.user_type === "worker") return <WorkerHome user={user} isDark={isDark} />;
  if (user.user_type === "employer") return <EmployerHome user={user} isDark={isDark} />;
  // admin → redireciona para AdminDashboard (o Layout.jsx já faz isso)
  return null;
}
