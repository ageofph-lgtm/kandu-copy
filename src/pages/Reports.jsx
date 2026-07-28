import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Job, Notification, Report, User } from "@/api/entities";
import { supabase } from "@/api/supabaseClient";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";
import LoadingScreen from "@/components/LoadingScreen";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { ShieldAlert, Upload, X } from "lucide-react";

// Penalização automática aplicada ao denunciado (#14, #16)
export const XP_PENALTY = 1000;

const REPORT_TYPES = [
  { value: "no_show",   emoji: "🚫", key: "reportNoShow",    pt: "Não compareceu",     penalty: XP_PENALTY },
  { value: "fake_job",  emoji: "🎭", key: "reportFakeJob",   pt: "Obra falsa",         penalty: XP_PENALTY },
  { value: "payment",   emoji: "💸", key: "reportPayment",   pt: "Problema de pagamento", penalty: 0 },
  { value: "behaviour", emoji: "⚠️", key: "reportBehaviour", pt: "Comportamento",      penalty: 0 },
  { value: "other",     emoji: "📄", key: "reportOther",     pt: "Outro",              penalty: 0 },
];

const STATUS_LABELS = {
  open:      { key: "reportOpen",      pt: "Em aberto",  color: "#F59E0B" },
  reviewing: { key: "reportReviewing", pt: "Em análise", color: "#3B82F6" },
  resolved:  { key: "reportResolved",  pt: "Resolvida",  color: "#22C55E" },
  dismissed: { key: "reportDismissed", pt: "Arquivada",  color: "#888888" },
};

const ALLOWED_EVIDENCE = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

/** Retira XP ao denunciado sem nunca descer abaixo de zero */
async function applyPenalty(userId, amount) {
  if (!userId || !amount) return;
  const target = await User.get(userId).catch(() => null);
  if (!target) return;
  await User.update(userId, { xp: Math.max(0, (target.xp || 0) - amount) }).catch(err =>
    console.error("XP penalty failed:", err)
  );
}

