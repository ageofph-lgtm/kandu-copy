import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, X } from "lucide-react";

export default function CompletionModal() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([null, null, null]);
  const inputRef = useRef(null);
  const [activeSlot, setActiveSlot] = useState(null);

  const filledCount = photos.filter(Boolean).length;
  const hasAll = filledCount === 3;
  const xp = hasAll ? 1000 : 200;
  const barWidth = hasAll ? "100%" : `${(filledCount / 3) * 40 + 15}%`;

  const handleSlotClick = (i) => {
    setActiveSlot(i);
    inputRef.current?.click();
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file || activeSlot === null) return;
    const url = URL.createObjectURL(file);
    setPhotos(prev => { const n = [...prev]; n[activeSlot] = url; return n; });
    e.target.value = "";
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />

      <div style={{
        width: "100%", maxWidth: 380, background: "#1A1A1A", borderRadius: 24,
        padding: 24, display: "flex", flexDirection: "column", gap: 16,
      }}>

        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* KANDU hex logo */}
          <div style={{
            width: 36, height: 36, flexShrink: 0,
            background: "#FF6600",
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>K</span>
          </div>
          <h2 style={{ flex: 1, textAlign: "center", color: "#fff", fontWeight: 800, fontSize: 20, margin: 0 }}>
            Obra Concluída! 🎉
          </h2>
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <X size={20} color="#888" />
          </button>
        </div>

        {/* Photo slots */}
        <div style={{ display: "flex", gap: 10 }}>
          {photos.map((photo, i) => (
            <div
              key={i}
              onClick={() => handleSlotClick(i)}
              style={{
                flex: 1, height: 90, position: "relative", cursor: "pointer",
                background: photo ? "#FF660033" : "#2A2A2A",
                border: `2px ${photo ? "solid" : "dashed"} #FF6600`,
                borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {photo ? (
                <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <Camera size={28} color="#FF6600" />
              )}
              {/* Badge */}
              <div style={{
                position: "absolute", top: -8, right: -8,
                background: "#FF6600", borderRadius: 50,
                padding: "3px 7px", fontSize: 11, fontWeight: 700, color: "#fff",
              }}>
                {i + 1}/3
              </div>
            </div>
          ))}
        </div>

        {/* Banner */}
        <div style={{
          background: "#FF6600", borderRadius: 12, padding: "10px 14px",
          textAlign: "center", color: "#fff", fontWeight: 700, fontSize: 13,
        }}>
          Envia 3 fotos e multiplica o teu XP por 5x! ⚡
        </div>

        {/* XP Card */}
        <div style={{
          background: "#2A2A2A", borderRadius: 16, padding: 20,
          textAlign: "center", display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#fff", fontWeight: 800, fontSize: 18, margin: 0 }}>200 XP</p>
              <p style={{ color: "#888", fontSize: 12, margin: "2px 0 0" }}>Base</p>
            </div>
            <span style={{ color: "#FF6600", fontSize: 20, fontWeight: 700 }}>→</span>
            <p style={{
              color: "#FF6600", fontWeight: 900, fontSize: 28, margin: 0,
              transition: "all 0.4s ease",
              transform: hasAll ? "scale(1.1)" : "scale(1)",
            }}>
              {xp.toLocaleString("pt-PT")} XP ⚡
            </p>
          </div>

          {/* Progress bar */}
          <div style={{ background: "#333", height: 10, borderRadius: 10, overflow: "hidden" }}>
            <div style={{
              width: barWidth, height: "100%",
              background: "linear-gradient(to right, #FF6600, #FFAA00)",
              borderRadius: 10, transition: "width 0.4s ease",
            }} />
          </div>

          <p style={{ color: "#888", fontSize: 13, margin: 0 }}>Prova que o trabalho foi feito e ganha mais</p>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate("/review")}
          style={{
            width: "100%", background: "#FF6600", borderRadius: 50,
            padding: 16, fontWeight: 700, fontSize: 16,
            color: "#fff", border: "none", cursor: "pointer",
          }}
        >
          Submeter e Receber XP 🚀
        </button>
      </div>
    </div>
  );
}