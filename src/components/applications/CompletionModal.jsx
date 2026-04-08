import React, { useState, useEffect } from "react";
import { Rating } from "@/entities/Rating";
import { calcJobXP, applyXP, XP_EVENTS } from "@/lib/xp";
import XPGainToast from "@/components/XPGainToast";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Notification } from "@/entities/Notification";
import { UploadFile } from "@/integrations/Core";
import { createPageUrl } from "@/utils";

export default function CompletionModal({
  job,
  application,
  otherUser,
  currentUser,
  onClose,
  onComplete
}) {
  const [photos, setPhotos] = useState([null, null, null]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [xpToast, setXpToast] = useState({ show: false, gained: 0, total: 0 });
  const [uploading, setUploading] = useState(false);

  const checkIfEarly = () => {
    if (!job.end_date) return false;
    const today = new Date();
    const endDate = new Date(job.end_date);
    return today < endDate;
  };

  const baseXP = calcJobXP(5, job.price, checkIfEarly());
  const bonusXP = baseXP * 5;

  const handlePhotoUpload = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      const newPhotos = [...photos];
      newPhotos[index] = file_url;
      setPhotos(newPhotos);
    } catch (error) {
      console.error("Erro ao enviar foto:", error);
      alert("Erro ao enviar foto");
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Cria a avaliação com 5 estrelas automáticas (prova fotográfica)
      const visibleAfter = new Date();
      visibleAfter.setDate(visibleAfter.getDate() + 7);

      const newRating = await Rating.create({
        job_id: job.id,
        rater_id: currentUser.id,
        rated_id: otherUser.id,
        rating: 5,
        comment: `Trabalho concluído com sucesso. Fotos anexadas: ${photos.filter(p => p).length}/3`,
        qualities: ["Profissional", "Qualidade"],
        is_visible: false,
        visible_after: visibleAfter.toISOString()
      });

      // Verifica se a outra parte já avaliou
      const reciprocalRatings = await Rating.filter({ job_id: job.id, rater_id: otherUser.id });
      
      if (reciprocalRatings.length > 0) {
        await Rating.update(newRating.id, { is_visible: true });
        await Rating.update(reciprocalRatings[0].id, { is_visible: true });
      }

      // XP para o utilizador avaliado (com bonus de 5x se 3 fotos)
      const photosCount = photos.filter(p => p).length;
      const xpMultiplier = photosCount === 3 ? 5 : 1;
      const xpGained = baseXP * xpMultiplier;
      
      const updatedOther = applyXP(otherUser.xp || 0, xpGained);
      const existingRatings = await Rating.filter({ rated_id: otherUser.id, is_visible: true });
      const totalRatings = existingRatings.length;
      const ratingSum = existingRatings.reduce((sum, r) => sum + r.rating, 0);
      const newAvgRating = totalRatings > 0 ? (ratingSum / totalRatings).toFixed(1) : 5;

      await User.update(otherUser.id, { ...updatedOther, rating: parseFloat(newAvgRating) });

      // XP para o utilizador atual (por concluir)
      const selfXPGained = XP_EVENTS.job_completed_self;
      const updatedSelf = applyXP(currentUser.xp || 0, selfXPGained);
      await User.update(currentUser.id, updatedSelf);

      setXpToast({ show: true, gained: selfXPGained, total: updatedSelf.xp });
      
      // Atualiza status da obra
      if (currentUser.user_type === 'employer') {
        await Job.update(job.id, { status: 'completed_by_employer' });
        await Notification.create({
          user_id: otherUser.id,
          type: "job_ready_for_review",
          title: "Obra finalizada! Avalie o empregador.",
          message: `O trabalho "${job.title}" foi marcado como concluído.`,
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
          title: "Trabalho concluído!",
          message: `O profissional completou o trabalho "${job.title}" com fotos.`,
          related_id: job.id,
          action_url: createPageUrl("Profile")
        });
      }

      onComplete();

    } catch (error) {
      console.error("Erro ao finalizar trabalho:", error);
      alert("Erro ao finalizar trabalho. Tente novamente.");
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <XPGainToast xpGained={xpToast.gained} newXP={xpToast.total} show={xpToast.show} onDone={() => { setXpToast(t => ({...t, show: false})); onClose(); }} />
      
      <div style={{
        minHeight: '100vh', background: '#1A1A1A', padding: 24, display: 'flex', flexDirection: 'column',
        position: 'fixed', inset: 0, zIndex: 50, overflowY: 'auto'
      }}>
        {/* Top row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20
        }}>
          <img 
            src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png" 
            alt="K" 
            style={{ width: 32, height: 32 }}
          />
          <h1 style={{
            fontWeight: 800, fontSize: 20, color: '#FFF', margin: 0
          }}>
            Obra Concluída! 🎉
          </h1>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#AAA', fontSize: 20,
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* 3 photo slots */}
        <div style={{
          display: 'flex', gap: 10, marginBottom: 16
        }}>
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              onClick={() => document.getElementById(`photo-${idx}`)?.click()}
              style={{
                flex: 1, position: 'relative', cursor: 'pointer'
              }}
            >
              <div style={{
                height: 90, background: photos[idx] ? '#FF660033' : '#2A2A2A',
                border: photos[idx] ? '2px solid #FF6600' : '2px dashed #FF6600',
                borderRadius: 12, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ fontSize: 28, color: '#FF6600' }}>📷</span>
              </div>
              <div style={{
                position: 'absolute', top: 0, right: 0, background: '#FF6600',
                color: '#FFF', borderRadius: '0 8px 0 8px', padding: '2px 6px',
                fontSize: 11, fontWeight: 700
              }}>
                {idx + 1}/3
              </div>
              <input
                id={`photo-${idx}`}
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(idx, e)}
                style={{ display: 'none' }}
              />
            </div>
          ))}
        </div>

        {/* Banner */}
        <div style={{
          background: '#FF6600', borderRadius: 12, padding: '10px 14px',
          textAlign: 'center', color: '#FFF', fontWeight: 700, marginBottom: 16,
          boxShadow: '0 0 30px rgba(255, 102, 0, 0.4)'
        }}>
          Envia 3 fotos e multiplica o teu XP por 5x! ⚡
        </div>

        {/* XP Card */}
        <div style={{
          background: '#2A2A2A', borderRadius: 16, padding: 20, marginBottom: 20
        }}>
          {/* XP row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 12, marginBottom: 12
          }}>
            <div>
              <p style={{ fontWeight: 800, fontSize: 18, color: '#FFF', margin: 0 }}>
                {baseXP} XP
              </p>
              <p style={{ color: '#AAA', fontSize: 12, margin: 0 }}>Base</p>
            </div>
            <span style={{ color: '#FF6600', fontSize: 20 }}>→</span>
            <p style={{
              fontWeight: 900, fontSize: 28, color: '#FF6600', margin: 0
            }}>
              {bonusXP} XP ⚡
            </p>
          </div>

          {/* Progress bar */}
          <div style={{
            background: '#333', height: 10, borderRadius: 10, marginTop: 12,
            overflow: 'hidden'
          }}>
            <div style={{
              width: '40%', height: '100%',
              background: 'linear-gradient(90deg, #FF6600, #FFAA00)',
              borderRadius: 10
            }} />
          </div>

          {/* Footer text */}
          <p style={{
            color: '#AAA', fontSize: 12, textAlign: 'center', marginTop: 8, margin: 0
          }}>
            Prova que o trabalho foi feito e ganha mais
          </p>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || uploading}
          style={{
            background: '#FF6600', color: '#FFF', border: 'none', borderRadius: 14,
            padding: 16, fontWeight: 700, fontSize: 16, cursor: 'pointer',
            opacity: (isSubmitting || uploading) ? 0.5 : 1,
            width: '100%'
          }}
        >
          {isSubmitting ? "A processar..." : "Submeter e Receber XP 🚀"}
        </button>

        {/* Cancel button */}
        <button
          onClick={onClose}
          style={{
            background: 'none', border: '1px solid #333', color: '#AAA',
            borderRadius: 12, padding: 12, fontWeight: 600, fontSize: 14,
            cursor: 'pointer', marginTop: 12
          }}
        >
          Cancelar
        </button>
      </div>
    </>
  );
}