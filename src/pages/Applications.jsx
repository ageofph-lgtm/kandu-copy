import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { Application } from "@/entities/Application";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Notification } from "@/entities/Notification";
import { Check, X, MapPin, Trophy, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CompletionModal from "../components/applications/CompletionModal";

// ── helpers ──────────────────────────────────────────────────────────────────
function statusPill(appStatus, jobStatus) {
  if (jobStatus === "completed")             return { label: "Concluída",         color: "#22C55E", bg: "#22C55E22" };
  if (jobStatus === "completed_by_employer") return { label: "Aguarda avaliação", color: "#A855F7", bg: "#A855F722" };
  if (jobStatus === "in_progress")           return { label: "Em curso",          color: "#3B82F6", bg: "#3B82F622" };
  if (appStatus === "pending")               return { label: "Pendente",          color: "#F59E0B", bg: "#F59E0B22" };
  if (appStatus === "accepted")              return { label: "Aceite",            color: "#22C55E", bg: "#22C55E22" };
  if (appStatus === "rejected")              return { label: "Recusada",          color: "#EF4444", bg: "#EF444422" };
  return                                            { label: appStatus,           color: "#888",    bg: "#88888822" };
}

function getDailyPin(job) {
  if (!job) return "------";
  return String(((job.id?.charCodeAt(0) || 1) * 137 + new Date().getDate() * 31) % 900000 + 100000);
}

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(active) {
  const [sec, setSec] = useState(30);
  useEffect(() => {
    if (!active) { setSec(30); return; }
    const t = setInterval(() => setSec(p => p <= 1 ? (clearInterval(t), 0) : p - 1), 1000);
    return () => clearInterval(t);
  }, [active]);
  return sec;
}

// ── PIN display (hexágono) ────────────────────────────────────────────────────
function PinDisplay({ pin, countdown, isDark }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 0" }}>
      <div style={{
        width: 160, height: 160,
        clipPath: "polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)",
        background: isDark ? "#0D0D0D" : "#1A1A1A",
        border: "none",
        boxShadow: "0 0 32px #FF660077",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <span style={{ fontSize: 30, fontWeight: 900, color: "#FF6600", letterSpacing: 3 }}>{pin}</span>
      </div>
      <span style={{ color: "#FF6600", fontWeight: 700, fontSize: 16 }}>⏱ {countdown}s</span>
    </div>
  );
}

// ── QR Code simples (SVG pattern) ────────────────────────────────────────────
function QrDisplay({ value, size = 160, isDark }) {
  // Usamos qrcode.react se disponível, senão fallback visual
  try {
    const QRCode = require("qrcode.react").default;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", gap: 8 }}>
        <div style={{ background: "#FFF", padding: 12, borderRadius: 12, boxShadow: "0 0 24px #FF660044" }}>
          <QRCode value={value} size={size} level="H" />
        </div>
        <span style={{ color: "#22C55E", fontWeight: 700, fontSize: 13 }}>📷 Mostra ao empregador</span>
      </div>
    );
  } catch {
    // fallback — grid visual simples
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", gap: 8 }}>
        <div style={{ width: size, height: size, background: "#FFF", borderRadius: 12, padding: 12, boxShadow: "0 0 24px #FF660044", display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 1 }}>
          {Array.from({ length: 64 }).map((_, i) => {
            const on = (i % 3 === 0 || i % 7 === 1 || (i > 8 && i < 20) || (i > 44 && i < 56));
            return <div key={i} style={{ background: on ? "#000" : "#FFF", borderRadius: 1 }} />;
          })}
        </div>
        <span style={{ color: "#22C55E", fontWeight: 700, fontSize: 13 }}>📷 Mostra ao empregador</span>
        <span style={{ color: "#888", fontSize: 11 }}>Código: {value.slice(-6)}</span>
      </div>
    );
  }
}

