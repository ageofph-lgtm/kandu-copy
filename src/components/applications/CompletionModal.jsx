import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@/lib/ThemeContext";
import XPGainToast from "@/components/XPGainToast";
import { calcJobXP, XP_EVENTS } from "@/lib/xp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star, Camera, X, CheckCircle } from "lucide-react";

const WORKER_QUALITIES = [
  "Pontual", "Profissional", "Qualidade", "Comunicativo",
  "Organizado", "Criativo", "Eficiente", "Confiável"
];

const EMPLOYER_QUALITIES = [
  "Pagamento Rápido", "Comunicação Clara", "Condições Justas", "Organização",
  "Flexível", "Respeitoso", "Transparente", "Acessível"
];

// ─── Componente de upload de 1 foto ──────────────────────────────────────────
function PhotoBox({ index, photo, onAdd, onRemove, isDark, text, subtext }) {
  const inputRef = useRef(null);
  const surface = isDark ? "#2A2A2A" : "#F0F0F0";
  const border = photo ? "#22C55E" : (isDark ? "#444" : "#DDDDDD");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onAdd(index, ev.target.result, file);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"   /* abre câmara diretamente em mobile */
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <button
        type="button"
        onClick={() => !photo && inputRef.current?.click()}
        style={{
          width: "100%",
          aspectRatio: "1",
          background: photo ? "transparent" : surface,
          border: `2px dashed ${border}`,
          borderRadius: 14,
          cursor: photo ? "default" : "pointer",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          transition: "border-color 0.2s"
        }}
      >
        {photo ? (
          <>
            <img src={photo.preview} alt={`Foto ${index + 1}`}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }} />
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.3)", display: "flex",
              alignItems: "center", justifyContent: "center", borderRadius: 12
            }}>
              <CheckCircle style={{ color: "#22C55E", width: 28, height: 28 }} />
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(index); }}
              style={{
                position: "absolute", top: 4, right: 4,
                background: "#EF4444", border: "none", borderRadius: "50%",
                width: 22, height: 22, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
              <X style={{ color: "#FFF", width: 12, height: 12 }} />
            </button>
          </>
        ) : (
          <>
            <Camera style={{ color: subtext, width: 24, height: 24 }} />
            <span style={{ color: subtext, fontSize: 11, fontWeight: 600 }}>Foto {index + 1}</span>
          </>
        )}
      </button>
    </div>
  );
}

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
  // UX FIX: 3 caixas de fotos para profissional (prova de trabalho)
  const [photos, setPhotos] = useState([null, null, null]);

  const isWorkerFlow = currentUser.user_type === 'worker';

  useEffect(() => {
    if (otherUser?.user_type === 'worker') {
      setQualities(WORKER_QUALITIES);
    } else {
      setQualities(EMPLOYER_QUALITIES);
    }
  }, [otherUser]);

  const handlePhotoAdd = (index, preview, file) => {
    const next = [...photos];
    next[index] = { preview, file };
    setPhotos(next);
  };

  const handlePhotoRemove = (index) => {
    const next = [...photos];
    next[index] = null;
    setPhotos(next);
  };

  const photoCount = photos.filter(Boolean).length;

  const handleQualityToggle = (quality) => {
    setSelectedQualities(prev =>
      prev.includes(quality)
        ? prev.filter(q => q !== quality)
        : [...prev, quality]
    );
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      alert("Por favor, deixa um comentário sobre a experiência.");
      return;
    }
    if (!otherUser?.id) {
      alert("Erro: utilizador não identificado. Tenta novamente.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Calcular XP bonus por fotos (se worker)
      const photosBonus = isWorkerFlow && photoCount >= 3 ? 5 : 1; // 5x se 3 fotos

      const result = await fetch('/api/functions/completeJob', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          applicationId: application?.id,
          otherUserId: otherUser.id,
          raterId: currentUser.id,
          raterUserType: currentUser.user_type,
          rating,
          comment: comment.trim(),
          qualities: selectedQualities,
          photoCount: isWorkerFlow ? photoCount : 0,
        })
      });

      if (!result.ok) {
        const err = await result.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${result.status}`);
      }

      const data = await result.json();
      setXpToast({ show: true, gained: data.selfXPGained || 30, total: data.newSelfXP || 30 });
      onComplete();

    } catch (error) {
      console.error("Error completing job:", error);
      alert("Erro ao finalizar trabalho: " + error.message);
    }

    setIsSubmitting(false);
  };

  const isEmployerFlow = currentUser.user_type === 'employer';
  const { isDark } = useTheme();
  const bg = isDark ? "#1A1A1A" : "#FFFFFF";
  const surface = isDark ? "#2A2A2A" : "#F5F5F5";
  const text = isDark ? "#FFFFFF" : "#111016";
  const subtext = isDark ? "#AAAAAA" : "#666666";
  const border = isDark ? "#333333" : "#E5E5E5";

  return (
    <>
      <XPGainToast xpGained={xpToast.gained} newXP={xpToast.total} show={xpToast.show} onDone={() => { setXpToast(t => ({...t, show:false})); onClose(); }} />
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent style={{background:bg, border:"1px solid #333", borderRadius:20, maxWidth:460, maxHeight:"90vh", overflowY:"auto", padding:0}}>

          {/* Header */}
          <div style={{padding:"20px 20px 16px", borderBottom:"1px solid #333", display:"flex", alignItems:"center", gap:10}}>
            {isEmployerFlow ? <span style={{fontSize:20}}>🏆</span> : <span style={{fontSize:20}}>✏️</span>}
            <h2 style={{fontWeight:700, color:text, fontSize:16, margin:0}}>
              {isEmployerFlow ? "Finalizar e Avaliar Profissional" : "Avaliar Empregador"}
            </h2>
          </div>

          <div style={{padding:20, display:"flex", flexDirection:"column", gap:20}}>

            {/* Info da obra */}
            <div style={{background:"#FF660011", border:"1px solid #FF660033", borderRadius:12, padding:14}}>
              <p style={{fontWeight:700, color:"#FF6600", margin:"0 0 4px", fontSize:14}}>{job.title}</p>
              <p style={{color:subtext, fontSize:13, margin:0}}>A avaliar: <strong style={{color:text}}>{otherUser.full_name}</strong></p>
            </div>

            {/* UX FIX: 3 caixas de fotos para profissional (5x XP bonus) */}
            {isWorkerFlow && (
              <div>
                <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10}}>
                  <label style={{color:subtext, fontSize:12, fontWeight:600, textTransform:"uppercase", letterSpacing:1}}>
                    Fotos de Prova ({photoCount}/3)
                  </label>
                  {photoCount === 3 && (
                    <span style={{background:"#22C55E22", color:"#22C55E", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, border:"1px solid #22C55E44"}}>
                      ⚡ Bónus 5× XP desbloqueado!
                    </span>
                  )}
                </div>
                <div style={{display:"flex", gap:8}}>
                  {[0,1,2].map(i => (
                    <PhotoBox
                      key={i} index={i} photo={photos[i]}
                      onAdd={handlePhotoAdd} onRemove={handlePhotoRemove}
                      isDark={isDark} text={text} subtext={subtext}
                    />
                  ))}
                </div>
                <p style={{color:subtext, fontSize:12, margin:"8px 0 0", textAlign:"center"}}>
                  Toque numa caixa para abrir a câmara · 3 fotos = bónus de XP 🎯
                </p>
              </div>
            )}

            {/* Estrelas */}
            <div>
              <label style={{color:subtext, fontSize:12, fontWeight:600, display:"block", marginBottom:10}}>Como avalia a experiência?</label>
              <div style={{display:"flex", gap:8}}>
                {[1,2,3,4,5].map(star => (
                  <button key={star} type="button" onClick={() => setRating(star)}
                    style={{background:"none", border:"none", cursor:"pointer", padding:4}}>
                    <Star style={{width:36, height:36, color:star<=rating?"#FBBF24":"#444", fill:star<=rating?"#FBBF24":"none"}} />
                  </button>
                ))}
              </div>
            </div>

            {/* Qualidades */}
            <div>
              <label style={{color:subtext, fontSize:12, fontWeight:600, display:"block", marginBottom:10}}>Que qualidades destacaria?</label>
              <div style={{display:"flex", flexWrap:"wrap", gap:8}}>
                {qualities.map(quality => (
                  <button key={quality} type="button" onClick={() => handleQualityToggle(quality)}
                    style={{padding:"6px 14px", borderRadius:20, border:`1px solid ${selectedQualities.includes(quality)?"#FF6600":"#444"}`, background:selectedQualities.includes(quality)?"#FF6600":"transparent", color:selectedQualities.includes(quality)?"#FFF":"#AAAAAA", fontSize:13, cursor:"pointer", fontWeight:selectedQualities.includes(quality)?700:400}}>
                    {quality}
                  </button>
                ))}
              </div>
            </div>

            {/* Comentário */}
            <div>
              <label style={{color:subtext, fontSize:12, fontWeight:600, display:"block", marginBottom:8}}>Comentário *</label>
              <textarea placeholder="Descreve como foi a experiência..." value={comment} onChange={e => setComment(e.target.value)} rows={4}
                style={{width:"100%", padding:"12px 14px", background:surface, border:"2px solid #FF6600", borderRadius:12, color:text, fontSize:14, outline:"none", resize:"vertical", fontFamily:"inherit", boxSizing:"border-box", colorScheme: isDark ? "dark" : "light"}} />
            </div>

            {/* XP Preview */}
            <div style={{background:"#22C55E11", border:"1px solid #22C55E33", borderRadius:12, padding:16}}>
              <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:12}}>
                <span style={{fontSize:16}}>⚡</span>
                <span style={{fontWeight:700, color:"#22C55E", fontSize:14}}>XP a ser atribuído</span>
              </div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, textAlign:"center"}}>
                <div style={{background:"#22C55E22", borderRadius:10, padding:"10px 0"}}>
                  <p style={{fontSize:11, color:subtext, margin:"0 0 4px"}}>Para {otherUser.full_name?.split(' ')[0]}</p>
                  <p style={{fontWeight:800, fontSize:22, color:"#22C55E", margin:0}}>+{calcJobXP(rating, job.price || 0, false)} XP</p>
                </div>
                <div style={{background:"#22C55E11", borderRadius:10, padding:"10px 0"}}>
                  <p style={{fontSize:11, color:subtext, margin:"0 0 4px"}}>Para si</p>
                  <p style={{fontWeight:800, fontSize:22, color:"#22C55E", margin:0}}>
                    +{isWorkerFlow && photoCount >= 3
                      ? XP_EVENTS.job_completed_self * 5
                      : XP_EVENTS.job_completed_self} XP
                    {isWorkerFlow && photoCount >= 3 && <span style={{fontSize:12}}> ×5🔥</span>}
                  </p>
                </div>
              </div>
              {isWorkerFlow && photoCount > 0 && photoCount < 3 && (
                <p style={{color:"#F59E0B", fontSize:12, textAlign:"center", margin:"10px 0 0", fontWeight:600}}>
                  📷 Adiciona {3 - photoCount} foto{3 - photoCount > 1 ? "s" : ""} para desbloquear o bónus 5× XP!
                </p>
              )}
            </div>

            {/* Botões */}
            <div style={{display:"flex", gap:12}}>
              <button type="button" onClick={onClose}
                style={{flex:1, padding:"13px 0", background:"transparent", border:"1px solid #444", borderRadius:12, color:subtext, fontWeight:600, fontSize:14, cursor:"pointer"}}>
                Cancelar
              </button>
              <button onClick={handleSubmit} disabled={isSubmitting || !comment.trim()}
                style={{flex:1, padding:"13px 0", background:isSubmitting||!comment.trim()?"#333":"#22C55E", border:"none", borderRadius:12, color:isSubmitting||!comment.trim()?"#555":"#FFF", fontWeight:700, fontSize:14, cursor:isSubmitting||!comment.trim()?"not-allowed":"pointer"}}>
                {isSubmitting ? "A finalizar..." : "Enviar Avaliação ✓"}
              </button>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
