import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Job } from "@/entities/Job";
import { Application } from "@/entities/Application";
import { User } from "@/entities/User";
import { Notification } from "@/entities/Notification";
import CompletionModal from "../components/applications/CompletionModal";
import { ArrowLeft } from "lucide-react";

const hexPattern = `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><path d="M20 2 L30 8 L30 20 L20 26 L10 20 L10 8 Z" fill="none" stroke="rgba(255,102,0,0.1)" stroke-width="0.5"/></svg>`;

export default function ScanPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [job, setJob] = useState(null);
  const [application, setApplication] = useState(null);
  const [worker, setWorker] = useState(null);
  const [dailyPin, setDailyPin] = useState("");
  const [userInput, setUserInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [view, setView] = useState("employer");
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const generateDailyPin = useCallback(() => {
    const date = new Date();
    const dateString = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const jobId = (job?.id || "").substring(0, 6);
    const combined = dateString + jobId;
    const hash = combined.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return String(hash % 1000000).padStart(6, '0');
  }, [job]);

  const calculateTimeLeft = useCallback(() => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }, []);

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
    if (job) {
      setDailyPin(generateDailyPin());
    }
  }, [job, generateDailyPin]);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000);
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  const handleDigitClick = (digit) => {
    if (userInput.length < 6) {
      setUserInput(userInput + digit);
      setInputError("");
    }
  };

  const handleDelete = () => {
    setUserInput(userInput.slice(0, -1));
    setInputError("");
  };

  const handleStartJob = async () => {
    if (userInput !== dailyPin) {
      setInputError("Código incorreto!");
      return;
    }

    try {
      await Job.update(job.id, { 
        actual_start_date: new Date().toISOString(),
        status: 'in_progress'
      });
      
      await Notification.create({
        user_id: worker.id,
        type: 'job_started',
        title: 'Trabalho iniciado!',
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#FFF' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
          <p>A carregar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#FF6600' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#1A1A1A', position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', paddingBottom: 20
    }}>
      {/* Hex pattern background */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,${hexPattern}")`,
        backgroundRepeat: 'repeat'
      }} />

      {/* Top bar */}
      <div style={{
        padding: '50px 20px 12px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid #333', position: 'relative', zIndex: 2
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ fontSize: 22, color: '#FF6600', cursor: 'pointer', background: 'none', border: 'none' }}
        >
          ←
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', color: '#FFF', fontWeight: 'bold', fontSize: 17, margin: 0 }}>
          Validar Presença
        </h1>
        <div style={{ width: 22 }} />
      </div>

      {/* View toggle */}
      <div style={{
        display: 'flex', gap: 8, margin: '16px 20px', position: 'relative', zIndex: 2
      }}>
        <button
          onClick={() => { setView("employer"); setUserInput(""); }}
          style={{
            flex: 1, padding: '8px 0', borderRadius: 20, border: 'none', fontWeight: 600,
            fontSize: 13, cursor: 'pointer',
            background: view === "employer" ? '#FF6600' : '#2A2A2A',
            color: view === "employer" ? '#FFF' : '#AAA'
          }}
        >
          👷 Empregador
        </button>
        <button
          onClick={() => { setView("professional"); setUserInput(""); }}
          style={{
            flex: 1, padding: '8px 0', borderRadius: 20, border: 'none', fontWeight: 600,
            fontSize: 13, cursor: 'pointer',
            background: view === "professional" ? '#FF6600' : '#2A2A2A',
            color: view === "professional" ? '#FFF' : '#AAA'
          }}
        >
          🔧 Profissional
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', position: 'relative', zIndex: 2 }}>
        {view === "employer" ? (
          <>
            {/* Employer view */}
            <p style={{ color: '#AAA', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
              Mostra este código ao profissional
            </p>

            {/* Hexagon with PIN */}
            <div style={{
              width: 200, height: 200, margin: '24px auto', background: '#1A1A1A',
              border: '4px solid #FF6600', borderRadius: '20px',
              boxShadow: '0 0 40px rgba(255, 102, 0, 0.5)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
              position: 'relative'
            }}>
              <p style={{
                fontSize: 42, fontWeight: 900, color: '#FF6600', margin: 0,
                letterSpacing: 6, textAlign: 'center'
              }}>
                {dailyPin}
              </p>
            </div>

            {/* Timer */}
            <p style={{ color: '#FF6600', fontWeight: 700, fontSize: 22, textAlign: 'center', margin: '20px 0' }}>
              {timeLeft}
            </p>

            {/* Instruction */}
            <p style={{ color: '#AAA', fontSize: 13, textAlign: 'center', marginTop: 12 }}>
              Mostra este código ao profissional para confirmar o início do trabalho
            </p>
          </>
        ) : (
          <>
            {/* Professional view */}
            <p style={{ color: '#AAA', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
              Introduz o código fornecido pelo empregador
            </p>

            {/* 6 input boxes */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24, marginTop: 12 }}>
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  style={{
                    width: 44, height: 52, background: '#2A2A2A', borderRadius: 10,
                    border: userInput[idx] ? '2px solid #FF6600' : '2px solid #333',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, fontWeight: 700, color: '#FFF'
                  }}
                >
                  {userInput[idx] || ''}
                </div>
              ))}
            </div>

            {/* Error message */}
            {inputError && (
              <p style={{ color: '#FF6600', fontSize: 12, textAlign: 'center', marginBottom: 16 }}>
                {inputError}
              </p>
            )}

            {/* Numeric keyboard */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, margin: '20px 0', width: '100%', maxWidth: 300 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleDigitClick(String(digit))}
                  style={{
                    background: '#2A2A2A', borderRadius: 12, padding: '14px 0', fontSize: 20,
                    fontWeight: 700, color: '#FFF', border: 'none', cursor: 'pointer'
                  }}
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={() => handleDigitClick('0')}
                style={{
                  background: '#2A2A2A', borderRadius: 12, padding: '14px 0', fontSize: 20,
                  fontWeight: 700, color: '#FFF', border: 'none', cursor: 'pointer',
                  gridColumn: '2'
                }}
              >
                0
              </button>
              <button
                onClick={handleDelete}
                style={{
                  background: '#2A2A2A', borderRadius: 12, padding: '14px 0', fontSize: 20,
                  fontWeight: 700, color: '#FF6600', border: 'none', cursor: 'pointer'
                }}
              >
                ⌫
              </button>
            </div>
          </>
        )}
      </div>

      {/* Bottom button */}
      <div style={{ padding: '0 20px 32px', position: 'relative', zIndex: 2 }}>
        <button
          onClick={view === "employer" ? handleStartJob : handleStartJob}
          style={{
            width: '100%', padding: 16, background: '#FF6600', borderRadius: 14,
            border: 'none', color: '#FFF', fontWeight: 700, fontSize: 16,
            cursor: userInput.length === 6 || view === "employer" ? 'pointer' : 'not-allowed',
            opacity: userInput.length === 6 || view === "employer" ? 1 : 0.5
          }}
        >
          Confirmar e Iniciar ✓
        </button>
      </div>

      {showCompletionModal && (
        <CompletionModal
          job={job}
          application={application}
          otherUser={worker}
          currentUser={currentUser}
          onClose={() => setShowCompletionModal(false)}
          onComplete={() => {
            setShowCompletionModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}