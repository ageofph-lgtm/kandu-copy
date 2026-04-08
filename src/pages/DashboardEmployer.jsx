import React from "react";
import { useNavigate } from "react-router-dom";

const JOBS = [
  { title: "Remodelação Cozinha", count: 3, label: "3 candidatos", avatars: 2, extra: "+3" },
  { title: "Pintura Exterior", count: 1, label: "1 candidato", avatars: 2, extra: "+1" },
];

const NAV = [
  { icon: "🏠", label: "Início", active: true },
  { icon: "🏠", label: "" },
  { icon: "🔍", label: "" },
  { icon: "💬", label: "" },
  { icon: "👤", label: "" },
];

export default function DashboardEmployer() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      background: "#1A1A1A",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='80'%3E%3Cpolygon points='35,3 67,20 67,60 35,77 3,60 3,20' fill='none' stroke='%23ffffff' stroke-width='1.5' stroke-opacity='0.08'/%3E%3C/svg%3E")`,
      display: "flex", flexDirection: "column", paddingBottom: 80,
    }}>

      {/* Top bar */}
      <div style={{ padding: "50px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
        <div>
          <p style={{ color: "#fff", fontWeight: 800, fontSize: 20, margin: 0 }}>O que precisas, João?</p>
          <p style={{ color: "#AAAAAA", fontSize: 13, margin: "4px 0 0" }}>📍 Lisboa</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 20, cursor: "pointer" }} onClick={() => navigate("/Notifications")}>🔔</span>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: "#FF6600",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0,
          }}>J</div>
        </div>
      </div>

      {/* Publish button */}
      <div style={{ margin: "16px 20px" }}>
        <button
          onClick={() => navigate("/NewJob")}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#FF6600", borderRadius: 50, padding: "14px 24px",
            border: "none", cursor: "pointer", minWidth: "70%",
          }}
        >
          <div style={{
            width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 20, lineHeight: 1,
          }}>+</div>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>+ Publicar Obra</span>
        </button>
      </div>

      {/* Section header */}
      <div style={{ padding: "0 20px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <p style={{ color: "#fff", fontWeight: 700, fontSize: 16, margin: 0 }}>Os teus anúncios activos</p>
        <div style={{
          width: 22, height: 22, borderRadius: "50%", background: "#FF6600",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 700, fontSize: 12,
        }}>2</div>
      </div>

      {/* Job cards */}
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {JOBS.map((job, i) => (
          <div
            key={i}
            onClick={() => navigate("/Applications")}
            style={{
              background: "#2A2A2A", borderRadius: 16, padding: 16,
              borderLeft: "6px solid #FF6600", cursor: "pointer",
            }}
          >
            {/* Row 1 */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 16, margin: 0, flex: 1 }}>{job.title}</p>
              <span style={{
                background: "#FF6600", borderRadius: 50, padding: "3px 12px",
                color: "#fff", fontWeight: 600, fontSize: 12,
              }}>Ativo</span>
            </div>
            {/* Row 2 */}
            <p style={{ color: "#AAAAAA", fontSize: 13, margin: "0 0 10px" }}>{job.label}</p>
            {/* Row 3: avatars */}
            <div style={{ display: "flex", alignItems: "center" }}>
              {Array.from({ length: job.avatars }).map((_, j) => (
                <div key={j} style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: j % 2 === 0 ? "#FF6600" : "#666",
                  border: "2px solid #2A2A2A",
                  marginLeft: j === 0 ? 0 : -8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, color: "#fff",
                }}>👤</div>
              ))}
              <span style={{ color: "#888", fontSize: 12, marginLeft: 6 }}>{job.extra}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#111", borderTop: "1px solid #222",
        padding: "12px 0 20px",
        display: "flex", justifyContent: "space-around", alignItems: "center",
      }}>
        {NAV.map((item, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}>
            <span style={{ fontSize: 22, filter: item.active ? "none" : "grayscale(1) opacity(0.5)" }}>{item.icon}</span>
            {item.label && <span style={{ fontSize: 10, color: item.active ? "#fff" : "#555" }}>{item.label}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}