// Validações partilhadas — QA Ciclo 1 (#17, #18, #19, #21, #39, #1002, #1004)
// Regras acordadas no relatório de QA: NIF português com dígito de controlo,
// telemóvel PT, rejeição de domínios pessoais para Employers CIA e validação
// de formato de ficheiro nos uploads.

/** Domínios de email pessoais recusados para contas Cia Employer (#18) */
export const PERSONAL_EMAIL_DOMAINS = [
  "gmail.com", "hotmail.com", "yahoo.com", "outlook.com",
  "live.com", "icloud.com", "aol.com", "sapo.pt", "mail.com",
];

/**
 * NIF português: 9 dígitos + algoritmo de dígito de controlo (módulo 11).
 * O primeiro dígito identifica o tipo de contribuinte.
 */
export function isValidNIF(nif) {
  const digits = String(nif || "").replace(/\s/g, "");
  if (!/^\d{9}$/.test(digits)) return false;

  // Primeiro dígito válido: 1,2,3 (singular), 5 (colectiva), 6,8,9 (outros)
  if (!"123456889".includes(digits[0])) return false;

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
 * Telemóvel português: 9 dígitos começados por 9 (móvel) ou 2 (fixo).
 * Aceita prefixo +351 / 00351 e espaços.
 */
export function isValidPhonePT(phone) {
  const digits = String(phone || "").replace(/[\s\-().]/g, "").replace(/^(\+351|00351)/, "");
  return /^[92]\d{8}$/.test(digits);
}

/** Normaliza para o formato guardado na BD: +351XXXXXXXXX */
export function normalizePhonePT(phone) {
  const digits = String(phone || "").replace(/[\s\-().]/g, "").replace(/^(\+351|00351)/, "");
  return /^\d{9}$/.test(digits) ? `+351${digits}` : String(phone || "").trim();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || "").trim());
}

/** Rejeita emails pessoais — obrigatório em contas Cia Employer (#18) */
export function isCorporateEmail(email) {
  if (!isValidEmail(email)) return false;
  const domain = String(email).trim().toLowerCase().split("@")[1];
  return !PERSONAL_EMAIL_DOMAINS.includes(domain);
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
