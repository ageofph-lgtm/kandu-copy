import React, { useEffect, useState } from "react";

const LOGO = "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png";
const SPLASH_KEY = "kandu_splash_v2";

/*
  Timing total: ~1.8s
  0ms   → fundo preto, logo invisível
  100ms → logo aparece com fade-in
  400ms → neon começa a pulsar (anel laranja cresce)
  1200ms→ neon explode (flash breve)
  1500ms→ fade-out geral
  1800ms→ onDone()
*/

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState("idle"); // idle → fadeIn → neon → burst → fadeOut
  const alreadySeen = sessionStorage.getItem(SPLASH_KEY);

  useEffect(() => {
    if (alreadySeen) { onDone(); return; }

    const t1 = setTimeout(() => setPhase("fadeIn"),  80);
    const t2 = setTimeout(() => setPhase("neon"),    350);
    const t3 = setTimeout(() => setPhase("burst"),  1150);
    const t4 = setTimeout(() => setPhase("fadeOut"),1400);
    const t5 = setTimeout(() => {
      sessionStorage.setItem(SPLASH_KEY, "1");
      onDone();
    }, 1850);

    return () => [t1,t2,t3,t4,t5].forEach(clearTimeout);
  }, []);

  if (alreadySeen) return null;

  const css = `
    @keyframes neonRing {
      0%   { box-shadow: 0 0 0px 0px rgba(255,102,0,0); opacity: 0; transform: scale(0.92); }
      40%  { box-shadow: 0 0 18px 6px rgba(255,102,0,0.55), 0 0 40px 12px rgba(255,80,0,0.25); opacity: 1; transform: scale(1); }
      100% { box-shadow: 0 0 28px 10px rgba(255,102,0,0.8), 0 0 60px 20px rgba(255,60,0,0.4); opacity: 1; transform: scale(1.04); }
    }
    @keyframes burst {
      0%   { box-shadow: 0 0 28px 10px rgba(255,102,0,0.8), 0 0 60px 20px rgba(255,60,0,0.4); transform: scale(1.04); }
      50%  { box-shadow: 0 0 60px 30px rgba(255,130,0,1),   0 0 120px 60px rgba(255,60,0,0.6); transform: scale(1.12); }
      100% { box-shadow: 0 0 10px 4px rgba(255,102,0,0.2),  0 0 30px 10px rgba(255,60,0,0.1); transform: scale(1); }
    }
    @keyframes bgFlash {
      0%   { background: #111016; }
      50%  { background: #1f0d00; }
      100% { background: #111016; }
    }
  `;

  const logoStyle = (() => {
    const base = {
      width: 110,
      height: 110,
      objectFit: "contain",
      borderRadius: 28,
      transition: "opacity 0.25s ease, transform 0.25s ease",
    };
    if (phase === "idle")    return { ...base, opacity: 0, transform: "scale(0.88)" };
    if (phase === "fadeIn")  return { ...base, opacity: 1, transform: "scale(1)", transition: "opacity 0.28s ease, transform 0.28s ease" };
    if (phase === "neon")    return { ...base, opacity: 1, animation: "neonRing 0.85s ease forwards" };
    if (phase === "burst")   return { ...base, opacity: 1, animation: "burst 0.28s ease forwards" };
    if (phase === "fadeOut") return { ...base, opacity: 0, transform: "scale(1.06)", transition: "opacity 0.45s ease, transform 0.45s ease" };
    return base;
  })();

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#111016",
      animation: phase === "burst" ? "bgFlash 0.28s ease" : "none",
      transition: phase === "fadeOut" ? "opacity 0.45s ease" : "none",
      opacity: phase === "fadeOut" ? 0 : 1,
    }}>
      <style>{css}</style>
      <img src={LOGO} alt="KANDU" style={logoStyle} />
    </div>
  );
}
