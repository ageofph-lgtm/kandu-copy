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

  const handleOpenChat = () => { if (!employer) return; onClose(); navigate(createPageUrl("Chat")); };
  const formatPrice = (price, type) => type === "hourly" ? `€${price}/hora` : `€${price}`;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{job.title}</span>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2"><Badge variant="secondary">{job.category}</Badge><Badge className="bg-green-100 text-green-800">{job.status}</Badge></div>
            <div className="text-2xl font-bold text-blue-600">{formatPrice(job.price, job.price_type)}</div>
          </div>
          <div className="flex items-center gap-2 text-gray-600"><MapPin className="w-4 h-4" />{job.location}</div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1"><Eye className="w-4 h-4" />{job.views || 0} visualizações</div>
            <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{format(new Date(job.created_date), "dd MMM, HH:mm", { locale: pt })}</div>
          </div>
          <div><h4 className="font-semibold mb-2">Descrição</h4><p className="text-gray-700">{job.description}</p></div>
          {employer && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Avatar><AvatarFallback className="bg-purple-100 text-purple-700">{employer.full_name?.charAt(0) || <UserIcon className="w-5 h-5" />}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2"><span className="font-medium">{employer.full_name || "Empregador"}</span>{employer.verified && <Shield className="w-4 h-4 text-green-500" />}</div>
                  <div className="flex items-center gap-1 text-sm text-gray-600"><Star className="w-3 h-3 text-yellow-500 fill-current" />{employer.rating || "N/A"} • {employer.city || "N/A"}</div>
                </div>
                <Button variant="outline" size="sm" onClick={handleOpenChat}><MessageCircle className="w-4 h-4 mr-1" />Chat</Button>
              </div>
            </div>
          )}
          {user?.user_type === "worker" && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold">Como pretende responder?</h4>
              <div className="space-y-2">
                <Button variant={applicationType === "application" ? "default" : "outline"} className="w-full justify-start" onClick={() => setApplicationType("application")}><Send className="w-4 h-4 mr-2" />Candidatar-me ao preço indicado</Button>
                <Button variant={applicationType === "proposal" ? "default" : "outline"} className="w-full justify-start" onClick={() => setApplicationType("proposal")}><Euro className="w-4 h-4 mr-2" />Enviar proposta com preço diferente</Button>
              </div>
              {applicationType && (
                <div className="space-y-3">
                  {applicationType === "proposal" && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Valor proposto (€)</label>
                      <Input type="number" placeholder="Ex: 350" value={proposedPrice} onChange={(e) => setProposedPrice(e.target.value)} />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1">Mensagem</label>
                    <Textarea placeholder="Conte um pouco sobre a sua experiência..." value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
                  </div>
                  <Button onClick={handleSubmit} disabled={isSubmitting || !job.employer_id} className="w-full">{isSubmitting ? "Enviando..." : "Enviar candidatura"}</Button>
                </div>
              )}
            </div>
          )}
          {(user?.user_type === "employer" && job.employer_id === user.id) || user?.user_type === 'admin' ? (
            <div className="pt-4 border-t flex gap-2">
              <Button className="flex-1" onClick={() => { onClose(); navigate(createPageUrl("Applications")); }}>Ver candidaturas</Button>
              <Button variant="destructive" className="flex-1" onClick={() => onDelete(job.id)}><Trash2 className="w-4 h-4 mr-2" /> Apagar Obra</Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}