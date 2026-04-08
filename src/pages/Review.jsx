import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Review() {
  const navigate = useNavigate();
  const [stars, setStars] = useState(4);
  const [comment, setComment] = useState("");

  return (
    <div style={{
      minHeight: "100vh", background: "#1A1A1A",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='70'%3E%3Cpolygon points='30,2 58,17 58,53 30,68 2,53 2,17' fill='none' stroke='%23ffffff08' stroke-width='1.5'/%3E%3C/svg%3E")`,
      display: "flex", flexDirection: "column", alignItems: "center",
      paddingBottom: 100,
    }}>

      {/* Title */}
      <h1 style={{ color: "#fff", fontWeight: 800, fontSize: 28, textAlign: "center", paddingTop: 60, margin: "0 20px 24px" }}>
        Avaliar Trabalho
      </h1>

      {/* Hex avatar */}
      <div style={{ position: "relative", width: 104, height: 104, margin: "0 auto 16px" }}>
        <svg width="104" height="104" viewBox="0 0 104 104" style={{ position: "absolute" }}>
          <polygon
            points="52,4 100,27 100,77 52,100 4,77 4,27"
            fill="#1A1A1A" stroke="#FF6600" strokeWidth="4"
          />
        </svg>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 78, height: 78, borderRadius: "50%", overflow: "hidden",
          background: "#2A2A2A",
        }}>
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face"
            alt="Carlos Silva"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </div>

      {/* Name & role */}
      <p style={{ color: "#fff", fontWeight: 700, fontSize: 18, textAlign: "center", margin: "0 0 4px" }}>Carlos Silva</p>
      <p style={{ color: "#AAAAAA", fontSize: 14, textAlign: "center", margin: "0 0 16px" }}>Eletricista</p>

      {/* Stars */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <span
            key={i}
            onClick={() => setStars(i)}
            style={{ fontSize: 32, cursor: "pointer", color: i <= stars ? "#FF6600" : "#333", userSelect: "none" }}
          >
            ★
          </span>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Escreve o teu comentário..."
        style={{
          width: "calc(100% - 40px)", margin: "0 20px", padding: "14px 16px",
          background: "#2A2A2A", border: "2px solid #FF6600", borderRadius: 12,
          height: 100, color: "#fff", fontSize: 14, resize: "none", outline: "none",
          fontFamily: "inherit",
        }}
      />

      {/* Blind Review card */}
      <div style={{
        margin: "16px 20px 0", width: "calc(100% - 40px)",
        background: "#FF660011", border: "1px solid #FF660033",
        borderRadius: 14, padding: 14,
        display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>🔒</span>
        <div>
          <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: "0 0 4px" }}>Blind Review ativo</p>
          <p style={{ color: "#AAAAAA", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            A tua avaliação ficará oculta até que a outra parte também avalie, ou até 7 dias.
          </p>
        </div>
      </div>

      {/* Status */}
      <p style={{ color: "#888", fontSize: 13, textAlign: "center", margin: "16px 20px 0" }}>
        ⏳ A aguardar avaliação da outra parte
      </p>

      {/* CTA */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 20px 32px", background: "#1A1A1A" }}>
        <button
          disabled={stars < 1}
          onClick={() => navigate("/")}
          style={{
            width: "100%", background: stars < 1 ? "#555" : "#FF6600",
            borderRadius: 50, padding: 16, fontWeight: 700, fontSize: 16,
            color: "#fff", border: "none", cursor: stars < 1 ? "not-allowed" : "pointer",
          }}
        >
          Submeter Avaliação
        </button>
      </div>
    </div>
  );
}