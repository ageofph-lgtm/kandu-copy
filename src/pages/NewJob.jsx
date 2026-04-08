import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CATEGORIES = ["Elétrica", "Canalização", "Pintura", "Mão de Obra", "Carpintaria"];
const PRICE_TYPES = ["Project", "Hourly", "Negotiable"];

const labelStyle = {
  color: "#AAAAAA", fontSize: 13, fontWeight: 600,
  textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, display: "block",
};

const sectionStyle = {
  borderLeft: "4px solid #FF6600",
  paddingLeft: 16, marginBottom: 28,
};

export default function NewJob() {
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState(["Elétrica", "Mão de Obra"]);
  const [priceType, setPriceType] = useState("Hourly");

  const toggleCategory = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#1A1A1A", display: "flex", flexDirection: "column" }}>

      {/* Top bar */}
      <div style={{
        padding: "50px 20px 16px", display: "flex", alignItems: "center",
        position: "relative",
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", padding: 0, lineHeight: 1 }}
        >←</button>
        <p style={{ color: "#fff", fontWeight: 800, fontSize: 18, margin: 0, position: "absolute", left: 0, right: 0, textAlign: "center", pointerEvents: "none" }}>
          Nova Obra
        </p>
      </div>

      {/* Form */}
      <div style={{ padding: "8px 20px 100px", flex: 1, overflowY: "auto" }}>

        {/* Secção 1 — Título */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Título da Obra</span>
          <input
            placeholder="Nova remodelação..."
            style={{
              width: "100%", background: "#2A2A2A", border: "2px solid #FF6600",
              borderRadius: 12, padding: "14px 16px", color: "#fff", fontSize: 15,
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Secção 2 — Categoria */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Categoria</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CATEGORIES.map(cat => {
              const active = selectedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  style={{
                    background: active ? "#FF6600" : "#2A2A2A",
                    color: active ? "#fff" : "#AAAAAA",
                    fontWeight: active ? 700 : 400,
                    border: "none", borderRadius: 20, padding: "8px 16px",
                    fontSize: 14, cursor: "pointer", transition: "all 0.15s",
                  }}
                >{cat}</button>
              );
            })}
          </div>
        </div>

        {/* Secção 3 — Tipo de Preço */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Tipo de Preço</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <input
              defaultValue="25 €/hora"
              style={{
                flex: 1, minWidth: 100, background: "#2A2A2A", border: "none",
                borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14,
                outline: "none",
              }}
            />
            {PRICE_TYPES.map(pt => (
              <button
                key={pt}
                onClick={() => setPriceType(pt)}
                style={{
                  background: priceType === pt ? "#FF6600" : "#2A2A2A",
                  color: priceType === pt ? "#fff" : "#AAAAAA",
                  fontWeight: priceType === pt ? 700 : 400,
                  border: "none", borderRadius: 20, padding: "10px 14px",
                  fontSize: 13, cursor: "pointer", transition: "all 0.15s",
                }}
              >{pt}</button>
            ))}
          </div>
          <div style={{
            background: "#FF660011", border: "1px solid #FF660044",
            borderRadius: 10, padding: 12, display: "flex", gap: 8, alignItems: "flex-start",
          }}>
            <span style={{ fontSize: 16 }}>ℹ️</span>
            <p style={{ color: "#AAAAAA", fontSize: 12, fontStyle: "italic", margin: 0, lineHeight: 1.5 }}>
              O preço base considera apenas o trabalho principal, não inclui materiais ou ferramentas
            </p>
          </div>
        </div>

        {/* Secção 4 — Localização */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Localização</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "#FF6600", fontSize: 18 }}>📍</span>
            <span style={{ color: "#fff", fontSize: 15, flex: 1 }}>Av. da Liberdade, Lisboa</span>
            {/* Toggle switch */}
            <div style={{
              width: 44, height: 24, background: "#FF6600", borderRadius: 12,
              position: "relative", flexShrink: 0, cursor: "pointer",
            }}>
              <div style={{
                width: 20, height: 20, background: "#fff", borderRadius: "50%",
                position: "absolute", top: 2, right: 2,
              }} />
            </div>
          </div>
        </div>

        {/* Secção 5 — Fotos */}
        <div style={sectionStyle}>
          <span style={{ ...labelStyle, textTransform: "none", letterSpacing: 0, fontSize: 16, color: "#fff", fontWeight: 700 }}>
            Fotos de Local
          </span>
          <div style={{ display: "flex", gap: 10 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                flex: 1, height: 80, background: "#2A2A2A",
                border: "2px dashed #FF660066", borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}>
                <span style={{ fontSize: 24, filter: "grayscale(1) opacity(0.5)" }}>📷</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky bottom button */}
      <div style={{
        position: "sticky", bottom: 0,
        background: "#1A1A1A", padding: "16px 20px",
        borderTop: "1px solid #222",
      }}>
        <button
          onClick={() => navigate("/DashboardEmployer")}
          style={{
            width: "100%", background: "#FF6600", border: "none",
            borderRadius: 14, padding: "16px 0", color: "#fff",
            fontWeight: 800, fontSize: 16, cursor: "pointer",
          }}
        >Publicar Obra</button>
      </div>
    </div>
  );
}