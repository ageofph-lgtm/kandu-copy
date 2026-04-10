import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/ThemeContext";
import LoadingScreen from "@/components/LoadingScreen";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Application } from "@/entities/Application";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MapView from "@/components/dashboard/MapView";
import JobModal from "@/components/dashboard/JobModal";
import { Search, Plus, MapPin, Clock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { translations } from "@/components/utils/translations";

const LISBON_COORDS = [38.7223, -9.1393];
const CATEGORIES = ["Todos", "Pintura", "Eletricidade", "Canalização", "Alvenaria", "Ladrilhador", "Carpintaria", "Climatização", "Isolamentos", "Pavimentos", "Telhados"];

function JobCard({ job, onClick, isDark }) {
  const surface = isDark ? "#2A2A2A" : "#FFFFFF";
  const text = isDark ? "#FFFFFF" : "#1A1A1A";
  const subtext = isDark ? "#AAAAAA" : "#666666";
  const border = isDark ? "#333" : "#E5E5E5";
  const urgencyColor = { low: "#22c55e", medium: "#f59e0b", high: "#ef4444" };
  const urgencyLabel = { low: "Normal", medium: "Urgente", high: "Muito Urgente" };

  return (
    <div
      onClick={() => onClick(job)}
      style={{
        background: surface, border: `1px solid ${border}`, borderRadius: 16,
        padding: "14px 16px", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s", marginBottom: 10,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(255,102,0,0.15)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1, marginRight: 10 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: text, lineHeight: 1.3 }}>{job.title}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <MapPin size={12} color="#FF6600" />
            <span style={{ fontSize: 12, color: subtext }}>{job.location}</span>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#FF6600" }}>
            €{job.price}{job.price_type === "hourly" ? "/h" : ""}
          </p>
          {job.urgency && (
            <span style={{ fontSize: 10, color: urgencyColor[job.urgency] || "#22c55e", fontWeight: 600 }}>
              ● {urgencyLabel[job.urgency] || "Normal"}
            </span>
          )}
        </div>
      </div>
      <p style={{ margin: "0 0 10px", fontSize: 13, color: subtext, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {job.description}
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Badge style={{ background: "#FF660022", color: "#FF6600", border: "none", fontSize: 11, fontWeight: 600 }}>
          {job.category}
        </Badge>
        <span style={{ fontSize: 11, color: subtext, display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={11} /> {new Date(job.created_date).toLocaleDateString("pt-PT")}
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [viewMode, setViewMode] = useState("list");
  const [stats, setStats] = useState({ applied: 0, active: 0, posted: 0 });

  const bg = isDark ? "#1A1A1A" : "#F5F5F5";
  const surface = isDark ? "#2A2A2A" : "#FFFFFF";
  const text = isDark ? "#FFFFFF" : "#1A1A1A";
  const subtext = isDark ? "#AAAAAA" : "#666666";
  const border = isDark ? "#333" : "#E5E5E5";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      if (!userData) { navigate(createPageUrl("Welcome")); return; }
      if (!userData.user_type) { navigate(createPageUrl("SetupProfile")); return; }
      setUser(userData);

      const allJobs = await Job.list("-created_date");
      const openJobs = allJobs.filter(j => j.status === "open");
      setJobs(openJobs);
      setFilteredJobs(openJobs);

      if (userData.user_type === "worker") {
        const apps = await Application.filter({ worker_id: userData.id });
        const active = apps.filter(a => ["accepted", "in_progress"].includes(a.status));
        setStats({ applied: apps.length, active: active.length, posted: 0 });
      } else if (userData.user_type === "employer") {
        const myPostedJobs = allJobs.filter(j => j.employer_id === userData.id);
        const activeJobs = myPostedJobs.filter(j => ["open", "in_progress"].includes(j.status));
        setMyJobs(myPostedJobs.slice(0, 3));
        setStats({ applied: 0, active: activeJobs.length, posted: myPostedJobs.length });
      }
    } catch (error) {
      console.error("Error loading home:", error);
      navigate(createPageUrl("Welcome"));
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    let filtered = [...jobs];
    if (selectedCategory !== "Todos") filtered = filtered.filter(j => j.category === selectedCategory);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(j =>
        j.title?.toLowerCase().includes(term) ||
        j.location?.toLowerCase().includes(term) ||
        j.category?.toLowerCase().includes(term)
      );
    }
    setFilteredJobs(filtered);
  }, [jobs, selectedCategory, searchTerm]);

  const handleJobClick = async (job) => {
    try { await Job.update(job.id, { views: (job.views || 0) + 1 }); } catch {}
    setSelectedJob({ ...job, views: (job.views || 0) + 1 });
  };

  const getMapCenter = () => {
    if (user?.latitude && user?.longitude) return [user.latitude, user.longitude];
    return LISBON_COORDS;
  };

  if (loading) return <LoadingScreen />;
  if (!user) return null;

  const isWorker = user.user_type === "worker";
  const isEmployer = user.user_type === "employer";

  return (
    <div style={{ minHeight: "100vh", background: bg, paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: surface, borderBottom: `1px solid ${border}`, padding: "16px 20px 12px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: subtext }}>
              {isWorker ? "Obras disponíveis" : "Painel do Empregador"}
            </p>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: text }}>
              Olá, {user.full_name?.split(" ")[0] || "Utilizador"} 👋
            </h1>
          </div>
          {isEmployer && (
            <Button
              onClick={() => navigate(createPageUrl("NewJob"))}
              style={{ background: "#FF6600", color: "#FFF", borderRadius: 12, fontWeight: 700, fontSize: 13, padding: "8px 14px", border: "none", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={16} /> Nova Obra
            </Button>
          )}
        </div>
        <div style={{ position: "relative" }}>
          <Search size={16} color={subtext} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <Input
            placeholder="Pesquisar obras..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 36, background: isDark ? "#111" : "#F0F0F0", border: "none", borderRadius: 12, color: text, height: 40 }}
          />
        </div>
      </div>

      <div style={{ padding: "16px 20px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {isWorker ? (
            <>
              <div style={{ background: surface, borderRadius: 14, padding: "12px 10px", textAlign: "center", border: `1px solid ${border}` }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#FF6600" }}>{filteredJobs.length}</p>
                <p style={{ margin: 0, fontSize: 11, color: subtext, marginTop: 2 }}>Disponíveis</p>
              </div>
              <div style={{ background: surface, borderRadius: 14, padding: "12px 10px", textAlign: "center", border: `1px solid ${border}` }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#22c55e" }}>{stats.active}</p>
                <p style={{ margin: 0, fontSize: 11, color: subtext, marginTop: 2 }}>Activos</p>
              </div>
              <div style={{ background: surface, borderRadius: 14, padding: "12px 10px", textAlign: "center", border: `1px solid ${border}` }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#3b82f6" }}>{stats.applied}</p>
                <p style={{ margin: 0, fontSize: 11, color: subtext, marginTop: 2 }}>Candidaturas</p>
              </div>
            </>
          ) : (
            <>
              <div style={{ background: surface, borderRadius: 14, padding: "12px 10px", textAlign: "center", border: `1px solid ${border}` }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#FF6600" }}>{stats.posted}</p>
                <p style={{ margin: 0, fontSize: 11, color: subtext, marginTop: 2 }}>Minhas Obras</p>
              </div>
              <div style={{ background: surface, borderRadius: 14, padding: "12px 10px", textAlign: "center", border: `1px solid ${border}` }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#22c55e" }}>{stats.active}</p>
                <p style={{ margin: 0, fontSize: 11, color: subtext, marginTop: 2 }}>Activas</p>
              </div>
              <div style={{ background: surface, borderRadius: 14, padding: "12px 10px", textAlign: "center", border: `1px solid ${border}` }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#3b82f6" }}>{filteredJobs.length}</p>
                <p style={{ margin: 0, fontSize: 11, color: subtext, marginTop: 2 }}>No mercado</p>
              </div>
            </>
          )}
        </div>

        {/* Categories */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 16 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                flexShrink: 0, padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                background: selectedCategory === cat ? "#FF6600" : (isDark ? "#2A2A2A" : "#EBEBEB"),
                color: selectedCategory === cat ? "#FFF" : subtext,
                fontWeight: selectedCategory === cat ? 700 : 400, fontSize: 13, transition: "all 0.15s",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["list", "map"].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                flex: 1, padding: "8px", borderRadius: 10, border: `1px solid ${border}`, cursor: "pointer",
                background: viewMode === mode ? "#FF6600" : surface,
                color: viewMode === mode ? "#FFF" : subtext, fontWeight: 600, fontSize: 13,
              }}
            >
              {mode === "list" ? "📋 Lista" : "🗺️ Mapa"}
            </button>
          ))}
        </div>

        {/* Employer quick section */}
        {isEmployer && myJobs.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h2 style={{ margin: 0, fontWeight: 700, fontSize: 15, color: text }}>As Minhas Obras</h2>
              <button
                onClick={() => navigate(createPageUrl("MyJobs"))}
                style={{ background: "none", border: "none", color: "#FF6600", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                Ver todas <ChevronRight size={14} />
              </button>
            </div>
            {myJobs.map(job => (
              <JobCard key={job.id} job={job} onClick={handleJobClick} isDark={isDark} />
            ))}
          </div>
        )}

        {/* Section title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: 15, color: text }}>
            {isWorker ? "Obras perto de si" : "Mercado de obras"}
          </h2>
          <span style={{ fontSize: 12, color: subtext }}>{filteredJobs.length} resultado{filteredJobs.length !== 1 ? "s" : ""}</span>
        </div>

        {/* LIST */}
        {viewMode === "list" && (
          <div>
            {filteredJobs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <p style={{ fontSize: 40, margin: "0 0 10px" }}>🔍</p>
                <p style={{ color: subtext, fontSize: 14, margin: 0 }}>
                  {searchTerm || selectedCategory !== "Todos"
                    ? "Nenhuma obra encontrada com esses filtros."
                    : "Não há obras disponíveis de momento."}
                </p>
                {isEmployer && (
                  <Button
                    onClick={() => navigate(createPageUrl("NewJob"))}
                    style={{ marginTop: 16, background: "#FF6600", color: "#FFF", borderRadius: 12, fontWeight: 700 }}
                  >
                    Publicar obra
                  </Button>
                )}
              </div>
            ) : (
              filteredJobs.map(job => (
                <JobCard key={job.id} job={job} onClick={handleJobClick} isDark={isDark} />
              ))
            )}
          </div>
        )}

        {/* MAP */}
        {viewMode === "map" && (
          <div style={{ borderRadius: 16, overflow: "hidden", height: 420, border: `1px solid ${border}` }}>
            <MapView jobs={filteredJobs} onJobClick={handleJobClick} center={getMapCenter()} radius={15000} />
          </div>
        )}
      </div>

      {selectedJob && (
        <JobModal
          job={selectedJob}
          user={user}
          onClose={() => setSelectedJob(null)}
          onApply={() => { setSelectedJob(null); loadData(); }}
          onDelete={async (jobId) => {
            if (!window.confirm("Apagar esta obra?")) return;
            try { await Job.delete(jobId); setSelectedJob(null); loadData(); } catch (e) { console.error(e); }
          }}
        />
      )}
    </div>
  );
}
