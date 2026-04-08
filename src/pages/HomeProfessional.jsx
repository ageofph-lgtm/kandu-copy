import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, MapPin, MessageSquare, User, Wrench } from "lucide-react";

const PINS = [
  { id: 1, top: "18%", left: "55%", title: "Pintura", price: "18€/h", location: "Chiado, Lisboa" },
  { id: 2, top: "28%", left: "22%", title: "Canalização", price: "30€/h", location: "Belém, Lisboa" },
  { id: 3, top: "36%", left: "44%", title: "Carpintaria", price: "22€/h", location: "Baixa, Lisboa" },
  { id: 4, top: "42%", left: "14%", title: "Alvenaria", price: "20€/h", location: "Alcântara, Lisboa" },
  { id: 5, top: "48%", left: "32%", title: "Eletricidade", price: "25€/h", location: "Av. da Liberdade, Lisboa" },
  { id: 6, top: "55%", left: "65%", title: "Climatização", price: "35€/h", location: "Parque Nações, Lisboa" },
  { id: 7, top: "62%", left: "48%", title: "Telhados", price: "40€/h", location: "Alfama, Lisboa" },
  { id: 8, top: "38%", left: "72%", title: "Pavimentos", price: "28€/h", location: "Oriente, Lisboa" },
];

const HexPin = ({ onClick }) => (
  <div
    onClick={onClick}
    style={{
      width: 28,
      height: 28,
      background: "#FF6600",
      clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 0 8px #FF660088",
    }}
  />
);

export default function HomeProfessional() {
  const navigate = useNavigate();
  const [activePin, setActivePin] = useState(null);

  const handlePinClick = (pin) => {
    setActivePin(pin);
  };

  return (
    <div style={{ height: "100vh", background: "#1A1A1A", position: "relative", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Top bar */}
      <div style={{ background: "#111", padding: "50px 16px 12px", zIndex: 10, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32,
              background: "#FF6600",
              clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>K</span>
            </div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 4 }}>
              <MapPin size={14} color="#FF6600" fill="#FF6600" />
              Lisboa, PT
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Bell size={20} color="#FFFFFF" />
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "#FF6600",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, color: "#fff", fontSize: 16,
            }}>
              C
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div style={{
          background: "#2A2A2A",
          borderRadius: 24,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <Search size={18} color="#FF6600" />
          <span style={{ color: "#666", fontSize: 15 }}>O que precisas?</span>
        </div>
      </div>

      {/* Map area */}
      <div style={{ flex: 1, position: "relative", background: "#1a2a1e", overflow: "hidden" }}>
        {/* SVG street lines */}
        <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0, opacity: 0.35 }}>
          <line x1="0" y1="30%" x2="100%" y2="25%" stroke="#3A3A3A" strokeWidth="2" />
          <line x1="0" y1="50%" x2="100%" y2="55%" stroke="#3A3A3A" strokeWidth="2" />
          <line x1="0" y1="70%" x2="100%" y2="72%" stroke="#3A3A3A" strokeWidth="1.5" />
          <line x1="20%" y1="0" x2="18%" y2="100%" stroke="#3A3A3A" strokeWidth="2" />
          <line x1="45%" y1="0" x2="48%" y2="100%" stroke="#3A3A3A" strokeWidth="2" />
          <line x1="72%" y1="0" x2="70%" y2="100%" stroke="#3A3A3A" strokeWidth="1.5" />
          <line x1="0" y1="15%" x2="45%" y2="30%" stroke="#333" strokeWidth="1" />
          <line x1="45%" y1="30%" x2="100%" y2="40%" stroke="#333" strokeWidth="1" />
          <line x1="20%" y1="55%" x2="75%" y2="65%" stroke="#333" strokeWidth="1" />
          <line x1="10%" y1="80%" x2="60%" y2="75%" stroke="#333" strokeWidth="1" />
          <line x1="60%" y1="75%" x2="100%" y2="85%" stroke="#333" strokeWidth="1" />
          <line x1="0%" y1="42%" x2="20%" y2="55%" stroke="#2E2E2E" strokeWidth="1" />
          <line x1="48%" y1="0%" x2="72%" y2="30%" stroke="#2E2E2E" strokeWidth="1" />
          <line x1="72%" y1="30%" x2="80%" y2="55%" stroke="#2E2E2E" strokeWidth="1" />
        </svg>

        {/* Hex pins */}
        {PINS.map(pin => (
          <div
            key={pin.id}
            style={{ position: "absolute", top: pin.top, left: pin.left, transform: "translate(-50%,-50%)", zIndex: 5 }}
          >
            <HexPin onClick={() => handlePinClick(pin)} />
          </div>
        ))}

        {/* Tap-on-pin preview */}
        {activePin && (
          <div
            style={{
              position: "absolute", bottom: 8, left: 12, right: 12, zIndex: 10,
              background: "#2A2A2A", borderRadius: 16, padding: "12px 14px",
              borderLeft: "4px solid #FF6600",
              display: "flex", alignItems: "center", gap: 12,
            }}
            onClick={() => navigate("/Home")}
          >
            <div style={{
              width: 42, height: 42, borderRadius: "50%", background: "#FF6600",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Wrench size={20} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, margin: 0 }}>{activePin.title}</p>
              <p style={{ color: "#AAAAAA", fontSize: 13, margin: "2px 0 0" }}>{activePin.location}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <span style={{ color: "#FF6600", fontWeight: 700, fontSize: 15 }}>{activePin.price}</span>
              <span style={{ background: "#FF660022", color: "#FF6600", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10 }}>próximo</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating job card */}
      {!activePin && (
        <div
          style={{
            position: "absolute", bottom: 72, left: 16, right: 16, zIndex: 20,
            background: "#2A2A2A", borderRadius: 20, padding: 16,
            borderLeft: "4px solid #FF6600",
            display: "flex", alignItems: "center", gap: 12,
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          }}
          onClick={() => navigate("/Home")}
        >
          <div style={{
            width: 48, height: 48, borderRadius: "50%", background: "#FF6600",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Wrench size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 16, margin: 0 }}>Instalação Elétrica</p>
            <p style={{ color: "#AAAAAA", fontSize: 13, margin: "3px 0 0" }}>Av. da Liberdade, Lisboa</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <span style={{ color: "#FF6600", fontWeight: 700, fontSize: 16 }}>25€/h</span>
            <span style={{ background: "#FF660022", color: "#FF6600", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 12 }}>1.2km</span>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "#111", borderTop: "1px solid #222",
        padding: "12px 0 20px", zIndex: 20,
        display: "flex", justifyContent: "space-around",
      }}>
        {[
          { icon: <MapPin size={22} />, label: "Início", active: true },
          { icon: <Search size={22} />, label: "Procurar", active: false },
          { icon: <MessageSquare size={22} />, label: "Chat", active: false },
          { icon: <User size={22} />, label: "Perfil", active: false },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
            <div style={{ color: item.active ? "#FF6600" : "#666" }}>{item.icon}</div>
            <span style={{ fontSize: 10, color: item.active ? "#FF6600" : "#666", fontWeight: item.active ? 700 : 400 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}