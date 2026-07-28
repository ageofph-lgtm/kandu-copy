import { toast } from "sonner";
import { Application, ChatMessage, Notification, User } from "@/api/entities";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, Eye, Shield, X, Trash2, CheckCircle, AlertCircle, Heart, Building2, BadgeCheck } from "lucide-react";
import { toggleFavorite, isFavorite } from "@/lib/favorites";
import { VERIFICATION_LEVELS, computeVerificationLevel } from "@/lib/verification";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage, getDateLocale } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";

export default function JobModal({ job, user, onClose, onApply, onDelete, distanceKm }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState("detail"); // "detail" | "apply" | "success"
  const [applicationType, setApplicationType] = useState("application");
  const [message, setMessage] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employer, setEmployer] = useState(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // reset state when job changes
    setStep("detail");
    setMessage("");
    setProposedPrice("");
    setApplicationType("application");
    setAlreadyApplied(false);

    const fetchData = async () => {
      if (job.employer_id) {
        try {
          const res = await User.filter({ id: job.employer_id });
          if (res.length > 0) setEmployer(res[0]);
        } catch {}
      }
      if (user?.id) {
        isFavorite(user.id, "job", job.id).then(setSaved).catch(() => {});
      }
      if (user?.user_type === "worker") {
        setCheckingApplication(true);
        try {
          const existing = await Application.filter({ job_id: job.id, worker_id: user.id });
          setAlreadyApplied(existing.length > 0);
        } catch {}
        setCheckingApplication(false);
      }
    };
    fetchData();
  }, [job.id, user?.id]);

  // #40 — guardar obra em "Trabalho › Guardados"
  const handleToggleSaved = async () => {
    try {
      const next = await toggleFavorite(user.id, "job", job.id);
      setSaved(next);
      toast.success(next ? "Obra guardada ❤️" : "Removida dos guardados");
    } catch (e) {
      toast.error("Não foi possível guardar: " + (e.message || ""));
    }
  };

  const handleSubmit = async () => {
    if (!user || user.user_type !== "worker") return;
    if (!message.trim()) { toast.error(t(lang, "writeIntroMessage", "Escreve uma mensagem de apresentação.")); return; }
    if (applicationType === "proposal" && (!proposedPrice || isNaN(parseFloat(proposedPrice)))) {
      toast.error(t(lang, "enterValidProposalValue", "Insere um valor válido para a proposta.")); return;
    }

    setIsSubmitting(true);
    try {
      // guard against duplicate
      const existing = await Application.filter({ job_id: job.id, worker_id: user.id });
      if (existing.length > 0) { setAlreadyApplied(true); setStep("detail"); setIsSubmitting(false); return; }

      const payload = {
        job_id: job.id,
        worker_id: user.id,
        employer_id: job.employer_id,
        message: message.trim(),
        status: "pending",
        ...(proposedPrice
          ? { proposed_price: parseFloat(proposedPrice) }
          : {})
      };
      await Application.create(payload);

      // Efeitos secundários (notificação + mensagem inicial) — NÃO devem derrubar a candidatura
      try {
        await Notification.create({
          user_id: job.employer_id,
          type: "new_application",
          title: "📋 Nova candidatura!",
          message: `${user.full_name || user.email} candidatou-se para "${job.title}"`,
          related_id: job.id,
        });

        const chatMsg = applicationType === "application"
          ? `Olá! Candidatei-me à obra "${job.title}". ${message.trim()}`
          : `Olá! Enviei uma proposta de €${proposedPrice} para "${job.title}". ${message.trim()}`;
        await ChatMessage.create({
          job_id: job.id,
          sender_id: user.id,
          receiver_id: job.employer_id,
          content: chatMsg,
          read: false
        });
      } catch (sideErr) {
        console.error("Candidatura criada, mas falhou notificação/chat:", sideErr);
      }

      setAlreadyApplied(true);
      setStep("success");
      if (typeof onApply === "function") onApply();
    } catch (err) {
      console.error("Erro ao enviar candidatura:", err);
      const detalhe = err?.message || err?.error_description || err?.details || JSON.stringify(err);
      toast.error("Erro ao enviar candidatura: " + detalhe);
    }
    setIsSubmitting(false);
  };

  const formatPrice = (price, type) => type === "hourly" ? `€${price}${t(lang, "perHourSuffix", "/hora")}` : `€${price}`;

  const isOwner = (user?.user_type === "employer" && job.employer_id === user?.id) || user?.user_type === "admin";
  const isWorker = user?.user_type === "worker";

  return (
    /* Overlay */
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "flex-end", justifyContent: "center"
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        style={{
          position: "relative", zIndex: 1,
          background: "#FFFFFF", width: "100%", maxWidth: 540,
          borderRadius: "20px 20px 0 0", maxHeight: "92vh",
          display: "flex", flexDirection: "column",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.2)"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#DDD" }} />
        </div>

        {/* Header fixo */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 20px 12px", borderBottom: "1px solid #F0F0F0", flexShrink: 0
        }}>
          {step !== "detail" ? (
            <button
              onClick={() => setStep("detail")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 8 }}
            >
              ← {t(lang, "back", "Voltar")}
            </button>
          ) : <div style={{ width: 64 }} />}

          <h2 style={{ margin: 0, fontWeight: 800, fontSize: 16, textAlign: "center", flex: 1, padding: "0 8px" }}>
            {step === "apply" ? t(lang, "application", "Candidatura") : step === "success" ? `✅ ${t(lang, "sent", "Enviado!")}` : job.title}
          </h2>

          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {isWorker && step === "detail" && (
              <button onClick={handleToggleSaved} aria-label={saved ? "Remover dos guardados" : "Guardar obra"}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", lineHeight: 0 }}>
                <Heart size={19} color={saved ? "#EF4444" : "#666"} fill={saved ? "#EF4444" : "none"} />
              </button>
            )}
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 8, color: "#666" }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Corpo scrollável */}
        <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px 24px" }}>

          {/* ── SUCCESS ── */}
          {step === "success" && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: 60, marginBottom: 12 }}>🎉</div>
              <h3 style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 20 }}>{t(lang, "applicationSent", "Candidatura enviada!")}</h3>
              <p style={{ color: "#666", fontSize: 14, margin: "0 0 24px" }}>
                {t(lang, "applicationSentDesc", "O empregador foi notificado. Aguarda a resposta — podes acompanhar em Candidaturas.")}
              </p>
              <button
                onClick={() => { onClose(); navigate(createPageUrl("Chat")); }}
                style={{
                  background: "#FF6600", color: "#FFF", border: "none",
                  borderRadius: 14, padding: "14px 24px", fontWeight: 700,
                  fontSize: 15, cursor: "pointer", width: "100%"
                }}
              >
                💬 {t(lang, "goToChat", "Ir para o Chat")}
              </button>
              <button
                onClick={onClose}
                style={{
                  background: "none", color: "#888", border: "none",
                  marginTop: 12, cursor: "pointer", fontSize: 14
                }}
              >
                {t(lang, "close", "Fechar")}
              </button>
            </div>
          )}

          {/* ── FORMULÁRIO DE CANDIDATURA ── */}
          {step === "apply" && (
            <div>
              {/* Resumo da obra */}
              <div style={{
                background: "#FFF7F0", border: "1px solid #FFD0AA",
                borderRadius: 14, padding: "12px 16px", marginBottom: 16
              }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#111016" }}>{job.title}</p>
                <p style={{ margin: "4px 0 0", fontWeight: 800, fontSize: 18, color: "#FF6600" }}>
                  {formatPrice(job.price, job.price_type)}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888", display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={11} /> {job.location}
                </p>
              </div>

              {/* Tipo */}
              <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 14, color: "#111016" }}>{t(lang, "applicationTypeLabel", "Tipo de candidatura")}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                {[
                  { type: "application", icon: "✅", label: t(lang, "acceptPrice", "Aceito o preço"), sub: formatPrice(job.price, job.price_type) },
                  { type: "proposal", icon: "💰", label: t(lang, "makeProposal", "Fazer proposta"), sub: t(lang, "differentValue", "Valor diferente") }
                ].map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => setApplicationType(opt.type)}
                    style={{
                      border: `2px solid ${applicationType === opt.type ? "#FF6600" : "#E5E5E5"}`,
                      background: applicationType === opt.type ? "#FFF7F0" : "#FAFAFA",
                      borderRadius: 12, padding: "12px 10px", cursor: "pointer", textAlign: "center",
                      transition: "all 0.15s"
                    }}
                  >
                    <div style={{ fontSize: 22 }}>{opt.icon}</div>
                    <p style={{ margin: "4px 0 2px", fontWeight: 700, fontSize: 13, color: applicationType === opt.type ? "#FF6600" : "#111016" }}>
                      {opt.label}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{opt.sub}</p>
                  </button>
                ))}
              </div>

              {applicationType === "proposal" && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontWeight: 700, fontSize: 14, color: "#111016", marginBottom: 6 }}>
                    {t(lang, "yourValue", "O teu valor (€)")} *
                  </label>
                  <Input
                    type="number"
                    placeholder={t(lang, "examplePrice", "Ex: {price}").replace("{price}", job.price)}
                    value={proposedPrice}
                    onChange={e => setProposedPrice(e.target.value)}
                    style={{ fontSize: 18, fontWeight: 700, borderRadius: 12 }}
                  />
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: 14, color: "#111016", marginBottom: 6 }}>
                  {t(lang, "introduceYourself", "Apresenta-te ao empregador")} *
                </label>
                <Textarea
                  placeholder={t(lang, "introPlaceholder", "Ex: Tenho 5 anos de experiência nesta área...")}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                  style={{ borderRadius: 12, resize: "none" }}
                />
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#AAA" }}>{message.length}/500</p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !message.trim()}
                style={{
                  width: "100%", background: isSubmitting || !message.trim() ? "#FFB380" : "#FF6600",
                  color: "#FFF", border: "none", borderRadius: 14,
                  padding: "16px", fontWeight: 800, fontSize: 16, cursor: isSubmitting ? "not-allowed" : "pointer",
                  transition: "background 0.15s"
                }}
              >
                {isSubmitting ? t(lang, "sending", "A enviar...") : `${t(lang, "sendApplication", "Enviar Candidatura")} →`}
              </button>
            </div>
          )}

          {/* ── DETALHE DA OBRA ── */}
          {step === "detail" && (
            <div>
              {/* Preço + badges */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  <span style={{ background: "#F0F0F0", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600, color: "#444" }}>
                    {job.category}
                  </span>
                  <span style={{
                    borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600,
                    background: job.status === "open" ? "#D1FAE5" : "#E5E7EB",
                    color: job.status === "open" ? "#065F46" : "#4B5563"
                  }}>
                    {job.status === "open" ? `🟢 ${t(lang, "available", "Disponível")}` : job.status === "in_progress" ? `🔵 ${t(lang, "inProgress", "Em Curso")}` : `✅ ${t(lang, "completed", "Concluído")}`}
                  </span>
                  {job.urgency === "high" && (
                    <span style={{ background: "#FEE2E2", color: "#991B1B", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
                      🔥 {t(lang, "urgent", "Urgente")}
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 32, fontWeight: 900, color: "#FF6600" }}>
                  {formatPrice(job.price, job.price_type)}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#666", fontSize: 14, marginBottom: 8 }}>
                <MapPin size={15} color="#FF6600" />
                {job.location}
                {distanceKm !== null && distanceKm !== undefined && (
                  <span style={{
                    marginLeft: 6, background: "#FFF7F0", color: "#FF6600",
                    borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700,
                    border: "1px solid #FFD0AA", flexShrink: 0
                  }}>
                    📍 {distanceKm < 1
                      ? t(lang, "metersFromYou", "{meters}m de si").replace("{meters}", Math.round(distanceKm * 1000))
                      : t(lang, "kmFromYou", "{km}km de si").replace("{km}", distanceKm.toFixed(1))}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#AAA", marginBottom: 14 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Eye size={13} /> {job.views || 0} {t(lang, "views", "views")}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={13} /> {format(new Date(job.created_date), "dd MMM, HH:mm", { locale: getDateLocale(lang) })}
                </span>
              </div>

              <div style={{ background: "#F8F8F8", borderRadius: 14, padding: 16, marginBottom: 14 }}>
                <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 13 }}>{t(lang, "description", "Descrição")}</p>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#444" }}>{job.description}</p>
              </div>

              {/* #21 — fotos da área de trabalho */}
              {Array.isArray(job.photos) && job.photos.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 13, color: "#111016" }}>
                    📷 {t(lang, "workAreaPhotos", "Área de trabalho")}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                    {job.photos.map((url, i) => (
                      <img key={url + i} src={url} alt={`Área de trabalho ${i + 1}`}
                        onClick={() => window.open(url, "_blank")}
                        style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 10, cursor: "pointer" }} />
                    ))}
                  </div>
                </div>
              )}

              {employer && (() => {
                // #51 — o profissional passa a ver os dados do Employer que o
                // wireframe (slide 9) prevê: empresa, tipo, verificação e ranking.
                const vLevel = computeVerificationLevel(employer);
                const vInfo = VERIFICATION_LEVELS[vLevel];
                return (
                  <div style={{ background: "#F8F8F8", borderRadius: 14, padding: 16, marginBottom: 14 }}>
                    <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: "#111016" }}>
                      {t(lang, "employer", "Empregador")}
                    </p>
                    <div
                      onClick={() => navigate(`${createPageUrl("Profile")}?userId=${employer.id}`)}
                      style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                    >
                      <div style={{
                        width: 48, height: 48, borderRadius: "50%", background: "#F4621F",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#FFF", fontWeight: 800, fontSize: 18, flexShrink: 0, overflow: "hidden"
                      }}>
                        {employer.avatar_url
                          ? <img src={employer.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                          : employer.full_name?.charAt(0) || "U"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, fontSize: 15 }}>{employer.full_name || t(lang, "employer", "Empregador")}</span>
                          {employer.verified && <Shield size={14} color="#22c55e" />}
                        </div>
                        {employer.company && (
                          <span style={{ fontSize: 12, color: "#666", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                            <Building2 size={11} /> {employer.company}
                            {employer.employer_type === "cia" ? " · Empresa registada" : " · Cliente particular"}
                          </span>
                        )}
                        <span style={{ fontSize: 12, color: "#888" }}>
                          ⭐ {employer.rating ? Number(employer.rating).toFixed(1) : "Sem avaliações"}
                          {employer.total_reviews ? ` (${employer.total_reviews})` : ""} · {employer.city || "Portugal"}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: "#F4621F", fontWeight: 600, flexShrink: 0 }}>Ver perfil →</span>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{
                        background: vInfo.color + "22", color: vInfo.color, borderRadius: 20,
                        padding: "3px 10px", fontSize: 11, fontWeight: 700,
                        display: "inline-flex", alignItems: "center", gap: 4
                      }}>
                        <BadgeCheck size={11} /> {vInfo.label}
                      </span>
                      <span style={{ background: "#EEE", color: "#555", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                        {employer.completed_jobs || 0} obras concluídas
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onClose(); navigate(`${createPageUrl("Chat")}?userId=${employer.id}`); }}
                        style={{
                          marginLeft: "auto", background: "#FFF7F0", border: "1px solid #FFD0AA",
                          borderRadius: 10, padding: "6px 12px", cursor: "pointer",
                          fontSize: 12, fontWeight: 600, color: "#FF6600", flexShrink: 0
                        }}
                      >
                        💬 {t(lang, "chat", "Chat")}
                      </button>
                    </div>

                    {/* #67 — contactos protegidos até haver aceitação formal */}
                    <p style={{ margin: "10px 0 0", fontSize: 11, color: "#999", lineHeight: 1.5 }}>
                      🔒 Os contactos diretos ficam disponíveis depois de a candidatura ser aceite.
                    </p>
                  </div>
                );
              })()}

              {/* CTA Profissional */}
              {isWorker && job.status === "open" && (
                <div style={{ marginTop: 8 }}>
                  {checkingApplication ? (
                    <p style={{ textAlign: "center", color: "#AAA", fontSize: 13 }}>{t(lang, "verifying", "A verificar...")}</p>
                  ) : alreadyApplied ? (
                    <div style={{
                      background: "#F0FDF4", border: "1px solid #86EFAC",
                      borderRadius: 14, padding: "14px 16px",
                      display: "flex", alignItems: "center", gap: 10
                    }}>
                      <CheckCircle size={20} color="#22c55e" />
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: "#15803D", fontSize: 14 }}>{t(lang, "applicationSent", "Candidatura enviada")}</p>
                        <p style={{ margin: 0, fontSize: 12, color: "#166534" }}>{t(lang, "awaitingEmployerResponse", "Aguarda resposta do empregador")}</p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setStep("apply")}
                      style={{
                        width: "100%", background: "#FF6600", color: "#FFF", border: "none",
                        borderRadius: 14, padding: "16px", fontWeight: 800, fontSize: 17,
                        cursor: "pointer", boxShadow: "0 6px 20px rgba(255,102,0,0.35)",
                        transition: "transform 0.1s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    >
                      {t(lang, "applyMe", "Candidatar-me")} →
                    </button>
                  )}
                </div>
              )}

              {isWorker && job.status !== "open" && (
                <div style={{
                  background: "#F5F5F5", border: "1px solid #E5E5E5",
                  borderRadius: 14, padding: "14px 16px",
                  display: "flex", alignItems: "center", gap: 10
                }}>
                  <AlertCircle size={18} color="#9CA3AF" />
                  <p style={{ margin: 0, color: "#6B7280", fontSize: 14 }}>{t(lang, "jobNoLongerAvailable", "Esta obra já não está disponível.")}</p>
                </div>
              )}

              {/* CTA Empregador */}
              {isOwner && (
                <div style={{ marginTop: 16, borderTop: "1px solid #F0F0F0", paddingTop: 14, display: "flex", gap: 10 }}>
                  <button
                    onClick={() => { onClose(); navigate(createPageUrl("Applications")); }}
                    style={{
                      flex: 1, background: "#FF6600", color: "#FFF", border: "none",
                      borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer"
                    }}
                  >
                    {t(lang, "viewApplications", "Ver Candidaturas")}
                  </button>
                  <button
                    onClick={() => { if (typeof onDelete === "function") onDelete(job.id); }}
                    style={{
                      background: "#FEE2E2", color: "#DC2626", border: "none",
                      borderRadius: 12, padding: "12px 16px", cursor: "pointer"
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* iOS safe area */}
        <div style={{ height: "env(safe-area-inset-bottom, 0px)", flexShrink: 0 }} />
      </div>
    </div>
  );
}
