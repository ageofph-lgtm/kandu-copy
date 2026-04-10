import React, { useEffect, useState } from "react";
import { useTheme } from "@/lib/ThemeContext";

const LOGO_DARK  = "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/90321a683_Gemini_Generated_Image_k4rh2gk4rh2gk4rh.png";
const LOGO_LIGHT = "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/002158942_Gemini_Generated_Image_5.png";

/* ─── Hexagon segments (6 sides) drawn as SVG lines ─── */
const HEX_POINTS = (() => {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    pts.push([50 + 38 * Math.cos(angle), 50 + 38 * Math.sin(angle)]);
  }
  return pts;
})();

const HEX_SEGMENTS = HEX_POINTS.map((p, i) => ({
  x1: p[0], y1: p[1],
  x2: HEX_POINTS[(i + 1) % 6][0],
  y2: HEX_POINTS[(i + 1) % 6][1],
}));

export default function LoadingScreen({ label }) {
  const { isDark } = useTheme();
  const bg = isDark ? "#111016" : "#FFFFFF";
  const textColor = isDark ? "#AAAAAA" : "#666666";
  const logo = isDark ? LOGO_DARK : LOGO_LIGHT;

  const [activeSegment, setActiveSegment] = useState(0);
  const [builtSegments, setBuiltSegments] = useState([]);
  const [phase, setPhase] = useState("build"); // build → glow → build

  useEffect(() => {
    let seg = 0;
    let built = [];
    let interval;

    const tick = () => {
      if (seg < 6) {
        built = [...built, seg];
        setBuiltSegments([...built]);
        setActiveSegment(seg);
        seg++;
      } else {
        // Full hex — hold glow then restart
        setPhase("glow");
        clearInterval(interval);
        setTimeout(() => {
          seg = 0;
          built = [];
          setBuiltSegments([]);
          setActiveSegment(0);
          setPhase("build");
          interval = setInterval(tick, 130);
        }, 900);
      }
    };

    interval = setInterval(tick, 130);
    return () => clearInterval(interval);
  }, []);

  const css = `
    @keyframes kanduPulse {
      0%   { filter: drop-shadow(0 0 8px #FF6600) drop-shadow(0 0 20px #FF6600); opacity: 1; }
      50%  { filter: drop-shadow(0 0 22px #FF8C00) drop-shadow(0 0 48px #FF4400); opacity: 0.85; }
      100% { filter: drop-shadow(0 0 8px #FF6600) drop-shadow(0 0 20px #FF6600); opacity: 1; }
    }
    @keyframes logoGlow {
      0%   { filter: drop-shadow(0 0 6px rgba(255,102,0,0)) brightness(1); }
      50%  { filter: drop-shadow(0 0 18px #FF6600) brightness(1.15); }
      100% { filter: drop-shadow(0 0 6px rgba(255,102,0,0)) brightness(1); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: bg,
      gap: 24,
    }}>
      <style>{css}</style>

      {/* Hexagon forming animation */}
      <div style={{ position: "relative", width: 100, height: 100 }}>
        <svg viewBox="0 0 100 100" width="100" height="100" style={{ overflow: "visible" }}>
          {/* Ghost hex (faint outline always present) */}
          {HEX_SEGMENTS.map((seg, i) => (
            <line
              key={`ghost-${i}`}
              x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
              stroke={isDark ? "rgba(255,102,0,0.08)" : "rgba(255,102,0,0.12)"}
              strokeWidth="2"
              strokeLinecap="round"
            />
          ))}

          {/* Built segments */}
          {builtSegments.map((segIdx) => (
            <line
              key={`built-${segIdx}`}
              x1={HEX_SEGMENTS[segIdx].x1}
              y1={HEX_SEGMENTS[segIdx].y1}
              x2={HEX_SEGMENTS[segIdx].x2}
              y2={HEX_SEGMENTS[segIdx].y2}
              stroke="#FF6600"
              strokeWidth={phase === "glow" ? 3 : 2.5}
              strokeLinecap="round"
              style={{
                filter: phase === "glow"
                  ? "drop-shadow(0 0 6px #FF6600) drop-shadow(0 0 14px #FF4400)"
                  : segIdx === activeSegment
                    ? "drop-shadow(0 0 8px #FF6600)"
                    : "drop-shadow(0 0 3px rgba(255,102,0,0.5))",
                animation: phase === "glow" ? "kanduPulse 0.9s ease-in-out" : "none",
              }}
            />
          ))}

          {/* Leading dot */}
          {phase === "build" && builtSegments.length > 0 && builtSegments.length < 6 && (() => {
            const lastSeg = HEX_SEGMENTS[activeSegment];
            return (
              <circle
                cx={lastSeg.x2} cy={lastSeg.y2} r="4"
                fill="#FF6600"
                style={{ filter: "drop-shadow(0 0 6px #FF6600)" }}
              />
            );
          })()}
        </svg>
      </div>

      {/* KANDU logo with neon glow */}
      <img
        src={logo}
        alt="KANDU"
        style={{
          height: 32,
          objectFit: "contain",
          animation: "logoGlow 2s ease-in-out infinite",
          animationDelay: "0.4s",
        }}
      />

      {label && (
        <p style={{
          color: textColor,
          fontSize: 13,
          margin: 0,
          fontWeight: 500,
          animation: "fadeInUp 0.4s ease",
        }}>
          {label}
        </p>
      )}
    </div>
  );
}
