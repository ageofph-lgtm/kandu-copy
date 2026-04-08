import React from "react";
import { useNavigate } from "react-router-dom";

const HEX_CLIP = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";
const SPECIALTIES = ["Elétrica", "Solar", "Automação"];
const XP_NODES = [true, true, true, true, false]; // filled / empty

export default function ProfileKandu() {
  const navigate = useNavigate();

  const handleSpecialty = (s) => {
    navigate("/Search?cat=" + encodeURIComponent(s));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#1A1A1A", position: "relative", overflowY: "auto", padding: "50px 20px 80px" }}>

      {/* Hex pattern bg */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04, pointerEvents: "none" }} aria-hidden>
        <defs>
          <pattern id="hex" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
            <polygon points="28,0 56,14 56,34 28,48 0,34 0,14" fill="none" stroke="#FF6600" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex)" />
      </svg>

      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, position: "relative", zIndex: 1 }}>
        <div style={{
          width: 36, height: 36, background: "#222", borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid #FF660044",
        }}>
          <span style={{ color: "#FF6600", fontWeight: 900, fontSize: 16 }}>K</span>
        </div>
        <button style={{ background: "#2A2A2A", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18 }}>⚙️</button>
      </div>

      {/* Avatar hexagonal */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14, position: "relative", zIndex: 1 }}>
        <div style={{ position: "relative", width: 108, height: 108 }}>
          {/* Orange hex border */}
          <div style={{
            position: "absolute", inset: 0,
            clipPath: HEX_CLIP,
            background: "#FF6600",
          }} />
          {/* Inner hex image */}
          <div style={{
            position: "absolute", inset: 4,
            clipPath: HEX_CLIP,
            overflow: "hidden",
          }}>
            <img
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face"
              alt="avatar"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>
      </div>

      {/* Name & role */}
      <div style={{ textAlign: "center", marginBottom: 10, position: "relative", zIndex: 1 }}>
        <p style={{ color: "#fff", fontWeight: 800, fontSize: 20, margin: "0 0 4px" }}>Carlos Silva</p>
        <p style={{ color: "#AAAAAA", fontSize: 14, margin: 0 }}>Profissional · Eletricista</p>
      </div>

      {/* Badges row */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
        <span style={{ background: "#FF660022", color: "#FF6600", border: "1px solid #FF660044", borderRadius: 20, padding: "5px 14px", fontSize: 13, fontWeight: 600 }}>
          ✓ Verified
        </span>
        <span style={{ background: "#FF880022", color: "#FFAA00", border: "1px solid #FFAA0044", borderRadius: 20, padding: "5px 14px", fontSize: 13, fontWeight: 600 }}>
          ⭐ Ultra Verified
        </span>
      </div>

      {/* Stats grid 3 cols */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12, position: "relative", zIndex: 1 }}>
        {[
          { value: "47", label: "Trabalhos", color: "#fff" },
          { value: "4.9 ★", label: "Avaliação", color: "#FF6600" },
          { value: "98%", label: "Presença", color: "#22C55E" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#2A2A2A", borderRadius: 14, padding: "14px 8px", textAlign: "center" }}>
            <p style={{ color: s.color, fontWeight: 800, fontSize: 18, margin: "0 0 2px" }}>{s.value}</p>
            <p style={{ color: "#AAAAAA", fontSize: 11, margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* XP Card */}
      <div style={{ background: "#2A2A2A", borderRadius: 16, padding: 16, marginBottom: 12, position: "relative", zIndex: 1 }}>
        {/* XP nodes track */}
        <div style={{ position: "relative", height: 24, marginBottom: 12, display: "flex", alignItems: "center" }}>
          {/* Track line */}
          <div style={{ position: "absolute", left: 8, right: 8, height: 3, background: "#333", borderRadius: 2 }}>
            <div style={{ width: "80%", height: "100%", background: "#FF6600", borderRadius: 2 }} />
          </div>
          {/* Nodes */}
          {XP_NODES.map((filled, i) => {
            const pct = i / (XP_NODES.length - 1) * 100;
            return (
              <div key={i} style={{
                position: "absolute",
                left: `calc(${pct}% - 8px)`,
                width: 16, height: 16,
                clipPath: HEX_CLIP,
                background: filled ? "#FF6600" : "transparent",
                border: filled ? "none" : "2px solid #666",
                boxSizing: "border-box",
              }} />
            );
          })}
        </div>
        {/* XP label row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#FF6600", fontWeight: 800, fontSize: 20 }}>2.450 XP</span>
          <span style={{ color: "#AAAAAA", fontSize: 13 }}>Nível: Mestre</span>
        </div>
      </div>

      {/* No-show badge */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, position: "relative", zIndex: 1 }}>
        <span style={{ background: "#22C55E22", border: "1px solid #22C55E44", borderRadius: 20, padding: "6px 16px", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
          <span style={{ color: "#22C55E", fontWeight: 600, fontSize: 13 }}>No-show: 0.02%</span>
        </span>
      </div>

      {/* Especialidades card */}
      <div style={{ background: "#2A2A2A", borderRadius: 16, padding: 16, marginBottom: 24, position: "relative", zIndex: 1 }}>
        <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, margin: "0 0 10px" }}>Especialidades</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SPECIALTIES.map(s => (
            <button
              key={s}
              onClick={() => handleSpecialty(s)}
              style={{ background: "#FF6600", border: "none", borderRadius: 20, padding: "6px 14px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Android nav bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#111", padding: "12px 0 16px",
        display: "flex", justifyContent: "center", gap: 48, zIndex: 10,
      }}>
        {["□", "○", "◁"].map((icon, i) => (
          <span key={i} style={{ color: "#AAAAAA", fontSize: 18, cursor: "pointer" }}>{icon}</span>
        ))}
      </div>
    </div>
  );
}