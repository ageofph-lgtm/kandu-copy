import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/ThemeContext";
import LoadingScreen from "@/components/LoadingScreen";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Application } from "@/entities/Application";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User as UserIcon, QrCode, Navigation, MessageCircle, Trophy, MapPin, Clock, Plus, ChevronRight } from "lucide-react";
import DailyPinDisplay from "@/components/jobs/DailyPinDisplay";
import PinVerificationModal from "@/components/jobs/PinVerificationModal";
import CompletionModal from "@/components/applications/CompletionModal";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

/* ── Cartão de obra ── */
function JobItem({ job, application, userType, navigate, currentUser, isDark, onReload }) {
  const surface = isDark ? "#1C1B22" : "#FFFFFF";
  const text = isDark ? "#FFFFFF" : "#111016";
  const subtext = isDark ? "#AAAAAA" : "#666666";
  const border = isDark ? "#333" : "#E5E5E5";
  const [otherUser, setOtherUser] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    const otherId = userType === "worker" ? job.employer_id : job.worker_id;
    if (otherId) {
      User.filter({ id: otherId }).then(res => { if (res.length > 0) setOtherUser(res[0]); }).catch(() => {});
    }
  }, [job, userType]);

  const STATUS_MAP = {
    pending_employer:      { bg: "#FFF7E6", color: "#D97706", label: "Aguarda publicação" },
    open:                  { bg: "#FFF7E6", color: "#D97706", label: "Publicada" },
    in_progress:           { bg: "#EFF6FF", color: "#3B82F6", label: "Em Curso" },
    completed_by_employer: { bg: "#F5F3FF", color: "#7C3AED", label: "Aguarda Avaliação" },
    completed:             { bg: "#F0FDF4", color: "#16A34A", label: "Concluída" },
    cancelled:             { bg: "#F5F5F5", color: "#888",    label: "Cancelada" },
  };
  const s = STATUS_MAP[job.status] || { bg: "#F5F5F5", color: "#888", label: job.status };

  const actionArea = () => {
    if (userType === "worker") {
      if (job.status === "open" && application?.status === "pending") {
        return (
          <div style={{ marginTop: 10, background: "#FFF7E6", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#92400E" }}>
            ⏳ Candidatura pendente — aguarda resposta do empregador
          </div>
        );
      }
      if (job.status === "in_progress") {
        return (
          <button
            onClick={() => setShowPinModal(true)}
            style={{ marginTop: 10, width: "100%", background: "#FF6600", color: "#FFF", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
          >
            📱 Confirmar Presença / Finalizar
          </button>
        );
      }
      if (["open", "in_progress"].includes(job.status)) {
        return (
          <button
            onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(job.location)}`, "_blank")}
            style={{ marginTop: 10, width: "100%", background: "#EFF6FF", color: "#3B82F6", border: "1px solid #BFDBFE", borderRadius: 12, padding: "10px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            🗺️ Navegar ao Local
          </button>
        );
      }
    }

    if (userType === "employer") {
      if (job.status === "pending_employer") {
        return (
          <button
            onClick={async () => {
              if (!window.confirm("Publicar esta obra? Ficará visível a todos os profissionais.")) return;
              await Job.update(job.id, { status: "open" });
              if (onReload) onReload();
            }}
            style={{ marginTop: 10, width: "100%", background: "#FF6600", color: "#FFF", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
          >
            🚀 Publicar Obra
          </button>
        );
      }
      if (job.status === "open") {
        return (
          <button
            onClick={() => navigate(createPageUrl("Applications"))}
            style={{ marginTop: 10, width: "100%", background: "#F0FFF4", color: "#16A34A", border: "1px solid #86EFAC", borderRadius: 12, padding: "10px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            👥 Ver Candidaturas
          </button>
        );
      }
      if (job.status === "in_progress") {
        return (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            <DailyPinDisplay jobId={job.id} />
            <button
              onClick={() => setShowCompletionModal(true)}
              style={{ width: "100%", background: "#FEF3C7", color: "#92400E", border: "1px solid #FCD34D", borderRadius: 12, padding: "10px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
            >
              🏆 Finalizar e Avaliar
            </button>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <>
      {showPinModal && (
        <PinVerificationModal
          jobId={job.id} jobTitle={job.title}
          onVerified={() => { setShowPinModal(false); setShowCompletionModal(true); }}
          onCancel={() => setShowPinModal(false)}
        />
      )}
      {showCompletionModal && otherUser && currentUser && (
        <CompletionModal
          job={job} application={application} otherUser={otherUser} currentUser={currentUser}
          onClose={() => setShowCompletionModal(false)}
          onComplete={() => { setShowCompletionModal(false); if (onReload) onReload(); }}
        />
      )}
      <div style={{ background: surface, borderRadius: 16, padding: 16, borderLeft: "4px solid #FF6600", border: `1px solid ${border}`, borderLeftWidth: 4, borderLeftColor: "#FF6600" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
          <h3 style={{ fontWeight: 700, color: text, fontSize: 15, flex: 1, margin: 0, lineHeight: 1.3 }}>{job.title}</h3>
          <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, flexShrink: 0, whiteSpace: "nowrap" }}>
            {s.label}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <p style={{ fontSize: 12, color: subtext, display: "flex", alignItems: "center", gap: 4, margin: 0 }}>
            <MapPin size={11} /> {job.location}
          </p>
          <p style={{ fontSize: 16, fontWeight: 800, color: "#FF6600", margin: 0 }}>
            €{job.price}{job.price_type === "hourly" && <span style={{ fontSize: 11, fontWeight: 400 }}>/h</span>}
          </p>
        </div>
        {otherUser && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 8, borderTop: `1px solid ${border}`, marginTop: 6 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#FF6600", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {otherUser.full_name?.charAt(0) || "?"}
            </div>
            <span style={{ fontSize: 12, color: subtext }}>
              {userType === "worker" ? "Empregador" : "Profissional"}:{" "}
              <strong style={{ color: text }}>{otherUser.full_name}</strong>
            </span>
          </div>
        )}
        {actionArea()}
      </div>
    </>
  );
}

function EmptyState({ emoji, title, description, onCta, ctaLabel, isDark }) {
  const surface = isDark ? "#1C1B22" : "#F8F8F8";
  const subtext = isDark ? "#AAAAAA" : "#888";
  return (
    <div style={{ background: surface, borderRadius: 16, padding: "36px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 44, marginBottom: 10 }}>{emoji}</div>
      <h3 style={{ color: subtext, fontWeight: 700, fontSize: 15, margin: "0 0 6px" }}>{title}</h3>
      {description && <p style={{ color: subtext, fontSize: 13, margin: "0 0 16px" }}>{description}</p>}
      {onCta && ctaLabel && (
        <button onClick={onCta} style={{ background: "#FF6600", border: "none", borderRadius: 12, padding: "12px 24px", color: "#FFF", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

export default function MyJobs() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const bg = isDark ? "#111016" : "#F5F5F5";
  const surface = isDark ? "#1C1B22" : "#FFFFFF";
  const text = isDark ? "#FFFFFF" : "#111016";
  const subtext = isDark ? "#AAAAAA" : "#666666";

  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      let jobList = [];
      let appList = [];

      if (currentUser.user_type === "worker") {
        // Worker: obras onde foi aceite (worker_id = eu) + aplicações pendentes
        const myApps = await Application.filter({ worker_id: currentUser.id });
        appList = myApps;
        // Buscar obras referenciadas nas aplicações + obras onde sou worker
        const jobIdsFromApps = [...new Set(myApps.map(a => a.job_id).filter(Boolean))];
        const jobsAsWorker = await Job.filter({ worker_id: currentUser.id });
        // Fetch jobs from applications
        const allJobsRaw = await Job.list();
        const appsJobsMap = {};
        allJobsRaw.forEach(j => { appsJobsMap[j.id] = j; });
        const appJobs = jobIdsFromApps.map(id => appsJobsMap[id]).filter(Boolean);
        // Merge unique
        const merged = [...jobsAsWorker];
        appJobs.forEach(j => { if (!merged.find(x => x.id === j.id)) merged.push(j); });
        jobList = merged;
      } else if (currentUser.user_type === "employer") {
        jobList = await Job.filter({ employer_id: currentUser.id });
        const ids = jobList.map(j => j.id);
        if (ids.length > 0) {
          const allApps = await Application.list();
          appList = allApps.filter(a => ids.includes(a.job_id));
        }
      } else {
        jobList = await Job.list();
        appList = await Application.list();
      }

      setJobs(jobList);
      setApplications(appList);
    } catch (err) {
      console.error("Error loading jobs:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Filtros por tab ──
  // PENDENTES: obras aguardando aceitação / publicação
  const pendingJobs = (() => {
    if (!user) return [];
    if (user.user_type === "worker") {
      // obras onde o worker tem candidatura pending e a obra ainda está open
      const pendingAppJobIds = applications
        .filter(a => a.status === "pending")
        .map(a => a.job_id);
      return jobs.filter(j => pendingAppJobIds.includes(j.id) && j.status === "open");
    }
    if (user.user_type === "employer") {
      // obras que o empregador criou mas ainda não publicou (pending_employer) OU abertas sem candidato aceite
      return jobs.filter(j => j.status === "pending_employer" || (j.status === "open" && !j.worker_id));
    }
    return jobs.filter(j => j.status === "open");
  })();

  // ATIVAS: obras em curso
  const activeJobs = (() => {
    if (!user) return [];
    if (user.user_type === "worker") return jobs.filter(j => j.status === "in_progress" && j.worker_id === user.id);
    if (user.user_type === "employer") return jobs.filter(j => ["in_progress"].includes(j.status) && j.employer_id === user.id);
    return jobs.filter(j => j.status === "in_progress");
  })();

  // HISTÓRIO
  const historyJobs = (() => {
    if (!user) return [];
    const done = ["completed", "completed_by_employer", "cancelled"];
    if (user.user_type === "worker") return jobs.filter(j => done.includes(j.status) && j.worker_id === user.id);
    if (user.user_type === "employer") return jobs.filter(j => done.includes(j.status) && j.employer_id === user.id);
    return jobs.filter(j => done.includes(j.status));
  })();

  if (loading) return <LoadingScreen label="A carregar..." />;

  const isWorker = user?.user_type === "worker";
  const isEmployer = user?.user_type === "employer";

  return (
    <div style={{ background: bg, minHeight: "100vh", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: surface, borderBottom: `1px solid ${isDark ? "#333" : "#E5E5E5"}`, padding: "16px 20px 14px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <img src={isDark ? "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/90321a683_Gemini_Generated_Image_k4rh2gk4rh2gk4rh.png" : "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/002158942_Gemini_Generated_Image_5.png"} alt="KANDU" style={{ height: 24, objectFit: "contain" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: subtext }}>Gestão</p>
          <h1 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: text }}>Trabalho</h1>
        </div>
        {isEmployer && (
          <button
            onClick={() => navigate(createPageUrl("NewJob"))}
            style={{ background: "#FF6600", border: "none", borderRadius: 50, padding: "10px 16px", color: "#FFF", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={15} /> Publicar
          </button>
        )}
        </div>
      </div>

      <div style={{ padding: "16px 20px" }}>
        <Tabs defaultValue="pending">
          <TabsList style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: isDark ? "#1C1B22" : "#EBEBEB", borderRadius: 14, padding: 4, height: "auto" }} className="w-full">
            {[
              { value: "pending", label: isWorker ? "Pendentes" : "Publicadas", count: pendingJobs.length },
              { value: "active",  label: "Em Curso",   count: activeJobs.length },
              { value: "history", label: "Histórico",  count: historyJobs.length },
            ].map(tab => (
              <TabsTrigger
                key={tab.value} value={tab.value}
                style={{ borderRadius: 10, display: "flex", flexDirection: "column", padding: "8px 4px", fontSize: 11, gap: 2 }}
                className="data-[state=active]:bg-[#FF6600] data-[state=active]:text-white text-[#AAAAAA]"
              >
                <span>{tab.label}</span>
                <span style={{ fontWeight: 800, fontSize: 16 }}>{tab.count}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* TAB: PENDENTES */}
          <TabsContent value="pending" style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {isWorker && pendingJobs.length === 0 && (
              <EmptyState emoji="🔍" isDark={isDark} title="Nenhuma candidatura pendente"
                description="Candidata-te a obras para aparecerem aqui."
                onCta={() => navigate(createPageUrl("Home"))} ctaLabel="🗺️ Explorar Obras" />
            )}
            {isEmployer && pendingJobs.length === 0 && (
              <EmptyState emoji="📋" isDark={isDark} title="Nenhuma obra pendente"
                description="Publica uma obra e ela ficará aqui até ser aceite por um profissional."
                onCta={() => navigate(createPageUrl("NewJob"))} ctaLabel="+ Publicar Obra" />
            )}
            {pendingJobs.map(job => (
              <JobItem key={job.id} job={job}
                application={applications.find(a => a.job_id === job.id && (isWorker ? a.worker_id === user.id : true))}
                userType={user.user_type} navigate={navigate} currentUser={user} isDark={isDark} onReload={loadData}
              />
            ))}
            {/* Info contextual para o profissional */}
            {isWorker && pendingJobs.length > 0 && (
              <div style={{ background: isDark ? "#1C1B22" : "#FFF7E6", borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#92400E" }}>
                ⏳ As tuas candidaturas ficam pendentes até o empregador aceitar ou recusar.
              </div>
            )}
          </TabsContent>

          {/* TAB: ATIVAS */}
          <TabsContent value="active" style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {activeJobs.length === 0 ? (
              <EmptyState emoji="🔨" isDark={isDark} title="Nenhum trabalho em curso"
                description="Os trabalhos aceites e em andamento aparecem aqui." />
            ) : activeJobs.map(job => (
              <JobItem key={job.id} job={job}
                application={applications.find(a => a.job_id === job.id)}
                userType={user.user_type} navigate={navigate} currentUser={user} isDark={isDark} onReload={loadData}
              />
            ))}
          </TabsContent>

          {/* TAB: HISTÓRICO */}
          <TabsContent value="history" style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {historyJobs.length === 0 ? (
              <EmptyState emoji="🏆" isDark={isDark} title="Histórico vazio"
                description="Os trabalhos concluídos e cancelados aparecem aqui." />
            ) : historyJobs.map(job => (
              <JobItem key={job.id} job={job}
                application={applications.find(a => a.job_id === job.id)}
                userType={user.user_type} navigate={navigate} currentUser={user} isDark={isDark} onReload={loadData}
              />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
