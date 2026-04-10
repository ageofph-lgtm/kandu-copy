import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Application } from "@/entities/Application";
import { Notification } from "@/entities/Notification";
import CompletionModal from "@/components/applications/CompletionModal";
import { MapPin, Plus, ChevronDown, ChevronUp, Camera } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

// ─── helpers ──────────────────────────────────────────────────────────────────
function getDailyPin(jobId) {
  if (!jobId) return "------";
  return String(((jobId.charCodeAt(0) || 1) * 137 + new Date().getDate() * 31) % 900000 + 100000);
}

function playPing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1100, 1320].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = f;
      g.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.2);
      o.start(ctx.currentTime + i * 0.12);
      o.stop(ctx.currentTime + i * 0.12 + 0.25);
    });
  } catch (_) {}
  try { navigator.vibrate && navigator.vibrate([150, 80, 150]); } catch (_) {}
}

function sendBrowserPush(title, body) {
  if (!("Notification" in window)) return;
  const fire = () => {
    try {
      new window.Notification(title, {
        body,
        icon: "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png",
        tag: "kandu-alert",
        requireInteraction: false,
      });
    } catch (_) {}
  };
  if (window.Notification.permission === "granted") fire();
  else if (window.Notification.permission !== "denied")
    window.Notification.requestPermission().then(p => { if (p === "granted") fire(); });
}

// ─── countdown hook ───────────────────────────────────────────────────────────
function useCountdown(active) {
  const [sec, setSec] = useState(30);
  useEffect(() => {
    if (!active) { setSec(30); return; }
    const t = setInterval(() => setSec(p => p <= 1 ? (clearInterval(t), 0) : p - 1), 1000);
    return () => clearInterval(t);
  }, [active]);
  return sec;
}

// ─── PIN keypad inline ────────────────────────────────────────────────────────
function PinKeypad({ value, onChange, isDark, surface, text, onConfirm }) {
  const handleKey = k => {
    if (k === "del") { onChange(value.slice(0, -1)); return; }
    if (value.length < 6) onChange(value + k);
  };
  return (
    <div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 14 }}>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{
            width: 38, height: 46, background: isDark ? "#111" : "#FFF",
            borderRadius: 9, border: i === value.length ? "2px solid #FF6600" : `2px solid ${isDark ? "#333" : "#CCC"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 700, color: text
          }}>{value[i] || ""}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
        {["1","2","3","4","5","6","7","8","9","","0","del"].map((k, i) =>
          k === "" ? <div key={i} /> : (
            <button key={i} onClick={() => handleKey(k)}
              style={{ background: isDark ? "#1A1A1A" : "#EBEBEB", borderRadius: 10, padding: "11px 0",
                fontSize: k === "del" ? 16 : 18, fontWeight: 700, color: text, border: "none", cursor: "pointer" }}>
              {k === "del" ? "⌫" : k}
            </button>
          )
        )}
      </div>
      <button onClick={onConfirm} disabled={value.length < 6}
        style={{ width: "100%", marginTop: 10, background: value.length === 6 ? "#FF6600" : "#333",
          color: "#FFF", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14,
          cursor: value.length === 6 ? "pointer" : "default", transition: "background 0.2s" }}>
        Confirmar Presença ✓
      </button>
    </div>
  );
}

// ─── QR display (worker gera) — usa Google Charts API sem dependências ──────────
function QrDisplay({ value, isDark }) {
  const encoded = encodeURIComponent(value);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encoded}&bgcolor=ffffff&color=000000&margin=10`;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ background: "#FFF", padding: 10, borderRadius: 14, boxShadow: "0 0 24px #FF660044", display: "inline-block" }}>
        <img src={qrUrl} alt="QR Code" width={150} height={150} style={{ display: "block", borderRadius: 6 }} />
      </div>
      <span style={{ color: "#22C55E", fontSize: 13, fontWeight: 700 }}>📷 Mostra este QR ao empregador</span>
    </div>
  );
}

