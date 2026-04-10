import React, { useState, useEffect } from "react";
import { useTheme } from "@/lib/ThemeContext";
import XPGainToast from "@/components/XPGainToast";
import { XP_EVENTS } from "@/lib/xp";
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
      alert("Por favor, deixa um comentário sobre a experiência.");
      return;
    }
    if (!otherUser?.id) {
      alert("Erro: utilizador não identificado. Tenta novamente.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Chamar a backend function completeJob (usa asServiceRole para XP/rating)
      const result = await fetch('/api/functions/completeJob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          applicationId: application?.id,
          otherUserId: otherUser.id,
          rating,
          comment: comment.trim(),
          qualities: selectedQualities
        })
      });

      if (!result.ok) {
        const err = await result.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${result.status}`);
      }

      const data = await result.json();

      // Mostrar XP ganho
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
  const surface2 = isDark ? "#1E1E1E" : "#EBEBEB";
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
                  <p style={{fontWeight:800, fontSize:22, color:"#22C55E", margin:0}}>+{calcJobXP(rating, job.price, checkIfEarly())} XP</p>
                </div>
                <div style={{background:"#22C55E11", borderRadius:10, padding:"10px 0"}}>
                  <p style={{fontSize:11, color:subtext, margin:"0 0 4px"}}>Para si</p>
                  <p style={{fontWeight:800, fontSize:22, color:"#22C55E", margin:0}}>+{XP_EVENTS.job_completed_self} XP</p>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div style={{display:"flex", gap:12}}>
              <button type="button" onClick={onClose}
                style={{flex:1, padding:"13px 0", background:"transparent", border:"1px solid #444", borderRadius:12, color:subtext, fontWeight:600, fontSize:14, cursor:"pointer"}}>
                Cancelar
              </button>
              <button onClick={handleSubmit} disabled={isSubmitting || !comment.trim()}
                style={{flex:1, padding:"13px 0", background:isSubmitting||!comment.trim()?"#333":"#22C55E", border:"none", borderRadius:12, color:isSubmitting||!comment.trim()?"#555":"#FFF", fontWeight:700, fontSize:14, cursor:isSubmitting||!comment.trim()?"not-allowed":"pointer"}}>
                {isSubmitting ? "A finalizar..." : "Enviar Avaliação"}
              </button>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}