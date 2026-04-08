import React from "react";
import { useNavigate } from "react-router-dom";

const APPLICANTS = [
  { name: "João Silva", role: "Especialista em Demolição", rating: 4.8, icon: "⛑️" },
  { name: "Ana Rodrigues", role: "Especialista em Demolição", rating: 4.9, icon: "🧰" },
  { name: "Ana Rodrigues", role: "Mestre de Obras", rating: 3.9, icon: "🧰" },
  { name: "Carlos Santos", role: "Instalador de Móveis", rating: 4.7, icon: "🔧" },
];

export default function Applicants() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#1A1A1A", display: "flex", flexDirection: "column", paddingBottom: 40 }}>

      {/* Top bar */}
      <div style={{ padding: "50px 20px 12px", display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", padding: 0, lineHeight: 1, flexShrink: 0 }}
        >←</button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, justifyContent: "center" }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 22 }}>Candidatos</span>
          <div style={{
            background: "#FF6600", borderRadius: 50, width: 28, height: 28,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 13,
          }}>3</div>
        </div>
        <div style={{ width: 22 }} />
      </div>

      {/* Job context bar */}
      <div style={{
        margin: "0 20px 16px", background: "#222", borderRadius: 12,
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>💼</span>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 14, flex: 1 }}>Remodelação Cozinha</span>
        <span style={{ color: "#AAAAAA", fontSize: 12 }}>Ativo</span>
      </div>

      {/* Applicant cards */}
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {APPLICANTS.map((a, i) => (
          <div key={i} style={{
            background: "#2A2A2A", borderRadius: 14, padding: 14,
            borderLeft: "6px solid #FF6600", display: "flex", alignItems: "center", gap: 12,
          }}>
            {/* Avatar */}
            <div style={{
              width: 48, height: 48, borderRadius: "50%", background: "#888",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, flexShrink: 0,
            }}>{a.icon}</div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, margin: "0 0 2px" }}>{a.name}</p>
              <p style={{ color: "#AAAAAA", fontSize: 13, margin: "0 0 6px" }}>{a.role}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ color: "#FF6600", fontSize: 12, fontWeight: 700 }}>{a.rating} ★★</span>
                <span style={{
                  background: "#22C55E22", color: "#22C55E",
                  border: "1px solid #22C55E44", borderRadius: 10,
                  padding: "2px 8px", fontSize: 11, fontWeight: 600,
                }}>Ultra Verified</span>
              </div>
            </div>

            {/* Button */}
            <button
              onClick={() => navigate("/Profile")}
              style={{
                background: "#FF6600", border: "none", borderRadius: 10,
                padding: "8px 14px", color: "#fff", fontSize: 13,
                fontWeight: 700, cursor: "pointer", flexShrink: 0,
              }}
            >Ver Perfil</button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p style={{ color: "#AAAAAA", fontSize: 13, textAlign: "center", padding: 16, marginTop: 8 }}>
        Aceita um candidato para iniciar o chat
      </p>
    </div>
  );
}