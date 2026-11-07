import React from "react";
import { useTheme } from "@/lib/ThemeContext";

/**
 * Logótipo KANDU com fundo recortado (PNG transparente em /public/brand).
 * Escolhe a versão clara ou escura conforme a superfície onde assenta:
 *  - por omissão segue o tema (escuro → logótipo de texto branco);
 *  - `onDark` marca ecrãs cujo fundo é sempre escuro nos temas Titânio
 *    (Login, Boas-vindas…); no Ember claro esses fundos ficam claros,
 *    por isso aí usa-se a versão clara.
 */
export const BRAND = {
  wordmark: { light: "/brand/kandu-wordmark-light.png", dark: "/brand/kandu-wordmark-dark.png" },
  icon:     { light: "/brand/kandu-icon-light.png",     dark: "/brand/kandu-icon-dark.png" },
};

export function useBrandLogo(kind = "wordmark", onDark = false) {
  const { theme, isDark } = useTheme();
  const dark = theme === "ember-light" ? false : theme === "ember-dark" ? true : (onDark || isDark);
  return BRAND[kind][dark ? "dark" : "light"];
}

export default function KanduLogo({ kind = "wordmark", onDark = false, alt = "KANDU", ...rest }) {
  const src = useBrandLogo(kind, onDark);
  return <img src={src} alt={alt} draggable={false} {...rest} />;
}
