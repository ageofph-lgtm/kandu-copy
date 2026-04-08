import React, { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Camera } from "lucide-react";

export default function KYCVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const userType = location.state?.userType || "professional";
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const frontRef = useRef();
  const backRef = useRef();

  const handleSubmit = () => {
    if (userType === "professional") {
      navigate("/Home");
    } else {
      navigate("/Home");
    }
  };

  const SlotStyle = {
    flex: 1,
    background: "#2A2A2A",
    border: "2px dashed #FF6600",
    borderRadius: 12,
    height: 100,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#1A1A1A" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "50px 20px 16px" }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginRight: 8 }}>
          <ChevronLeft size={26} color="#FFFFFF" />
        </button>
        <p style={{ flex: 1, textAlign: "center", fontWeight: 800, fontSize: 18, color: "#FFFFFF", margin: 0, paddingRight: 34 }}>
          Verificação de Identidade
        </p>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 20px 40px", gap: 20 }}>
        {/* Verified badge */}
        <div style={{
          background: "#22C55E",
          color: "#fff",
          fontWeight: 700,
          fontSize: 15,
          padding: "8px 24px",
          borderRadius: 20,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <span>✓</span> Verified
        </div>

        {/* Hex badge */}
        <div style={{ position: "relative", width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="160" height="160" viewBox="0 0 160 160" style={{ position: "absolute", top: 0, left: 0 }}>
            <polygon
              points="80,6 148,43 148,117 80,154 12,117 12,43"
              fill="#1E1E1E"
              stroke="#FF6600"
              strokeWidth="4"
              style={{ filter: "drop-shadow(0 0 10px #FF660088)" }}
            />
          </svg>
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <img
              src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png"
              alt="KANDU"
              style={{ width: 44, height: 44, objectFit: "contain" }}
            />
            <span style={{ color: "#FFFFFF", fontWeight: 800, fontSize: 15, lineHeight: 1.2, textAlign: "center" }}>Ultra<br />Verified</span>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: 14, color: "#AAAAAA", textAlign: "center", margin: 0, maxWidth: 300 }}>
          Submete o teu documento de identidade para ganhar o badge máximo de confiança
        </p>

        {/* Upload slots */}
        <div style={{ display: "flex", gap: 12, width: "100%" }}>
          <input ref={frontRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => setFront(e.target.files[0])} />
          <div style={SlotStyle} onClick={() => frontRef.current.click()}>
            <Camera size={28} color={front ? "#FF6600" : "#666"} />
            <span style={{ fontSize: 12, color: front ? "#FF6600" : "#AAAAAA", textAlign: "center" }}>
              {front ? front.name.substring(0, 14) + "…" : "Frente do BI/CC"}
            </span>
          </div>

          <input ref={backRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => setBack(e.target.files[0])} />
          <div style={SlotStyle} onClick={() => backRef.current.click()}>
            <Camera size={28} color={back ? "#FF6600" : "#666"} />
            <span style={{ fontSize: 12, color: back ? "#FF6600" : "#AAAAAA", textAlign: "center" }}>
              {back ? back.name.substring(0, 14) + "…" : "Verso do BI/CC"}
            </span>
          </div>
        </div>

        {/* RGPD */}
        <p style={{ fontSize: 11, color: "#666", textAlign: "center", margin: 0 }}>
          De acordo com RGPD, os teus dados estão protegidos.
        </p>

        {/* Submit */}
        <button
          onClick={handleSubmit}
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
          Submeter Documentos
        </button>

        {/* Skip */}
        <button
          onClick={handleSubmit}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 14 }}
        >
          Fazer mais tarde
        </button>
      </div>
    </div>
  );
}