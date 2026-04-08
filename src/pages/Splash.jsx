import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate(createPageUrl("Welcome")), 2500);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden" style={{ background: "#1A1A1A" }}>
      {/* Hex pattern background */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.04 }}
      >
        <defs>
          <pattern id="hex" x="0" y="0" width="56" height="97" patternUnits="userSpaceOnUse">
            <polygon
              points="28,1 55,15.5 55,44.5 28,59 1,44.5 1,15.5"
              fill="none"
              stroke="#FF6600"
              strokeWidth="1"
            />
            <polygon
              points="28,49.5 55,64 55,93 28,107.5 1,93 1,64"
              fill="none"
              stroke="#FF6600"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex)" />
      </svg>

      {/* Logo content */}
      <div className="relative flex flex-col items-center">
        <img
          src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png"
          alt="KANDU Icon"
          width={140}
          style={{ width: 140 }}
        />
        <img
          src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/002158942_Gemini_Generated_Image_5.png"
          alt="KANDU"
          width={180}
          style={{ width: 180, marginTop: 16 }}
        />
      </div>

      {/* Bottom progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#333" }}>
        <div
          className="h-full"
          style={{
            background: "#FF6600",
            animation: "splash-bar 2.5s linear forwards",
          }}
        />
      </div>

      <style>{`
        @keyframes splash-bar {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}