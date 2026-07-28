// Níveis de verificação (#1, #3 — wireframe slides 8/9)
//
//   basic          → conta criada (email)
//   verified       → telemóvel confirmado  → "Verified Professional"
//   ultra_verified → documento de identidade aprovado → "Ultra Verified Professional"

export const VERIFICATION_LEVELS = {
  basic: {
    id: "basic",
    label: "Básico",
    labelPro: "Conta Básica",
    color: "#8A909A",
    emoji: "🔓",
    description: "Conta criada — confirma o telemóvel para subir de nível",
  },
  verified: {
    id: "verified",
    label: "Verificado",
    labelPro: "Verified Professional",
    color: "#3B82F6",
    emoji: "✅",
    description: "Telemóvel confirmado",
  },
  ultra_verified: {
    id: "ultra_verified",
    label: "Ultra Verificado",
    labelPro: "Ultra Verified Professional",
    color: "#22C55E",
    emoji: "🛡️",
    description: "Identidade confirmada com documento oficial",
  },
};

/**
 * Deriva o nível a partir das flags do utilizador. Fonte única de verdade —
 * o campo `verification_level` guardado na BD é apenas cache para queries.
 */
export function computeVerificationLevel(user) {
  if (!user) return "basic";
  if (user.id_verified) return "ultra_verified";
  if (user.phone_verified) return "verified";
  return "basic";
}

export function getVerification(user) {
  return VERIFICATION_LEVELS[computeVerificationLevel(user)] || VERIFICATION_LEVELS.basic;
}

/** Campos a persistir quando o nível muda — mantém a cache coerente. */
export function verificationPatch(user) {
  return { verification_level: computeVerificationLevel(user) };
}

// ── Código OTP de verificação de telemóvel ───────────────────────────────────
// O envio real de SMS depende do provider configurado em produção. Enquanto
// isso não existe, geramos o código no cliente e mostramo-lo ao utilizador,
// deixando explícito que é um fluxo de teste (não é prova anti-fraude).
export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
