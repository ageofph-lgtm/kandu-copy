import React, { useEffect, useState } from "react";

// Logo branco sem fundo (ícone standalone)
const LOGO = "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/f0a8b458b_Gemini_Generated_Image_nn24elnn24elnn24-Photoroom.png";
const SPLASH_KEY = "kandu_splash_v2";

/*
  Timing total: ~1.8s
  80ms  → logo fade-in
  350ms → neon anel laranja cresce
  1150ms→ burst / flash
  1400ms→ fade-out
  1850ms→ onDone()
*/

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState("idle");
  const alreadySeen = sessionStorage.getItem(SPLASH_KEY);

  useEffect(() => {
    if (alreadySeen) { onDone(); return; }

    const timers = [
      setTimeout(() => setPhase("fadeIn"),   80),
      setTimeout(() => setPhase("neon"),    350),
      setTimeout(() => setPhase("burst"),  1150),
      setTimeout(() => setPhase("fadeOut"),1400),
      setTimeout(() => {
        sessionStorage.setItem(SPLASH_KEY, "1");
        onDone();
      }, 1850),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  if (alreadySeen) return null;

  const css = `
    @keyframes neonRing {
      0%   { box-shadow: 0 0 0px 0px rgba(255,102,0,0);    transform: scale(0.92); }
      40%  { box-shadow: 0 0 22px 8px rgba(255,102,0,0.6), 0 0 50px 16px rgba(255,80,0,0.28); transform: scale(1); }
      100% { box-shadow: 0 0 32px 12px rgba(255,102,0,0.85), 0 0 70px 24px rgba(255,60,0,0.45); transform: scale(1.04); }
    }
    @keyframes burst {
      0%   { box-shadow: 0 0 32px 12px rgba(255,102,0,0.85), 0 0 70px 24px rgba(255,60,0,0.45); transform: scale(1.04); }
      50%  { box-shadow: 0 0 70px 36px rgba(255,140,0,1),    0 0 140px 70px rgba(255,60,0,0.65); transform: scale(1.13); }
      100% { box-shadow: 0 0 12px 4px rgba(255,102,0,0.2),   0 0 30px 10px rgba(255,60,0,0.1);  transform: scale(1); }
    }
    @keyframes bgBurst {
      0%   { background: #111016; }
      50%  { background: #1c0d00; }
      100% { background: #111016; }
    }
  `;

  const logoStyle = (() => {
    const base = { width: 110, height: 110, objectFit: "contain", borderRadius: 24 };
    if (phase === "idle")    return { ...base, opacity: 0, transform: "scale(0.88)", transition: "none" };
    if (phase === "fadeIn")  return { ...base, opacity: 1, transform: "scale(1)", transition: "opacity 0.28s ease, transform 0.28s ease" };
    if (phase === "neon")    return { ...base, opacity: 1, animation: "neonRing 0.85s ease forwards" };
    if (phase === "burst")   return { ...base, opacity: 1, animation: "burst 0.28s ease forwards" };
    if (phase === "fadeOut") return { ...base, opacity: 0, transform: "scale(1.06)", transition: "opacity 0.45s ease, transform 0.45s ease" };
    return base;
  })();

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#111016",
      animation: phase === "burst" ? "bgBurst 0.28s ease" : "none",
      opacity: phase === "fadeOut" ? 0 : 1,
      transition: phase === "fadeOut" ? "opacity 0.45s ease" : "none",
    }}>
      <style>{css}</style>
      <img src={LOGO} alt="KANDU" style={logoStyle} />
    </div>
  );
}
