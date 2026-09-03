/**
 * Acessibilidade (#83/#84) — tamanho de fonte (3 níveis) e modo de
 * alto contraste. Persistido em localStorage e aplicado via classes CSS
 * globais no <html>.
 */

const STORAGE = "kandu_a11y";
export const FONT_SCALES = ["small", "medium", "large"];

export function getA11ySettings() {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        fontScale: FONT_SCALES.includes(parsed.fontScale) ? parsed.fontScale : "medium",
        highContrast: !!parsed.highContrast,
      };
    }
  } catch (_) {}
  return { fontScale: "medium", highContrast: false };
}

export function saveA11ySettings(settings) {
  try { localStorage.setItem(STORAGE, JSON.stringify(settings)); } catch (_) {}
  applyA11y(settings);
}

export function setFontScale(scale) {
  const cur = getA11ySettings();
  const next = { ...cur, fontScale: FONT_SCALES.includes(scale) ? scale : "medium" };
  saveA11ySettings(next);
  return next;
}

export function toggleHighContrast() {
  const cur = getA11ySettings();
  const next = { ...cur, highContrast: !cur.highContrast };
  saveA11ySettings(next);
  return next;
}

/** Aplica as classes ao <html> — deve ser chamado no arranque e a cada mudança. */
export function applyA11y(settings) {
  if (typeof document === "undefined") return;
  const s = settings || getA11ySettings();
  const root = document.documentElement;
  root.classList.remove("a11y-font-small", "a11y-font-medium", "a11y-font-large", "a11y-contrast");
  root.classList.add(`a11y-font-${s.fontScale}`);
  if (s.highContrast) root.classList.add("a11y-contrast");
}