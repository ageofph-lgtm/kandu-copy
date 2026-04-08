import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const FILTERS = ["Todos", "Elétrica", "Canalização", "Pintura", "Carpintaria"];

const PROFESSIONALS = [
  { name: "Manuel Silva", role: "Eletricista", rating: 4.9, km: 5, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" },
  { name: "Ana Costa", role: "Canalizadora", rating: 4.7, km: 3, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" },
  { name: "Rui Ferreira", role: "Pintor", rating: 4.5, km: 8, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face" },
];

const ADS = [
  { title: "Reparação de Canalização", location: "Lisboa", rating: 4.9, km: 5, highlight: true },
  { title: "Coplunainda", location: "Lisboa", price: "€50", km: 2, highlight: false },
  { title: "Instalação Elétrica", location: "Cascais", rating: 4.6, km: 12, highlight: false },
];

export default function Search() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("profissionais");
  const [filter, setFilter] = useState("Todos");

  return (
    <div style={{ minHeight: "100vh", background: "#1A1A1A", display: "flex", flexDirection: "column", paddingBottom: 60 }}>

      {/* Top */}
      <div style={{ padding: "50px 20px 12px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 20 }}>O que precisas, Carlos?</span>
          <span style={{ color: "#FF6600", fontSize: 12, fontWeight: 600 }}>📍 Lisboa</span>
        </div>
      </div>

      {/* Search bar */}
      <div style={{
        margin: "0 20px 12px", background: "#2A2A2A", borderRadius: 24,
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ color: "#FF6600", fontSize: 16 }}>🔍</span>
        <input
          placeholder="Pesquisar..."
          style={{
            background: "none", border: "none", outline: "none",
            color: "#fff", fontSize: 15, flex: 1,
          }}
        />
      </div>

      {/* Tabs */}
      <div style={{ margin: "0 20px 12px", display: "flex", gap: 8 }}>
        {[["profissionais", "Por Profisionals"], ["anuncios", "Por Anúncios"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, borderRadius: 20, padding: "10px 0", textAlign: "center",
              fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer",
              background: tab === key ? "#FF6600" : "#2A2A2A",
              color: tab === key ? "#fff" : "#AAAAAA",
              transition: "all 0.15s",
            }}
          >{label}</button>
        ))}
      </div>

      {/* Filter chips */}
      <div style={{
        padding: "0 20px", display: "flex", gap: 8, overflowX: "auto",
        marginBottom: 12, scrollbarWidth: "none",
      }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              flexShrink: 0, padding: "6px 14px", borderRadius: 20, border: "none",
              cursor: "pointer", fontWeight: 600, fontSize: 13,
              background: filter === f ? "#FF6600" : "#2A2A2A",
              color: filter === f ? "#fff" : "#AAAAAA",
              transition: "all 0.15s",
            }}
          >{f}</button>
        ))}
      </div>

      {/* Results */}
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {tab === "profissionais" ? (
          PROFESSIONALS.map((p, i) => (
            <div key={i} style={{
              background: "#2A2A2A", borderRadius: 14, padding: 14,
              display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
            }} onClick={() => navigate("/Profile")}>
              <img src={p.avatar} alt={p.name} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, margin: "0 0 2px" }}>{p.name}</p>
                <p style={{ color: "#AAAAAA", fontSize: 13, margin: "0 0 5px" }}>{p.role}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ color: "#FF6600", fontSize: 12, fontWeight: 700 }}>{p.rating} ★★★</span>
                  <span style={{ background: "#333", color: "#AAAAAA", border: "1px solid #555", borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>{p.km}km</span>
                </div>
              </div>
              <span style={{
                background: "#FF6600", color: "#fff", borderRadius: 20,
                padding: "4px 10px", fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>▶ Verificado</span>
            </div>
          ))
        ) : (
          ADS.map((a, i) => (
            <div key={i} style={{
              background: "#2A2A2A", borderRadius: 14, padding: 14,
              display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
              border: a.highlight ? "2px solid #FF6600" : "2px solid transparent",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%", background: "#555",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
              }}>🏗️</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, margin: "0 0 2px" }}>{a.title}</p>
                <p style={{ color: "#AAAAAA", fontSize: 13, margin: "0 0 5px" }}>{a.location}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {a.rating && <span style={{ color: "#FF6600", fontSize: 12, fontWeight: 700 }}>{a.rating} ★★★</span>}
                  <span style={{ background: "#333", color: "#AAAAAA", border: "1px solid #555", borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>{a.km}km</span>
                </div>
              </div>
              {a.price && (
                <span style={{ background: "#FF6600", color: "#fff", borderRadius: 20, padding: "4px 10px", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{a.price}</span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bottom logo */}
      <div style={{ display: "flex", justifyContent: "center", margin: "20px auto" }}>
        <div style={{
          width: 40, height: 40, background: "#222", borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid #333",
        }}>
          <span style={{ color: "#FF6600", fontWeight: 900, fontSize: 18 }}>K</span>
        </div>
      </div>
    </div>
  );
}