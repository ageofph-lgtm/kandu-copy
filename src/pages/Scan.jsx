import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Job } from "@/entities/Job";
import { Application } from "@/entities/Application";
import { User } from "@/entities/User";
import { Notification } from "@/entities/Notification";
import CompletionModal from "../components/applications/CompletionModal";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default function ScanPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [job, setJob] = useState(null);
  const [application, setApplication] = useState(null);
  const [worker, setWorker] = useState(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const [activeView, setActiveView] = useState("employer");
  const [pinInput, setPinInput] = useState("");
  const [countdown, setCountdown] = useState(30);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(location.search);
      const jobId = params.get("jobId");
      const applicationId = params.get("applicationId");

      if (!jobId || !applicationId) {
        throw new Error("Informações inválidas no QR Code.");
      }

      const user = await User.me();
      setCurrentUser(user);

      const [jobData] = await Job.filter({ id: jobId });
      if (!jobData) throw new Error("Obra não encontrada.");

      const [appData] = await Application.filter({ id: applicationId });
      if (!appData) throw new Error("Candidatura não encontrada.");

      if (jobData.employer_id !== user.id) {
        throw new Error("Apenas o empregador desta obra pode aceder a esta página.");
      }

      setJob(jobData);
      setApplication(appData);

      const [workerData] = await User.filter({ id: appData.worker_id });
      setWorker(workerData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [location.search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeView !== "employer") return;
    setCountdown(30);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeView]);

  const dailyPin = job
    ? String(((job.id?.charCodeAt(0) || 1) * 137 + new Date().getDate() * 31) % 900000 + 100000)
    : "------";

  const handleKey = (k) => {
    if (k === "del") { setPinInput(p => p.slice(0, -1)); return; }
    if (pinInput.length < 6) setPinInput(p => p + k);
  };

  const handleStartJob = async () => {
    try {
      await Job.update(job.id, {
        actual_start_date: new Date().toISOString(),
        status: "in_progress"
      });
      await Notification.create({
        user_id: worker.id,
        type: "job_started",
        title: "Trabalho iniciado!",
        message: `O trabalho "${job.title}" foi oficialmente iniciado.`,
        related_id: job.id
      });
      alert("Trabalho iniciado com sucesso!");
      await loadData();
    } catch (e) {
      console.error("Erro ao iniciar trabalho:", e);
      alert("Ocorreu um erro ao iniciar o trabalho.");
    }
  };

  const handleCompleteJob = () => {
    setShowCompletionModal(true);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <div style={{ width: 40, height: 40, border: "3px solid #FF6600", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#AAAAAA", fontSize: 14 }}>A verificar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, padding: 20 }}>
        <span style={{ fontSize: 40 }}>⚠️</span>
        <p style={{ color: "#EF4444", textAlign: "center", fontWeight: 600 }}>{error}</p>
        <button onClick={() => navigate(-1)} style={{ background: "#FF6600", color: "#FFF", border: "none", borderRadius: 12, padding: "12px 24px", fontWeight: 700, cursor: "pointer" }}>Voltar</button>
      </div>
    );
  }

  return (
    <div style={{ background: "#1A1A1A", minHeight: "100vh", display: "flex", flexDirection: "column", backgroundImage: "radial-gradient(circle, #FF660008 1px, transparent 1px)", backgroundSize: "28px 28px" }}>

      {/* Top Bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "50px 20px 16px", gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#FF6600", fontSize: 22, fontWeight: 700, lineHeight: 1 }}>←</button>
        <span style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 18, color: "#FFF" }}>Validar Presença</span>
        <div style={{ width: 22 }} />
      </div>

      {/* Toggle */}
      <div style={{ display: "flex", gap: 8, margin: "0 20px 24px" }}>
        <button onClick={() => { setActiveView("employer"); setPinInput(""); }} style={{ flex: 1, padding: "10px 0", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: activeView === "employer" ? "#FF6600" : "#2A2A2A", color: activeView === "employer" ? "#FFF" : "#AAAAAA" }}>👷 Empregador</button>
        <button onClick={() => { setActiveView("professional"); setPinInput(""); }} style={{ flex: 1, padding: "10px 0", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: activeView === "professional" ? "#FF6600" : "#2A2A2A", color: activeView === "professional" ? "#FFF" : "#AAAAAA" }}>🔧 Profissional</button>
      </div>

      {activeView === "employer" ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 20px", flex: 1 }}>
          <p style={{ color: "#AAAAAA", fontSize: 14, marginBottom: 24, textAlign: "center" }}>Mostra este código ao profissional</p>
          <div style={{ width: 200, height: 200, clipPath: "polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)", background: "#1A1A1A", border: "4px solid #FF6600", boxShadow: "0 0 40px #FF660088", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 42, fontWeight: 900, color: "#FF6600", letterSpacing: 6 }}>{dailyPin}</span>
          </div>
          <p style={{ color: "#FF6600", fontWeight: 700, fontSize: 22, textAlign: "center", marginTop: 24 }}>⏱ {countdown}s</p>
          <p style={{ color: "#AAAAAA", fontSize: 13, marginTop: 8 }}>{job?.title}</p>
          {job?.actual_start_date && job?.status !== "completed" && (
            <button onClick={handleCompleteJob} style={{ marginTop: 24, background: "#FF6600", color: "#FFF", border: "none", borderRadius: 14, padding: "14px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              🏆 Finalizar Trabalho
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", padding: "0 20px", flex: 1 }}>
          <p style={{ color: "#AAAAAA", fontSize: 14, textAlign: "center", marginBottom: 20 }}>Introduz o código fornecido pelo empregador</p>

          {/* PIN Boxes */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ width: 44, height: 52, background: "#2A2A2A", borderRadius: 10, border: i === pinInput.length ? "2px solid #FF6600" : "2px solid #333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#FFF" }}>
                {pinInput[i] || ""}
              </div>
            ))}
          </div>

          {/* Teclado */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, margin: "0 0 20px" }}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((k, i) =>
              k === "" ? <div key={i} /> : (
                <button key={i} onClick={() => handleKey(k)} style={{ background: "#2A2A2A", borderRadius: 12, padding: "14px 0", fontSize: k === "del" ? 18 : 20, fontWeight: 700, color: "#FFF", border: "none", cursor: "pointer" }}>
                  {k === "del" ? "⌫" : k}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Botão Confirmar */}
      {activeView === "professional" && (
        <button
          onClick={handleStartJob}
          disabled={pinInput.length < 6}
          style={{ background: pinInput.length === 6 ? "#FF6600" : "#333", color: "#FFF", border: "none", borderRadius: 14, padding: 16, fontWeight: 700, fontSize: 16, margin: "0 20px 32px", cursor: pinInput.length === 6 ? "pointer" : "default", transition: "background 0.2s" }}>
          Confirmar e Iniciar ✓
        </button>
      )}

      {showCompletionModal && (
        <CompletionModal
          job={job}
          application={application}
          otherUser={worker}
          currentUser={currentUser}
          onClose={() => setShowCompletionModal(false)}
          onComplete={() => { setShowCompletionModal(false); loadData(); }}
        />
      )}
    </div>
  );
}