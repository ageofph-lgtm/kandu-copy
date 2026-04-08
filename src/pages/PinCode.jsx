import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const PIN = "482719";
const TOTAL = 30 * 60; // 30 min in seconds

function TimerArc({ seconds }) {
  const total = TOTAL;
  const progress = seconds / total;
  const r = 36;
  const cx = 44;
  const cy = 44;
  const circumference = Math.PI * r; // half circle
  const dashOffset = circumference * (1 - progress);
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 24 }}>
      <svg width="88" height="52" viewBox="0 0 88 52">
        {/* background arc */}
        <path
          d={`M 8 44 A ${r} ${r} 0 0 1 80 44`}
          fill="none" stroke="#2A2A2A" strokeWidth="5" strokeLinecap="round"
        />
        {/* progress arc */}
        <path
          d={`M 8 44 A ${r} ${r} 0 0 1 80 44`}
          fill="none" stroke="#FF6600" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <p style={{ color: "#FF6600", fontWeight: 700, fontSize: 18, margin: "-6px 0 0" }}>
        {mins}:{secs}
      </p>
    </div>
  );
}

export default function PinCode() {
  const navigate = useNavigate();
  const [view, setView] = useState("employer");
  const [digits, setDigits] = useState([]);
  const [seconds, setSeconds] = useState(TOTAL);

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const pressKey = (key) => {
    if (key === "del") {
      setDigits(d => d.slice(0, -1));
    } else if (digits.length < 6) {
      setDigits(d => [...d, key]);
    }
  };

  const keys = ["1","2","3","4","5","6","7","8","9","","0","del"];

  return (
    <div style={{
      minHeight: "100vh", background: "#1A1A1A", display: "flex", flexDirection: "column",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='70'%3E%3Cpolygon points='30,2 58,17 58,53 30,68 2,53 2,17' fill='none' stroke='%23ffffff08' stroke-width='1.5'/%3E%3C/svg%3E")`,
    }}>

      {/* Top bar */}
      <div style={{ padding: "50px 16px 16px", display: "flex", alignItems: "center" }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <ChevronLeft size={26} color="#FFFFFF" />
        </button>
        <h1 style={{ flex: 1, textAlign: "center", color: "#fff", fontWeight: 800, fontSize: 20, margin: 0, marginRight: 26 }}>
          Validar Presença
        </h1>
      </div>

      {/* Toggle */}
      <div style={{ display: "flex", gap: 8, margin: "0 20px 24px" }}>
        {[{ key: "employer", label: "👷 Empregador" }, { key: "professional", label: "🔧 Profissional" }].map(t => (
          <button
            key={t.key}
            onClick={() => { setView(t.key); setDigits([]); }}
            style={{
              flex: 1, padding: "12px 0", borderRadius: 50, border: "none", cursor: "pointer",
              background: view === t.key ? "#FF6600" : "#2A2A2A",
              color: "#fff", fontWeight: 700, fontSize: 14,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 20px 100px" }}>
        {view === "employer" ? (
          <>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 32 }}>Mostra este código ao profissional</p>

            {/* Hexagon */}
            <div style={{ position: "relative", width: 200, height: 230, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="200" height="230" viewBox="0 0 200 230" style={{ position: "absolute" }}>
                <polygon
                  points="100,4 196,52 196,178 100,226 4,178 4,52"
                  fill="#1A1A1A"
                  stroke="#FF6600"
                  strokeWidth="4"
                  filter="url(#glow)"
                />
                <defs>
                  <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
              </svg>
              <p style={{
                position: "relative", zIndex: 1,
                color: "#FF6600", fontWeight: 900, fontSize: 44,
                letterSpacing: 8, margin: 0, userSelect: "none",
              }}>
                {PIN}
              </p>
            </div>

            <TimerArc seconds={seconds} />
          </>
        ) : (
          <>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 24, textAlign: "center" }}>
              Introduz o código fornecido pelo empregador
            </p>

            {/* 6 boxes */}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{
                  width: 44, height: 52, background: "#2A2A2A", borderRadius: 10,
                  border: `2px solid ${i === digits.length ? "#FF6600" : "#333"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: 20,
                }}>
                  {digits[i] || ""}
                </div>
              ))}
            </div>

            {/* Numpad */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, width: "100%", maxWidth: 280 }}>
              {keys.map((k, i) => (
                k === "" ? <div key={i} /> :
                <button
                  key={i}
                  onClick={() => pressKey(k)}
                  style={{
                    background: "#2A2A2A", borderRadius: 12, padding: "14px 0",
                    fontSize: 20, fontWeight: 700, color: "#fff", border: "none", cursor: "pointer",
                  }}
                >
                  {k === "del" ? "⌫" : k}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom CTA */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 20px 32px", background: "#1A1A1A" }}>
        <button style={{
          width: "100%", background: "#FF6600", borderRadius: 50,
          padding: 16, fontWeight: 700, fontSize: 16,
          color: "#fff", border: "none", cursor: "pointer",
        }}>
          Confirmar e Iniciar ✓
        </button>
      </div>
    </div>
  );
}