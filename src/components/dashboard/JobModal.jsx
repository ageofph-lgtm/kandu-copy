import React, { useState, useEffect } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { Application } from "@/entities/Application";
import { Notification } from "@/entities/Notification";
import { ChatMessage } from "@/entities/ChatMessage";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Euro, Clock, Eye, Star, Shield, Send, MessageCircle, X, User as UserIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function JobModal({ job, user, onClose, onApply, onDelete }) {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const bg = isDark ? "#1A1A1A" : "#FFFFFF";
  const surface = isDark ? "#2A2A2A" : "#F5F5F5";
  const surface2 = isDark ? "#1E1E1E" : "#EBEBEB";
  const text = isDark ? "#FFFFFF" : "#1A1A1A";
  const subtext = isDark ? "#AAAAAA" : "#666666";
  const border = isDark ? "#333333" : "#E5E5E5";
  const [applicationType, setApplicationType] = useState(null);
  const [message, setMessage] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employer, setEmployer] = useState(null);

  useEffect(() => {
    const fetchEmployer = async () => {
      if (job.employer_id) {
        try {
          const employerData = await User.filter({ id: job.employer_id });
          if (employerData.length > 0) setEmployer(employerData[0]);
        } catch (e) {
          console.error("Failed to fetch employer by ID", e);
        }
      }
    };
    fetchEmployer();
  }, [job]);

  const createConversationId = (userId1, userId2) => [userId1, userId2].sort().join('_');

  const handleSubmit = async () => {
    if (!user) { alert("Precisa de fazer login para candidatar-se"); return; }
    if (user.user_type !== "worker") { alert("Apenas profissionais podem candidatar-se a obras"); return; }
    if (!message.trim()) { alert("Por favor, escreva uma mensagem"); return; }
    if (!job.employer_id) { alert("Não foi possível identificar o empregador desta obra."); return; }

    setIsSubmitting(true);
    
    try {
      const existingApplications = await Application.filter({ job_id: job.id, worker_id: user.id });
      if (existingApplications.length > 0) {
        alert("Já se candidatou a esta obra!");
        setIsSubmitting(false);
        return;
      }

      const applicationData = { job_id: job.id, worker_id: user.id, message: message.trim(), application_type: applicationType, status: "pending" };
      if (applicationType === "proposal" && proposedPrice) {
        applicationData.proposed_price = parseFloat(proposedPrice);
      }
      await Application.create(applicationData);

      await Notification.create({
        user_id: job.employer_id,
        type: applicationType === "application" ? "new_application" : "new_proposal",
        title: applicationType === "application" ? "📋 Nova candidatura!" : "💰 Nova proposta!",
        message: `${user.full_name || user.email} ${applicationType === "application" ? "candidatou-se" : "enviou uma proposta"} para a obra "${job.title}"`,
        related_id: job.id,
        action_url: createPageUrl("Applications"),
      });

      const conversationId = createConversationId(user.id, job.employer_id);
      const initialMessage = applicationType === "application" 
        ? `Olá! Candidatei-me à obra "${job.title}". ${message}`
        : `Olá! Enviei uma proposta para a obra "${job.title}" no valor de €${proposedPrice}. ${message}`;
      await ChatMessage.create({ conversation_id: conversationId, sender_id: user.id, receiver_id: job.employer_id, message: initialMessage, is_read: false });

      alert("Candidatura enviada com sucesso!");
      onApply();
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Erro ao enviar candidatura.");
    }
    
    setIsSubmitting(false);
  };

  const handleOpenChat = () => { 
    if (!employer) return; 
    onClose(); 
    // Criar conversa se não existir e navegar
    const conversationId = createConversationId(user.id, employer.id);
    navigate(createPageUrl("Chat") + `?conversationId=${conversationId}&userId=${employer.id}`);
  };
  const formatPrice = (price, type) => type === "hourly" ? `€${price}/hora` : `€${price}`;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent style={{ background: bg, border: `1px solid ${border}`, borderRadius: 20, maxWidth: 480, maxHeight: "90vh", overflowY: "auto", padding: 0 }}>
        <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontWeight: 700, color: text, fontSize: 17, margin: 0, flex: 1, paddingRight: 8 }}>{job.title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: subtext, fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Categoria e Status */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ background: "#FF660022", color: "#FF6600", border: "1px solid #FF660044", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>{job.category}</span>
            <span style={{ background: "#22C55E22", color: "#22C55E", border: "1px solid #22C55E44", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>{job.status === 'open' ? 'Disponível' : job.status}</span>
          </div>

          {/* Preço */}
          <p style={{ fontWeight: 800, fontSize: 28, color: "#FF6600", margin: 0 }}>{formatPrice(job.price, job.price_type)}</p>

          {/* Localização, Views, Data */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: subtext }}><MapPin style={{ width: 14, height: 14 }} />{job.location}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: subtext }}><Eye style={{ width: 14, height: 14 }} />{job.views || 0} views</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: subtext }}><Clock style={{ width: 14, height: 14 }} />{format(new Date(job.created_date), "dd MMM, HH:mm", { locale: pt })}</span>
          </div>

          {/* Descrição */}
          <div style={{ background: surface2, borderRadius: 12, padding: 14 }}>
            <p style={{ fontWeight: 600, color: text, fontSize: 13, margin: "0 0 6px" }}>Descrição</p>
            <p style={{ color: subtext, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{job.description}</p>
          </div>

          {/* Card do Empregador */}
          {employer && (
            <div style={{ background: surface, borderRadius: 14, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#FF6600", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                {employer.full_name?.charAt(0) || "?"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 700, color: text, fontSize: 14 }}>{employer.full_name || "Empregador"}</span>
                  {employer.verified && <Shield style={{ width: 14, height: 14, color: "#22C55E" }} />}
                </div>
                <span style={{ fontSize: 12, color: subtext }}>★ {employer.rating || "N/A"} · {employer.city || "N/A"}</span>
              </div>
              <button onClick={handleOpenChat} style={{ background: "#FF660022", border: "1px solid #FF6600", borderRadius: 10, padding: "8px 14px", color: "#FF6600", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <MessageCircle style={{ width: 14, height: 14 }} /> Chat
              </button>
            </div>
          )}

          {/* Secção de Candidatura */}
          {user?.user_type === "worker" && (
            <div style={{ borderTop: `1px solid ${border}`, paddingTop: 16 }}>
              <p style={{ fontWeight: 700, color: text, fontSize: 14, margin: "0 0 12px" }}>Como queres responder?</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={() => setApplicationType("application")}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: `2px solid ${applicationType === "application" ? "#FF6600" : border}`,
                    background: applicationType === "application" ? "#FF660022" : "transparent",
                    color: applicationType === "application" ? "#FF6600" : subtext,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    textAlign: "left"
                  }}
                >
                  <Send style={{ width: 16, height: 16 }} /> Candidatar ao preço indicado (€{job.price})
                </button>
                <button
                  onClick={() => setApplicationType("proposal")}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: `2px solid ${applicationType === "proposal" ? "#FF6600" : border}`,
                    background: applicationType === "proposal" ? "#FF660022" : "transparent",
                    color: applicationType === "proposal" ? "#FF6600" : subtext,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    textAlign: "left"
                  }}
                >
                  <Euro style={{ width: 16, height: 16 }} /> Propor preço diferente
                </button>
              </div>

              {applicationType && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {applicationType === "proposal" && (
                    <div>
                      <label style={{ color: subtext, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Valor proposto (€)</label>
                      <input
                        type="number"
                        placeholder="Ex: 350"
                        value={proposedPrice}
                        onChange={(e) => setProposedPrice(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          background: surface,
                          border: `2px solid #FF6600`,
                          borderRadius: 12,
                          color: text,
                          fontSize: 15,
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                  )}
                  <div>
                    <label style={{ color: subtext, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Mensagem *</label>
                    <textarea
                      placeholder="Conta um pouco sobre a tua experiência..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        background: surface,
                        border: `2px solid #FF6600`,
                        borderRadius: 12,
                        color: text,
                        fontSize: 14,
                        outline: "none",
                        resize: "vertical",
                        fontFamily: "inherit",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !job.employer_id}
                    style={{
                      width: "100%",
                      padding: "14px 0",
                      background: isSubmitting ? "#555" : "#FF6600",
                      border: "none",
                      borderRadius: 14,
                      color: "#FFF",
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: isSubmitting ? "not-allowed" : "pointer"
                    }}
                  >
                    {isSubmitting ? "A enviar..." : "Enviar Candidatura"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Secção do Empregador/Admin */}
          {((user?.user_type === "employer" && job.employer_id === user.id) || user?.user_type === 'admin') && (
            <div style={{ borderTop: `1px solid ${border}`, paddingTop: 16, display: "flex", gap: 10 }}>
              <button
                style={{
                  flex: 1,
                  padding: "12px 0",
                  background: "#FF6600",
                  border: "none",
                  borderRadius: 12,
                  color: "#FFF",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer"
                }}
                onClick={() => {
                  onClose();
                  navigate(createPageUrl("Applications"));
                }}
              >
                Ver Candidaturas
              </button>
              <button
                style={{
                  flex: 1,
                  padding: "12px 0",
                  background: "#EF444422",
                  border: "1px solid #EF4444",
                  borderRadius: 12,
                  color: "#EF4444",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer"
                }}
                onClick={() => onDelete(job.id)}
              >
                🗑 Apagar
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}