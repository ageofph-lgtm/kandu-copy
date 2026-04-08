import React, { useState, useEffect } from "react";
import { Rating } from "@/entities/Rating";
import { calcJobXP, applyXP, XP_EVENTS } from "@/lib/xp";
import XPGainToast from "@/components/XPGainToast";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Notification } from "@/entities/Notification";
import { Star, Lock } from "lucide-react";
import { createPageUrl } from "@/utils";

const WORKER_QUALITIES = ["Pontual", "Profissional", "Qualidade", "Comunicativo", "Organizado", "Eficiente", "Confiável", "Criativo"];
const EMPLOYER_QUALITIES = ["Pagamento Rápido", "Comunicação Clara", "Condições Justas", "Organização", "Flexível", "Respeitoso", "Transparente", "Acessível"];

export default function CompletionModal({ job, application, otherUser, currentUser, onClose, onComplete }) {
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState("");
  const [selectedQualities, setSelectedQualities] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [xpToast, setXpToast] = useState({ show: false, gained: 0, total: 0 });

  const qualities = otherUser?.user_type === 'worker' ? WORKER_QUALITIES : EMPLOYER_QUALITIES;

  const checkIfEarly = () => {
    if (!job.end_date) return false;
    return new Date() < new Date(job.end_date);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const visibleAfter = new Date();
      visibleAfter.setDate(visibleAfter.getDate() + 7);
      const newRating = await Rating.create({
        job_id: job.id, rater_id: currentUser.id, rated_id: otherUser.id,
        rating, comment: comment.trim(), qualities: selectedQualities,
        is_visible: false, visible_after: visibleAfter.toISOString()
      });
      const reciprocal = await Rating.filter({ job_id: job.id, rater_id: otherUser.id });
      if (reciprocal.length > 0) {
        await Rating.update(newRating.id, { is_visible: true });
        await Rating.update(reciprocal[0].id, { is_visible: true });
      }
      const xpGained = calcJobXP(rating, job.price, checkIfEarly());
      const updatedOther = applyXP(otherUser.xp || 0, xpGained);
      const existingRatings = await Rating.filter({ rated_id: otherUser.id, is_visible: true });
      const avgRating = existingRatings.length > 0
        ? (existingRatings.reduce((s, r) => s + r.rating, 0) / existingRatings.length).toFixed(1)
        : rating;
      await User.update(otherUser.id, { ...updatedOther, rating: parseFloat(avgRating) });
      const selfXP = XP_EVENTS.job_completed_self;
      const updatedSelf = applyXP(currentUser.xp || 0, selfXP);
      await User.update(currentUser.id, updatedSelf);
      setXpToast({ show: true, gained: selfXP, total: updatedSelf.xp });
      if (currentUser.user_type === 'employer') {
        await Job.update(job.id, { status: 'completed_by_employer' });
        await Notification.create({ user_id: otherUser.id, type: "job_ready_for_review", title: "Obra finalizada!", message: `O trabalho "${job.title}" foi marcado como concluído.`, related_id: job.id, action_url: createPageUrl("Applications") });
      } else {
        await Job.update(job.id, { status: 'completed', actual_end_date: new Date().toISOString() });
        await Notification.create({ user_id: otherUser.id, type: "job_completed", title: "Trabalho concluído!", message: `O profissional avaliou o seu trabalho em "${job.title}".`, related_id: job.id, action_url: createPageUrl("Profile") });
      }
      onComplete();
    } catch (e) { console.error(e); }
    setIsSubmitting(false);
  };

  return (
    <>
      <XPGainToast xpGained={xpToast.gained} newXP={xpToast.total} show={xpToast.show} onDone={() => { setXpToast(t => ({...t, show: false})); onClose(); }} />
      <div className="fixed inset-0 bg-black/80 z-50 flex items-end md:items-center justify-center">
        <div className="bg-[#1a1a1a] w-full max-w-lg rounded-t-3xl md:rounded-3xl max-h-[95vh] overflow-y-auto pb-8">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <h2 className="text-2xl font-black text-white">Avaliar Trabalho</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2a2a2a] text-gray-400">✕</button>
          </div>

          <div className="px-5 space-y-6">
            {/* Avatar hexagon */}
            <div className="flex flex-col items-center py-4">
              <div className="relative mb-3">
                <svg width="100" height="116" viewBox="0 0 100 116">
                  <polygon points="50,4 96,28 96,88 50,112 4,88 4,28" fill="#2a2a2a" stroke="#F26522" strokeWidth="3"/>
                  {otherUser?.avatar_url ? (
                    <image href={otherUser.avatar_url} x="12" y="16" width="76" height="84" clipPath="url(#hex-clip)"/>
                  ) : null}
                </svg>
                {!otherUser?.avatar_url && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-3xl font-black">{otherUser?.full_name?.charAt(0) || '?'}</span>
                  </div>
                )}
              </div>
              <p className="text-white font-bold text-xl">{otherUser?.full_name}</p>
              <p className="text-gray-400 text-sm">{otherUser?.skills?.[0] || otherUser?.user_type}</p>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-3">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} className="p-1">
                  <Star className={`w-10 h-10 ${s <= rating ? 'text-[#F26522] fill-[#F26522]' : 'text-[#3a3a3a]'} transition-colors`} />
                </button>
              ))}
            </div>

            {/* Qualities */}
            <div className="flex flex-wrap gap-2">
              {qualities.map(q => (
                <button key={q} onClick={() => setSelectedQualities(p => p.includes(q) ? p.filter(x => x !== q) : [...p, q])}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${selectedQualities.includes(q) ? 'bg-[#F26522] text-white' : 'bg-[#2a2a2a] text-gray-400'}`}>
                  {q}
                </button>
              ))}
            </div>

            {/* Comment */}
            <textarea
              placeholder="Escreve o teu comentário..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              className="w-full bg-[#2a2a2a] border border-[#F26522]/40 rounded-2xl px-4 py-3 text-white placeholder:text-gray-500 text-sm outline-none focus:border-[#F26522] resize-none"
            />

            {/* Info banner */}
            <div className="bg-[#F26522]/20 border border-[#F26522]/40 rounded-xl px-4 py-3 flex items-start gap-3">
              <Lock className="w-4 h-4 text-[#F26522] shrink-0 mt-0.5" />
              <p className="text-xs text-gray-300 leading-snug">
                A tua avaliação ficará oculta até que a outra parte também avalie, ou até 7 dias.
              </p>
            </div>

            <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-2">
              <span>⏳</span> A aguardar avaliação da outra parte
            </p>

            {/* XP preview */}
            <div className="bg-[#2a2a2a] rounded-xl p-4 flex justify-around">
              <div className="text-center">
                <p className="text-xs text-gray-500">Para {otherUser?.full_name?.split(' ')[0]}</p>
                <p className="text-[#F26522] font-black text-lg">+{calcJobXP(rating, job.price, checkIfEarly())} XP</p>
              </div>
              <div className="w-px bg-[#3a3a3a]" />
              <div className="text-center">
                <p className="text-xs text-gray-500">Para si</p>
                <p className="text-[#F26522] font-black text-lg">+{XP_EVENTS.job_completed_self} XP</p>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-14 bg-[#F26522] hover:bg-orange-600 text-white font-black rounded-2xl text-base disabled:opacity-40 transition-colors"
            >
              {isSubmitting ? "A submeter..." : "Submeter Avaliação"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}