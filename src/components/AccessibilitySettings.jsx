import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";
import {
  getA11ySettings, setFontScale, toggleHighContrast, FONT_SCALES,
} from "@/lib/accessibility";
import { Type, Contrast } from "lucide-react";

/**
 * AccessibilitySettings (#83/#84) — UI para tamanho de fonte e alto contraste.
 * As mudanças são aplicadas imediatamente via accessibility.js.
 */
export default function AccessibilitySettings() {
  const { lang } = useLanguage();
  const [settings, setSettings] = useState(getA11ySettings);

  const handleFont = (scale) => setSettings(setFontScale(scale));
  const handleContrast = () => setSettings(toggleHighContrast());

  const scaleLabel = (s) => ({
    small: t(lang, "a11yFontSmall", "Pequeno"),
    medium: t(lang, "a11yFontMedium", "Médio"),
    large: t(lang, "a11yFontLarge", "Grande"),
  }[s] || s);

  return (
    <div style={{
      background: "var(--surface2)",
      border: "1px solid var(--hair)",
      borderRadius: 16,
      padding: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Type size={17} color="#FF6600" />
        <span style={{ fontWeight: 800, fontSize: 15, color: "var(--text)" }}>
          {t(lang, "a11yTitle", "Acessibilidade")}
        </span>
      </div>

      {/* Tamanho de fonte */}
      <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.6 }}>
        {t(lang, "a11yFontSize", "Tamanho do texto")}
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {FONT_SCALES.map(s => (
          <button key={s} onClick={() => handleFont(s)}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              border: `1px solid ${settings.fontScale === s ? "#FF6600" : "var(--hair)"}`,
              background: settings.fontScale === s ? "#FF6600" : "var(--surface)",
              color: settings.fontScale === s ? "#fff" : "var(--text2)",
            }}>
            {scaleLabel(s)}
          </button>
        ))}
      </div>

      {/* Alto contraste */}
      <button onClick={handleContrast}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "12px 14px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
          border: `1px solid ${settings.highContrast ? "#FF6600" : "var(--hair)"}`,
          background: settings.highContrast ? "#FF660011" : "var(--surface)",
        }}>
        <Contrast size={18} color={settings.highContrast ? "#FF6600" : "var(--text2)"} />
        <span style={{ flex: 1, textAlign: "left", fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
          {t(lang, "a11yHighContrast", "Alto contraste")}
        </span>
        <span style={{
          width: 42, height: 24, borderRadius: 12, position: "relative", flexShrink: 0,
          background: settings.highContrast ? "#FF6600" : "var(--hair)",
          transition: "background .15s",
        }}>
          <span style={{
            position: "absolute", top: 3, left: settings.highContrast ? 21 : 3,
            width: 18, height: 18, borderRadius: "50%", background: "#fff",
            transition: "left .15s",
          }} />
        </span>
      </button>
    </div>
  );
}