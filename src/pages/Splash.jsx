import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const HEX_PATTERN = `
<svg xmlns='http://www.w3.org/2000/svg' width='120' height='104'>
  <polygon points='60,2 118,32 118,72 60,102 2,72 2,32'
    fill='none' stroke='%23FF6600' stroke-width='1'/>
</svg>`;

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate(createPageUrl("Welcome")), 2500);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#1A1A1A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Hex pattern background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,${HEX_PATTERN.trim()}")`,
          backgroundRepeat: "repeat",
          opacity: 0.06,
          pointerEvents: "none",
        }}
      />

      {/* Logo icon */}
      <img
        src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png"
        alt="KANDU icon"
        style={{ width: 140, position: "relative", zIndex: 1 }}
      />

      {/* Logo wordmark */}
      <img
        src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/002158942_Gemini_Generated_Image_5.png"
        alt="KANDU"
        style={{ width: 180, marginTop: 16, position: "relative", zIndex: 1 }}
      />

      {/* Loading bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 4,
          width: "100%",
          background: "#2A2A2A",
        }}
      >
        <div
          style={{
            height: "100%",
            background: "#FF6600",
            animation: "splashLoad 2.5s linear forwards",
          }}
        />
      </div>

      <style>{`
        @keyframes splashLoad {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}