export default function Reports() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const bg = "var(--base)";
  const surface = "var(--surface2)";
  const text = "var(--text)";
  const subtext = "var(--text2)";
  const border = "var(--hair)";

  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [jobsById, setJobsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [evidence, setEvidence] = useState([]);
  const evidenceInputRef = useRef(null);

  // Pré-preenchimento vindo do botão "Denunciar" (?jobId=&reportedId=&type=)
  const params = new URLSearchParams(window.location.search);
  const [form, setForm] = useState({
    type: params.get("type") || "",
    job_id: params.get("jobId") || "",
    reported_id: params.get("reportedId") || "",
    description: "",
  });

  const loadData = useCallback(async () => {
    try {
      const me = await User.me();
      if (!me) { navigate(createPageUrl("Login")); return; }
      setUser(me);

      const mine = await Report.filter({ reporter_id: me.id });
      setReports(mine);

      const jobIds = [...new Set(mine.map(r => r.job_id).filter(Boolean))];
      const jobs = await Promise.all(jobIds.map(id => Job.get(id).catch(() => null)));
      setJobsById(Object.fromEntries(jobs.filter(Boolean).map(j => [j.id, j])));
    } catch (err) {
      // A tabela pode ainda não existir na base de dados
      console.error("Reports load error:", err);
      setTableMissing(true);
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleEvidenceAdd = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const invalid = files.find(f => !ALLOWED_EVIDENCE.includes(f.type));
    if (invalid) {
      toast.error(t(lang, "evidenceFormatError", "Só são aceites JPG, PNG ou PDF."));
      return;
    }
    setEvidence(prev => [...prev, ...files]);
  };

  const uploadEvidence = async () => {
    const urls = [];
    for (const [i, file] of evidence.entries()) {
      const ext = (file.name.split(".").pop() || "bin").toLowerCase();
      const path = `reports/${user.id}_${Date.now()}_${i}.${ext}`;
      const { error } = await supabase.storage
        .from("kandu-uploads")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("kandu-uploads").getPublicUrl(path);
      urls.push(publicUrl);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!form.type) { toast.error(t(lang, "reportTypeRequired", "Escolhe o motivo da denúncia.")); return; }
    if (form.description.trim().length < 20) {
      toast.error(t(lang, "reportDescriptionShort", "Descreve o que aconteceu (mínimo 20 caracteres)."));
      return;
    }

    setSubmitting(true);
    try {
      const evidenceUrls = evidence.length ? await uploadEvidence() : [];
      const penalty = REPORT_TYPES.find(rt => rt.value === form.type)?.penalty || 0;

      await Report.create({
        reporter_id: user.id,
        reported_id: form.reported_id || null,
        job_id: form.job_id || null,
        type: form.type,
        description: form.description.trim(),
        evidence_urls: evidenceUrls,
        xp_penalty: penalty,
      });

      // Falta de comparência e obra falsa custam XP a quem foi denunciado
      if (penalty && form.reported_id) await applyPenalty(form.reported_id, penalty);

      // Uma obra denunciada como falsa fica bloqueada até haver decisão
      if (form.type === "fake_job" && form.job_id) {
        await Job.update(form.job_id, { status: "cancelled" }).catch(err =>
          console.error("Blocking reported job failed:", err)
        );
      }

      if (form.reported_id) {
        await Notification.create({
          user_id: form.reported_id,
          type: "report_received",
          title: "⚠️ Denúncia recebida",
          message: penalty
            ? `Foi registada uma denúncia sobre ti (−${penalty} XP). A equipa KANDU vai analisar.`
            : "Foi registada uma denúncia sobre ti. A equipa KANDU vai analisar.",
          related_id: form.job_id || null,
          read: false,
        }).catch(() => {});
      }

      toast.success(t(lang, "reportSubmitted", "Denúncia enviada. Vamos analisar."));
      setForm({ type: "", job_id: "", reported_id: "", description: "" });
      setEvidence([]);
      await loadData();
    } catch (err) {
      console.error("Report submit error:", err);
      toast.error(t(lang, "reportSubmitError", "Não foi possível enviar a denúncia."));
    }
    setSubmitting(false);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ background: bg, minHeight: "100vh", paddingBottom: 90 }}>
      <div style={{ background: surface, borderBottom: `1px solid ${border}`, padding: "50px 20px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "#FF6600", fontSize: 22, cursor: "pointer", padding: 0 }}>←</button>
          <ShieldAlert size={20} color="#FF6600" />
          <h1 style={{ margin: 0, fontWeight: 800, fontSize: 20, color: text }}>
            {t(lang, "reportsTitle", "Denúncias")}
          </h1>
        </div>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: subtext }}>
          {t(lang, "reportsSubtitle", "Reporta faltas, obras falsas ou problemas de pagamento com provas.")}
        </p>
      </div>

      {tableMissing && (
        <div style={{ margin: "16px", background: "#EF444422", border: "1px solid #EF444455", borderRadius: 12, padding: "12px 14px" }}>
          <p style={{ margin: 0, color: "#EF4444", fontSize: 13, fontWeight: 600 }}>
            {t(lang, "reportsTableMissing", "A tabela de denúncias ainda não existe na base de dados. Aplica base44/migrations/001_reports.sql no Supabase.")}
          </p>
        </div>
      )}

      {/* Nova denúncia */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ background: surface, borderRadius: 16, border: `1px solid ${border}`, padding: 16 }}>
          <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 14, color: text }}>
            {t(lang, "newReport", "Nova denúncia")}
          </p>

          <p style={{ margin: "0 0 6px", fontSize: 11, color: subtext, fontWeight: 600 }}>
            {t(lang, "reportReason", "Motivo")}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {REPORT_TYPES.map(rt => (
              <button key={rt.value} onClick={() => setForm(f => ({ ...f, type: rt.value }))}
                className={form.type === rt.value ? "k-cat active" : "k-cat"}>
                {rt.emoji} {t(lang, rt.key, rt.pt)}
                {rt.penalty > 0 && <span style={{ fontWeight: 800 }}> −{rt.penalty} XP</span>}
              </button>
            ))}
          </div>

          <p style={{ margin: "0 0 6px", fontSize: 11, color: subtext, fontWeight: 600 }}>
            {t(lang, "whatHappened", "O que aconteceu")}
          </p>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={4}
            maxLength={1000}
            placeholder={t(lang, "reportPlaceholder", "Descreve a situação com o máximo de detalhe possível...")}
            style={{ width: "100%", boxSizing: "border-box", background: "var(--base)", border: `1px solid ${border}`, borderRadius: 12, padding: 12, color: text, fontSize: 14, fontFamily: "inherit", resize: "vertical", outline: "none" }}
          />

          {/* Provas */}
          <input ref={evidenceInputRef} type="file" multiple accept="image/jpeg,image/png,application/pdf"
            onChange={handleEvidenceAdd} style={{ display: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
            <button onClick={() => evidenceInputRef.current?.click()}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px dashed ${border}`, borderRadius: 10, padding: "8px 12px", color: subtext, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Upload size={13} /> {t(lang, "attachEvidence", "Anexar provas")}
            </button>
            {evidence.map((file, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--base)", borderRadius: 10, padding: "6px 10px", fontSize: 12, color: text }}>
                {file.name.length > 18 ? `${file.name.slice(0, 18)}…` : file.name}
                <button onClick={() => setEvidence(prev => prev.filter((_, idx) => idx !== i))}
                  style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", padding: 0, display: "flex" }}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          <button onClick={handleSubmit} disabled={submitting}
            style={{ width: "100%", background: submitting ? "#555" : "#EF4444", border: "none", borderRadius: 12, padding: "13px", color: "#FFF", fontWeight: 700, fontSize: 14, cursor: submitting ? "not-allowed" : "pointer" }}>
            {submitting ? t(lang, "sending", "A enviar...") : t(lang, "submitReport", "Enviar denúncia")}
          </button>
        </div>
      </div>

      {/* Denúncias anteriores */}
      <div style={{ padding: "16px" }}>
        <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 14, color: text }}>
          {t(lang, "myReports", "As minhas denúncias")} ({reports.length})
        </p>
        {reports.length === 0 ? (
          <div style={{ background: surface, borderRadius: 16, border: `1px solid ${border}`, padding: "32px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🛡️</div>
            <p style={{ margin: 0, color: subtext, fontSize: 13 }}>
              {t(lang, "noReports", "Ainda não fizeste nenhuma denúncia.")}
            </p>
          </div>
        ) : reports.map(report => {
          const rt = REPORT_TYPES.find(x => x.value === report.type);
          const status = STATUS_LABELS[report.status] || STATUS_LABELS.open;
          const job = report.job_id ? jobsById[report.job_id] : null;
          return (
            <div key={report.id} style={{ background: surface, borderRadius: 14, border: `1px solid ${border}`, borderLeft: `4px solid ${status.color}`, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: text }}>
                  {rt?.emoji} {t(lang, rt?.key || "reportOther", rt?.pt || report.type)}
                </span>
                <span style={{ background: status.color + "22", color: status.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                  {t(lang, status.key, status.pt)}
                </span>
              </div>
              {job && <p style={{ margin: "0 0 4px", fontSize: 12, color: "#FF6600" }}>📋 {job.title}</p>}
              <p style={{ margin: 0, fontSize: 13, color: subtext, lineHeight: 1.5 }}>{report.description}</p>
              {report.evidence_urls?.length > 0 && (
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {report.evidence_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, color: "#3B82F6", textDecoration: "underline" }}>
                      {t(lang, "evidenceN", "Prova {n}").replace("{n}", i + 1)}
                    </a>
                  ))}
                </div>
              )}
              <p style={{ margin: "8px 0 0", fontSize: 11, color: subtext }}>
                {format(new Date(report.created_at || report.created_date), "dd/MM/yyyy HH:mm")}
                {report.xp_penalty > 0 && ` · −${report.xp_penalty} XP`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
