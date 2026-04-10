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
import { MapPin, Euro, Clock, Eye, Star, Shield, MessageCircle, X, User as UserIcon, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function JobModal({ job, user, onClose, onApply, onDelete }) {
  const navigate = useNavigate();
  const [step, setStep] = useState("detail"); // "detail" | "apply"
  const [applicationType, setApplicationType] = useState("application");
  const [message, setMessage] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employer, setEmployer] = useState(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch employer info
      if (job.employer_id) {
        try {
          const employerData = await User.filter({ id: job.employer_id });
          if (employerData.length > 0) setEmployer(employerData[0]);
        } catch (e) {
          console.error("Failed to fetch employer", e);
        }
      }
      // Check if worker already applied
      if (user?.user_type === "worker") {
        setCheckingApplication(true);
        try {
          const existing = await Application.filter({ job_id: job.id, worker_id: user.id });
          setAlreadyApplied(existing.length > 0);
        } catch (e) {
          console.error("Failed to check application", e);
        } finally {
          setCheckingApplication(false);
        }
      }
    };
    fetchData();
  }, [job, user]);

  const createConversationId = (userId1, userId2) => [userId1, userId2].sort().join('_');

  const handleSubmit = async () => {
    if (!user) { alert("Precisa de fazer login para candidatar-se"); return; }
    if (user.user_type !== "worker") { alert("Apenas profissionais podem candidatar-se a obras"); return; }
    if (!message.trim()) { alert("Por favor, escreva uma mensagem de apresentação"); return; }
    if (!job.employer_id) { alert("Não foi possível identificar o empregador desta obra."); return; }
    if (applicationType === "proposal" && (!proposedPrice || isNaN(parseFloat(proposedPrice)))) {
      alert("Por favor, insira um valor válido para a proposta.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Double-check for duplicate
      const existingApplications = await Application.filter({ job_id: job.id, worker_id: user.id });
      if (existingApplications.length > 0) {
        setAlreadyApplied(true);
        setIsSubmitting(false);
        setStep("detail");
        return;
      }

      const applicationData = {
        job_id: job.id,
        worker_id: user.id,
        message: message.trim(),
        application_type: applicationType,
        status: "pending"
      };
      if (applicationType === "proposal" && proposedPrice) {
        applicationData.proposed_price = parseFloat(proposedPrice);
      }
      await Application.create(applicationData);

      // Notify employer
      await Notification.create({
        user_id: job.employer_id,
        type: applicationType === "application" ? "new_application" : "new_proposal",
        title: applicationType === "application" ? "📋 Nova candidatura!" : "💰 Nova proposta!",
        message: `${user.full_name || user.email} ${applicationType === "application" ? "candidatou-se" : "enviou uma proposta"} para "${job.title}"`,
        related_id: job.id,
        action_url: createPageUrl("Applications"),
      });

      // Send initial chat message
      const conversationId = createConversationId(user.id, job.employer_id);
      const initialMessage = applicationType === "application"
        ? `Olá! Candidatei-me à obra "${job.title}". ${message}`
        : `Olá! Enviei uma proposta para "${job.title}" no valor de €${proposedPrice}. ${message}`;
      await ChatMessage.create({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: job.employer_id,
        message: initialMessage,
        is_read: false
      });

      setAlreadyApplied(true);
      setStep("success");
      onApply();
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Erro ao enviar candidatura. Tenta novamente.");
    }
    setIsSubmitting(false);
  };

  const handleOpenChat = () => {
    onClose();
    navigate(createPageUrl("Chat"));
  };

  const formatPrice = (price, type) => type === "hourly" ? `€${price}/hora` : `€${price}`;

  const isOwner = (user?.user_type === "employer" && job.employer_id === user?.id) || user?.user_type === "admin";
  const isWorker = user?.user_type === "worker";

  return (
    /* Full-screen overlay — no nested Dialog, avoids double-modal bug on iOS */
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto shadow-2xl z-10">
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
          {step !== "detail" ? (
            <button onClick={() => setStep("detail")} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
          ) : (
            <div className="w-9" />
          )}
          <h2 className="font-bold text-base text-center flex-1 px-2 line-clamp-1">
            {step === "apply" ? "Candidatura" : step === "success" ? "Enviado!" : job.title}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">

          {/* ── SUCCESS STATE ── */}
          {step === "success" && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Candidatura enviada!</h3>
              <p className="text-gray-500 text-sm mb-6">O empregador foi notificado e pode responder em breve.</p>
              <Button onClick={handleOpenChat} className="w-full bg-[#F26522] hover:bg-orange-600 text-white">
                <MessageCircle className="w-4 h-4 mr-2" />
                Ir para o Chat
              </Button>
            </div>
          )}

          {/* ── APPLY FORM ── */}
          {step === "apply" && (
            <div className="space-y-4">
              {/* Job summary */}
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <p className="font-semibold text-sm text-gray-800">{job.title}</p>
                <p className="text-[#F26522] font-bold text-lg">{formatPrice(job.price, job.price_type)}</p>
                <p className="text-gray-500 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</p>
              </div>

              {/* Type toggle */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Tipo de candidatura</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setApplicationType("application")}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      applicationType === "application"
                        ? "border-[#F26522] bg-orange-50 text-[#F26522]"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    ✅ Preço fixo<br/><span className="font-bold">{formatPrice(job.price, job.price_type)}</span>
                  </button>
                  <button
                    onClick={() => setApplicationType("proposal")}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      applicationType === "proposal"
                        ? "border-[#F26522] bg-orange-50 text-[#F26522]"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    💰 Proposta<br/><span className="text-xs text-gray-500">Valor diferente</span>
                  </button>
                </div>
              </div>

              {applicationType === "proposal" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">O teu valor (€)</label>
                  <Input
                    type="number"
                    placeholder={`Ex: ${job.price}`}
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    className="text-lg font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Apresenta-te ao empregador <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Ex: Tenho 5 anos de experiência em pintura de interiores e já fiz projetos similares..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{message.length}/500 caracteres</p>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !message.trim()}
                className="w-full bg-[#F26522] hover:bg-orange-600 text-white font-bold py-4 text-base rounded-xl"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="30 70" /></svg>A enviar...</span>
                ) : (
                  "Enviar Candidatura →"
                )}
              </Button>
            </div>
          )}

          {/* ── JOB DETAIL ── */}
          {step === "detail" && (
            <>
              {/* Price & badges */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-sm">{job.category}</Badge>
                  <Badge className={`text-sm ${job.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {job.status === 'open' ? '🟢 Disponível' : job.status === 'in_progress' ? '🔵 Em Curso' : '✅ Concluído'}
                  </Badge>
                  {job.urgency === 'high' && <Badge className="bg-red-100 text-red-700">🔥 Urgente</Badge>}
                </div>
                <div className="text-3xl font-bold text-[#F26522]">{formatPrice(job.price, job.price_type)}</div>
              </div>

              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0 text-[#F26522]" />
                {job.location}
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{job.views || 0} visualizações</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />
                  {format(new Date(job.created_date), "dd MMM, HH:mm", { locale: pt })}
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold mb-2 text-sm">Descrição</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{job.description}</p>
              </div>

              {employer && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-orange-100 text-orange-700 font-bold">
                        {employer.full_name?.charAt(0) || <UserIcon className="w-5 h-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{employer.full_name || "Empregador"}</span>
                        {employer.verified && <Shield className="w-4 h-4 text-green-500" />}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        {employer.rating || "N/A"} · {employer.city || "Portugal"}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleOpenChat} className="text-xs">
                      <MessageCircle className="w-3.5 h-3.5 mr-1" />Chat
                    </Button>
                  </div>
                </div>
              )}

              {/* ── WORKER CTA ── */}
              {isWorker && job.status === "open" && (
                <div className="pt-2">
                  {checkingApplication ? (
                    <div className="w-full py-4 text-center text-gray-400 text-sm">A verificar...</div>
                  ) : alreadyApplied ? (
                    <div className="w-full bg-green-50 border border-green-200 rounded-xl py-4 px-4 flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-green-700 text-sm">Candidatura enviada</p>
                        <p className="text-xs text-green-600">Aguarda resposta do empregador</p>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setStep("apply")}
                      className="w-full bg-[#F26522] hover:bg-orange-600 text-white font-bold py-4 text-base rounded-xl shadow-lg shadow-orange-500/20"
                    >
                      Candidatar-me →
                    </Button>
                  )}
                </div>
              )}

              {isWorker && job.status !== "open" && (
                <div className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <p className="text-gray-500 text-sm">Esta obra já não está disponível.</p>
                </div>
              )}

              {/* ── EMPLOYER CTA ── */}
              {isOwner && (
                <div className="pt-2 border-t flex gap-2">
                  <Button
                    className="flex-1 bg-[#F26522] hover:bg-orange-600 text-white"
                    onClick={() => { onClose(); navigate(createPageUrl("Applications")); }}
                  >
                    Ver candidaturas
                  </Button>
                  <Button variant="destructive" onClick={() => onDelete(job.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom safe area spacer for iOS */}
        <div className="h-safe-bottom" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
      </div>
    </div>
  );
}
