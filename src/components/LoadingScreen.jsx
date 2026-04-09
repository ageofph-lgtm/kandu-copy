import React from "react";
import { useTheme } from "@/lib/ThemeContext";

const LOGO_DARK = "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/f0a8b458b_Gemini_Generated_Image_nn24elnn24elnn24-Photoroom.png";
const LOGO_LIGHT = "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png";

export default function LoadingScreen({ label }) {
  const { isDark } = useTheme();
  const bg = isDark ? "#1A1A1A" : "#FFFFFF";
  const text = isDark ? "#AAAAAA" : "#666666";
  const logo = isDark ? LOGO_DARK : LOGO_LIGHT;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: bg, gap: 16 }}>
      <img
        src={logo}
        style={{ width: 80, height: 80, objectFit: "contain", animation: "spin 2s linear infinite", borderRadius: 0, background: "transparent" }}
        alt="KANDU"
      />
      {label && <p style={{ color: text, fontSize: 14, margin: 0 }}>{label}</p>}
    </div>
  );
}