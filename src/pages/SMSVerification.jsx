import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SMSVerification() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "#1A1A1A" }}
    >
      {/* Hex pattern */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.06 }}>
        <defs>
          <pattern id="hex-sms" x="0" y="0" width="48" height="83" patternUnits="userSpaceOnUse">
            <polygon points="24,1 47,13.5 47,38.5 24,51 1,38.5 1,13.5" fill="none" stroke="#FF6600" strokeWidth="1" />
            <polygon points="24,42 47,54.5 47,79.5 24,92 1,79.5 1,54.5" fill="none" stroke="#FF6600" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-sms)" />
      </svg>

      {/* Top bar */}
      <div className="relative flex items-center justify-between px-6 pt-8 pb-2">
        <img
          src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png"
          alt="KANDU"
          style={{ width: 40, height: 40, objectFit: "contain" }}
        />
        <span style={{
          background: "transparent",
          color: "#FF6600",
          fontWeight: 800,
          fontSize: 20,
        }}>
          1 / 3
        </span>
      </div>

      {/* Main content */}
      <div className="relative flex flex-col items-center justify-center flex-1 px-7 gap-5 text-center">
        {/* Phone icon */}
        <div style={{ fontSize: 64, lineHeight: 1 }}>📞</div>

        {/* Title */}
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF", margin: 0 }}>
          O teu número, a tua identidade
        </h1>

        {/* Subtitle */}
        <p style={{ fontSize: 14, color: "#AAAAAA", margin: 0, maxWidth: 280 }}>
          Verificamos o teu número para garantir uma comunidade segura
        </p>

        {/* Phone input */}
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+351 ___ ___ ___"
          style={{
            width: "100%",
            background: "#2A2A2A",
            border: "2px solid #FF6600",
            borderRadius: 50,
            padding: "14px 20px",
            textAlign: "center",
            color: "#FFFFFF",
            fontSize: 18,
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        {/* Continue button */}
        <button
          onClick={() => navigate(createPageUrl("SetupProfile"))}
          style={{
            width: "90%",
            background: "#FF6600",
            borderRadius: 50,
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