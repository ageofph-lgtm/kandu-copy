import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Building2, ChevronLeft } from "lucide-react";

const setores = ["Construção Civil", "Imobiliário", "Indústria", "Serviços", "Comércio", "Tecnologia", "Outro"];

export default function CiaEmployer() {
  const navigate = useNavigate();
  const [type, setType] = useState("simple");
  const [form, setForm] = useState({ empresa: "", nif: "", setor: "", website: "" });

  const inputStyle = {
    width: "100%",
    background: "#2A2A2A",
    border: "1.5px solid #3A3A3A",
    borderRadius: 10,
    padding: "12px 14px",
    color: "#FFFFFF",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
    marginTop: 6,
    marginBottom: 12,
  };

  const labelStyle = { fontSize: 13, color: "#AAAAAA", fontWeight: 600 };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#1A1A1A" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "50px 20px 12px" }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginRight: 8 }}>
          <ChevronLeft size={26} color="#FF6600" />
        </button>
        <p style={{ flex: 1, textAlign: "center", fontWeight: 800, fontSize: 18, color: "#FFFFFF", margin: 0 }}>
          Tipo de Empregador
        </p>
        <span style={{ fontSize: 15, color: "#AAAAAA", fontWeight: 600, marginLeft: 8 }}>2/3</span>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 120px" }}>
        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
          {/* Simple */}
          <button
            onClick={() => setType("simple")}
            style={{
              background: "#2A2A2A",
              borderRadius: 16,
              padding: 20,
              border: type === "simple" ? "2px solid #FF6600" : "2px solid transparent",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <User size={40} color={type === "simple" ? "#FF6600" : "#666"} strokeWidth={1.5} />
            <p style={{ fontWeight: 700, fontSize: 15, color: "#FFFFFF", margin: 0 }}>Simple Employer</p>
            <p style={{ fontSize: 13, color: "#AAAAAA", margin: 0 }}>Cliente Particular</p>
          </button>

          {/* Cia */}
          <button
            onClick={() => setType("cia")}
            style={{
              background: "#2A2A2A",
              borderRadius: type === "cia" ? "16px 16px 0 0" : 16,
              padding: 20,
              border: type === "cia" ? "2px solid #FF6600" : "2px solid transparent",
              borderBottom: type === "cia" ? "none" : "2px solid transparent",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Building2 size={40} color={type === "cia" ? "#FF6600" : "#666"} strokeWidth={1.5} />
            <p style={{ fontWeight: 700, fontSize: 15, color: "#FFFFFF", margin: 0 }}>Cia Employer</p>
            <p style={{ fontSize: 13, color: "#AAAAAA", margin: 0, textAlign: "center" }}>Empresa ou Organização</p>
          </button>
        </div>

        {/* Expandable form */}
        <div
          style={{
            overflow: "hidden",
            maxHeight: type === "cia" ? 600 : 0,
            transition: "max-height 0.35s ease",
            background: "#1E1E1E",
            borderRadius: "0 0 16px 16px",
            borderLeft: type === "cia" ? "2px solid #FF6600" : "none",
            borderRight: type === "cia" ? "2px solid #FF6600" : "none",
            borderBottom: type === "cia" ? "2px solid #FF6600" : "none",
            borderTop: type === "cia" ? "3px solid #FF6600" : "none",
          }}
        >
          <div style={{ padding: 16 }}>
            <label style={labelStyle}>Nome da Empresa</label>
            <input style={inputStyle} value={form.empresa} onChange={e => setForm({...form, empresa: e.target.value})} placeholder="" />

            <label style={labelStyle}>NIF</label>
            <input style={inputStyle} value={form.nif} onChange={e => setForm({...form, nif: e.target.value})} placeholder="" />

            <label style={labelStyle}>Setor de Atividade</label>
            <select
              style={{ ...inputStyle, appearance: "none" }}
              value={form.setor}
              onChange={e => setForm({...form, setor: e.target.value})}
            >
              <option value="" disabled></option>
              {setores.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <label style={labelStyle}>Website</label>
            <input style={inputStyle} value={form.website} onChange={e => setForm({...form, website: e.target.value})} placeholder="" />

            <div style={{ background: "#FF6600", borderRadius: 8, padding: "10px 14px" }}>
              <p style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 600, margin: 0 }}>
                Empresas têm acesso a funcionalidades exclusivas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom button */}
      <div style={{ position: "fixed", bottom: 32, left: 0, right: 0, padding: "0 20px" }}>
        <button
          onClick={() => navigate("/kyc")}
          style={{
            width: "100%",
            background: "#FF6600",
            borderRadius: 14,
            padding: "16px",
            fontWeight: 700,
            fontSize: 16,
            color: "#FFFFFF",
            border: "none",
            cursor: "pointer",
          }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}