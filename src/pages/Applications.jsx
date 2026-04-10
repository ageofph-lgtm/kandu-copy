import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { Application } from "@/entities/Application";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Notification } from "@/entities/Notification";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, Clock, User as UserIcon, Trophy, MapPin, Euro, Bell, ChevronRight, Briefcase, History, AlertCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CompletionModal from "../components/applications/CompletionModal";

// ── Status helpers ────────────────────────────────────────────────────────────
function statusLabel(appStatus, jobStatus) {
  if (jobStatus === "completed")             return { label: "Concluída",          color: "#22C55E", bg: "#22C55E22" };
  if (jobStatus === "completed_by_employer") return { label: "Aguarda avaliação",  color: "#A855F7", bg: "#A855F722" };
  if (jobStatus === "in_progress")           return { label: "Em curso",           color: "#3B82F6", bg: "#3B82F622" };
  if (appStatus === "pending")               return { label: "Pendente",           color: "#F59E0B", bg: "#F59E0B22" };
  if (appStatus === "accepted")              return { label: "Aceite",             color: "#22C55E", bg: "#22C55E22" };
  if (appStatus === "rejected")              return { label: "Recusada",           color: "#EF4444", bg: "#EF444422" };
  return                                            { label: appStatus,            color: "#888",    bg: "#88888822" };
}

