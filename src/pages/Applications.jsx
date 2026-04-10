import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { Application } from "@/entities/Application";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Notification } from "@/entities/Notification";
import { MapPin } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "@/components/LoadingScreen";

// ─── Card de candidato (para o employer aprovar/recusar) ─────────────────────
function CandidateCard({ app, job, worker, onAccept, onReject, isDark, surface, text, subtext, border }) {
  const [acting, setActing] = useState(false);

  const handleAccept = async () => {
    if (acting) return; setActing(true);
    try {
      const price = app.proposed_price || job?.price;
      await Application.update(app.id, { status: "accepted" });
      await Job.update(job.id, { status: "in_progress", worker_id: app.worker_id, price });
      // Rejeitar outros candidatos
      const others = await Application.filter({ job_id: job.id });
      await Promise.all(
        others.filter(a => a.id !== app.id && a.status === "pending")
          .map(a => Application.update(a.id, { status: "rejected" }))
      );
      await Notification.create({
        user_id: app.worker_id, type: "job_accepted",
        title: "🎉 Candidatura Aceite!",
        message: `A tua candidatura para "${job?.title}" foi aceite. Vai a Trabalhos para começar.`,
        related_id: job?.id, action_url: createPageUrl("MyJobs"), is_read: false
      });
      onAccept();
    } catch (_) { setActing(false); }
  };

  const handleReject = async () => {
    if (acting) return; setActing(true);
    try {
      await Application.update(app.id, { status: "rejected" });
      await Notification.create({
        user_id: app.worker_id, type: "job_rejected",
        title: "Candidatura não aceite",
        message: `A tua candidatura para "${job?.title}" não foi selecionada.`,
        related_id: job?.id, action_url: createPageUrl("Home"), is_read: false
      });
      onReject();
    } catch (_) { setActing(false); }
  };

  return (
    <div style={{
      background: surface, borderRadius: 16,
      border: `1px solid ${border}`, borderLeft: "4px solid #F59E0B",
      padding: 16, marginBottom: 12
    }}>
      {/* Worker info */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 46, height: 46, borderRadius: "50%",
          background: "#FF660022", display: "flex", alignItems: "center",
          justifyContent: "center", fontWeight: 800, fontSize: 20, color: "#FF6600", flexShrink: 0
        }}>
          {worker?.full_name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: text, margin: 0 }}>{worker?.full_name || "Profissional"}</p>
          <p style={{ fontSize: 12, color: subtext, margin: "2px 0 0" }}>
            ⭐ {worker?.rating?.toFixed(1) || "Novo"} · {worker?.skills?.slice(0,2).join(", ") || ""}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ color: subtext, fontSize: 11, margin: 0 }}>Proposta</p>
          <p style={{ color: "#FF6600", fontWeight: 800, fontSize: 18, margin: 0 }}>
            €{app.proposed_price || job?.price}
          </p>
        </div>
      </div>

      {/* Obra */}
      <div style={{
        background: isDark ? "#0D0D0D" : "#F5F5F5",
        borderRadius: 10, padding: "8px 12px", marginBottom: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <p style={{ fontWeight: 600, fontSize: 13, color: text, margin: 0 }}>{job?.title}</p>
        <span style={{ fontSize: 12, color: subtext, display: "flex", alignItems: "center", gap: 3 }}>
          <MapPin size={11} />{job?.location}
        </span>
      </div>

      {/* Mensagem */}
      {app.message && (
        <p style={{
          color: subtext, fontSize: 13, fontStyle: "italic",
          background: isDark ? "#111" : "#FAFAFA",
          borderRadius: 8, padding: "8px 12px", margin: "0 0 12px",
          borderLeft: "3px solid #FF660044"
        }}>
          "{app.message.slice(0, 150)}{app.message.length > 150 ? "…" : ""}"
        </p>
      )}

      {/* Botões */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={handleReject} disabled={acting} style={{
          flex: 1, background: "#EF444422", color: "#EF4444",
          border: "1px solid #EF444444", borderRadius: 12,
          padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer"
        }}>✕ Recusar</button>
        <button onClick={handleAccept} disabled={acting} style={{
          flex: 2, background: "#FF6600", color: "#FFF",
          border: "none", borderRadius: 12,
          padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer"
        }}>✓ Aceitar e Contratar</button>
      </div>
    </div>
  );
}

// ─── Card de candidatura do worker (só o status, sem PIN/QR) ─────────────────
function WorkerAppCard({ app, job, isDark, surface, text, subtext, border }) {
  const statusMap = {
    pending:  { color: "#F59E0B", label: "⏳ Pendente" },
    accepted: { color: "#22C55E", label: "✅ Aceite — vai a Trabalhos" },
    rejected: { color: "#EF4444", label: "✕ Não selecionado" },
  };
  const s = statusMap[app.status] || { color: "#888", label: app.status };

  return (
    <div style={{
      background: surface, borderRadius: 16,
      border: `1px solid ${border}`, borderLeft: `4px solid ${s.color}`,
      padding: 16, marginBottom: 12
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: text, margin: 0 }}>{job?.title || "Obra"}</p>
          <p style={{ fontSize: 12, color: subtext, margin: "3px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin size={11} />{job?.location}
          </p>
        </div>
        <p style={{ color: "#FF6600", fontWeight: 800, fontSize: 17, margin: 0 }}>
          €{app.proposed_price || job?.price}
        </p>
      </div>
      <span style={{
        background: s.color + "22", color: s.color,
        borderRadius: 20, padding: "5px 12px", fontSize: 13, fontWeight: 700
      }}>{s.label}</span>

      {app.status === "accepted" && (
        <p style={{ color: subtext, fontSize: 12, margin: "10px 0 0" }}>
          A obra está em curso. Acede a <strong style={{ color: "#FF6600" }}>Trabalhos → Em Curso</strong> para confirmar presença e finalizar.
        </p>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Applications() {
  const { isDark } = useTheme();
  const navigate   = useNavigate();
  const bg      = isDark ? "#111016" : "#F5F5F5";
  const surface = isDark ? "#1C1B22" : "#FFFFFF";
  const text    = isDark ? "#FFFFFF" : "#111016";
  const subtext = isDark ? "#AAAAAA" : "#666666";
  const border  = isDark ? "#2A2A2A" : "#E5E5E5";

  const [user,  setUser]  = useState(null);
  const [apps,  setApps]  = useState([]);
  const [jobs,  setJobs]  = useState({});
  const [workers, setWorkers] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all"); // "all" | job_id

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const cu = await User.me(); setUser(cu);

      let appList = [];
      if (cu.user_type === "worker") {
        appList = await Application.filter({ worker_id: cu.id });
      } else {
        // employer/admin — só candidaturas PENDENTES (não aceites nem rejeitadas)
        const allJobs = await Job.filter({ employer_id: cu.id });
        const myJobIds = allJobs.map(j => j.id);
        if (myJobIds.length) {
          const all = await Application.list();
          // Só pending — as aceites já estão em Trabalhos
          appList = all.filter(a => myJobIds.includes(a.job_id) && a.status === "pending");
        }
      }

      setApps(appList);

      if (!appList.length) { setLoading(false); return; }

      // Carregar jobs e workers
      const allJobsRaw = await Job.list();
      const jobMap = {}; allJobsRaw.forEach(j => jobMap[j.id] = j);
      setJobs(jobMap);

      const allUsers = await User.list();
      const wMap = {}; allUsers.forEach(u => wMap[u.id] = u);
      setWorkers(wMap);

    } catch(e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const isWorker = user?.user_type === "worker";

  // Filtros de obra (employer)
  const myJobsWithApps = isWorker ? [] : [...new Map(
    apps.map(a => a.job_id).filter(Boolean).map(id => [id, jobs[id]]).filter(([,j]) => j)
  ).values()];

  const filtered = filter === "all" ? apps : apps.filter(a => a.job_id === filter);

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ background: bg, minHeight: "100vh", paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ background: surface, borderBottom: `1px solid ${border}`, padding: "50px 20px 14px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <img
            src={isDark
              ? "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/90321a683_Gemini_Generated_Image_k4rh2gk4rh2gk4rh.png"
              : "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/002158942_Gemini_Generated_Image_5.png"}
            alt="KANDU" style={{ height: 24, objectFit: "contain" }} />
        </div>
        <p style={{ margin: 0, fontSize: 12, color: subtext }}>
          {isWorker ? "O teu histórico" : "Candidatos às tuas obras"}
        </p>
        <h1 style={{ margin: "2px 0 0", fontWeight: 800, fontSize: 22, color: text }}>
          Candidaturas
        </h1>
      </div>

      {/* Filtro por obra (employer) */}
      {!isWorker && myJobsWithApps.length > 1 && (
        <div style={{ padding: "12px 16px 0", overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 8, paddingBottom: 4 }}>
            <button onClick={() => setFilter("all")} style={{
              flexShrink: 0, padding: "8px 16px", borderRadius: 20,
              border: `1px solid ${filter === "all" ? "#FF6600" : border}`,
              background: filter === "all" ? "#FF6600" : "transparent",
              color: filter === "all" ? "#FFF" : subtext,
              fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap"
            }}>Todas</button>
            {myJobsWithApps.map(j => (
              <button key={j.id} onClick={() => setFilter(j.id)} style={{
                flexShrink: 0, padding: "8px 16px", borderRadius: 20,
                border: `1px solid ${filter === j.id ? "#FF6600" : border}`,
                background: filter === j.id ? "#FF6600" : "transparent",
                color: filter === j.id ? "#FFF" : subtext,
                fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap"
              }}>
                {j.title?.slice(0, 20)}{j.title?.length > 20 ? "…" : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista */}
      <div style={{ padding: "16px 16px 0" }}>
        {filtered.length === 0 ? (
          <div style={{ background: surface, borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>📋</div>
            <p style={{ color: text, fontWeight: 700, fontSize: 16, margin: "0 0 6px" }}>
              {isWorker ? "Ainda não te candidataste a nenhuma obra" : "Sem candidatos pendentes"}
            </p>
            <p style={{ color: subtext, fontSize: 13, margin: 0 }}>
              {isWorker
                ? "Explora obras no mapa e candidata-te!"
                : "Quando um profissional se candidatar, aparece aqui."}
            </p>
            {isWorker && (
              <button onClick={() => navigate(createPageUrl("Home"))}
                style={{ marginTop: 16, background: "#FF6600", border: "none", borderRadius: 12, padding: "12px 24px", color: "#FFF", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                🗺️ Explorar Obras
              </button>
            )}
          </div>
        ) : isWorker ? (
          filtered.map(app => (
            <WorkerAppCard key={app.id} app={app} job={jobs[app.job_id]}
              isDark={isDark} surface={surface} text={text} subtext={subtext} border={border} />
          ))
        ) : (
          filtered.map(app => (
            <CandidateCard key={app.id} app={app} job={jobs[app.job_id]} worker={workers[app.worker_id]}
              onAccept={loadData} onReject={loadData}
              isDark={isDark} surface={surface} text={text} subtext={subtext} border={border} />
          ))
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
