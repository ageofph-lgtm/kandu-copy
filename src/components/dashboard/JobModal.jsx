import React, { useState, useEffect } from "react";
import { Application } from "@/entities/Application";
import { Notification } from "@/entities/Notification";
import { ChatMessage } from "@/entities/ChatMessage";
import { User } from "@/entities/User";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, DollarSign, Send, Euro, X, Trash2, Shield, ArrowLeft } from "lucide-react";
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
    if (job.employer_id) {
      User.filter({ id: job.employer_id }).then(r => r.length > 0 && setEmployer(r[0]));
    }
  }, [job]);

  const createConversationId = (a, b) => [a, b].sort().join('_');

  const handleSubmit = async () => {
    if (!user) return;
    if (user.user_type !== "worker") return;
    if (!message.trim()) return;
    if (!job.employer_id) return;
    setIsSubmitting(true);
    try {
      const existing = await Application.filter({ job_id: job.id, worker_id: user.id });
      if (existing.length > 0) { setIsSubmitting(false); return; }
      const appData = { job_id: job.id, worker_id: user.id, message: message.trim(), application_type: applicationType, status: "pending" };
      if (applicationType === "proposal" && proposedPrice) appData.proposed_price = parseFloat(proposedPrice);
      await Application.create(appData);
      await Notification.create({
        user_id: job.employer_id,
        type: applicationType === "application" ? "new_application" : "new_proposal",
        title: applicationType === "application" ? "Nova candidatura!" : "Nova proposta!",
        message: `${user.full_name || user.email} candidatou-se à obra "${job.title}"`,
        related_id: job.id, action_url: createPageUrl("Applications"),
      });
      const convId = createConversationId(user.id, job.employer_id);
      await ChatMessage.create({ conversation_id: convId, sender_id: user.id, receiver_id: job.employer_id, message: `Olá! Candidatei-me à obra "${job.title}". ${message}`, is_read: false });
      onApply();
    } catch {}
    setIsSubmitting(false);
  };

  const isEmployer = user?.user_type === 'employer' && job.employer_id === user?.id;
  const isAdmin = user?.user_type === 'admin';

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div
        className="bg-[#1a1a1a] w-full max-w-lg rounded-t-3xl md:rounded-3xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2a2a2a]">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white">{job.title}</h2>
            {job.urgency === 'high' && (
              <span className="bg-[#F26522] text-white text-xs font-bold px-2 py-0.5 rounded-full">Urgente</span>
            )}
          </div>
          <div className="w-9" />
        </div>

        <div className="px-5 space-y-4 pb-8">
          {/* Employer card */}
          {employer && (
            <div className="bg-[#2a2a2a] rounded-2xl p-4 border-l-4 border-[#F26522] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-white font-bold text-sm">
                {employer.full_name?.charAt(0) || '?'}
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{employer.full_name || 'Empregador'}</p>
                <p className="text-gray-400 text-xs">{employer.employer_type === 'cia' ? 'Cia Employer' : 'Simple Employer'}</p>
              </div>
              {employer.verified_level === 'ultra_verified' && (
                <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-full">
                  <Shield className="w-3 h-3 text-yellow-400" />
                  <span className="text-yellow-400 text-xs font-bold">Ultra Verified</span>
                </div>
              )}
            </div>
          )}

          {/* Info card */}
          <div className="bg-[#2a2a2a] rounded-2xl p-4 space-y-3 border-l-4 border-[#F26522]">
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <MapPin className="w-4 h-4 text-[#F26522]" />
              <span>{job.location}</span>
            </div>
            {job.start_date && (
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <Clock className="w-4 h-4 text-[#F26522]" />
                <span>Início: {job.start_date}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <DollarSign className="w-4 h-4 text-[#F26522]" />
              <span className="text-white font-bold">€{job.price}{job.price_type === 'hourly' ? '/hora' : ''}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">Descrição</p>
            <p className="text-gray-300 text-sm leading-relaxed">{job.description}</p>
          </div>

          {/* Fotos placeholder */}
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">Fotos do Local</p>
            <div className="flex gap-2">
              {[1,2,3].map(i => (
                <div key={i} className="w-24 h-24 rounded-xl bg-[#2a2a2a] flex items-center justify-center">
                  <span className="text-gray-600 text-xs">📷</span>
                </div>
              ))}
            </div>
          </div>

          {/* Worker apply */}
          {user?.user_type === "worker" && (
            <div className="space-y-3 pt-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setApplicationType("application")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${applicationType === 'application' ? 'bg-[#F26522] text-white' : 'bg-[#2a2a2a] text-gray-300'}`}
                >
                  Preço indicado
                </button>
                <button
                  onClick={() => setApplicationType("proposal")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${applicationType === 'proposal' ? 'bg-[#F26522] text-white' : 'bg-[#2a2a2a] text-gray-300'}`}
                >
                  Proposta própria
                </button>
              </div>
              {applicationType && (
                <div className="space-y-3">
                  {applicationType === "proposal" && (
                    <Input type="number" placeholder="Valor proposto (€)" value={proposedPrice} onChange={e => setProposedPrice(e.target.value)}
                      className="bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus:border-[#F26522] rounded-xl h-12" />
                  )}
                  <Textarea placeholder="Escreve a tua mensagem..." value={message} onChange={e => setMessage(e.target.value)} rows={3}
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus:border-[#F26522] rounded-xl resize-none" />
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !applicationType || !message.trim()}
                className="w-full h-14 bg-[#F26522] hover:bg-orange-600 text-white font-bold rounded-2xl text-base disabled:opacity-40 transition-colors"
              >
                {isSubmitting ? "A enviar..." : "Candidatar-me"}
              </button>
            </div>
          )}

          {/* Employer/Admin actions */}
          {(isEmployer || isAdmin) && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { onClose(); navigate(createPageUrl("Applications")); }}
                className="flex-1 h-12 bg-[#F26522] hover:bg-orange-600 text-white font-bold rounded-xl transition-colors"
              >
                Ver candidaturas
              </button>
              <button
                onClick={() => onDelete(job.id)}
                className="h-12 px-4 bg-red-500/20 text-red-400 rounded-xl font-bold transition-colors hover:bg-red-500/30"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}