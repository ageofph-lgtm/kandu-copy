import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Job, User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import LoadingScreen from "@/components/LoadingScreen";
import { UploadFile } from "@/api/integrations";
import { validateFile, DOC_MIME_TYPES } from "@/lib/validation";
import { COMPLAINT_TYPES, fileComplaint, listMyComplaints } from "@/lib/complaints";
import { AlertTriangle, Upload, Loader2, ShieldAlert, ArrowLeft } from "lucide-react";

const STATUS_LABEL = {
  open:      { label: "Em análise",  color: "#F59E0B" },
  reviewing: { label: "Em revisão",  color: "#3B82F6" },
  resolved:  { label: "Resolvida",   color: "#22C55E" },
  dismissed: { label: "Arquivada",   color: "#8A909A" },
};

/**
 * Página de Reclamações (#28).
 *
 * · Acessível a partir de obras com anúncio; desativada em Direct Chat (sem
 *   obra associada não há contexto para o suporte investigar).
 * · Permite anexar evidência (#79).
 * · Submeter bloqueia a obra para revisão do suporte (#80).
 */
export default function Complaints() {
  const navigate = useNavigate();
  const jobId = new URLSearchParams(window.location.search).get("jobId");

  const [user, setUser] = useState(null);
  const [job, setJob] = useState(null);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [type, setType] = useState("complaint");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await User.me();
      setUser(me);
      if (jobId) {
        const j = await Job.get(jobId);
        setJob(j);
      }
      setMine(await listMyComplaints(me.id).catch(() => []));
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível carregar as reclamações.");
    }
    setLoading(false);
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  const handleEvidence = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const check = validateFile(file, { accept: DOC_MIME_TYPES });
    if (!check.ok) { toast.error(check.error); return; }
    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setEvidence({ url: file_url, name: file.name });
      toast.success("Evidência anexada ✓");
    } catch (err) {
      toast.error("Erro ao enviar a evidência: " + (err.message || ""));
    }
    setUploading(false);
  };

  const otherPartyId = job
    ? (job.employer_id === user?.id ? job.worker_id : job.employer_id)
    : null;

  const handleSubmit = async () => {
    if (!reason.trim()) { toast.error("Indica o motivo da reclamação."); return; }
    if (description.trim().length < 20) {
      toast.error("Descreve o que aconteceu com pelo menos 20 caracteres.");
      return;
    }
    const meta = COMPLAINT_TYPES.find(c => c.value === type);
    if (meta.penalty > 0 && !window.confirm(
      `Esta denúncia aplica uma penalização automática de ${meta.penalty} XP à outra parte ` +
      `e bloqueia a obra até o suporte analisar.\n\nConfirmas?`
    )) return;

    setSubmitting(true);
    try {
      await fileComplaint({
        reporterId: user.id,
        type,
        jobId: job?.id || null,
        reportedId: otherPartyId,
        reason: reason.trim(),
        description: description.trim(),
        evidenceUrl: evidence?.url || null,
      });
      toast.success("Reclamação submetida. A obra ficou bloqueada até revisão do suporte.");
      setReason(""); setDescription(""); setEvidence(null);
      await load();
    } catch (e) {
      toast.error(e.message || "Não foi possível submeter a reclamação.");
    }
    setSubmitting(false);
  };

  if (loading) return <LoadingScreen />;

  const bg = "var(--base)", surface = "var(--surface2)", text = "var(--text)";
  const subtext = "var(--text2)", border = "var(--hair)";
  const card = { background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: 16 };
  const input = {
    width: "100%", padding: "11px 13px", borderRadius: 10, border: `1px solid ${border}`,
    background: bg, color: text, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  };

  return (
    <div style={{ background: bg, minHeight: "100vh", paddingBottom: 90 }}>
      <div style={{ background: surface, borderBottom: `1px solid ${border}`, padding: "50px 20px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate(-1)} aria-label="Voltar"
          style={{ background: "none", border: "none", color: "#FF6600", cursor: "pointer", padding: 0, display: "flex" }}>
          <ArrowLeft size={22} />
        </button>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: subtext }}>Suporte</p>
          <h1 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: text }}>Reclamações</h1>
        </div>
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Sem obra associada → Direct Chat: formulário desativado (#28) */}
        {!job ? (
          <div style={{ ...card, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <ShieldAlert size={20} color="#F59E0B" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: text, fontSize: 14 }}>
                Reclamações só estão disponíveis em obras com anúncio
              </p>
              <p style={{ margin: "4px 0 0", color: subtext, fontSize: 13, lineHeight: 1.5 }}>
                Numa conversa direta (Direct Chat) não existe contrato nem anúncio que o suporte
                possa analisar. Abre a obra em <strong>Trabalho</strong> e usa o botão “Reclamar”.
              </p>
              <button onClick={() => navigate(createPageUrl("MyJobs"))}
                style={{ marginTop: 12, background: "#FF6600", border: "none", borderRadius: 10, padding: "10px 18px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Ir para Trabalho
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ ...card, borderColor: "#FF660055" }}>
              <p style={{ margin: 0, fontSize: 12, color: subtext, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Obra</p>
              <p style={{ margin: "4px 0 0", fontWeight: 700, color: "#FF6600", fontSize: 15 }}>{job.title}</p>
              <p style={{ margin: "2px 0 0", color: subtext, fontSize: 13 }}>📍 {job.location} · €{job.price}</p>
              {job.blocked_by_complaint && (
                <p style={{ margin: "10px 0 0", color: "#F59E0B", fontSize: 12, fontWeight: 600 }}>
                  ⏸ Esta obra já está bloqueada para revisão do suporte.
                </p>
              )}
            </div>

            <div style={card}>
              <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 14, color: text }}>Tipo de ocorrência</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {COMPLAINT_TYPES.map(opt => (
                  <button key={opt.value} onClick={() => setType(opt.value)}
                    style={{
                      textAlign: "left", padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                      border: `2px solid ${type === opt.value ? "#FF6600" : border}`,
                      background: type === opt.value ? "#FF660011" : bg,
                      display: "flex", gap: 12, alignItems: "center", fontFamily: "inherit",
                    }}>
                    <span style={{ fontSize: 22 }}>{opt.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: text }}>{opt.label}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: subtext }}>{opt.description}</p>
                    </div>
                    {opt.penalty > 0 && (
                      <span style={{ background: "#EF444422", color: "#EF4444", fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 20, flexShrink: 0 }}>
                        −{opt.penalty} XP
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ ...card, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label htmlFor="reason" style={{ display: "block", fontSize: 12, fontWeight: 700, color: subtext, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.6 }}>
                  Motivo *
                </label>
                <input id="reason" style={input} value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="Ex: O trabalho não foi concluído conforme combinado" maxLength={120} />
              </div>

              <div>
                <label htmlFor="desc" style={{ display: "block", fontSize: 12, fontWeight: 700, color: subtext, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.6 }}>
                  Descrição * <span style={{ textTransform: "none", fontWeight: 400 }}>({description.length}/1000)</span>
                </label>
                <textarea id="desc" rows={5} maxLength={1000} value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{ ...input, resize: "vertical" }}
                  placeholder="Descreve o que aconteceu, com datas e detalhes concretos..." />
              </div>

              {/* #79 — upload de evidência */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: subtext, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.6 }}>
                  Evidência (opcional)
                </label>
                <input ref={fileRef} type="file" accept="application/pdf,image/jpeg,image/png"
                  onChange={handleEvidence} style={{ display: "none" }} />
                {evidence ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px" }}>
                    <span style={{ fontSize: 18 }}>📎</span>
                    <span style={{ flex: 1, fontSize: 13, color: text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{evidence.name}</span>
                    <button onClick={() => setEvidence(null)}
                      style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: 13 }}>Remover</button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: bg, border: `1px dashed ${border}`, borderRadius: 10, padding: "12px", color: subtext, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                    {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                    {uploading ? "A enviar..." : "Anexar foto ou PDF"}
                  </button>
                )}
              </div>

              <div style={{ background: "#F59E0B15", border: "1px solid #F59E0B44", borderRadius: 10, padding: "10px 12px", display: "flex", gap: 8 }}>
                <AlertTriangle size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 12, color: "#F59E0B", lineHeight: 1.5 }}>
                  Ao submeter, a obra fica <strong>bloqueada</strong> até o suporte analisar o caso.
                  Denúncias falsas podem levar a penalizações na tua própria conta.
                </p>
              </div>

              <button onClick={handleSubmit} disabled={submitting}
                style={{
                  width: "100%", padding: 14, borderRadius: 12, border: "none",
                  background: submitting ? "#555" : "#EF4444", color: "#fff",
                  fontWeight: 800, fontSize: 15, cursor: submitting ? "not-allowed" : "pointer",
                }}>
                {submitting ? "A submeter..." : "Submeter reclamação"}
              </button>
            </div>
          </>
        )}

        {/* Histórico */}
        {mine.length > 0 && (
          <div style={card}>
            <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14, color: text }}>As minhas reclamações</p>
            {mine.map(c => {
              const st = STATUS_LABEL[c.status] || STATUS_LABEL.open;
              const meta = COMPLAINT_TYPES.find(x => x.value === c.type);
              return (
                <div key={c.id} style={{ borderTop: `1px solid ${border}`, padding: "12px 0", display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{meta?.icon || "⚠️"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: text }}>{c.reason || meta?.label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: subtext }}>
                      {new Date(c.created_at).toLocaleDateString("pt-PT")}
                      {c.xp_penalty > 0 && ` · −${c.xp_penalty} XP aplicados`}
                    </p>
                  </div>
                  <span style={{ background: st.color + "22", color: st.color, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, height: "fit-content", flexShrink: 0 }}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