// ─── QR Reader (employer lê) ─────────────────────────────────────────────────
function QrReader({ onRead, onClose, isDark, surface, text, subtext, border }) {
  const videoRef = useRef(null);
  const [manual, setManual] = useState("");
  const [camErr, setCamErr] = useState(false);
  const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

  useEffect(() => {
    if (!isMobile) return;
    let stream = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) videoRef.current.srcObject = stream;
        // Usar BarcodeDetector se disponível
        if ("BarcodeDetector" in window) {
          const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
          const scan = setInterval(async () => {
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes.length > 0) { clearInterval(scan); onRead(codes[0].rawValue); }
            } catch (_) {}
          }, 500);
          return () => { clearInterval(scan); stream?.getTracks().forEach(t => t.stop()); };
        }
      } catch (_) { setCamErr(true); }
    })();
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, []);

  return (
    <div style={{ background: isDark ? "#0D0D0D" : "#F0F0F0", borderRadius: 12, padding: 16 }}>
      <p style={{ color: text, fontWeight: 700, fontSize: 14, margin: "0 0 10px" }}>📷 Ler QR do Profissional</p>
      {isMobile && !camErr ? (
        <>
          <div style={{ borderRadius: 10, overflow: "hidden", marginBottom: 10, position: "relative", background: "#000" }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", maxHeight: 220, objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, border: "3px solid #FF6600", borderRadius: 10, pointerEvents: "none" }} />
          </div>
          <p style={{ color: subtext, fontSize: 12, textAlign: "center", marginBottom: 8 }}>Aponta a câmera para o QR do profissional</p>
        </>
      ) : (
        <>
          <p style={{ color: subtext, fontSize: 13, marginBottom: 8 }}>Insere o código de conclusão:</p>
          <input value={manual} onChange={e => setManual(e.target.value)}
            placeholder="KANDU-COMPLETE-..."
            style={{ width: "100%", background: isDark ? "#1A1A1A" : "#FFF", border: `1px solid ${border}`,
              borderRadius: 10, padding: "10px 12px", color: text, fontSize: 13, boxSizing: "border-box", marginBottom: 8 }} />
          <button onClick={() => onRead(manual)}
            style={{ width: "100%", background: "#22C55E", color: "#FFF", border: "none", borderRadius: 10,
              padding: "11px", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 6 }}>
            Confirmar e Finalizar
          </button>
        </>
      )}
      <button onClick={onClose}
        style={{ width: "100%", background: "transparent", color: subtext, border: `1px solid ${border}`,
          borderRadius: 10, padding: "9px", fontSize: 13, cursor: "pointer" }}>
        Cancelar
      </button>
    </div>
  );
}

// ─── STATUS pill ──────────────────────────────────────────────────────────────
const STATUS_MAP = {
  pending_employer:      { color: "#F59E0B", label: "A publicar" },
  open:                  { color: "#3B82F6", label: "Publicada" },
  in_progress:           { color: "#FF6600", label: "Em Curso" },
  completed_by_employer: { color: "#A855F7", label: "Aguarda Avaliação" },
  completed:             { color: "#22C55E", label: "Concluída" },
  cancelled:             { color: "#888",    label: "Cancelada" },
};

