import React from "react";
import { useNavigate } from "react-router-dom";

const NOTIFICATIONS = [
  {
    icon: "💼", color: "#FF6600", title: "Nova candidatura",
    sub: "Carlos Silva candidatou-se à tua obra", time: "2 min",
    route: "/Applications", accent: true,
  },
  {
    icon: "⭐", color: "#FF6600", title: "Nova avaliação desbloqueada",
    sub: "A avaliação de João M. já está disponível", time: "1h",
    route: "/Review", accent: true,
  },
  {
    icon: "📍", color: "#FF6600", title: "Obra próxima de ti",
    sub: "Instalação Elétrica · 1.2km", time: "3h",
    route: "/HomeProfessional", accent: true,
  },
  {
    icon: "💬", color: "#AAAAAA", title: "Mensagem de João M.",
    sub: null, time: "5h",
    route: "/Chat", accent: false,
  },
];

const NAV = [
  { icon: "🏠", label: "Início", route: "/Home" },
  { icon: "👥", label: "Trabalhos", route: "/MyJobs" },
  { icon: "🧭", label: "Explorar", route: "/HomeProfessional" },
  { icon: "🔔", label: "Notificações", route: "/Notifications", active: true, badge: 4 },
  { icon: "👤", label: "Perfil", route: "/Profile" },
];

export default function Notifications() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#1A1A1A", display: "flex", flexDirection: "column", paddingBottom: 90 }}>

      {/* Top logo */}
      <div style={{ padding: "50px 20px 12px", display: "flex", justifyContent: "center" }}>
        <div style={{
          width: 40, height: 40,
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          background: "#FF6600", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>K</span>
        </div>
      </div>

      {/* Title row */}
      <div style={{ padding: "0 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ color: "#fff", fontWeight: 800, fontSize: 32, margin: 0 }}>Notificações</h1>
        <div style={{
          width: 28, height: 28, borderRadius: "50%", background: "#FF6600",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0,
        }}>4</div>
      </div>

      {/* Cards */}
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {NOTIFICATIONS.map((n, i) => (
          <div
            key={i}
            onClick={() => navigate(n.route)}
            style={{
              background: "#2A2A2A", borderRadius: 14, padding: "14px 16px",
              borderLeft: n.accent ? "4px solid #FF6600" : "4px solid #444",
              display: "flex", gap: 12, alignItems: "center", cursor: "pointer",
            }}
          >
            {/* Icon */}
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: n.color + "22",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>
              {n.icon}
            </div>
            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: 0 }}>{n.title}</p>
              <p style={{ color: "#AAAAAA", fontSize: 13, margin: "2px 0 0" }}>
                {n.sub ?? (
                  <span>Olá, posso tirar uma dúvida... <span style={{ color: "#FF6600", fontSize: 16 }}>●</span></span>
                )}
              </p>
            </div>
            {/* Time */}
            <span style={{ color: "#666", fontSize: 11, flexShrink: 0 }}>{n.time}</span>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#111", borderTop: "1px solid #222",
        padding: "12px 0 20px",
        display: "flex", justifyContent: "space-around", alignItems: "flex-end",
      }}>
        {NAV.map((item, i) => (
          <div
            key={i}
            onClick={() => navigate(item.route)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", position: "relative" }}
          >
            <div style={{ position: "relative" }}>
              <span style={{ fontSize: 22, filter: item.active ? "none" : "grayscale(1) opacity(0.5)" }}>
                {item.icon}
              </span>
              {item.badge && (
                <div style={{
                  position: "absolute", top: -4, right: -6,
                  background: "#FF6600", borderRadius: "50%", width: 16, height: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: "#fff", fontWeight: 700,
                }}>{item.badge}</div>
              )}
            </div>
            <span style={{ fontSize: 10, color: item.active ? "#fff" : "#555" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}