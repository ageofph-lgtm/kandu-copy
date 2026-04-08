import React, { useState, useEffect } from "react";
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
    const conversationId = createConversationId(user.id, employer.id);
    navigate(createPageUrl("Chat") + `?conversationId=${conversationId}&userId=${employer.id}`);
  };
  const formatPrice = (price, type) => type === "hourly" ? `€${price}/hora` : `€${price}`;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 50, display: 'flex', alignItems: 'flex-end'
    }} onClick={onClose}>
      <div
        style={{
          width: '100%', maxHeight: '95vh', background: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24,
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div style={{
          padding: '50px 20px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #333',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              fontSize: 22, color: '#FF6600', cursor: 'pointer', background: 'none', border: 'none'
            }}
          >
            ←
          </button>
          <h1 style={{ fontWeight: 700, fontSize: 16, color: '#FFF', flex: 1, margin: 0 }}>{job.title}</h1>
          {job.urgency === 'high' && (
            <span style={{
              background: '#EF4444', color: '#FFF', fontSize: 12, padding: '4px 10px',
              borderRadius: 20, fontWeight: 600, whiteSpace: 'nowrap'
            }}>Urgente</span>
          )}
          <img
            src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png"
            alt="K"
            style={{ position: 'absolute', right: 16, top: 50, width: 40 }}
          />
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', paddingBottom: 120 }}>
          {/* Employer card */}
          {employer && (
            <div style={{
              background: '#2A2A2A', borderRadius: 16, padding: 16, borderLeft: '4px solid #FF6600',
              display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, marginTop: 12
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', background: '#FF6600',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF',
                fontWeight: 'bold', fontSize: 14, flexShrink: 0
              }}>
                {employer.full_name?.charAt(0) || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#FFF', fontWeight: 'bold', margin: 0, fontSize: 15 }}>{employer.full_name || 'Empregador'}</p>
                <p style={{ color: '#AAA', fontSize: 13, margin: '2px 0 0 0' }}>
                  {employer.employer_type === 'cia' ? 'Cia Employer' : 'Empregador'}
                </p>
              </div>
              {employer.verified_level === 'ultra_verified' && (
                <span style={{
                  background: 'rgba(255, 102, 0, 0.15)', color: '#FF6600', border: '1px solid rgba(255, 102, 0, 0.3)',
                  borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap'
                }}>✓ Ultra Verified</span>
              )}
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: '#333', margin: '12px 0' }} />

          {/* Details card */}
          <div style={{
            background: '#2A2A2A', borderRadius: 16, padding: 16, borderLeft: '4px solid #FF6600', marginBottom: 12
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #333' }}>
              <span style={{ fontSize: 18 }}>📍</span>
              <span style={{ color: '#AAA', fontSize: 14 }}>{job.location}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #333' }}>
              <span style={{ fontSize: 18 }}>🕐</span>
              <span style={{ color: '#AAA', fontSize: 14 }}>Início: {job.start_date ? format(new Date(job.start_date), 'dd MMM', { locale: pt }) : 'Amanhã'}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0' }}>
              <span style={{ fontSize: 18 }}>💰</span>
              <span style={{ color: '#FF6600', fontWeight: 'bold', fontSize: 14 }}>{formatPrice(job.price, job.price_type)}</span>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: '#FFF', fontWeight: 'bold', margin: '0 0 8px 0', fontSize: 14 }}>Descrição</p>
            <p style={{ color: '#AAA', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{job.description}</p>
          </div>

          {/* Photos placeholder */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: '#FFF', fontWeight: 'bold', margin: '0 0 8px 0', fontSize: 14 }}>Fotos do Local</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    flex: 1, height: 70, background: '#2A2A2A', borderRadius: 10
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Fixed apply button */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '16px 20px 32px', background: '#1A1A1A', borderTop: '1px solid #333'
        }}>
          {user?.user_type === 'worker' ? (
            <button
              onClick={() => {
                if (!applicationType) setApplicationType('application');
                else handleSubmit();
              }}
              disabled={isSubmitting}
              style={{
                width: '100%', background: '#FF6600', borderRadius: 50, padding: 16,
                fontWeight: 700, fontSize: 16, color: '#FFF', border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? 'A enviar...' : 'Candidatar-me'}
            </button>
          ) : null}
        </div>

        {/* Application form modal */}
        {user?.user_type === 'worker' && applicationType && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20
          }} onClick={() => setApplicationType(null)}>
            <div
              style={{
                background: '#2A2A2A', borderRadius: 16, padding: 20, width: '100%', maxWidth: 380
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ color: '#FFF', fontWeight: 'bold', margin: '0 0 16px 0' }}>
                {applicationType === 'application' ? 'Candidatura' : 'Nova Proposta'}
              </h2>
              {applicationType === 'proposal' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ color: '#AAA', fontSize: 13, display: 'block', marginBottom: 6 }}>Valor proposto (€)</label>
                  <input
                    type="number"
                    placeholder="Ex: 350"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    style={{
                      width: 'calc(100% - 16px)', padding: 8, background: '#1A1A1A', border: '1px solid #444',
                      borderRadius: 8, color: '#FFF', fontSize: 14
                    }}
                  />
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={{ color: '#AAA', fontSize: 13, display: 'block', marginBottom: 6 }}>Mensagem</label>
                <textarea
                  placeholder="Conte um pouco sobre a sua experiência..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  style={{
                    width: 'calc(100% - 16px)', padding: 8, background: '#1A1A1A', border: '1px solid #444',
                    borderRadius: 8, color: '#FFF', fontSize: 14, resize: 'none'
                  }}
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !message.trim()}
                style={{
                  width: '100%', background: '#FF6600', borderRadius: 8, padding: 12,
                  fontWeight: 700, color: '#FFF', border: 'none', cursor: 'pointer',
                  opacity: (isSubmitting || !message.trim()) ? 0.5 : 1
                }}
              >
                {isSubmitting ? 'A enviar...' : 'Enviar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}