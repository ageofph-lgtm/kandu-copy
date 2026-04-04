import React, { useState, useEffect } from "react";
import { Rating } from "@/entities/Rating";
import { calcJobXP, applyXP, XP_EVENTS } from "@/lib/xp";
import XPGainToast from "@/components/XPGainToast";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Notification } from "@/entities/Notification";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Star,
  Trophy,
  Award,
  Edit // Added for review icon
} from "lucide-react";
import { createPageUrl } from "@/utils";

const WORKER_QUALITIES = [
  "Pontual", "Profissional", "Qualidade", "Comunicativo",
  "Organizado", "Criativo", "Eficiente", "Confiável"
];

const EMPLOYER_QUALITIES = [
  "Pagamento Rápido", "Comunicação Clara", "Condições Justas", "Organização",
  "Flexível", "Respeitoso", "Transparente", "Acessível"
];

export default function CompletionModal({
  job,
  application,
  otherUser,
  currentUser,
  onClose,
  onComplete
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [selectedQualities, setSelectedQualities] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qualities, setQualities] = useState([]);
  const [xpToast, setXpToast] = useState({ show: false, gained: 0, total: 0 });

  useEffect(() => {
    if (otherUser?.user_type === 'worker') {
      setQualities(WORKER_QUALITIES);
    } else {
      setQualities(EMPLOYER_QUALITIES);
    }
  }, [otherUser]);

  const checkIfEarly = () => {
    if (!job.end_date) return false;
    const today = new Date();
    const endDate = new Date(job.end_date);
    return today < endDate;
  };

  const handleQualityToggle = (quality) => {
    setSelectedQualities(prev =>
      prev.includes(quality)
        ? prev.filter(q => q !== quality)
        : [...prev, quality]
    );
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      alert("Por favor, deixe um comentário sobre a experiência.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prazo de 7 dias para auto-revelar a avaliação
      const visibleAfter = new Date();
      visibleAfter.setDate(visibleAfter.getDate() + 7);

      // Cria a avaliação (oculta por defeito)
      const newRating = await Rating.create({
        job_id: job.id,
        rater_id: currentUser.id,
        rated_id: otherUser.id,
        rating: rating,
        comment: comment.trim(),
        qualities: selectedQualities,
        is_visible: false,
        visible_after: visibleAfter.toISOString()
      });

      // Verifica se a outra parte já avaliou o mesmo job
      const reciprocalRatings = await Rating.filter({ job_id: job.id, rater_id: otherUser.id });
      
      if (reciprocalRatings.length > 0) {
        // Ambas as partes avaliaram — torna ambas visíveis
        await Rating.update(newRating.id, { is_visible: true });
        await Rating.update(reciprocalRatings[0].id, { is_visible: true });
      }

      // XP para o utilizador avaliado
      const xpGained = calcJobXP(rating, job.price, checkIfEarly());
      const updatedOther = applyXP(otherUser.xp || 0, xpGained);
      const existingRatings = await Rating.filter({ rated_id: otherUser.id, is_visible: true });
      const totalRatings = existingRatings.length;
      const ratingSum = existingRatings.reduce((sum, r) => sum + r.rating, 0);
      const newAvgRating = totalRatings > 0 ? (ratingSum / totalRatings).toFixed(1) : rating;

      await User.update(otherUser.id, { ...updatedOther, rating: parseFloat(newAvgRating) });

      // XP para o utilizador atual (por concluir/avaliar)
      const selfXPGained = XP_EVENTS.job_completed_self;
      const updatedSelf = applyXP(currentUser.xp || 0, selfXPGained);
      await User.update(currentUser.id, updatedSelf);
      setXpToast({ show: true, gained: selfXPGained, total: updatedSelf.xp });
      
      // Lógica específica para cada tipo de utilizador
      if (currentUser.user_type === 'employer') {
        await Job.update(job.id, { status: 'completed_by_employer' });
        await Notification.create({
          user_id: otherUser.id,
          type: "job_ready_for_review",
          title: "Obra finalizada! Avalie o empregador.",
          message: `O trabalho "${job.title}" foi marcado como concluído. Por favor, deixe sua avaliação.`,
          related_id: job.id,
          action_url: createPageUrl("Applications")
        });

      } else if (currentUser.user_type === 'worker') {
        await Job.update(job.id, {
          status: 'completed',
          actual_end_date: new Date().toISOString()
        });
        await Notification.create({
          user_id: otherUser.id,
          type: "job_completed",
          title: "Trabalho concluído e avaliado!",
          message: `O profissional avaliou o seu trabalho em "${job.title}". A obra está oficialmente concluída.`,
          related_id: job.id,
          action_url: createPageUrl("Profile")
        });
      }

      onComplete();

    } catch (error) {
      console.error("Error completing job:", error);
      alert("Erro ao finalizar trabalho. Tente novamente.");
    }

    setIsSubmitting(false);
  };
  
  const isEmployerFlow = currentUser.user_type === 'employer';

  return (
    <>
    <XPGainToast xpGained={xpToast.gained} newXP={xpToast.total} show={xpToast.show} onDone={() => { setXpToast(t => ({...t, show: false})); onClose(); }} />
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEmployerFlow ? <Trophy className="w-5 h-5 text-yellow-500" /> : <Edit className="w-5 h-5 text-blue-500" />}
            {isEmployerFlow ? 'Finalizar e Avaliar Profissional' : 'Avaliar Empregador'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900">{job.title}</h3>
            <p className="text-blue-700 text-sm mt-1">
              Avaliar: {otherUser.full_name}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Como avalia a experiência? *
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Que qualidades destacaria?
            </label>
            <div className="flex flex-wrap gap-2">
              {qualities.map((quality) => (
                <button
                  key={quality}
                  type="button"
                  onClick={() => handleQualityToggle(quality)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedQualities.includes(quality)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {quality}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Deixe um comentário *
            </label>
            <Textarea
              placeholder="Descreva como foi a experiência..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">XP a ser atribuído</span>
            </div>
            <div className="flex justify-around text-center">
              <div>
                <p className="text-xs text-gray-500">Para {otherUser.full_name?.split(' ')[0]}</p>
                <p className="font-bold text-lg text-green-900">+{calcJobXP(rating, job.price, checkIfEarly())} XP</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Para si</p>
                <p className="font-bold text-lg text-green-700">+{XP_EVENTS.job_completed_self} XP</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !comment.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Finalizando..." : "Enviar Avaliação"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}