import React, { useState } from "react";
import { Rating } from "@/entities/Rating";
import { User } from "@/entities/User";
import { createPageUrl } from "@/utils";

export default function ReviewModal({
  job,
  application,
  otherUser,
  currentUser,
  onClose,
  onComplete
}) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (stars === 0) {
      alert("Por favor, selecione uma classificação");
      return;
    }

    if (!comment.trim()) {
      alert("Por favor, escreva um comentário");
      return;
    }

    setIsSubmitting(true);
    try {
      const visibleAfter = new Date();
      visibleAfter.setDate(visibleAfter.getDate() + 7);

      // Create rating (hidden by default - blind review)
      const newRating = await Rating.create({
        job_id: job.id,
        rater_id: currentUser.id,
        rated_id: otherUser.id,
        rating: stars,
        comment: comment.trim(),
        qualities: [],
        is_visible: false,
        visible_after: visibleAfter.toISOString()
      });

      // Check if other party already rated
      const reciprocalRatings = await Rating.filter({ 
        job_id: job.id, 
        rater_id: otherUser.id 
      });
      
      if (reciprocalRatings.length > 0) {
        // Both parties rated - make both visible
        await Rating.update(newRating.id, { is_visible: true });
        await Rating.update(reciprocalRatings[0].id, { is_visible: true });
      }

      // Update other user's average rating
      const existingRatings = await Rating.filter({ 
        rated_id: otherUser.id, 
        is_visible: true 
      });
      const totalRatings = existingRatings.length;
      const ratingSum = existingRatings.reduce((sum, r) => sum + r.rating, 0);
      const newAvgRating = totalRatings > 0 ? (ratingSum / totalRatings).toFixed(1) : stars;

      await User.update(otherUser.id, { 
        rating: parseFloat(newAvgRating) 
      });

      alert("Avaliação submetida com sucesso!");
      onComplete();

    } catch (error) {
      console.error("Erro ao submeter avaliação:", error);
      alert("Erro ao submeter avaliação. Tente novamente.");
    }
    setIsSubmitting(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1A1A1A',
      padding: '60px 20px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      overflowY: 'auto'
    }}>
      {/* Title */}
      <h1 style={{
        fontWeight: 800,
        fontSize: 28,
        color: '#FFF',
        textAlign: 'center',
        margin: 0
      }}>
        Avaliar Trabalho
      </h1>

      {/* Avatar hexagon */}
      <div style={{
        width: 100,
        height: 100,
        margin: '0 auto',
        clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
        border: '4px solid #FF6600',
        overflow: 'hidden'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          background: '#FF6600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFF',
          fontWeight: 'bold',
          fontSize: 40
        }}>
          {otherUser?.full_name?.charAt(0) || '?'}
        </div>
      </div>

      {/* Name and specialty */}
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontWeight: 'bold',
          fontSize: 18,
          color: '#FFF',
          margin: '0 0 4px 0'
        }}>
          {otherUser?.full_name || 'Utilizador'}
        </p>
        <p style={{
          color: '#AAA',
          fontSize: 14,
          margin: 0
        }}>
          {otherUser?.user_type === 'worker' ? 'Profissional' : 'Empregador'}
        </p>
      </div>

      {/* Stars */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        margin: '16px 0'
      }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setStars(star)}
            style={{
              fontSize: 32,
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0
            }}
          >
            {star <= stars ? '⭐' : '☆'}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        placeholder="Escreve o teu comentário..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={{
          padding: '14px 16px',
          background: '#2A2A2A',
          border: '2px solid #FF6600',
          borderRadius: 12,
          height: 100,
          color: '#FFF',
          fontSize: 14,
          resize: 'none',
          width: '100%',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
          outline: 'none'
        }}
      />

      {/* Blind Review card */}
      <div style={{
        background: '#FF660011',
        border: '1px solid #FF660033',
        borderRadius: 14,
        padding: 14,
        display: 'flex',
        gap: 10
      }}>
        <span style={{ fontSize: 18 }}>🔒</span>
        <div>
          <p style={{
            fontWeight: 'bold',
            fontSize: 14,
            color: '#FFF',
            margin: '0 0 4px 0'
          }}>
            Blind Review ativo
          </p>
          <p style={{
            color: '#AAA',
            fontSize: 13,
            margin: 0
          }}>
            A tua avaliação ficará oculta até que a outra parte também avalie, ou até 7 dias.
          </p>
        </div>
      </div>

      {/* Waiting message */}
      <p style={{
        color: '#AAA',
        fontSize: 13,
        textAlign: 'center',
        margin: 0
      }}>
        ⏳ A aguardar avaliação da outra parte
      </p>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || stars === 0}
        style={{
          background: '#FF6600',
          borderRadius: 14,
          padding: 16,
          fontWeight: 700,
          color: '#FFF',
          border: 'none',
          cursor: (isSubmitting || stars === 0) ? 'not-allowed' : 'pointer',
          opacity: (isSubmitting || stars === 0) ? 0.4 : 1,
          width: '100%',
          fontSize: 16
        }}
      >
        {isSubmitting ? "A submeter..." : "Submeter Avaliação"}
      </button>

      {/* Cancel button */}
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: '1px solid #333',
          color: '#AAA',
          borderRadius: 12,
          padding: 12,
          fontWeight: 600,
          fontSize: 14,
          cursor: 'pointer'
        }}
      >
        Cancelar
      </button>
    </div>
  );
}