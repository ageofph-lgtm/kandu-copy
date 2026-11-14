/**
 * Bolinha no ícone do app (Badging API). Silencioso: muitos browsers não têm
 * a API e o cálculo nunca pode rebentar nada na UI.
 */
export function atualizarBadge(n) {
  try {
    if (typeof navigator === "undefined") return;
    const total = Number(n) || 0;
    if (total > 0) {
      if (typeof navigator.setAppBadge === "function") {
        Promise.resolve(navigator.setAppBadge(total)).catch(() => {});
      }
    } else if (typeof navigator.clearAppBadge === "function") {
      Promise.resolve(navigator.clearAppBadge()).catch(() => {});
    }
  } catch {
    /* sem suporte — ignora */
  }
}