// ── Candidate card (employer view) ────────────────────────────────────────────
function CandidateCard({ application, job, worker, onAccept, onReject, onComplete, isDark }) {
  const surface  = isDark ? "#1C1B22" : "#FFFFFF";
  const text     = isDark ? "#FFFFFF" : "#111016";
  const subtext  = isDark ? "#AAAAAA" : "#666";
  const border   = isDark ? "#2A2A2A" : "#E5E5E5";
  const st       = statusLabel(application.status, job?.status);
  const price    = application.proposed_price || job?.price;
  const isActive = application.status === "accepted" && job?.status === "in_progress";
  const needsEval= application.status === "accepted" && job?.status === "in_progress";

  return (
    <div style={{ background: surface, borderRadius: 16, border: `1px solid ${border}`, borderLeft: `4px solid ${isActive ? "#FF6600" : border}`, padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#FF660033", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, color: "#FF6600", flexShrink: 0 }}>
          {worker?.full_name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: text, margin: 0 }}>{worker?.full_name || "Profissional"}</p>
          <p style={{ fontSize: 12, color: subtext, margin: "2px 0 0" }}>
            ⭐ {worker?.rating?.toFixed(1) || "Novo"} &nbsp;·&nbsp; {worker?.xp_level || "Novato"}
          </p>
        </div>
        <span style={{ background: st.bg, color: st.color, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>{st.label}</span>
      </div>

      <div style={{ background: isDark ? "#111" : "#F9F9F9", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
        <p style={{ color: subtext, fontSize: 11, margin: "0 0 2px" }}>Obra</p>
        <p style={{ color: text, fontWeight: 600, fontSize: 14, margin: 0 }}>{job?.title}</p>
        <p style={{ color: subtext, fontSize: 12, margin: "4px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={11} />{job?.location}
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: application.message ? 10 : 0 }}>
        <div>
          <p style={{ color: subtext, fontSize: 11, margin: 0 }}>Valor proposto</p>
          <p style={{ color: "#FF6600", fontWeight: 800, fontSize: 18, margin: 0 }}>€{price}</p>
        </div>
        <p style={{ color: subtext, fontSize: 11 }}>
          {format(new Date(application.created_date), "dd MMM, HH:mm", { locale: pt })}
        </p>
      </div>

      {application.message && (
        <p style={{ color: subtext, fontSize: 13, fontStyle: "italic", background: isDark ? "#111" : "#F9F9F9", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
          "{application.message.slice(0, 140)}{application.message.length > 140 ? "…" : ""}"
        </p>
      )}

      {application.status === "pending" && (
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={() => onReject(application)}
            style={{ flex: 1, background: "#EF444422", color: "#EF4444", border: "1px solid #EF444444", borderRadius: 12, padding: "10px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            ✕ Recusar
          </button>
          <button onClick={() => onAccept(application)}
            style={{ flex: 2, background: "#FF6600", color: "#FFF", border: "none", borderRadius: 12, padding: "10px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            ✓ Aceitar e Contratar
          </button>
        </div>
      )}
      {needsEval && (
        <button onClick={() => onComplete(application, job, worker)}
          style={{ width: "100%", marginTop: 8, background: "#F59E0B22", color: "#F59E0B", border: "1px solid #F59E0B44", borderRadius: 12, padding: "10px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          🏆 Finalizar Obra e Avaliar
        </button>
      )}
    </div>
  );
}

// ── Worker application card ───────────────────────────────────────────────────
function WorkerCard({ application, job, employer, onComplete, isDark }) {
  const surface  = isDark ? "#1C1B22" : "#FFFFFF";
  const text     = isDark ? "#FFFFFF" : "#111016";
  const subtext  = isDark ? "#AAAAAA" : "#666";
  const border   = isDark ? "#2A2A2A" : "#E5E5E5";
  const st       = statusLabel(application.status, job?.status);
  const price    = application.proposed_price || job?.price;
  const needsWorkerEval = application.status === "accepted" && job?.status === "completed_by_employer";

  return (
    <div style={{ background: surface, borderRadius: 16, border: `1px solid ${border}`, borderLeft: `4px solid ${st.color}`, padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: text, margin: 0 }}>{job?.title || "Obra"}</p>
          <p style={{ fontSize: 12, color: subtext, margin: "3px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin size={11} />{job?.location}
          </p>
        </div>
        <span style={{ background: st.bg, color: st.color, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{st.label}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <p style={{ color: subtext, fontSize: 11, margin: 0 }}>Valor</p>
          <p style={{ color: "#FF6600", fontWeight: 800, fontSize: 16, margin: 0 }}>€{price}</p>
        </div>
        <p style={{ color: subtext, fontSize: 11, alignSelf: "flex-end" }}>
          {format(new Date(application.created_date), "dd MMM, HH:mm", { locale: pt })}
        </p>
      </div>
      {needsWorkerEval && (
        <button onClick={() => onComplete(application, job, employer)}
          style={{ width: "100%", marginTop: 12, background: "#A855F722", color: "#A855F7", border: "1px solid #A855F744", borderRadius: 12, padding: "10px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          ✍️ Avaliar Empregador
        </button>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Applications() {
  const navigate  = useNavigate();
  const { isDark } = useTheme();
  const bg        = isDark ? "#111016" : "#FFFFFF";
  const surface   = isDark ? "#1C1B22" : "#F5F5F5";
  const text      = isDark ? "#FFFFFF" : "#111016";
  const subtext   = isDark ? "#AAAAAA" : "#666";
  const border    = isDark ? "#2A2A2A" : "#E5E5E5";

  const [user,            setUser]            = useState(null);
  const [applications,    setApplications]    = useState([]);
  const [jobs,            setJobs]            = useState({});
  const [applicants,      setApplicants]      = useState({});
  const [employers,       setEmployers]       = useState({});
  const [loading,         setLoading]         = useState(true);
  const [activeTab,       setActiveTab]       = useState("pending");
  const [showCompletion,  setShowCompletion]  = useState(false);
  const [selectedCompletion, setSelectedCompletion] = useState(null);

  // Employer job filter
  const [selectedJobId, setSelectedJobId] = useState("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Mark related notifications as read
      try {
        const unread = await Notification.filter({ user_id: currentUser.id, is_read: false });
        const toRead = unread.filter(n =>
          ["new_application","new_proposal","job_accepted","job_rejected","job_completed","job_ready_for_review","application_rejected"].includes(n.type)
        );
        await Promise.all(toRead.map(n => Notification.update(n.id, { is_read: true })));
      } catch (_) {}

      let appsData = [];
      if (currentUser.user_type === "admin") {
        appsData = await Application.list("-created_date");
      } else if (currentUser.user_type === "employer") {
        const allJobs = await Job.list("-created_date");
        const myJobIds = allJobs.filter(j => j.employer_id === currentUser.id).map(j => j.id);
        if (myJobIds.length > 0) {
          const allApps = await Application.list("-created_date");
          appsData = allApps.filter(a => myJobIds.includes(a.job_id));
        }
      } else {
        appsData = await Application.filter({ worker_id: currentUser.id }, "-created_date");
      }
      setApplications(appsData);

      if (!appsData.length) { setLoading(false); return; }

      const allJobs   = await Job.list();
      const jobMap    = {};
      allJobs.forEach(j => { jobMap[j.id] = j; });
      setJobs(jobMap);

      const allUsers  = await User.list();
      const userMap   = {};
      allUsers.forEach(u => { userMap[u.id] = u; });

      const workerMap  = {}, employerMap = {};
      appsData.forEach(a => {
        if (a.worker_id   && userMap[a.worker_id])              workerMap[a.worker_id]   = userMap[a.worker_id];
        const emp = jobMap[a.job_id]?.employer_id;
        if (emp && userMap[emp])                                 employerMap[emp]         = userMap[emp];
      });
      setApplicants(workerMap);
      setEmployers(employerMap);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAccept = async (app) => {
    try {
      const job = jobs[app.job_id];
      if (!job) return;
      const finalPrice = app.proposed_price || job.price;
      await Application.update(app.id, { status: "accepted" });
      await Job.update(app.job_id, { status: "in_progress", worker_id: app.worker_id, price: finalPrice });
      const otherApps = applications.filter(a => a.job_id === app.job_id && a.id !== app.id && a.status === "pending");
      await Promise.all(otherApps.map(a => Application.update(a.id, { status: "rejected" })));
      await Notification.create({
        user_id: app.worker_id, type: "job_accepted",
        title: "🎉 Candidatura Aceite!",
        message: `A tua candidatura para "${job.title}" foi aceite. Começa a obra!`,
        related_id: app.job_id, action_url: createPageUrl("Applications"), is_read: false
      });
      await Promise.all(otherApps.map(a => Notification.create({
        user_id: a.worker_id, type: "application_rejected",
        title: "Candidatura não selecionada",
        message: `Outro profissional foi selecionado para "${job.title}".`,
        related_id: app.job_id, action_url: createPageUrl("Home"), is_read: false
      })));
      loadData();
    } catch (e) { alert("Erro ao aceitar. Tente novamente."); }
  };

  const handleReject = async (app) => {
    if (!window.confirm("Recusar esta candidatura?")) return;
    try {
      const job = jobs[app.job_id];
      await Application.update(app.id, { status: "rejected" });
      await Notification.create({
        user_id: app.worker_id, type: "job_rejected",
        title: "Candidatura não aceite",
        message: `A tua candidatura para "${job?.title}" não foi selecionada.`,
        related_id: app.job_id, action_url: createPageUrl("Home"), is_read: false
      });
      loadData();
    } catch (e) { alert("Erro ao recusar."); }
  };

  const handleComplete = (app, job, otherUser) => {
    setSelectedCompletion({ application: app, job, otherUser });
    setShowCompletion(true);
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const isEmployer = user?.user_type === "employer" || user?.user_type === "admin";

  // My jobs (employer) — for the filter selector
  const myJobs = isEmployer
    ? [...new Map(
        applications.map(a => a.job_id)
          .filter(Boolean)
          .map(id => [id, jobs[id]])
          .filter(([,j]) => j)
      ).values()]
    : [];

  const filteredApps = selectedJobId === "all"
    ? applications
    : applications.filter(a => a.job_id === selectedJobId);

  // Tabs
  const pendingApps  = filteredApps.filter(a => a.status === "pending");
  const activeApps   = filteredApps.filter(a => a.status === "accepted" && ["in_progress","completed_by_employer"].includes(jobs[a.job_id]?.status));
  const historyApps  = filteredApps.filter(a => a.status === "rejected" || jobs[a.job_id]?.status === "completed");

  const TABS = [
    { id: "pending",  label: "Pendentes",  icon: "⏳", count: pendingApps.length,  data: pendingApps  },
    { id: "active",   label: "Ativas",     icon: "🔨", count: activeApps.length,   data: activeApps   },
    { id: "history",  label: "Histórico",  icon: "📋", count: historyApps.length,  data: historyApps  },
  ];

  const current = TABS.find(t => t.id === activeTab);

  // Loading
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <div style={{ width: 40, height: 40, border: "3px solid #FF6600", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: subtext, fontSize: 14 }}>A carregar candidaturas…</p>
      </div>
    );
  }

  return (
    <div style={{ background: bg, minHeight: "100vh", paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ padding: "50px 20px 0" }}>
        <h1 style={{ fontWeight: 800, fontSize: 28, color: text, margin: "0 0 4px" }}>
          {isEmployer ? "Candidaturas" : "Os Meus Trabalhos"}
        </h1>
        <p style={{ color: subtext, fontSize: 14, margin: 0 }}>
          {isEmployer ? "Gere as candidaturas às tuas obras" : "Acompanha as tuas candidaturas"}
        </p>
      </div>

      {/* Employer — job filter */}
      {isEmployer && myJobs.length > 1 && (
        <div style={{ padding: "16px 20px 0", overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 8, paddingBottom: 4 }}>
            <button onClick={() => setSelectedJobId("all")}
              style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 20, border: `1px solid ${selectedJobId === "all" ? "#FF6600" : border}`, background: selectedJobId === "all" ? "#FF6600" : "transparent", color: selectedJobId === "all" ? "#FFF" : subtext, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
              Todas as obras
            </button>
            {myJobs.map(j => (
              <button key={j.id} onClick={() => setSelectedJobId(j.id)}
                style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 20, border: `1px solid ${selectedJobId === j.id ? "#FF6600" : border}`, background: selectedJobId === j.id ? "#FF6600" : "transparent", color: selectedJobId === j.id ? "#FFF" : subtext, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                {j.title?.slice(0, 22)}{j.title?.length > 22 ? "…" : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab selector — big buttons */}
      <div style={{ padding: "20px 20px 0", display: "flex", gap: 10 }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ flex: 1, padding: "14px 8px", borderRadius: 16, border: `2px solid ${isActive ? "#FF6600" : border}`, background: isActive ? "#FF6600" : surface, color: isActive ? "#FFF" : subtext, cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{tab.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{tab.label}</div>
              {tab.count > 0 && (
                <div style={{ marginTop: 4, background: isActive ? "#FFF3" : "#FF660033", color: isActive ? "#FFF" : "#FF6600", borderRadius: 10, padding: "2px 8px", fontSize: 12, fontWeight: 800, display: "inline-block" }}>
                  {tab.count}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding: "20px 20px 0" }}>
        {current?.data.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>
              {activeTab === "pending" ? "⏳" : activeTab === "active" ? "🔨" : "📋"}
            </div>
            <p style={{ color: text, fontWeight: 700, fontSize: 16, margin: "0 0 6px" }}>
              {activeTab === "pending" ? "Sem candidaturas pendentes" : activeTab === "active" ? "Nenhuma obra ativa" : "Histórico vazio"}
            </p>
            <p style={{ color: subtext, fontSize: 13 }}>
              {activeTab === "pending" && isEmployer ? "Quando alguém se candidatar às tuas obras, aparece aqui." : "Nada para mostrar neste momento."}
            </p>
          </div>
        ) : isEmployer ? (
          current.data.map(app => (
            <CandidateCard
              key={app.id}
              application={app}
              job={jobs[app.job_id]}
              worker={applicants[app.worker_id]}
              onAccept={handleAccept}
              onReject={handleReject}
              onComplete={handleComplete}
              isDark={isDark}
            />
          ))
        ) : (
          current.data.map(app => (
            <WorkerCard
              key={app.id}
              application={app}
              job={jobs[app.job_id]}
              employer={employers[jobs[app.job_id]?.employer_id]}
              onComplete={handleComplete}
              isDark={isDark}
            />
          ))
        )}
      </div>

      {showCompletion && selectedCompletion && (
        <CompletionModal
          job={selectedCompletion.job}
          application={selectedCompletion.application}
          otherUser={selectedCompletion.otherUser}
          currentUser={user}
          onClose={() => setShowCompletion(false)}
          onComplete={() => { setShowCompletion(false); loadData(); }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
