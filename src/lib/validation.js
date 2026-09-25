// Validações partilhadas — QA Ciclo 1 (#17, #18, #19, #21, #39, #1002, #1004)
// Regras acordadas no relatório de QA: NIF português com dígito de controlo,
// telemóvel PT, rejeição de domínios pessoais para Employers CIA e validação
// de formato de ficheiro nos uploads.

/**
 * Domínios de email pessoais/gratuitos recusados para contas Cia Employer (#18).
 * Comparamos pelo rótulo de 2.º nível (ex.: "outlook" em outlook.pt E em outlook.com),
 * por isso a lista não precisa de enumerar cada TLD.
 */
export const FREE_EMAIL_PROVIDERS = [
  "gmail", "googlemail", "hotmail", "outlook", "live", "msn", "yahoo", "ymail",
  "icloud", "me", "mac", "aol", "sapo", "mail", "gmx", "proton", "protonmail",
  "clix", "iol", "netcabo", "zonmail", "vodafone",
];
// Mantido por compatibilidade com imports existentes
export const PERSONAL_EMAIL_DOMAINS = FREE_EMAIL_PROVIDERS.map(p => `${p}.com`);

/**
 * NIF português: 9 dígitos + dígito de controlo (módulo 11) + prefixo válido.
 * Prefixos válidos (AT): 1,2,3 (singular), 5 (colectiva), 6 (público),
 * 8 (empresário nome individual), 9 (irregular/condomínio); e ainda os prefixos
 * de dois dígitos 45,70,71,72,74,75,77,79,90,91,98,99.
 */
const NIF_PREFIX_2 = new Set(["45","70","71","72","74","75","77","79","90","91","98","99"]);
const NIF_PREFIX_1 = new Set(["1","2","3","5","6","8","9"]);
export function isValidNIF(nif) {
  const digits = String(nif || "").replace(/\s/g, "");
  if (!/^\d{9}$/.test(digits)) return false;
  if (!NIF_PREFIX_1.has(digits[0]) && !NIF_PREFIX_2.has(digits.slice(0, 2))) return false;

  let sum = 0;
  for (let i = 0; i < 8; i++) sum += Number(digits[i]) * (9 - i);
  const mod = sum % 11;
  const check = mod < 2 ? 0 : 11 - mod;
  return check === Number(digits[8]);
}

/** NIF de pessoa colectiva (empresa) — começa por 5, 6 ou 9 (#1002) */
export function isValidCompanyNIF(nif) {
  const digits = String(nif || "").replace(/\s/g, "");
  return isValidNIF(digits) && "569".includes(digits[0]);
}

/**
 * Telemóvel português: 9 dígitos começados por 91/92/93/96 (gamas móveis reais).
 * O campo é "telemóvel" e desbloqueia o estado Verificado (#3), por isso não
 * aceitamos fixos (2xx) nem gamas inexistentes. Aceita prefixo +351/00351 e espaços.
 */
export function isValidPhonePT(phone) {
  const digits = String(phone || "").replace(/[\s\-().]/g, "").replace(/^(\+351|00351)/, "");
  return /^9[1236]\d{7}$/.test(digits);
}

/** Normaliza para o formato guardado na BD: +351XXXXXXXXX */
export function normalizePhonePT(phone) {
  const digits = String(phone || "").replace(/[\s\-().]/g, "").replace(/^(\+351|00351)/, "");
  return /^\d{9}$/.test(digits) ? `+351${digits}` : String(phone || "").trim();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || "").trim());
}

/** Rejeita emails pessoais/gratuitos — obrigatório em contas Cia Employer (#18) */
export function isCorporateEmail(email) {
  if (!isValidEmail(email)) return false;
  const domain = String(email).trim().toLowerCase().split("@")[1] || "";
  const labels = domain.split(".");
  // rótulo de 2.º nível: "outlook" em outlook.pt e em outlook.com
  const sld = labels.length >= 2 ? labels[labels.length - 2] : labels[0];
  return !FREE_EMAIL_PROVIDERS.includes(sld);
}

// ── Uploads (#39) ────────────────────────────────────────────────────────────
export const DOC_MIME_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
export const IMAGE_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

/**
 * Valida um ficheiro antes do upload.
 * @returns {{ok: true} | {ok: false, error: string}}
 */
export function validateFile(file, { accept = DOC_MIME_TYPES, maxBytes = MAX_UPLOAD_BYTES } = {}) {
  if (!file) return { ok: false, error: "Nenhum ficheiro selecionado." };
  const type = (file.type || "").toLowerCase();
  if (!accept.includes(type)) {
    const labels = accept.map(m => m.split("/")[1].toUpperCase().replace("JPEG", "JPG")).join(", ");
    return { ok: false, error: `Formato não suportado. Usa: ${labels}.` };
  }
  if (file.size > maxBytes) {
    return { ok: false, error: `Ficheiro demasiado grande (máx. ${Math.round(maxBytes / 1024 / 1024)} MB).` };
  }
  return { ok: true };
}

/**
 * Redimensiona/comprime uma imagem no browser antes do upload (#62 — logo da
 * empresa não redimensionava). Devolve um File pronto a enviar.
 */
export function resizeImage(file, { maxSize = 512, quality = 0.9, mime = "image/jpeg" } = {}) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) { reject(new Error("Falha ao processar imagem")); return; }
          const ext = mime === "image/png" ? "png" : "jpg";
          resolve(new File([blob], `${Date.now()}.${ext}`, { type: mime }));
        },
        mime,
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Imagem inválida")); };
    img.src = url;
  });
}

// ── Validação de formulários (#19, #1002) ───────────────────────────────────
/**
 * Valida campos obrigatórios devolvendo um mapa de erros por campo.
 * Não depende do atributo HTML `required` — o relatório assinala que a
 * validação nativa estava a ser contornada.
 */
export function requireFields(values, fields) {
  const errors = {};
  for (const { name, label, validate } of fields) {
    const value = values[name];
    const empty = value === undefined || value === null ||
      (typeof value === "string" && !value.trim()) ||
      (Array.isArray(value) && value.length === 0);
    if (empty) { errors[name] = `${label} é obrigatório.`; continue; }
    if (validate) {
      const msg = validate(value, values);
      if (msg) errors[name] = msg;
    }
  }
  return errors;
}

/** Data fim não pode ser anterior à data de início (#1002) */
export function isValidDateRange(start, end) {
  if (!start || !end) return true;
  return new Date(end) >= new Date(start);
}