// ── PIN Keypad ────────────────────────────────────────────────────────────────
function PinKeypad({ value, onChange, isDark, surface, text }) {
  const handleKey = (k) => {
    if (k === "del") { onChange(value.slice(0, -1)); return; }
    if (value.length < 6) onChange(value + k);
  };
  return (
    <div style={{ padding: "12px 0" }}>
      {/* Boxes */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{
            width: 40, height: 48, background: surface, borderRadius: 10,
            border: i === value.length ? "2px solid #FF6600" : `2px solid ${isDark?"#333":"#CCC"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 700, color: text
          }}>
            {value[i] || ""}
          </div>
        ))}
      </div>
      {/* Teclado */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {["1","2","3","4","5","6","7","8","9","","0","del"].map((k, i) =>
          k === "" ? <div key={i} /> : (
            <button key={i} onClick={() => handleKey(k)}
              style={{ background: surface, borderRadius: 10, padding: "12px 0", fontSize: k === "del" ? 16 : 18, fontWeight: 700, color: text, border: "none", cursor: "pointer" }}>
              {k === "del" ? "⌫" : k}
            </button>
          )
        )}
      </div>
    </div>
  );
}

// ── Employer Active Card ──────────────────────────────────────────────────────
function EmployerActiveCard({ application, job, worker, onComplete, isDark, surface, text, subtext, border }) {
  const [expanded, setExpanded]   = useState(false);
  const [showPin, setShowPin]     = useState(false);
  const [pinSent, setPinSent]     = useState(false);
  const [showQrReader, setShowQrReader] = useState(false);
  const [qrInput, setQrInput]     = useState("");
  const pinCountdown = useCountdown(showPin);
  const pin = getDailyPin(job);
  const st = statusPill(application.status, job?.status);

  const handleSendPin = async () => {
    setShowPin(true);
    setPinSent(true);
    // Notificar o worker
    try {
      await Notification.create({
        user_id: application.worker_id,
        type: "pin_received",
        title: "📍 PIN de presença recebido!",
        message: `O empregador enviou o PIN para a obra "${job?.title}". Abre o app para confirmar a tua presença.`,
        related_id: job?.id,
        action_url: createPageUrl("Applications"),
        is_read: false
      });
      // Push notification browser
      if ("Notification" in window && window.Notification.permission === "granted") {
        new window.Notification("KANDU — PIN Recebido! 📍", {
          body: `PIN para "${job?.title}" disponível. Confirma a tua presença.`,
          icon: "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png",
          tag: "kandu-pin"
        });
      }
    } catch(_) {}
  };

  const handleReadQr = async () => {
    // Validar o código manualmente (simulação — em produção usaria câmera)
    const expected = `KANDU-COMPLETE-${job?.id}`;
    if (qrInput.trim() === expected || qrInput.trim().endsWith(job?.id?.slice(-6))) {
      onComplete(application, job, worker);
    } else {
      alert("Código QR inválido. Pede ao profissional para mostrar o QR gerado no app.");
    }
  };

  return (
    <div style={{ background: surface, borderRadius: 16, border: `1px solid #FF660044`, borderLeft: "4px solid #FF6600", marginBottom: 12, overflow: "hidden" }}>
      {/* Header sempre visível */}
      <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setExpanded(e => !e)}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#FF660033", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, color: "#FF6600", flexShrink: 0 }}>
          {worker?.full_name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: text, margin: 0 }}>{worker?.full_name || "Profissional"}</p>
          <p style={{ fontSize: 13, color: subtext, margin: "2px 0 0" }}>{job?.title}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ background: st.bg, color: st.color, borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>{st.label}</span>
          {expanded ? <ChevronUp size={16} color={subtext} /> : <ChevronDown size={16} color={subtext} />}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${border}` }}>
          {/* Info */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
            <div>
              <p style={{ color: subtext, fontSize: 11, margin: 0 }}>Valor</p>
              <p style={{ color: "#FF6600", fontWeight: 800, fontSize: 18, margin: 0 }}>€{application.proposed_price || job?.price}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: subtext, fontSize: 12 }}>
              <MapPin size={12} />{job?.location}
            </div>
          </div>

          {/* Secção PIN */}
          <div style={{ background: isDark ? "#0D0D0D" : "#F0F0F0", borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <p style={{ color: text, fontWeight: 700, fontSize: 14, margin: "0 0 8px" }}>📍 Presença Diária</p>
            {!showPin ? (
              <button onClick={handleSendPin}
                style={{ width: "100%", background: "#3B82F6", color: "#FFF", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Gerar e Enviar PIN ao Profissional
              </button>
            ) : (
              <>
                <PinDisplay pin={pin} countdown={pinCountdown} isDark={isDark} />
                <button onClick={() => { setShowPin(false); setPinSent(false); }}
                  style={{ width: "100%", marginTop: 4, background: "transparent", color: subtext, border: `1px solid ${border}`, borderRadius: 10, padding: "8px", fontSize: 13, cursor: "pointer" }}>
                  Fechar PIN
                </button>
              </>
            )}
          </div>

          {/* Secção Finalização QR */}
          {job?.status === "in_progress" && (
            <div style={{ background: isDark ? "#0D0D0D" : "#F0F0F0", borderRadius: 12, padding: 16 }}>
              <p style={{ color: text, fontWeight: 700, fontSize: 14, margin: "0 0 8px" }}>🏁 Finalizar Obra</p>
              {!showQrReader ? (
                <button onClick={() => setShowQrReader(true)}
                  style={{ width: "100%", background: "#22C55E22", color: "#22C55E", border: "1px solid #22C55E44", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  📷 Ler QR do Profissional
                </button>
              ) : (
                <div>
                  <p style={{ color: subtext, fontSize: 13, marginBottom: 8 }}>Insere o código que o profissional apresenta:</p>
                  <input
                    value={qrInput}
                    onChange={e => setQrInput(e.target.value)}
                    placeholder={`KANDU-COMPLETE-...`}
                    style={{ width: "100%", background: isDark ? "#1A1A1A" : "#FFF", border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px", color: text, fontSize: 14, boxSizing: "border-box", marginBottom: 8 }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setShowQrReader(false)}
                      style={{ flex: 1, background: "transparent", color: subtext, border: `1px solid ${border}`, borderRadius: 10, padding: "10px", fontSize: 13, cursor: "pointer" }}>
                      Cancelar
                    </button>
                    <button onClick={handleReadQr}
                      style={{ flex: 2, background: "#22C55E", color: "#FFF", border: "none", borderRadius: 10, padding: "10px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                      Confirmar e Finalizar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Worker Active Card ────────────────────────────────────────────────────────
function WorkerActiveCard({ application, job, employer, onComplete, isDark, surface, text, subtext, border }) {
  const [expanded, setExpanded]   = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [pinInput, setPinInput]   = useState("");
  const [pinOk, setPinOk]         = useState(false);
  const [showQr, setShowQr]       = useState(false);
  const st = statusPill(application.status, job?.status);
  const expectedPin = getDailyPin(job);

  const handleConfirmPin = async () => {
    if (pinInput === expectedPin) {
      setPinOk(true);
      setShowKeypad(false);
      try {
        await Job.update(job.id, { actual_start_date: new Date().toISOString() });
        await Notification.create({
          user_id: job?.employer_id,
          type: "pin_confirmed",
          title: "✅ PIN confirmado!",
          message: `${application.worker_name || "O profissional"} confirmou presença na obra "${job?.title}".`,
          related_id: job?.id,
          action_url: createPageUrl("Applications"),
          is_read: false
        });
      } catch(_) {}
    } else {
      alert("PIN incorreto. Confirma com o empregador.");
      setPinInput("");
    }
  };

  const qrValue = `KANDU-COMPLETE-${job?.id}`;
  const needsWorkerEval = application.status === "accepted" && job?.status === "completed_by_employer";

  return (
    <div style={{ background: surface, borderRadius: 16, border: `1px solid ${border}`, borderLeft: `4px solid ${st.color}`, marginBottom: 12, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setExpanded(e => !e)}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: text, margin: 0 }}>{job?.title}</p>
          <p style={{ fontSize: 12, color: subtext, margin: "2px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin size={11} />{job?.location}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ background: st.bg, color: st.color, borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>{st.label}</span>
          {expanded ? <ChevronUp size={16} color={subtext} /> : <ChevronDown size={16} color={subtext} />}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
            <div>
              <p style={{ color: subtext, fontSize: 11, margin: 0 }}>Valor</p>
              <p style={{ color: "#FF6600", fontWeight: 800, fontSize: 18, margin: 0 }}>€{application.proposed_price || job?.price}</p>
            </div>
            <div style={{ color: subtext, fontSize: 12 }}>
              {format(new Date(application.created_date), "dd MMM", { locale: pt })}
            </div>
          </div>

          {/* PIN confirmar presença */}
          {!pinOk && !needsWorkerEval && (
            <div style={{ background: isDark ? "#0D0D0D" : "#F0F0F0", borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <p style={{ color: text, fontWeight: 700, fontSize: 14, margin: "0 0 8px" }}>📍 Confirmar Presença</p>
              {!showKeypad ? (
                <button onClick={() => setShowKeypad(true)}
                  style={{ width: "100%", background: "#3B82F622", color: "#3B82F6", border: "1px solid #3B82F644", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Inserir PIN do Empregador
                </button>
              ) : (
                <>
                  <PinKeypad value={pinInput} onChange={setPinInput} isDark={isDark} surface={isDark?"#1A1A1A":"#FFF"} text={text} />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={() => { setShowKeypad(false); setPinInput(""); }}
                      style={{ flex: 1, background: "transparent", color: subtext, border: `1px solid ${border}`, borderRadius: 10, padding: "10px", fontSize: 13, cursor: "pointer" }}>
                      Cancelar
                    </button>
                    <button onClick={handleConfirmPin} disabled={pinInput.length < 6}
                      style={{ flex: 2, background: pinInput.length === 6 ? "#FF6600" : "#333", color: "#FFF", border: "none", borderRadius: 10, padding: "10px", fontWeight: 700, fontSize: 14, cursor: pinInput.length === 6 ? "pointer" : "default" }}>
                      Confirmar ✓
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {pinOk && (
            <div style={{ background: "#22C55E22", borderRadius: 12, padding: 12, marginBottom: 12, textAlign: "center" }}>
              <p style={{ color: "#22C55E", fontWeight: 700, margin: 0 }}>✅ Presença confirmada!</p>
            </div>
          )}

          {/* QR para finalizar */}
          {!needsWorkerEval && (
            <div style={{ background: isDark ? "#0D0D0D" : "#F0F0F0", borderRadius: 12, padding: 16 }}>
              <p style={{ color: text, fontWeight: 700, fontSize: 14, margin: "0 0 8px" }}>🏁 Finalizar Obra</p>
              {!showQr ? (
                <button onClick={() => setShowQr(true)}
                  style={{ width: "100%", background: "#22C55E22", color: "#22C55E", border: "1px solid #22C55E44", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Gerar QR Code de Conclusão
                </button>
              ) : (
                <>
                  <QrDisplay value={qrValue} isDark={isDark} />
                  <button onClick={() => setShowQr(false)}
                    style={{ width: "100%", marginTop: 4, background: "transparent", color: subtext, border: `1px solid ${border}`, borderRadius: 10, padding: "8px", fontSize: 13, cursor: "pointer" }}>
                    Fechar QR
                  </button>
                </>
              )}
            </div>
          )}

          {/* Worker avaliação pendente */}
          {needsWorkerEval && (
            <button onClick={() => onComplete(application, job, employer)}
              style={{ width: "100%", background: "#A855F722", color: "#A855F7", border: "1px solid #A855F744", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              ✍️ Avaliar Empregador
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Simple cards (pending / history) ─────────────────────────────────────────
function PendingCandidateCard({ application, job, worker, onAccept, onReject, isDark, surface, text, subtext, border }) {
  const price = application.proposed_price || job?.price;
  return (
    <div style={{ background: surface, borderRadius: 16, border: `1px solid ${border}`, borderLeft: "4px solid #F59E0B", padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#F59E0B22", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, color: "#F59E0B", flexShrink: 0 }}>
          {worker?.full_name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: text, margin: 0 }}>{worker?.full_name || "Profissional"}</p>
          <p style={{ fontSize: 13, color: subtext, margin: "2px 0 0" }}>{job?.title}</p>
          <p style={{ fontSize: 12, color: subtext, margin: "2px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin size={11} />{job?.location}
          </p>
        </div>
        <div>
          <p style={{ color: subtext, fontSize: 11, margin: 0, textAlign: "right" }}>Valor</p>
          <p style={{ color: "#FF6600", fontWeight: 800, fontSize: 18, margin: 0 }}>€{price}</p>
        </div>
      </div>
      {application.message && (
        <p style={{ color: subtext, fontSize: 13, fontStyle: "italic", background: isDark?"#0D0D0D":"#F0F0F0", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
          "{application.message.slice(0,120)}{application.message.length>120?"…":""}"
        </p>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => onReject(application)}
          style={{ flex: 1, background: "#EF444422", color: "#EF4444", border: "1px solid #EF444444", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          ✕ Recusar
        </button>
        <button onClick={() => onAccept(application)}
          style={{ flex: 2, background: "#FF6600", color: "#FFF", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          ✓ Aceitar e Contratar
        </button>
      </div>
    </div>
  );
}

function WorkerPendingCard({ application, job, isDark, surface, text, subtext, border }) {
  const st = statusPill(application.status, job?.status);
  return (
    <div style={{ background: surface, borderRadius: 16, border: `1px solid ${border}`, borderLeft: `4px solid ${st.color}`, padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: text, margin: 0 }}>{job?.title}</p>
          <p style={{ fontSize: 12, color: subtext, margin: "3px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin size={11} />{job?.location}
          </p>
        </div>
        <span style={{ background: st.bg, color: st.color, borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>{st.label}</span>
      </div>
      <p style={{ color: "#FF6600", fontWeight: 800, fontSize: 16, margin: "10px 0 0" }}>€{application.proposed_price || job?.price}</p>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function Applications() {
  const { isDark } = useTheme();
  const bg      = isDark ? "#111016" : "#FFFFFF";
  const surface = isDark ? "#1C1B22" : "#F5F5F5";
  const text    = isDark ? "#FFFFFF" : "#111016";
  const subtext = isDark ? "#AAAAAA" : "#666";
  const border  = isDark ? "#2A2A2A" : "#E5E5E5";

  const [user,         setUser]         = useState(null);
  const [applications, setApplications] = useState([]);
  const [jobs,         setJobs]         = useState({});
  const [applicants,   setApplicants]   = useState({});
  const [employers,    setEmployers]    = useState({});
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState("pending");
  const [selectedJobId,setSelectedJobId]= useState("all");
  const [showCompletion, setShowCompletion] = useState(false);
  const [selectedCompletion, setSelectedCompletion] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      try {
        const unread = await Notification.filter({ user_id: currentUser.id, is_read: false });
        const toRead = unread.filter(n => ["new_application","new_proposal","job_accepted","job_rejected","job_completed","job_ready_for_review","application_rejected","pin_received","pin_confirmed"].includes(n.type));
        await Promise.all(toRead.map(n => Notification.update(n.id, { is_read: true })));
      } catch(_) {}

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

      const allJobs = await Job.list();
      const jobMap  = {};
      allJobs.forEach(j => { jobMap[j.id] = j; });
      setJobs(jobMap);

      const allUsers = await User.list();
      const userMap  = {};
      allUsers.forEach(u => { userMap[u.id] = u; });

      const wMap = {}, eMap = {};
      appsData.forEach(a => {
        if (a.worker_id && userMap[a.worker_id]) wMap[a.worker_id] = userMap[a.worker_id];
        const emp = jobMap[a.job_id]?.employer_id;
        if (emp && userMap[emp]) eMap[emp] = userMap[emp];
      });
      setApplicants(wMap);
      setEmployers(eMap);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAccept = async (app) => {
    try {
      const job = jobs[app.job_id]; if (!job) return;
      const finalPrice = app.proposed_price || job.price;
      await Application.update(app.id, { status: "accepted" });
      await Job.update(app.job_id, { status: "in_progress", worker_id: app.worker_id, price: finalPrice });
      const others = applications.filter(a => a.job_id === app.job_id && a.id !== app.id && a.status === "pending");
      await Promise.all(others.map(a => Application.update(a.id, { status: "rejected" })));
      await Notification.create({ user_id: app.worker_id, type: "job_accepted", title: "🎉 Candidatura Aceite!", message: `A tua candidatura para "${job.title}" foi aceite.`, related_id: app.job_id, action_url: createPageUrl("Applications"), is_read: false });
      await Promise.all(others.map(a => Notification.create({ user_id: a.worker_id, type: "application_rejected", title: "Candidatura não selecionada", message: `Outro profissional foi selecionado para "${job.title}".`, related_id: app.job_id, action_url: createPageUrl("Home"), is_read: false })));
      loadData();
    } catch(e) { alert("Erro ao aceitar."); }
  };

  const handleReject = async (app) => {
    if (!window.confirm("Recusar esta candidatura?")) return;
    try {
      const job = jobs[app.job_id];
      await Application.update(app.id, { status: "rejected" });
      await Notification.create({ user_id: app.worker_id, type: "job_rejected", title: "Candidatura não aceite", message: `A tua candidatura para "${job?.title}" não foi selecionada.`, related_id: app.job_id, action_url: createPageUrl("Home"), is_read: false });
      loadData();
    } catch(e) { alert("Erro ao recusar."); }
  };

  const handleComplete = (app, job, other) => {
    setSelectedCompletion({ application: app, job, otherUser: other });
    setShowCompletion(true);
  };

  const isEmployer = user?.user_type === "employer" || user?.user_type === "admin";
  const myJobs = isEmployer ? [...new Map(applications.map(a => a.job_id).filter(Boolean).map(id => [id, jobs[id]]).filter(([,j]) => j)).values()] : [];
  const filtered = selectedJobId === "all" ? applications : applications.filter(a => a.job_id === selectedJobId);

  const pendingApps = filtered.filter(a => a.status === "pending");
  const activeApps  = filtered.filter(a => a.status === "accepted" && ["in_progress","completed_by_employer"].includes(jobs[a.job_id]?.status));
  const historyApps = filtered.filter(a => a.status === "rejected" || jobs[a.job_id]?.status === "completed");

  const TABS = [
    { id: "pending", label: "Pendentes", icon: "⏳", count: pendingApps.length, data: pendingApps },
    { id: "active",  label: "Ativas",    icon: "🔨", count: activeApps.length,  data: activeApps  },
    { id: "history", label: "Histórico", icon: "📋", count: historyApps.length, data: historyApps },
  ];
  const current = TABS.find(t => t.id === activeTab);

  if (loading) return (
    <div style={{ minHeight:"100vh", background:bg, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
      <div style={{ width:40, height:40, border:"3px solid #FF6600", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <p style={{ color:subtext, fontSize:14 }}>A carregar…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ background: bg, minHeight:"100vh", paddingBottom:90 }}>
      {/* Header */}
      <div style={{ padding:"50px 20px 0" }}>
        <h1 style={{ fontWeight:800, fontSize:28, color:text, margin:"0 0 4px" }}>
          {isEmployer ? "Candidaturas" : "Os Meus Trabalhos"}
        </h1>
        <p style={{ color:subtext, fontSize:14, margin:0 }}>
          {isEmployer ? "Gere as candidaturas e obras ativas" : "Acompanha as tuas candidaturas e obras"}
        </p>
      </div>

      {/* Filtro por obra (employer) */}
      {isEmployer && myJobs.length > 1 && (
        <div style={{ padding:"16px 20px 0", overflowX:"auto" }}>
          <div style={{ display:"flex", gap:8, paddingBottom:4 }}>
            <button onClick={() => setSelectedJobId("all")} style={{ flexShrink:0, padding:"8px 16px", borderRadius:20, border:`1px solid ${selectedJobId==="all"?"#FF6600":border}`, background:selectedJobId==="all"?"#FF6600":"transparent", color:selectedJobId==="all"?"#FFF":subtext, fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>Todas</button>
            {myJobs.map(j => (
              <button key={j.id} onClick={() => setSelectedJobId(j.id)} style={{ flexShrink:0, padding:"8px 16px", borderRadius:20, border:`1px solid ${selectedJobId===j.id?"#FF6600":border}`, background:selectedJobId===j.id?"#FF6600":"transparent", color:selectedJobId===j.id?"#FFF":subtext, fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>
                {j.title?.slice(0,22)}{j.title?.length>22?"…":""}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ padding:"20px 20px 0", display:"flex", gap:10 }}>
        {TABS.map(tab => {
          const isAct = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ flex:1, padding:"14px 8px", borderRadius:16, border:`2px solid ${isAct?"#FF6600":border}`, background:isAct?"#FF6600":surface, color:isAct?"#FFF":subtext, cursor:"pointer", textAlign:"center" }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{tab.icon}</div>
              <div style={{ fontWeight:700, fontSize:13 }}>{tab.label}</div>
              {tab.count > 0 && <div style={{ marginTop:4, background:isAct?"#FFF3":"#FF660033", color:isAct?"#FFF":"#FF6600", borderRadius:10, padding:"2px 8px", fontSize:12, fontWeight:800, display:"inline-block" }}>{tab.count}</div>}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding:"20px 20px 0" }}>
        {current?.data.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>{activeTab==="pending"?"⏳":activeTab==="active"?"🔨":"📋"}</div>
            <p style={{ color:text, fontWeight:700, fontSize:16, margin:"0 0 6px" }}>
              {activeTab==="pending"?"Sem candidaturas pendentes":activeTab==="active"?"Nenhuma obra ativa":"Histórico vazio"}
            </p>
            <p style={{ color:subtext, fontSize:13 }}>
              {activeTab==="pending" && isEmployer ? "Quando alguém se candidatar, aparece aqui." : "Nada para mostrar."}
            </p>
          </div>
        ) : isEmployer ? (
          activeTab === "active" ? (
            current.data.map(app => (
              <EmployerActiveCard key={app.id} application={app} job={jobs[app.job_id]} worker={applicants[app.worker_id]}
                onComplete={handleComplete} isDark={isDark} surface={surface} text={text} subtext={subtext} border={border} />
            ))
          ) : activeTab === "pending" ? (
            current.data.map(app => (
              <PendingCandidateCard key={app.id} application={app} job={jobs[app.job_id]} worker={applicants[app.worker_id]}
                onAccept={handleAccept} onReject={handleReject} isDark={isDark} surface={surface} text={text} subtext={subtext} border={border} />
            ))
          ) : (
            current.data.map(app => (
              <WorkerPendingCard key={app.id} application={app} job={jobs[app.job_id]} isDark={isDark} surface={surface} text={text} subtext={subtext} border={border} />
            ))
          )
        ) : (
          activeTab === "active" ? (
            current.data.map(app => (
              <WorkerActiveCard key={app.id} application={app} job={jobs[app.job_id]} employer={employers[jobs[app.job_id]?.employer_id]}
                onComplete={handleComplete} isDark={isDark} surface={surface} text={text} subtext={subtext} border={border} />
            ))
          ) : (
            current.data.map(app => (
              <WorkerPendingCard key={app.id} application={app} job={jobs[app.job_id]} isDark={isDark} surface={surface} text={text} subtext={subtext} border={border} />
            ))
          )
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

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
