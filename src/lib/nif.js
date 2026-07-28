// Validação de NIF português (9 dígitos + dígito de controlo módulo 11)

// Prefixos válidos: 1/2/3 (singulares), 45 (não residentes), 5 (colectivas),
// 6 (organismos públicos), 70-79 (heranças/irregulares), 8 (empresário em nome
// individual), 90/91/98/99 (condomínios, não residentes, etc.)
const ONE_DIGIT_PREFIXES = ["1", "2", "3", "5", "6", "8"];
const TWO_DIGIT_PREFIXES = ["45", "70", "71", "72", "74", "75", "77", "78", "79", "90", "91", "98", "99"];

/** Remove espaços/pontos/traços — o utilizador pode escrever "123 456 789" */
export function normalizeNIF(value) {
  return String(value ?? "").replace(/[\s.-]/g, "");
}

/** true se o NIF tem 9 dígitos, prefixo válido e dígito de controlo correcto */
export function isValidNIF(value) {
  const nif = normalizeNIF(value);
  if (!/^\d{9}$/.test(nif)) return false;

  const hasValidPrefix =
    ONE_DIGIT_PREFIXES.includes(nif[0]) || TWO_DIGIT_PREFIXES.includes(nif.slice(0, 2));
  if (!hasValidPrefix) return false;

  let sum = 0;
  for (let i = 0; i < 8; i++) sum += Number(nif[i]) * (9 - i);
  const remainder = sum % 11;
  const checkDigit = remainder < 2 ? 0 : 11 - remainder;

  return checkDigit === Number(nif[8]);
}

/** Formata para exibição: "123456789" → "123 456 789" */
export function formatNIF(value) {
  const nif = normalizeNIF(value);
  return nif.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}
