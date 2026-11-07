import React, { useEffect, useRef, useState } from "react";
import { Sun, Moon, Flame } from "lucide-react";
import { useTheme, THEMES, THEME_META } from "@/lib/ThemeContext";

/**
 * Seletor de tema. Um toque no botão troca claro ↔ escuro dentro da
 * família activa (comportamento antigo); a seta abre a lista com as
 * quatro opções, incluindo as duas Ember.
 */
const ICONS = {
  "light": Sun,
  "dark": Moon,
  "ember-light": Flame,
  "ember-dark": Flame,
};

const SWATCH = {
  "light": "linear-gradient(150deg,#EAEDF0,#FFFFFF)",
  "dark": "linear-gradient(150deg,#14161A,#0B0C0E)",
  "ember-light": "linear-gradient(150deg,#FFD6BE,#FFF3EA 55%,#FFC8A6)",
  "ember-dark": "linear-gradient(150deg,#170E09,#0B0806 55%,#2A1206)",
};

export default function ThemePicker({ compact = false, align = "left" }) {
  const { theme, setTheme, toggleTheme, isDark, isEmber } = useTheme();
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const meta = THEME_META[theme] || THEME_META.dark;
  const Current = isEmber ? Flame : (isDark ? Moon : Sun);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    const onEsc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={boxRef} style={{ position: "relative", width: compact ? "auto" : "100%" }}>
      <div style={{ display: "flex", gap: 6, width: "100%" }}>
        <button
          onClick={toggleTheme}
          title="Trocar claro / escuro"
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            background: "linear-gradient(180deg, var(--glass2), var(--glass))",
            border: "1px solid var(--hair)", borderRadius: 20,
            padding: compact ? "4px 10px" : "6px 12px",
            cursor: "pointer", fontSize: compact ? 12 : 13, fontWeight: 700,
            color: isEmber ? "var(--or)" : "var(--text)",
            whiteSpace: "nowrap",
          }}
        >
          <Current size={14} />
          {meta.label}
        </button>
        <button
          onClick={() => setOpen(o => !o)}
          title="Escolher tema"
          aria-haspopup="listbox"
          aria-expanded={open}
          style={{
            background: "linear-gradient(180deg, var(--glass2), var(--glass))",
            border: "1px solid var(--hair)", borderRadius: 20,
            padding: compact ? "4px 8px" : "6px 10px",
            cursor: "pointer", color: "var(--text2)", fontWeight: 700,
          }}
        >
          ▾
        </button>
      </div>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            [align === "right" ? "right" : "left"]: 0,
            zIndex: 90,
            minWidth: 210,
            padding: 8,
            borderRadius: 16,
            background: "linear-gradient(180deg, var(--glass2), var(--glass))",
            border: "1px solid var(--hair)",
            boxShadow: "0 18px 40px -18px var(--shadow), inset 0 1px 0 var(--edge-hi)",
            backdropFilter: "saturate(180%) blur(24px)",
            WebkitBackdropFilter: "saturate(180%) blur(24px)",
          }}
        >
          {THEMES.map((key) => {
            const m = THEME_META[key];
            const Icon = ICONS[key];
            const active = key === theme;
            return (
              <button
                key={key}
                role="option"
                aria-selected={active}
                onClick={() => { setTheme(key); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "9px 10px", borderRadius: 11, cursor: "pointer",
                  border: active ? "1px solid var(--or)" : "1px solid transparent",
                  background: active ? "rgba(255,106,0,.10)" : "transparent",
                  color: "var(--text)", fontSize: 13, fontWeight: active ? 800 : 600,
                  textAlign: "left",
                }}
              >
                <span style={{
                  width: 22, height: 22, borderRadius: 7, flex: "none",
                  background: SWATCH[key], border: "1px solid var(--hair)",
                }} />
                <span style={{ flex: 1 }}>{m.label}</span>
                <Icon size={14} style={{ opacity: active ? 1 : .55 }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


/**
 * Grelha de temas (telemóvel): as quatro opções à vista, com amostra.
 * Vive em Perfil › Conta, junto do idioma, em vez de flutuar sobre a barra.
 */
export function ThemeGrid() {
  const { theme, setTheme } = useTheme();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {THEMES.map(id => {
        const on = id === theme;
        const Icon = ICONS[id];
        return (
          <button key={id} type="button" onClick={() => setTheme(id)} aria-pressed={on}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 14, cursor: "pointer", textAlign: "left",
              background: "linear-gradient(180deg, var(--glass2), var(--glass))",
              border: on ? "2px solid var(--or)" : "1px solid var(--hair)",
              color: "var(--text)", fontWeight: on ? 800 : 600, fontSize: 13,
            }}>
            <span style={{ width: 26, height: 26, borderRadius: 8, flex: "none", background: SWATCH[id],
              border: "1px solid rgba(128,128,128,.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={13} color={id.endsWith("dark") ? "#F7EFE9" : "#1A1A1E"} />
            </span>
            {THEME_META[id].label}
          </button>
        );
      })}
    </div>
  );
}
