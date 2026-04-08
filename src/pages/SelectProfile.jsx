import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HardHat, Briefcase, ChevronRight } from "lucide-react";

export default function SelectProfile() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const handleSelect = (type) => {
    setSelected(type);
    setTimeout(() => {
      if (type === "professional") {
        navigate("/kyc", { state: { userType: "professional" } });
      } else {
        navigate("/cia-employer");
      }
    }, 150);
  };

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "#1A1A1A" }}
    >
      {/* Hex pattern */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.06 }}>
        <defs>
          <pattern id="hex-sp" x="0" y="0" width="48" height="83" patternUnits="userSpaceOnUse">
            <polygon points="24,1 47,13.5 47,38.5 24,51 1,38.5 1,13.5" fill="none" stroke="#FF6600" strokeWidth="1" />
            <polygon points="24,42 47,54.5 47,79.5 24,92 1,79.5 1,54.5" fill="none" stroke="#FF6600" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-sp)" />
      </svg>

      {/* Content */}
      <div className="relative flex flex-col items-center px-7 flex-1" style={{ marginTop: 60 }}>
        {/* Logo */}
        <img
          src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png"
          alt="KANDU"
          style={{ width: 50, height: 50, objectFit: "contain" }}
        />

        {/* Title */}
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF", textAlign: "center", marginTop: 32, marginBottom: 32 }}>
          Como vais usar o KANDU?
        </h1>

        {/* Cards */}
        <div className="w-full flex flex-col" style={{ gap: 16, maxWidth: 400 }}>
          {/* Card Professional */}
          <button
            onClick={() => handleSelect("professional")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 20,
              background: "#2A2A2A",
              borderRadius: 16,
              border: selected === "professional" ? "2px solid #FF6600" : "2px solid transparent",
              borderLeft: "4px solid #FF6600",
              cursor: "pointer",
              textAlign: "left",
              transition: "border 0.15s",
            }}
          >
            <HardHat size={48} color="#FFFFFF" strokeWidth={1.5} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#FFFFFF", margin: 0 }}>Sou Profissional</p>
              <p style={{ fontSize: 13, color: "#AAAAAA", margin: 0, marginTop: 4 }}>Quero encontrar trabalho perto de mim</p>
            </div>
            <ChevronRight size={22} color="#FF6600" style={{ flexShrink: 0 }} />
          </button>

          {/* Card Employer */}
          <button
            onClick={() => handleSelect("employer")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 20,
              background: "#2A2A2A",
              borderRadius: 16,
              border: selected === "employer" ? "2px solid #FF6600" : "2px solid transparent",
              borderLeft: "4px solid #FF6600",
              cursor: "pointer",
              textAlign: "left",
              transition: "border 0.15s",
            }}
          >
            <Briefcase size={48} color="#FFFFFF" strokeWidth={1.5} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#FFFFFF", margin: 0 }}>Preciso de Profissional</p>
              <p style={{ fontSize: 13, color: "#AAAAAA", margin: 0, marginTop: 4 }}>Quero contratar para a minha obra</p>
            </div>
            <ChevronRight size={22} color="#FF6600" style={{ flexShrink: 0 }} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <p style={{ fontSize: 11, color: "#555", textAlign: "center", padding: "20px 28px", position: "relative" }}>
        Utilize a plataforma gratuitamente, construído para a comunidade KANDU.
      </p>
    </div>
  );
}