// ─── EMPLOYER JOB CARD ────────────────────────────────────────────────────────
function EmployerJobCard({ job, applications, user, onReload, isDark, surface, text, subtext, border }) {
  const [expanded, setExpanded] = useState(false);
  const [showPin, setShowPin]   = useState(false);
  const [showQr, setShowQr]     = useState(false);
  const [completion, setCompletion] = useState(null);
  const [otherUser, setOtherUser]   = useState(null);
  const pinCountdown = useCountdown(showPin);
  const navigate = useNavigate();
  const pin = getDailyPin(job.id);
  const s = STATUS_MAP[job.status] || STATUS_MAP.cancelled;

  useEffect(() => {
    if (job.worker_id)
      User.filter({ id: job.worker_id }).then(r => r[0] && setOtherUser(r[0])).catch(() => {});
  }, [job.worker_id]);

  // Candidaturas pendentes para esta obra
  const pendingApps = applications.filter(a => a.job_id === job.id && a.status === "pending");

  const handleSendPin = async () => {
    setShowPin(true);
    // Notificar worker
    if (job.worker_id) {
      try {
        const pinCode = getDailyPin(job.id);
        await Notification.create({
          user_id: job.worker_id, type: "pin_received",
          title: "📍 PIN de presença recebido!",
          message: `PIN para "${job.title}": ${pinCode} — Abre o app, vai a Trabalho → Em Curso e insere este código.`,
          related_id: job.id, action_url: createPageUrl("MyJobs"), is_read: false
        });
        playPing();
        sendBrowserPush("KANDU — PIN Recebido! 📍", `PIN: ${getDailyPin(job.id)} — Obra: "${job.title}". Insere no app.`);
      } catch (_) {}
    }
  };

  const handleQrRead = async (code) => {
    const expected = `KANDU-COMPLETE-${job.id}`;
    if (code.trim() === expected || code.trim().includes(job.id?.slice(-8))) {
      const app = applications.find(a => a.job_id === job.id && a.status === "accepted");
      setCompletion({ application: app, job, otherUser });
      setShowQr(false);
    } else {
      alert("QR inválido. Pede ao profissional para regenerar.");
    }
  };

  const handlePublish = async () => {
    if (!window.confirm("Publicar esta obra?")) return;
    await Job.update(job.id, { status: "open" });
    onReload();
  };

  return (
    <>
      <div style={{ background: surface, borderRadius: 16, border: `1px solid ${border}`, borderLeft: `4px solid ${s.color}`, marginBottom: 12, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setExpanded(e => !e)}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: text, margin: 0 }}>{job.title}</p>
              {pendingApps.length > 0 && (
                <span style={{ background: "#FF6600", color: "#FFF", borderRadius: 10, padding: "2px 8px", fontSize: 11, fontWeight: 800 }}>
                  {pendingApps.length} nova{pendingApps.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: subtext, display: "flex", alignItems: "center", gap: 3 }}>
                <MapPin size={11} />{job.location}
              </span>
              <span style={{ color: "#FF6600", fontWeight: 800, fontSize: 14 }}>€{job.price}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ background: s.color + "22", color: s.color, borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>{s.label}</span>
            {expanded ? <ChevronUp size={16} color={subtext} /> : <ChevronDown size={16} color={subtext} />}
          </div>
        </div>

        {expanded && (
          <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${border}` }}>
            {otherUser && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FF660033", display: "flex", alignItems: "center", justifyContent: "center", color: "#FF6600", fontWeight: 700 }}>
                  {otherUser.full_name?.charAt(0) || "?"}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: subtext }}>Profissional</p>
                  <p style={{ margin: 0, fontSize: 13, color: text, fontWeight: 600 }}>{otherUser.full_name}</p>
                </div>
              </div>
            )}

            {/* Candidaturas pendentes inline */}
            {pendingApps.length > 0 && (
              <div style={{ background: isDark ? "#0D0D0D" : "#F9F9F9", borderRadius: 12, padding: 14, marginBottom: 12 }}>
                <p style={{ color: text, fontWeight: 700, fontSize: 13, margin: "0 0 10px" }}>👥 Candidaturas ({pendingApps.length})</p>
                {pendingApps.map(app => (
                  <AppMiniCard key={app.id} app={app} job={job} isDark={isDark} text={text} subtext={subtext} border={border} surface={surface} onReload={onReload} />
                ))}
              </div>
            )}

            {/* Ações por estado */}
            {job.status === "pending_employer" && (
              <button onClick={handlePublish}
                style={{ width: "100%", background: "#FF6600", color: "#FFF", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 8 }}>
                🚀 Publicar Obra
              </button>
            )}

            {job.status === "in_progress" && (
              <>
                {/* PIN section */}
                <div style={{ background: isDark ? "#0D0D0D" : "#F0F0F0", borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <p style={{ color: text, fontWeight: 700, fontSize: 13, margin: "0 0 8px" }}>📍 Presença Diária</p>
                  {!showPin ? (
                    <button onClick={handleSendPin}
                      style={{ width: "100%", background: "#3B82F6", color: "#FFF", border: "none", borderRadius: 12, padding: "11px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      Gerar PIN e Notificar Profissional
                    </button>
                  ) : (
                    <>
                      {/* Hexágono PIN */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "10px 0" }}>
                        <div style={{
                          width: 140, height: 140,
                          clipPath: "polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)",
                          background: isDark ? "#050505" : "#1A1A1A",
                          boxShadow: "0 0 28px #FF660077",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          <span style={{ fontSize: 26, fontWeight: 900, color: "#FF6600", letterSpacing: 2 }}>{pin}</span>
                        </div>
                        <span style={{ color: "#FF6600", fontWeight: 700, fontSize: 15 }}>⏱ {pinCountdown}s</span>
                      </div>
                      <button onClick={() => setShowPin(false)}
                        style={{ width: "100%", background: "transparent", color: subtext, border: `1px solid ${border}`, borderRadius: 10, padding: "8px", fontSize: 12, cursor: "pointer" }}>
                        Fechar PIN
                      </button>
                    </>
                  )}
                </div>

                {/* QR Finalizar */}
                {!showQr ? (
                  <button onClick={() => setShowQr(true)}
                    style={{ width: "100%", background: "#22C55E22", color: "#22C55E", border: "1px solid #22C55E44", borderRadius: 12, padding: "11px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    📷 Ler QR e Finalizar Obra
                  </button>
                ) : (
                  <QrReader onRead={handleQrRead} onClose={() => setShowQr(false)}
                    isDark={isDark} surface={surface} text={text} subtext={subtext} border={border} />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {completion && (
        <CompletionModal
          job={completion.job} application={completion.application}
          otherUser={completion.otherUser} currentUser={user}
          onClose={() => setCompletion(null)}
          onComplete={() => { setCompletion(null); onReload(); }}
        />
      )}
    </>
  );
}

// ─── Mini card de candidatura (dentro do card employer) ───────────────────────
function AppMiniCard({ app, job, isDark, text, subtext, border, surface, onReload }) {
  const [worker, setWorker] = useState(null);
  const [acting, setActing] = useState(false);
  useEffect(() => {
    User.filter({ id: app.worker_id }).then(r => r[0] && setWorker(r[0])).catch(() => {});
  }, [app.worker_id]);

  const handleAccept = async () => {
    if (acting) return; setActing(true);
    try {
      const price = app.proposed_price || job.price;
      await Application.update(app.id, { status: "accepted" });
      await Job.update(job.id, { status: "in_progress", worker_id: app.worker_id, price });
      const others = await Application.filter({ job_id: job.id });
      await Promise.all(others.filter(a => a.id !== app.id && a.status === "pending").map(a => Application.update(a.id, { status: "rejected" })));
      await Notification.create({ user_id: app.worker_id, type: "job_accepted", title: "🎉 Candidatura Aceite!", message: `A tua candidatura para "${job.title}" foi aceite. Começa a obra!`, related_id: job.id, action_url: createPageUrl("MyJobs"), is_read: false });
      playPing();
      onReload();
    } catch (_) { setActing(false); }
  };

  const handleReject = async () => {
    if (acting) return; setActing(true);
    try {
      await Application.update(app.id, { status: "rejected" });
      await Notification.create({ user_id: app.worker_id, type: "job_rejected", title: "Candidatura não aceite", message: `A tua candidatura para "${job.title}" não foi selecionada.`, related_id: job.id, action_url: createPageUrl("Home"), is_read: false });
      onReload();
    } catch (_) { setActing(false); }
  };

  return (
    <div style={{ background: isDark ? "#161616" : "#FFF", borderRadius: 10, padding: "10px 12px", border: `1px solid ${border}`, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#FF660033", display: "flex", alignItems: "center", justifyContent: "center", color: "#FF6600", fontWeight: 700, fontSize: 15 }}>
          {worker?.full_name?.charAt(0) || "?"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: text, margin: 0 }}>{worker?.full_name || "Profissional"}</p>
          <p style={{ fontSize: 11, color: subtext, margin: 0 }}>⭐ {worker?.rating?.toFixed(1) || "Novo"}</p>
        </div>
        <p style={{ color: "#FF6600", fontWeight: 800, fontSize: 15, margin: 0 }}>€{app.proposed_price || job.price}</p>
      </div>
      {app.message && (
        <p style={{ color: subtext, fontSize: 12, fontStyle: "italic", background: isDark ? "#0A0A0A" : "#F5F5F5", borderRadius: 7, padding: "6px 10px", margin: "0 0 8px" }}>
          "{app.message.slice(0, 100)}{app.message.length > 100 ? "…" : ""}"
        </p>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleReject} disabled={acting}
          style={{ flex: 1, background: "#EF444422", color: "#EF4444", border: "1px solid #EF444444", borderRadius: 10, padding: "9px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          ✕ Recusar
        </button>
        <button onClick={handleAccept} disabled={acting}
          style={{ flex: 2, background: "#FF6600", color: "#FFF", border: "none", borderRadius: 10, padding: "9px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          ✓ Aceitar
        </button>
      </div>
    </div>
  );
}

// ─── WORKER JOB CARD ──────────────────────────────────────────────────────────
function WorkerJobCard({ job, application, user, onReload, isDark, surface, text, subtext, border }) {
  const [expanded, setExpanded]     = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [pinInput, setPinInput]     = useState("");
  const [pinOk, setPinOk]           = useState(false);
  const [showQr, setShowQr]         = useState(false);
  const [completion, setCompletion] = useState(null);
  const [employer, setEmployer]     = useState(null);
  const s = STATUS_MAP[job.status] || STATUS_MAP.cancelled;
  const expectedPin = getDailyPin(job.id);
  const qrValue = `KANDU-COMPLETE-${job.id}`;

  useEffect(() => {
    if (job.employer_id)
      User.filter({ id: job.employer_id }).then(r => r[0] && setEmployer(r[0])).catch(() => {});
  }, [job.employer_id]);

  const handleConfirmPin = async () => {
    if (pinInput === expectedPin) {
      setPinOk(true);
      setShowKeypad(false);
      try {
        // Registar no calendário (criar evento na entidade CalendarEvent se existir, senão usar Notification como registo)
        await Job.update(job.id, { actual_start_date: new Date().toISOString() });
        // Notificar employer
        await Notification.create({
          user_id: job.employer_id, type: "pin_confirmed",
          title: "✅ Presença confirmada!",
          message: `O profissional confirmou presença na obra "${job.title}".`,
          related_id: job.id, action_url: createPageUrl("MyJobs"), is_read: false
        });
        // Notificar o próprio worker (para o calendário)
        await Notification.create({
          user_id: user.id, type: "attendance_confirmed",
          title: "📅 Presença registada",
          message: `A tua presença na obra "${job.title}" foi registada hoje às ${format(new Date(), "HH:mm", { locale: pt })}.`,
          related_id: job.id, action_url: createPageUrl("Calendar"), is_read: false
        });
        playPing();
        sendBrowserPush("✅ Presença confirmada!", `Obra "${job.title}" — presença registada.`);
      } catch (_) {}
    } else {
      alert("❌ PIN incorreto. Pede ao empregador para mostrar o PIN correto.");
      setPinInput("");
    }
  };

  const needsWorkerEval = application?.status === "accepted" && job.status === "completed_by_employer";

  return (
    <>
      <div style={{ background: surface, borderRadius: 16, border: `1px solid ${border}`, borderLeft: `4px solid ${s.color}`, marginBottom: 12, overflow: "hidden" }}>
        <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setExpanded(e => !e)}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: text, margin: "0 0 4px" }}>{job.title}</p>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: subtext, display: "flex", alignItems: "center", gap: 3 }}>
                <MapPin size={11} />{job.location}
              </span>
              <span style={{ color: "#FF6600", fontWeight: 800, fontSize: 13 }}>€{job.price}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ background: s.color + "22", color: s.color, borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>{s.label}</span>
            {expanded ? <ChevronUp size={16} color={subtext} /> : <ChevronDown size={16} color={subtext} />}
          </div>
        </div>

        {expanded && (
          <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${border}` }}>
            {employer && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#3B82F622", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6", fontWeight: 700 }}>
                  {employer.full_name?.charAt(0) || "?"}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: subtext }}>Empregador</p>
                  <p style={{ margin: 0, fontSize: 13, color: text, fontWeight: 600 }}>{employer.full_name}</p>
                </div>
              </div>
            )}

            {/* Estado: candidatura pendente */}
            {application?.status === "pending" && job.status === "open" && (
              <div style={{ background: "#F59E0B22", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>⏳</span>
                <p style={{ color: "#F59E0B", fontWeight: 600, fontSize: 13, margin: 0 }}>Candidatura pendente — aguarda resposta</p>
              </div>
            )}

            {/* Estado: em curso */}
            {job.status === "in_progress" && application?.status === "accepted" && (
              <>
                {/* Confirmar presença */}
                <div style={{ background: isDark ? "#0D0D0D" : "#F0F0F0", borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <p style={{ color: text, fontWeight: 700, fontSize: 13, margin: "0 0 8px" }}>📍 Confirmar Presença</p>
                  {pinOk ? (
                    <div style={{ background: "#22C55E22", borderRadius: 10, padding: "12px", textAlign: "center" }}>
                      <p style={{ color: "#22C55E", fontWeight: 700, fontSize: 14, margin: "0 0 2px" }}>✅ Presença confirmada hoje!</p>
                      <p style={{ color: subtext, fontSize: 12, margin: 0 }}>Registado às {format(new Date(), "HH:mm")}</p>
                    </div>
                  ) : !showKeypad ? (
                    <button onClick={() => setShowKeypad(true)}
                      style={{ width: "100%", background: "#3B82F622", color: "#3B82F6", border: "1px solid #3B82F644", borderRadius: 12, padding: "11px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      Inserir PIN do Empregador
                    </button>
                  ) : (
                    <>
                      <PinKeypad value={pinInput} onChange={setPinInput} isDark={isDark} surface={isDark?"#1A1A1A":"#FFF"} text={text} onConfirm={handleConfirmPin} />
                      <button onClick={() => { setShowKeypad(false); setPinInput(""); }}
                        style={{ width: "100%", marginTop: 6, background: "transparent", color: subtext, border: `1px solid ${border}`, borderRadius: 10, padding: "8px", fontSize: 12, cursor: "pointer" }}>
                        Cancelar
                      </button>
                    </>
                  )}
                </div>

                {/* Gerar QR finalizar */}
                <div style={{ background: isDark ? "#0D0D0D" : "#F0F0F0", borderRadius: 12, padding: 14 }}>
                  <p style={{ color: text, fontWeight: 700, fontSize: 13, margin: "0 0 8px" }}>🏁 Finalizar Obra</p>
                  {!showQr ? (
                    <button onClick={() => setShowQr(true)}
                      style={{ width: "100%", background: "#22C55E22", color: "#22C55E", border: "1px solid #22C55E44", borderRadius: 12, padding: "11px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      Gerar QR de Conclusão
                    </button>
                  ) : (
                    <>
                      <QrDisplay value={qrValue} isDark={isDark} />
                      <button onClick={() => setShowQr(false)}
                        style={{ width: "100%", marginTop: 8, background: "transparent", color: subtext, border: `1px solid ${border}`, borderRadius: 10, padding: "8px", fontSize: 12, cursor: "pointer" }}>
                        Fechar QR
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Worker avalia */}
            {needsWorkerEval && (
              <button onClick={() => setCompletion({ application, job, otherUser: employer })}
                style={{ width: "100%", background: "#A855F722", color: "#A855F7", border: "1px solid #A855F744", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                ✍️ Avaliar Empregador
              </button>
            )}
          </div>
        )}
      </div>

      {completion && (
        <CompletionModal
          job={completion.job} application={completion.application}
          otherUser={completion.otherUser} currentUser={user}
          onClose={() => setCompletion(null)}
          onComplete={() => { setCompletion(null); onReload(); }}
        />
      )}
    </>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function MyJobs() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const bg      = isDark ? "#111016" : "#F5F5F5";
  const surface = isDark ? "#1C1B22" : "#FFFFFF";
  const text    = isDark ? "#FFFFFF" : "#111016";
  const subtext = isDark ? "#AAAAAA" : "#666666";
  const border  = isDark ? "#2A2A2A" : "#E5E5E5";

  const [user,         setUser]         = useState(null);
  const [jobs,         setJobs]         = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState("pending");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const cu = await User.me(); setUser(cu);
      let jobList = [], appList = [];

      if (cu.user_type === "worker") {
        const myApps = await Application.filter({ worker_id: cu.id });
        appList = myApps;
        const allJobsRaw = await Job.list();
        const jobMap = {}; allJobsRaw.forEach(j => jobMap[j.id] = j);
        const appJobs = [...new Set(myApps.map(a => a.job_id).filter(Boolean))].map(id => jobMap[id]).filter(Boolean);
        const asWorker = await Job.filter({ worker_id: cu.id });
        const merged = [...asWorker]; appJobs.forEach(j => { if (!merged.find(x => x.id === j.id)) merged.push(j); });
        jobList = merged;
      } else if (cu.user_type === "employer") {
        jobList = await Job.filter({ employer_id: cu.id });
        const ids = jobList.map(j => j.id);
        if (ids.length) { const all = await Application.list(); appList = all.filter(a => ids.includes(a.job_id)); }
      } else {
        jobList = await Job.list(); appList = await Application.list();
      }
      setJobs(jobList); setApplications(appList);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const isWorker   = user?.user_type === "worker";
  const isEmployer = user?.user_type === "employer";

  // ── Tabs ──────────────────────────────────────────────────────────────────
  // PENDENTES (worker): obras com candidatura pending
  // PENDENTES (employer): obras published sem worker aceite + pending_employer
  const pendingJobs = !user ? [] : isWorker
    ? jobs.filter(j => applications.some(a => a.job_id === j.id && a.status === "pending") && ["open","pending_employer"].includes(j.status))
    : jobs.filter(j => ["pending_employer","open"].includes(j.status) && !j.worker_id);

  const activeJobs = !user ? [] : isWorker
    ? jobs.filter(j => j.status === "in_progress" && j.worker_id === user.id)
    : jobs.filter(j => ["in_progress","completed_by_employer"].includes(j.status));

  const historyJobs = !user ? [] : jobs.filter(j => ["completed","cancelled"].includes(j.status));

  const TABS = [
    { id: "pending", label: isWorker ? "Candidaturas" : "Publicadas", icon: isWorker ? "📋" : "📢", count: pendingJobs.length },
    { id: "active",  label: "Em Curso",   icon: "🔨", count: activeJobs.length  },
    { id: "history", label: "Histórico",  icon: "🏆", count: historyJobs.length },
  ];

  const currentData = tab === "pending" ? pendingJobs : tab === "active" ? activeJobs : historyJobs;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
      <div style={{ width: 40, height: 40, border: "3px solid #FF6600", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: subtext, fontSize: 14 }}>A carregar…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ background: bg, minHeight: "100vh", paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ background: surface, borderBottom: `1px solid ${border}`, padding: "50px 20px 14px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <img src={isDark
            ? "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/90321a683_Gemini_Generated_Image_k4rh2gk4rh2gk4rh.png"
            : "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/002158942_Gemini_Generated_Image_5.png"}
            alt="KANDU" style={{ height: 24, objectFit: "contain" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: subtext }}>Gestão</p>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: text }}>Trabalho</h1>
          </div>
          {isEmployer && (
            <button onClick={() => navigate(createPageUrl("NewJob"))}
              style={{ background: "#FF6600", border: "none", borderRadius: 50, padding: "10px 16px", color: "#FFF", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={15} /> Publicar
            </button>
          )}
        </div>
      </div>

      {/* Tab buttons grandes */}
      <div style={{ padding: "16px 16px 0", display: "flex", gap: 10 }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: "14px 6px", borderRadius: 16, border: `2px solid ${active ? "#FF6600" : border}`,
                background: active ? "#FF6600" : surface, color: active ? "#FFF" : subtext, cursor: "pointer", textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 3 }}>{t.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{t.label}</div>
              {t.count > 0 && (
                <div style={{ marginTop: 3, background: active ? "#FFF3" : "#FF660033", color: active ? "#FFF" : "#FF6600",
                  borderRadius: 10, padding: "2px 8px", fontSize: 11, fontWeight: 800, display: "inline-block" }}>{t.count}</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <div style={{ padding: "16px 16px 0" }}>
        {currentData.length === 0 ? (
          <div style={{ background: surface, borderRadius: 16, padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>{TABS.find(t=>t.id===tab)?.icon}</div>
            <p style={{ color: subtext, fontWeight: 700, fontSize: 15, margin: "0 0 6px" }}>
              {tab === "pending" ? (isWorker ? "Nenhuma candidatura pendente" : "Nenhuma obra publicada") : tab === "active" ? "Nenhum trabalho em curso" : "Histórico vazio"}
            </p>
            {tab === "pending" && isWorker && (
              <button onClick={() => navigate(createPageUrl("Home"))}
                style={{ background: "#FF6600", border: "none", borderRadius: 12, padding: "12px 24px", color: "#FFF", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 10 }}>
                🗺️ Explorar Obras
              </button>
            )}
            {tab === "pending" && isEmployer && (
              <button onClick={() => navigate(createPageUrl("NewJob"))}
                style={{ background: "#FF6600", border: "none", borderRadius: 12, padding: "12px 24px", color: "#FFF", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 10 }}>
                + Publicar Obra
              </button>
            )}
          </div>
        ) : isEmployer ? (
          currentData.map(job => (
            <EmployerJobCard key={job.id} job={job} applications={applications} user={user}
              onReload={loadData} isDark={isDark} surface={surface} text={text} subtext={subtext} border={border} />
          ))
        ) : (
          currentData.map(job => (
            <WorkerJobCard key={job.id} job={job}
              application={applications.find(a => a.job_id === job.id && a.worker_id === user.id)}
              user={user} onReload={loadData} isDark={isDark} surface={surface} text={text} subtext={subtext} border={border} />
          ))
        )}
      </div>
    </div>
  );
}
