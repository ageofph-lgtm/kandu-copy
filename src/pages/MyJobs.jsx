import { useState, useEffect, useCallback } from "react";
import { Application, Job, Notification, User } from "@/api/entities";
import JobEditModal from "@/components/jobs/JobEditModal";
import { listFavorites, toggleFavorite } from "@/lib/favorites";
import { useTheme } from "@/lib/ThemeContext";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";
import CompletionModal from "@/components/applications/CompletionModal";
import { MapPin, Plus, ChevronDown, ChevronUp, Pencil, Eye, Flag, Heart, Undo2 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import LoadingScreen from "@/components/LoadingScreen";
import { toast } from "sonner";

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
  const { lang } = useLanguage();
  const handleKey = k => {
    if (k === "del") { onChange(value.slice(0, -1)); return; }
    if (value.length < 6) onChange(value + k);
  };
  return (
    <div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 14 }}>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{
            width: 38, height: 46, background: "var(--surface2)",
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
              style={{ background: "var(--surface)", borderRadius: 10, padding: "11px 0",
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
        {t(lang, "confirmPresence", "Confirmar Presença")} ✓
      </button>
    </div>
  );
}

// ─── PIN de finalização (diferente do PIN de presença) ───────────────────────
// Usa hora do dia + job.id para ser único por sessão de trabalho
function getCompletionPin(jobId, hourOffset = 0) {
  if (!jobId) return "------";
  const hour = (new Date().getHours() + 24 + hourOffset) % 24;
  return String(((jobId.charCodeAt(2) || 7) * 251 + (jobId.charCodeAt(4) || 3) * 97 + hour * 19) % 900000 + 100000);
}

// Aceita o PIN da hora atual ou da anterior — evita que a viragem de hora
// entre o worker gerar o PIN e o employer o inserir invalide o código.
function isValidCompletionPin(input, jobId) {
  return input === getCompletionPin(jobId) || input === getCompletionPin(jobId, -1);
}

// Display hexágono verde para PIN de finalização
function CompletionPinDisplay({ pin, countdown, isDark, employerName }) {
  const { lang } = useLanguage();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "10px 0" }}>
      {/* UX FIX: instrução clara de quem deve receber o PIN */}
      <div style={{
        background: "#22C55E15", border: "1px solid #22C55E44",
        borderRadius: 12, padding: "10px 16px", width: "100%", textAlign: "center"
      }}>
        <p style={{ color: "#22C55E", fontWeight: 700, fontSize: 13, margin: "0 0 4px" }}>✅ {t(lang, "completionPinGenerated", "PIN de Conclusão Gerado!")}</p>
        <p style={{ color: isDark ? "#CCCCCC" : "#444", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
          {t(lang, "showCodeToClient", "Mostra este código a {name}. Ele vai inseri-lo no telemóvel dele para confirmar que a obra está concluída.")
            .replace("{name}", employerName || t(lang, "employer", "Empregador"))}
        </p>
      </div>
      <div style={{
        width: 150, height: 150,
        clipPath: "polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)",
        background: isDark ? "#050505" : "#0A1A0A",
        boxShadow: "0 0 28px #22C55E77",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <span style={{ fontSize: 28, fontWeight: 900, color: "#22C55E", letterSpacing: 3 }}>{pin}</span>
      </div>
      <span style={{ color: "#22C55E", fontWeight: 700, fontSize: 14 }}>⏱ {countdown}s {t(lang, "remaining", "restantes")}</span>
    </div>
  );
}

// ─── STATUS pill ──────────────────────────────────────────────────────────────
// labels guardados como chave i18n + fallback PT, traduzidos no render
const STATUS_MAP = {
  draft:                 { color: "#8A909A", key: "statusDraft", pt: "Rascunho" },
  pending_employer:      { color: "#F59E0B", key: "statusToPublish", pt: "A publicar" },
  open:                  { color: "#3B82F6", key: "statusPublished", pt: "Publicada" },
  in_progress:           { color: "#FF6600", key: "statusInProgress", pt: "Em Curso" },
  completed_by_employer: { color: "#A855F7", key: "awaitingReview", pt: "Aguarda Avaliação" },
  completed:             { color: "#22C55E", key: "completed", pt: "Concluída" },
  cancelled:             { color: "#888",    key: "cancelled", pt: "Cancelada" },
};
const statusLabel = (lang, s) => t(lang, s.key, s.pt);

// ─── EMPLOYER JOB CARD ────────────────────────────────────────────────────────
function EmployerJobCard({ job, applications, user, usersById = {}, onReload, isDark, surface, text, subtext, border }) {
  const { lang } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [showPin,        setShowPin]        = useState(false);
  const [showFinishPin,  setShowFinishPin]  = useState(false);  // employer digita PIN
  const [finishPinInput, setFinishPinInput] = useState("");
  const [completion,     setCompletion]     = useState(null);
  const [otherUser, setOtherUser]   = useState(null);
  const [editMode,  setEditMode]    = useState(null);   // "edit" | "view" | null
  const pinCountdown = useCountdown(showPin);
  const navigate = useNavigate();
  const pin = getDailyPin(job.id);
  const completionPin = getCompletionPin(job.id);
  const s = STATUS_MAP[job.status] || STATUS_MAP.cancelled;

  // Usar usersById carregado pelo pai (evita RLS block)
  useEffect(() => {
    if (job.worker_id && usersById[job.worker_id]) {
      setOtherUser(usersById[job.worker_id]);
    }
  }, [job.worker_id, usersById]);

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
          related_id: job.id, read: false
        });
        playPing();
        sendBrowserPush("KANDU — PIN Recebido! 📍", `PIN: ${getDailyPin(job.id)} — Obra: "${job.title}". Insere no app.`);
      } catch (_) {}
    }
  };

  const handleFinishPin = async () => {
    if (!isValidCompletionPin(finishPinInput, job.id)) {
      toast.error(t(lang, "pinIncorrectFromWorker", "PIN incorreto. Pede ao profissional para te mostrar o PIN de finalização."));
      setFinishPinInput("");
      return;
    }
    setShowFinishPin(false);
    // #75 — confirmação explícita depois do PIN correcto
    toast.success(t(lang, "thankYouJobDone", "Obrigado. Trabalho concluído ✓"), { duration: 5000 });
    const app = applications.find(a => a.job_id === job.id && a.status === "accepted");
    if (!app) {
      // sem candidatura aceite — finalizar directo
      try {
        await Job.update(job.id, { status: "completed_by_employer" });
        await Notification.create({
          user_id: job.worker_id, type: "job_completed",
          title: "🏁 Obra finalizada!",
          message: `O empregador finalizou a obra "${job.title}". Avalia a experiência em Trabalhos!`,
          related_id: job.id, read: false
        });
        playPing();
        onReload();
      } catch(e) { toast.error(t(lang, "errorFinishing", "Erro ao finalizar") + ": " + e.message); }
      return;
    }
    // Garante que otherUser está carregado antes de abrir o modal
    let resolvedOtherUser = otherUser;
    if (!resolvedOtherUser && job.worker_id) {
      try { const r = await User.filter({ id: job.worker_id }); resolvedOtherUser = r[0] || null; } catch(_) {}
    }
    setCompletion({ application: app, job, otherUser: resolvedOtherUser });
  };

  const handlePublish = async () => {
    if (!window.confirm(t(lang, "publishJobQuestion", "Publicar esta obra?"))) return;
    try {
      await Job.update(job.id, { status: "open", published_at: new Date().toISOString() });
      toast.success("Obra publicada ✓");
      onReload();
    } catch (e) { toast.error("Erro ao publicar: " + (e.message || "")); }
  };

  // #66 — depois de o profissional iniciar, o anúncio deixa de ser editável
  const canEdit = ["draft", "pending_employer", "open"].includes(job.status);

  // #14 — denúncia de ausência do profissional
  const handleNoShow = () => {
    navigate(`${createPageUrl("Complaints")}?jobId=${job.id}`);
  };

  return (
    <>
      <div style={{ background: "var(--surface2)", borderRadius: 16, border: "1px solid var(--hair)", boxShadow: "inset 0 1.5px 0 var(--edge-hi), 0 8px 24px -16px var(--shadow)", border: `1px solid ${border}`, borderLeft: `4px solid ${s.color}`, marginBottom: 12, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setExpanded(e => !e)}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: text, margin: 0 }}>{job.title}</p>
              {pendingApps.length > 0 && (
                <span style={{ background: "#FF6600", color: "#FFF", borderRadius: 10, padding: "2px 8px", fontSize: 11, fontWeight: 800 }}>
                  {pendingApps.length} {t(lang, "newBadge", "nova(s)")}
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
            <span style={{ background: s.color + "22", color: s.color, borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>{statusLabel(lang, s)}</span>
            {job.status === "completed_by_employer" && !expanded && (
              <span style={{ background: "#A855F7", color: "#FFF", borderRadius: 10, padding: "3px 8px", fontSize: 11, fontWeight: 800, animation: "pulse 1.5s ease-in-out infinite" }}>
                ✍️
              </span>
            )}
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
                  <p style={{ margin: 0, fontSize: 11, color: subtext }}>{t(lang,"worker")}</p>
                  <p style={{ margin: 0, fontSize: 13, color: text, fontWeight: 600 }}>{otherUser.full_name}</p>
                </div>
              </div>
            )}

            {/* Candidaturas pendentes inline */}
            {pendingApps.length > 0 && (
              <div style={{ background: isDark ? "#0D0D0D" : "#F9F9F9", borderRadius: 12, padding: 14, marginBottom: 12 }}>
                <p style={{ color: text, fontWeight: 700, fontSize: 13, margin: "0 0 10px" }}>👥 {t(lang,"applications")} ({pendingApps.length})</p>
                {pendingApps.map(app => (
                  <AppMiniCard key={app.id} app={app} job={job} isDark={isDark} text={text} subtext={subtext} border={border} surface={surface} onReload={onReload} />
                ))}
              </div>
            )}

            {/* #54 — ver detalhes e editar anúncio */}
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <button onClick={() => setEditMode("view")}
                style={{ flex: 1, background: "transparent", color: subtext, border: `1px solid ${border}`, borderRadius: 10, padding: "9px", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Eye size={14} /> {t(lang, "viewDetails", "Ver detalhes")}
              </button>
              <button onClick={() => setEditMode(canEdit ? "edit" : "view")}
                disabled={!canEdit}
                title={canEdit ? undefined : "A obra já começou — o anúncio não pode ser alterado."}
                style={{ flex: 1, background: canEdit ? "#FF660022" : "transparent", color: canEdit ? "#FF6600" : "#555", border: `1px solid ${canEdit ? "#FF660055" : border}`, borderRadius: 10, padding: "9px", fontWeight: 700, fontSize: 13, cursor: canEdit ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Pencil size={14} /> {t(lang, "editJob", "Editar")}
              </button>
            </div>

            {/* Ações por estado */}
            {job.status === "draft" && (
              <button onClick={() => setEditMode("edit")}
                style={{ width: "100%", background: "#FF6600", color: "#FFF", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 8 }}>
                📝 {t(lang, "completeAndPublish", "Completar e publicar rascunho")}
              </button>
            )}

            {job.status === "pending_employer" && (
              <button onClick={handlePublish}
                style={{ width: "100%", background: "#FF6600", color: "#FFF", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 8 }}>
                🚀 {t(lang, "publishJob", "Publicar Obra")}
              </button>
            )}

            {job.status === "in_progress" && (
              <>
                {/* PIN section */}
                <div style={{ background: isDark ? "#0D0D0D" : "#F0F0F0", borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <p style={{ color: text, fontWeight: 700, fontSize: 13, margin: "0 0 8px" }}>📍 {t(lang, "dailyPresence", "Presença Diária")}</p>
                  {!showPin ? (
                    <button onClick={handleSendPin}
                      style={{ width: "100%", background: "#3B82F6", color: "#FFF", border: "none", borderRadius: 12, padding: "11px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      {t(lang, "generatePinNotifyWorker", "Gerar PIN e Notificar Profissional")}
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
                        {t(lang, "closePin", "Fechar PIN")}
                      </button>
                    </>
                  )}
                </div>

                {/* PIN Finalizar (employer digita o PIN que o worker enviou) */}
                <div style={{ background: isDark ? "#0D0D0D" : "#F0F0F0", borderRadius: 12, padding: 14 }}>
                  <p style={{ color: text, fontWeight: 700, fontSize: 13, margin: "0 0 8px" }}>🏁 {t(lang, "finishJob", "Finalizar Obra")}</p>
                  {!showFinishPin ? (
                    <button onClick={() => setShowFinishPin(true)}
                      style={{ width: "100%", background: "#22C55E22", color: "#22C55E", border: "1px solid #22C55E44", borderRadius: 12, padding: "11px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      {t(lang, "enterCompletionPin", "Inserir PIN de Conclusão do Profissional")}
                    </button>
                  ) : (
                    <>
                      {/* UX FIX: instrução clara de onde vem o PIN */}
                      <div style={{ marginBottom: 10, background: "#22C55E15", border: "1px solid #22C55E40", borderRadius: 10, padding: "8px 12px" }}>
                        <p style={{ color: "#22C55E", fontSize: 13, margin: 0, lineHeight: 1.5, fontWeight: 600 }}>
                          👉 {t(lang, "askWorkerForCode", "Pede ao profissional {name} o código de 6 dígitos que aparece no telemóvel dele.")
                            .replace("{name}", otherUser?.full_name || t(lang, "worker", "Profissional"))}
                        </p>
                      </div>
                      <PinKeypad value={finishPinInput} onChange={setFinishPinInput}
                        isDark={isDark} surface={isDark ? "#1A1A1A" : "#FFF"} text={text}
                        onConfirm={handleFinishPin} />
                      <button onClick={() => { setShowFinishPin(false); setFinishPinInput(""); }}
                        style={{ width: "100%", marginTop: 6, background: "transparent", color: subtext,
                          border: `1px solid ${border}`, borderRadius: 10, padding: "8px", fontSize: 12, cursor: "pointer" }}>
                        {t(lang, "cancel", "Cancelar")}
                      </button>
                    </>
                  )}
                </div>

                {/* #14 / #28 — denunciar ausência ou abrir reclamação */}
                <button onClick={handleNoShow}
                  style={{ width: "100%", marginTop: 10, background: "transparent", color: "#EF4444", border: "1px solid #EF444444", borderRadius: 12, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Flag size={14} /> {t(lang, "reportProblem", "Reportar ausência ou problema")}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {editMode && (
        <JobEditModal
          job={job}
          mode={editMode}
          onClose={() => setEditMode(null)}
          onSaved={onReload}
        />
      )}

      {completion && completion.job && (
        <CompletionModal
          job={completion.job} application={completion.application || {}}
          otherUser={completion.otherUser || {}} currentUser={user}
          onClose={() => setCompletion(null)}
          onComplete={() => { setCompletion(null); onReload(); }}
        />
      )}
    </>
  );
}

// ─── Mini card de candidatura (dentro do card employer) ───────────────────────
function AppMiniCard({ app, job, isDark, text, subtext, border, surface, onReload }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();
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
      await Notification.create({ user_id: app.worker_id, type: "job_accepted", title: "🎉 Candidatura Aceite!", message: `A tua candidatura para "${job.title}" foi aceite. Começa a obra!`, related_id: job.id, read: false });
      playPing();
      onReload();
    } catch (_) { setActing(false); }
  };

  const handleReject = async () => {
    if (acting) return; setActing(true);
    try {
      await Application.update(app.id, { status: "rejected" });
      await Notification.create({ user_id: app.worker_id, type: "job_rejected", title: "Candidatura não aceite", message: `A tua candidatura para "${job.title}" não foi selecionada.`, related_id: job.id, read: false });
      onReload();
    } catch (_) { setActing(false); }
  };

  // #110 — em vez de recusar, o employer pode enviar uma contraproposta
  const handleCounterOffer = async () => {
    const raw = window.prompt(
      `Contraproposta para ${worker?.full_name || "o profissional"}\n\n` +
      `Pedido: €${app.proposed_price || job.price}\nQual o teu valor (€)?`,
      String(job.price || "")
    );
    if (raw === null) return;
    const value = parseFloat(raw);
    if (!Number.isFinite(value) || value <= 0) { toast.error("Valor inválido."); return; }

    setActing(true);
    try {
      await Application.update(app.id, {
        counter_offer: value,
        counter_offer_by: job.employer_id,
        counter_offer_status: "pending",
      });
      await Notification.create({
        user_id: app.worker_id, type: "new_proposal",
        title: "💰 Contraproposta recebida",
        message: `O empregador propôs €${value} para "${job.title}". Vê em Trabalho › Candidaturas.`,
        related_id: job.id, read: false,
      });
      toast.success("Contraproposta enviada ✓");
      onReload();
    } catch (e) {
      toast.error("Erro ao enviar contraproposta: " + (e.message || ""));
      setActing(false);
    }
  };

  return (
    <div style={{ background: isDark ? "#161616" : "#FFF", borderRadius: 10, padding: "10px 12px", border: `1px solid ${border}`, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div
          onClick={() => worker && navigate(`${createPageUrl("Profile")}?userId=${worker.id}`)}
          style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, cursor: worker ? "pointer" : "default", borderRadius: 8, padding: "2px 4px", transition: "background 0.15s" }}
          onMouseEnter={e => worker && (e.currentTarget.style.background = "rgba(244,98,31,0.08)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#F4621F33", display: "flex", alignItems: "center", justifyContent: "center", color: "#F4621F", fontWeight: 700, fontSize: 15, flexShrink: 0, overflow: "hidden" }}>
            {worker?.avatar_url
              ? <img src={worker.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="" />
              : worker?.full_name?.charAt(0) || "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: text, margin: 0 }}>
              {worker?.full_name || t(lang, "worker", "Profissional")}
              {worker && <span style={{fontSize:10,color:"#F4621F",marginLeft:4}}>ver →</span>}
            </p>
            <p style={{ fontSize: 11, color: subtext, margin: 0 }}>⭐ {worker?.rating?.toFixed(1) || t(lang, "newLabel", "Novo")}</p>
          </div>
        </div>
        <p style={{ color: "#F4621F", fontWeight: 800, fontSize: 15, margin: 0, flexShrink: 0 }}>€{app.proposed_price || job.price}</p>
      </div>
      {app.message && (
        <p style={{ color: subtext, fontSize: 12, fontStyle: "italic", background: isDark ? "#0A0A0A" : "#F5F5F5", borderRadius: 7, padding: "6px 10px", margin: "0 0 8px" }}>
          "{app.message.slice(0, 100)}{app.message.length > 100 ? "…" : ""}"
        </p>
      )}
      {app.counter_offer && (
        <p style={{ color: "#3B82F6", fontSize: 12, fontWeight: 600, background: "#3B82F615", borderRadius: 7, padding: "6px 10px", margin: "0 0 8px" }}>
          💰 Contraproposta enviada: €{app.counter_offer} — {app.counter_offer_status === "accepted" ? "aceite" : "à espera de resposta"}
        </p>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleReject} disabled={acting}
          style={{ flex: 1, background: "#EF444422", color: "#EF4444", border: "1px solid #EF444444", borderRadius: 10, padding: "9px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          ✕ {t(lang, "reject", "Recusar")}
        </button>
        <button onClick={handleCounterOffer} disabled={acting}
          style={{ flex: 1, background: "#3B82F622", color: "#3B82F6", border: "1px solid #3B82F644", borderRadius: 10, padding: "9px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          💰 {t(lang, "counterOffer", "Contrapropor")}
        </button>
        <button onClick={handleAccept} disabled={acting}
          style={{ flex: 2, background: "#FF6600", color: "#FFF", border: "none", borderRadius: 10, padding: "9px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          ✓ {t(lang, "accept", "Aceitar")}
        </button>
      </div>
    </div>
  );
}

// ─── WORKER JOB CARD ──────────────────────────────────────────────────────────
function WorkerJobCard({ job, application, user, usersById = {}, onReload, isDark, surface, text, subtext, border }) {
  const { lang } = useLanguage();
  const [expanded, setExpanded]     = useState(false);
  const [showKeypad,     setShowKeypad]     = useState(false);
  const [pinInput,       setPinInput]       = useState("");
  const [pinOk,          setPinOk]          = useState(false);
  const [showFinishPin,  setShowFinishPin]  = useState(false);  // worker mostra PIN
  const [finishCountdown,setFinishCountdown]= useState(30);
  const [completion,     setCompletion]     = useState(null);
  const [employer, setEmployer]     = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const navigate = useNavigate();
  const s = STATUS_MAP[job.status] || STATUS_MAP.cancelled;
  const expectedPin = getDailyPin(job.id);
  const completionPin = getCompletionPin(job.id);
  // countdown do PIN de finalização
  useEffect(() => {
    if (!showFinishPin) { setFinishCountdown(30); return; }
    const t = setInterval(() => setFinishCountdown(p => p <= 1 ? (clearInterval(t), 0) : p - 1), 1000);
    return () => clearInterval(t);
  }, [showFinishPin]);

  // Usar usersById carregado pelo pai (evita RLS block)
  useEffect(() => {
    if (job.employer_id && usersById[job.employer_id]) {
      setEmployer(usersById[job.employer_id]);
    }
  }, [job.employer_id, usersById]);

  // Auto-expandir quando obra aguarda avaliação do worker
  useEffect(() => {
    if (job.status === "completed_by_employer" && application?.status === "accepted") {
      setExpanded(true);
    }
  }, [job.status, application?.status]);

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
          related_id: job.id, read: false
        });
        // Notificar o próprio worker (para o calendário)
        await Notification.create({
          user_id: user.id, type: "attendance_confirmed",
          title: "📅 Presença registada",
          message: `A tua presença na obra "${job.title}" foi registada hoje às ${format(new Date(), "HH:mm", { locale: pt })}.`,
          related_id: job.id, read: false
        });
        playPing();
        sendBrowserPush("✅ Presença confirmada!", `Obra "${job.title}" — presença registada.`);
      } catch (_) {}
    } else {
      toast.error(t(lang, "pinIncorrectFromEmployer", "PIN incorreto. Pede ao empregador para mostrar o PIN correto."));
      setPinInput("");
    }
  };

  // #41 — retirar candidatura antes de ser aceite
  const handleWithdraw = async () => {
    if (!application?.id) return;
    if (!window.confirm("Retirar a tua candidatura a esta obra?\n\nPodes candidatar-te novamente enquanto o anúncio estiver aberto.")) return;
    setWithdrawing(true);
    try {
      await Application.delete(application.id);
      await Notification.create({
        user_id: job.employer_id, type: "application_withdrawn",
        title: "Candidatura retirada",
        message: `${user.full_name || "Um profissional"} retirou a candidatura a "${job.title}".`,
        related_id: job.id, read: false,
      }).catch(() => {});
      toast.success("Candidatura retirada.");
      onReload();
    } catch (e) {
      toast.error("Erro ao retirar candidatura: " + (e.message || ""));
      setWithdrawing(false);
    }
  };

  const needsWorkerEval = application?.status === "accepted" && job.status === "completed_by_employer";

  return (
    <>
      <div style={{ background: "var(--surface2)", borderRadius: 16, border: "1px solid var(--hair)", boxShadow: "inset 0 1.5px 0 var(--edge-hi), 0 8px 24px -16px var(--shadow)", border: `1px solid ${border}`, borderLeft: `4px solid ${s.color}`, marginBottom: 12, overflow: "hidden" }}>
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
            <span style={{ background: s.color + "22", color: s.color, borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>{statusLabel(lang, s)}</span>
            {expanded ? <ChevronUp size={16} color={subtext} /> : <ChevronDown size={16} color={subtext} />}
          </div>
        </div>

        {/* Banner de avaliação — sempre visível quando obra aguarda avaliação do worker */}
        {needsWorkerEval && (
          <div style={{ padding: "0 16px 14px" }}>
            <button
              onClick={() => {
                // employer é carregado pelo pai via usersById — fallback: usar employer_id como nome
                const resolvedEmployer = employer || usersById[job.employer_id] || { id: job.employer_id, full_name: t(lang, "employer", "Empregador") };
                if (!resolvedEmployer.id) {
                  toast.error(t(lang, "employerNotIdentified", "Não foi possível identificar o empregador. Tenta recarregar a página."));
                  return;
                }
                setCompletion({ application, job, otherUser: resolvedEmployer });
              }}
              style={{ width: "100%", background: "linear-gradient(135deg, #A855F7, #7C3AED)", color: "#FFF",
                border: "none", borderRadius: 14, padding: "15px", fontWeight: 800, fontSize: 15,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 4px 20px #A855F744" }}>
              ✍️ {t(lang, "evaluateEmployerToComplete", "Avaliar Empregador para concluir obra")}
            </button>
          </div>
        )}

        {expanded && !needsWorkerEval && (
          <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${border}` }}>
            {employer && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#3B82F622", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6", fontWeight: 700 }}>
                  {employer.full_name?.charAt(0) || "?"}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: subtext }}>{t(lang,"employer")}</p>
                  <p style={{ margin: 0, fontSize: 13, color: text, fontWeight: 600 }}>{employer.full_name}</p>
                </div>
              </div>
            )}

            {/* Estado: candidatura pendente */}
            {application?.status === "pending" && job.status === "open" && (
              <>
                <div style={{ background: "#F59E0B22", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>⏳</span>
                  <p style={{ color: "#F59E0B", fontWeight: 600, fontSize: 13, margin: 0 }}>{t(lang, "pendingApplicationWaiting", "Candidatura pendente — aguarda resposta")}</p>
                </div>

                {/* #110 — contraproposta do empregador */}
                {application.counter_offer && application.counter_offer_status === "pending" && (
                  <div style={{ background: "#3B82F615", border: "1px solid #3B82F644", borderRadius: 12, padding: "12px 14px", marginTop: 10 }}>
                    <p style={{ color: "#3B82F6", fontWeight: 700, fontSize: 13, margin: "0 0 8px" }}>
                      💰 O empregador propôs €{application.counter_offer}
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={async () => {
                        try {
                          await Application.update(application.id, { counter_offer_status: "rejected" });
                          toast.info("Contraproposta recusada.");
                          onReload();
                        } catch (e) { toast.error(e.message || "Erro"); }
                      }}
                        style={{ flex: 1, background: "transparent", color: subtext, border: `1px solid ${border}`, borderRadius: 10, padding: "9px", fontSize: 13, cursor: "pointer" }}>
                        Recusar
                      </button>
                      <button onClick={async () => {
                        try {
                          await Application.update(application.id, { counter_offer_status: "accepted", proposed_price: application.counter_offer });
                          await Notification.create({
                            user_id: job.employer_id, type: "new_proposal",
                            title: "✅ Contraproposta aceite",
                            message: `${user.full_name || "O profissional"} aceitou €${application.counter_offer} para "${job.title}".`,
                            related_id: job.id, read: false,
                          }).catch(() => {});
                          toast.success("Contraproposta aceite ✓");
                          onReload();
                        } catch (e) { toast.error(e.message || "Erro"); }
                      }}
                        style={{ flex: 2, background: "#3B82F6", color: "#fff", border: "none", borderRadius: 10, padding: "9px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                        Aceitar €{application.counter_offer}
                      </button>
                    </div>
                  </div>
                )}

                {/* #41 — retirar candidatura */}
                <button onClick={handleWithdraw} disabled={withdrawing}
                  style={{ width: "100%", marginTop: 10, background: "transparent", color: subtext, border: `1px solid ${border}`, borderRadius: 12, padding: "10px", fontWeight: 600, fontSize: 13, cursor: withdrawing ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Undo2 size={14} /> {withdrawing ? "A retirar..." : t(lang, "withdrawApplication", "Retirar candidatura")}
                </button>
              </>
            )}

            {/* Estado: em curso */}
            {job.status === "in_progress" && application?.status === "accepted" && (
              <>
                {/* Confirmar presença */}
                <div style={{ background: isDark ? "#0D0D0D" : "#F0F0F0", borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <p style={{ color: text, fontWeight: 700, fontSize: 13, margin: "0 0 8px" }}>📍 {t(lang, "confirmPresence", "Confirmar Presença")}</p>
                  {pinOk ? (
                    <div style={{ background: "#22C55E22", borderRadius: 10, padding: "14px", textAlign: "center" }}>
                      <p style={{ color: "#22C55E", fontWeight: 800, fontSize: 15, margin: "0 0 4px" }}>
                        ✅ {t(lang, "thankYouWorkDone", "Obrigado. Presença registada!")}
                      </p>
                      <p style={{ color: subtext, fontSize: 12, margin: 0 }}>{t(lang, "registeredAt", "Registado às")} {format(new Date(), "HH:mm")}</p>
                    </div>
                  ) : !showKeypad ? (
                    <button onClick={() => setShowKeypad(true)}
                      style={{ width: "100%", background: "#3B82F622", color: "#3B82F6", border: "1px solid #3B82F644", borderRadius: 12, padding: "11px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      {t(lang, "enterEmployerPin", "Inserir PIN do Empregador")}
                    </button>
                  ) : (
                    <>
                      <PinKeypad value={pinInput} onChange={setPinInput} isDark={isDark} surface={isDark?"#1A1A1A":"#FFF"} text={text} onConfirm={handleConfirmPin} />
                      <button onClick={() => { setShowKeypad(false); setPinInput(""); }}
                        style={{ width: "100%", marginTop: 6, background: "transparent", color: subtext, border: `1px solid ${border}`, borderRadius: 10, padding: "8px", fontSize: 12, cursor: "pointer" }}>
                        {t(lang, "cancel", "Cancelar")}
                      </button>
                    </>
                  )}
                </div>

                {/* PIN de finalização (worker gera e envia ao employer) */}
                <div style={{ background: isDark ? "#0D0D0D" : "#F0F0F0", borderRadius: 12, padding: 14 }}>
                  <p style={{ color: text, fontWeight: 700, fontSize: 13, margin: "0 0 8px" }}>🏁 {t(lang, "finishJob", "Finalizar Obra")}</p>
                  {!showFinishPin ? (
                    <button onClick={async () => {
                      setShowFinishPin(true);
                      try {
                        await Notification.create({
                          user_id: job.employer_id, type: "completion_pin",
                          title: "🏁 PIN de conclusão recebido!",
                          message: `PIN de conclusão para "${job.title}": ${completionPin} — Vai a Trabalhos → Em Curso e insere este código para finalizar.`,
                          related_id: job.id, read: false
                        });
                        playPing();
                        sendBrowserPush("KANDU — Obra Concluída! 🏁", `PIN: ${completionPin} — "${job.title}". Insere no app para finalizar.`);
                      } catch(_) {}
                    }}
                      style={{ width: "100%", background: "#22C55E22", color: "#22C55E", border: "1px solid #22C55E44", borderRadius: 12, padding: "11px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      {t(lang, "generatePinNotifyEmployer", "Gerar PIN de Conclusão e Notificar Empregador")}
                    </button>
                  ) : (
                    <>
                      <CompletionPinDisplay pin={completionPin} countdown={finishCountdown} isDark={isDark} employerName={employer?.full_name} />
                      <button onClick={() => setShowFinishPin(false)}
                        style={{ width: "100%", marginTop: 4, background: "transparent", color: subtext,
                          border: `1px solid ${border}`, borderRadius: 10, padding: "8px", fontSize: 12, cursor: "pointer" }}>
                        {t(lang, "closePin", "Fechar PIN")}
                      </button>
                    </>
                  )}
                </div>

                {/* #16 / #28 — denunciar anúncio falso ou abrir reclamação */}
                <button onClick={() => navigate(`${createPageUrl("Complaints")}?jobId=${job.id}`)}
                  style={{ width: "100%", marginTop: 10, background: "transparent", color: "#EF4444", border: "1px solid #EF444444", borderRadius: 12, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Flag size={14} /> {t(lang, "reportProblem", "Reportar problema com a obra")}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {completion && completion.job && (
        <CompletionModal
          job={completion.job} application={completion.application || {}}
          otherUser={completion.otherUser || {}} currentUser={user}
          onClose={() => setCompletion(null)}
          onComplete={() => { setCompletion(null); onReload(); }}
        />
      )}
    </>
  );
}

// ─── Obra guardada (#40) ──────────────────────────────────────────────────────
function SavedJobCard({ job, user, onReload, text, subtext, border }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [removing, setRemoving] = useState(false);
  const s = STATUS_MAP[job.status] || STATUS_MAP.open;

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await toggleFavorite(user.id, "job", job.id);
      toast.success("Removida dos guardados");
      onReload();
    } catch (e) {
      toast.error("Erro ao remover: " + (e.message || ""));
      setRemoving(false);
    }
  };

  return (
    <div style={{ background: "var(--surface2)", borderRadius: 16, border: `1px solid ${border}`, borderLeft: `4px solid ${s.color}`, marginBottom: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: text, margin: "0 0 4px" }}>{job.title}</p>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: subtext, display: "flex", alignItems: "center", gap: 3 }}>
              <MapPin size={11} />{job.location}
            </span>
            <span style={{ color: "#FF6600", fontWeight: 800, fontSize: 14 }}>€{job.price}</span>
            <span style={{ background: s.color + "22", color: s.color, borderRadius: 20, padding: "3px 9px", fontSize: 11, fontWeight: 700 }}>
              {statusLabel(lang, s)}
            </span>
          </div>
        </div>
        <button onClick={handleRemove} disabled={removing} aria-label="Remover dos guardados"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0, lineHeight: 0 }}>
          <Heart size={20} color="#EF4444" fill="#EF4444" />
        </button>
      </div>
      <button onClick={() => navigate(createPageUrl("Home"))}
        style={{ width: "100%", marginTop: 12, background: "#FF660022", color: "#FF6600", border: "1px solid #FF660055", borderRadius: 10, padding: "9px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
        Ver no mapa →
      </button>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function MyJobs() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { lang } = useLanguage();
  const bg      = "var(--base)";
  const surface = "var(--surface2)";
  const text    = "var(--text)";
  const subtext = "var(--text2)";
  const border  = isDark ? "#2A2A2A" : "#E5E5E5";

  const [user,         setUser]         = useState(null);
  const [jobs,         setJobs]         = useState([]);
  const [applications, setApplications] = useState([]);
  const [usersById,    setUsersById]    = useState({});
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState("pending");
  const [savedJobs,    setSavedJobs]    = useState([]);   // #40 — guardados

  const loadData = useCallback(async () => {
    setLoading(true);
    // Timeout de segurança — garante que o loading nunca fica preso
    const safetyTimer = setTimeout(() => setLoading(false), 10000);
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

      // Carregar users referenciados — com timeout individual por fetch
      const userIds = [...new Set([
        ...jobList.map(j => j.employer_id).filter(Boolean),
        ...jobList.map(j => j.worker_id).filter(Boolean),
        ...appList.map(a => a.worker_id).filter(Boolean),
        ...appList.map(a => a.employer_id).filter(Boolean),
      ])];
      // #40 — obras guardadas (favoritos)
      try {
        const favs = await listFavorites(cu.id, "job");
        const favJobs = await Promise.all(favs.map(f => Job.get(f.target_id).catch(() => null)));
        setSavedJobs(favJobs.filter(Boolean));
      } catch { setSavedJobs([]); }

      if (userIds.length) {
        const userMap = {};
        const fetchWithTimeout = (uid) => {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 5000);
          return fetch('/api/functions/getUserById', {
            method: 'POST',
            signal: ctrl.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: uid })
          })
          .then(r => r.ok ? r.json() : null)
          .then(data => { clearTimeout(t); if (data?.id) userMap[data.id] = data; })
          .catch(() => clearTimeout(t));
        };
        await Promise.all(userIds.map(fetchWithTimeout));
        setUsersById(userMap);
      }
    } catch(e) { console.error('loadData error:', e); }
    clearTimeout(safetyTimer);
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
    ? jobs.filter(j => (j.status === "in_progress" || j.status === "completed_by_employer") && j.worker_id === user.id)
    : jobs.filter(j => ["in_progress","completed_by_employer"].includes(j.status));

  const historyJobs = !user ? [] : jobs.filter(j => ["completed","cancelled"].includes(j.status));
  const draftJobs   = !user ? [] : jobs.filter(j => j.status === "draft");

  const TABS = [
    { id: "pending", label: isWorker ? t(lang,"applications") : t(lang,"published","Publicadas"), icon: isWorker ? "📋" : "📢", count: pendingJobs.length },
    { id: "active",  label: t(lang,"statusInProgress","Em Curso"), icon: "🔨", count: activeJobs.length  },
    // #53 — rascunhos (só fazem sentido para quem publica)
    ...(isEmployer ? [{ id: "drafts", label: t(lang,"drafts","Rascunhos"), icon: "📝", count: draftJobs.length }] : []),
    // #40 — guardados
    { id: "saved",   label: t(lang,"saved","Guardados"), icon: "❤️", count: savedJobs.length },
    { id: "history", label: t(lang,"history","Histórico"), icon: "🏆", count: historyJobs.length },
  ];

  const currentData =
    tab === "pending" ? pendingJobs :
    tab === "active"  ? activeJobs :
    tab === "drafts"  ? draftJobs :
    tab === "saved"   ? savedJobs :
    historyJobs;

  if (loading) return <LoadingScreen />;

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
            <p style={{ margin: 0, fontSize: 12, color: subtext }}>{t(lang, "management", "Gestão")}</p>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: text }}>{t(lang, "workTitle", "Trabalho")}</h1>
          </div>
          {isEmployer && (
            <button onClick={() => navigate(createPageUrl("NewJob"))}
              style={{ background: "#FF6600", border: "none", borderRadius: 50, padding: "10px 16px", color: "#FFF", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={15} /> {t(lang, "publishJob", "Publicar Obra")}
            </button>
          )}
        </div>
      </div>

      {/* Tab buttons grandes */}
      <div style={{ padding: "16px 16px 0", display: "flex", gap: 8, overflowX: "auto" }}>
        {TABS.map(tabItem => {
          const active = tab === tabItem.id;
          return (
            <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
              style={{ flex: "1 0 auto", minWidth: 78, padding: "14px 6px", borderRadius: 16, border: `2px solid ${active ? "#FF6600" : border}`,
                background: active ? "#FF6600" : surface, color: active ? "#FFF" : subtext, cursor: "pointer", textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 3 }}>{tabItem.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{tabItem.label}</div>
              {tabItem.count > 0 && (
                <div style={{ marginTop: 3, background: active ? "#FFF3" : "#FF660033", color: active ? "#FFF" : "#FF6600",
                  borderRadius: 10, padding: "2px 8px", fontSize: 11, fontWeight: 800, display: "inline-block" }}>{tabItem.count}</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <div style={{ padding: "16px 16px 0" }}>
        {currentData.length === 0 ? (
          <div style={{ background: "var(--surface2)", borderRadius: 16, border: "1px solid var(--hair)", boxShadow: "inset 0 1.5px 0 var(--edge-hi), 0 8px 24px -16px var(--shadow)", padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>{TABS.find(tabItem=>tabItem.id===tab)?.icon}</div>
            <p style={{ color: subtext, fontWeight: 700, fontSize: 15, margin: "0 0 6px" }}>
              {tab === "pending"
                ? (isWorker ? t(lang, "noPendingApplications", "Nenhuma candidatura pendente") : t(lang, "noPublishedJobs", "Nenhuma obra publicada"))
                : tab === "active" ? t(lang, "noActiveJobs", "Nenhum trabalho em curso")
                : tab === "drafts" ? t(lang, "noDrafts", "Nenhum rascunho guardado")
                : tab === "saved"  ? t(lang, "noSaved", "Nada guardado ainda")
                : t(lang, "emptyHistory", "Histórico vazio")}
            </p>
            {tab === "pending" && isWorker && (
              <button onClick={() => navigate(createPageUrl("Home"))}
                style={{ background: "#FF6600", border: "none", borderRadius: 12, padding: "12px 24px", color: "#FFF", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 10 }}>
                🗺️ {t(lang, "exploreJobs", "Explorar Obras")}
              </button>
            )}
            {tab === "pending" && isEmployer && (
              <button onClick={() => navigate(createPageUrl("NewJob"))}
                style={{ background: "#FF6600", border: "none", borderRadius: 12, padding: "12px 24px", color: "#FFF", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 10 }}>
                + {t(lang, "publishJob", "Publicar Obra")}
              </button>
            )}
          </div>
        ) : tab === "saved" ? (
          currentData.map(job => (
            <SavedJobCard key={job.id} job={job} user={user} onReload={loadData}
              text={text} subtext={subtext} border={border} />
          ))
        ) : isEmployer ? (
          currentData.map(job => (
            <EmployerJobCard key={job.id} job={job} applications={applications} user={user} usersById={usersById}
              onReload={loadData} isDark={isDark} surface={surface} text={text} subtext={subtext} border={border} />
          ))
        ) : (
          currentData.map(job => (
            <WorkerJobCard key={job.id} job={job} usersById={usersById}
              application={applications.find(a => a.job_id === job.id && a.worker_id === user.id)}
              user={user} onReload={loadData} isDark={isDark} surface={surface} text={text} subtext={subtext} border={border} />
          ))
        )}
      </div>
    </div>
  );
}