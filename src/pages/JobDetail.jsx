import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin, Clock, DollarSign } from "lucide-react";

export default function JobDetail() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#1A1A1A", position: "relative" }}>

      {/* Top bar */}
      <div style={{ padding: "50px 20px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
          <ChevronLeft size={26} color="#FFFFFF" />
        </button>
        <h1 style={{ color: "#FFFFFF", fontWeight: 800, fontSize: 16, margin: 0, flex: 1 }}>
          Instalação Elétrica
        </h1>
        <span style={{
          background: "#EF4444", color: "#fff", fontSize: 12, fontWeight: 700,
          padding: "4px 10px", borderRadius: 20, flexShrink: 0,
        }}>
          Urgente
        </span>
      </div>

      {/* KANDU hex logo top-right */}
      <div style={{
        position: "absolute", top: 50, right: 16,
        width: 40, height: 40,
        background: "#FF6600",
        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 5,
      }}>
        <span style={{ color: "#fff", fontWeight: 900, fontSize: 17 }}>K</span>
      </div>

      {/* Scrollable content */}
      <div style={{ padding: "0 20px", paddingBottom: 100, display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Employer card */}
        <div style={{
          background: "#2A2A2A", borderRadius: 16, padding: 16,
          borderLeft: "4px solid #FF6600",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%", background: "#FF6600",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, color: "#fff", fontSize: 18, flexShrink: 0,
          }}>
            J
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, margin: 0 }}>João M.</p>
            <p style={{ color: "#AAAAAA", fontSize: 13, margin: "2px 0 0" }}>Cia Employer</p>
          </div>
          <span style={{
            background: "#FF660022", color: "#FF6600", fontSize: 12, fontWeight: 700,
            padding: "5px 10px", borderRadius: 20, border: "1px solid #FF660044",
            flexShrink: 0,
          }}>
            ✓ Ultra Verified
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#333" }} />

        {/* Details card */}
        <div style={{
          background: "#2A2A2A", borderRadius: 16, padding: 16,
          borderLeft: "4px solid #FF6600",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #333" }}>
            <MapPin size={16} color="#FF6600" fill="#FF6600" />
            <span style={{ color: "#AAAAAA", fontSize: 14 }}>Rua da Construção, 123 - Lisboa</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #333" }}>
            <Clock size={16} color="#FF6600" />
            <span style={{ color: "#AAAAAA", fontSize: 14 }}>Início: Amanhã</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0 0" }}>
            <DollarSign size={16} color="#FF6600" />
            <span style={{ color: "#AAAAAA", fontSize: 14 }}>25€/hora</span>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginTop: 4 }}>
          <p style={{ color: "#AAAAAA", fontWeight: 700, fontSize: 15, margin: "0 0 6px" }}>Descrição</p>
          <p style={{ color: "#AAAAAA", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            Instalação de pontos de luz e tomadas em apartamento novo. Necessário certificação.
          </p>
        </div>

        {/* Photos */}
        <div>
          <p style={{ color: "#AAAAAA", fontWeight: 700, fontSize: 15, margin: "0 0 10px" }}>Fotos do Local</p>
          <div style={{ display: "flex", gap: 10 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                flex: 1, height: 70, background: "#2A2A2A",
                borderRadius: 10, border: "1px solid #333",
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "16px 20px 32px", background: "#1A1A1A",
      }}>
        <button
          onClick={() => navigate("/Chat")}
          style={{
            width: "100%", background: "#FF6600", borderRadius: 50,
            padding: "16px", fontWeight: 700, fontSize: 16,
            color: "#FFFFFF", border: "none", cursor: "pointer",
          }}
        >
          Candidatar-me
        </button>
      </div>
    </div>
  );
}