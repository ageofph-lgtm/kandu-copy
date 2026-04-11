import React, { useEffect, useState } from "react";
import { getXPLevel } from "@/lib/xp";

/**
 * Animated XP gain popup com animação de hexágono KANDU.
 * Props: xpGained (number), newXP (number), show (bool), onDone (fn)
 */
export default function XPGainToast({ xpGained, newXP, show, onDone }) {
  const [visible, setVisible] = useState(false);
  const [animPhase, setAnimPhase] = useState(0); // 0=entrada, 1=steady, 2=saída
  const level = getXPLevel(newXP);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    setAnimPhase(0);
    // Fase 1: entrada rápida
    const t1 = setTimeout(() => setAnimPhase(1), 50);
    // Fase 2: começa a sair
    const t2 = setTimeout(() => setAnimPhase(2), 2800);
    // Fase 3: remove do DOM
    const t3 = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 3300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [show]);

  if (!visible) return null;

  const scale = animPhase === 0 ? 0.5 : animPhase === 1 ? 1 : 0.8;
  const opacity = animPhase === 0 ? 0 : animPhase === 1 ? 1 : 0;
  const translateY = animPhase === 0 ? -30 : animPhase === 1 ? 0 : -20;

  return (
    <div style={{
      position:"fixed",
      top:20,
      left:"50%",
      transform:`translateX(-50%) translateY(${translateY}px) scale(${scale})`,
      opacity,
      transition:"all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
      zIndex:9999,
      pointerEvents:"none"
    }}>
      <div style={{
        background:"#1A1A1A",
        border:"2px solid #FF6600",
        borderRadius:20,
        padding:"16px 24px",
        display:"flex",
        alignItems:"center",
        gap:14,
        minWidth:240,
        boxShadow:"0 8px 32px rgba(255,102,0,0.35), 0 2px 8px rgba(0,0,0,0.5)"
      }}>
        {/* Hexágono animado */}
        <div style={{position:"relative",flexShrink:0}}>
          <svg width="48" height="54" viewBox="0 0 48 54" style={{
            filter:"drop-shadow(0 0 8px #FF6600)",
            animation: animPhase === 1 ? "hexPulse 0.6s ease-out" : "none"
          }}>
            <polygon points="24,2 46,14 46,40 24,52 2,40 2,14"
              fill="#FF6600" stroke="#FF8833" strokeWidth="2"/>
            <polygon points="24,10 38,18 38,36 24,44 10,36 10,18"
              fill="#1A1A1A"/>
            <text x="24" y="31" textAnchor="middle" fill="#FF6600" fontSize="14" fontWeight="900" fontFamily="Arial">K</text>
          </svg>
          <style>{`
            @keyframes hexPulse {
              0% { transform: scale(0.6) rotate(-15deg); }
              60% { transform: scale(1.2) rotate(5deg); }
              100% { transform: scale(1) rotate(0deg); }
            }
          `}</style>
        </div>

        <div>
          <p style={{fontSize:11, color:"#AAAAAA", margin:"0 0 2px", textTransform:"uppercase", letterSpacing:1, fontWeight:600}}>XP Ganho!</p>
          <p style={{
            fontSize:28,
            fontWeight:900,
            color:"#FF6600",
            margin:"0 0 2px",
            lineHeight:1,
            textShadow:"0 0 12px rgba(255,102,0,0.5)"
          }}>+{xpGained}</p>
          <p style={{fontSize:11, color:"#AAAAAA", margin:0}}>
            {level.emoji} {level.name} · {newXP.toLocaleString("pt-PT")} XP total
          </p>
        </div>
      </div>
    </div>
  );
}
