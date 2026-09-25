/**
 * PINs de presença e de conclusão de obra.
 *
 * NOTA DE SEGURANÇA (#S6): estes PINs são gerados no cliente e servem apenas
 * como UX de confirmação — NÃO são prova anti-fraude. A validação real deve
 * passar para o servidor antes do lançamento. Esta versão corrige o defeito
 * funcional anterior (o PIN dependia de um único caráter do id + o dia, o que
 * gerava imensas colisões) usando um hash (FNV-1a) sobre o id completo.
 */

// FNV-1a de 32 bits — distribuição uniforme sobre toda a string do id.
function hashStr(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const sixDigits = (n) => String(n % 1000000).padStart(6, "0");

/**
 * PIN de presença — determinístico por obra e por dia.
 * Empregador e profissional geram o mesmo valor (mesmo id + mesma data).
 */
export function generateDailyPin(jobId) {
  if (!jobId) return "------";
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return sixDigits(hashStr(`presence:${jobId}:${day}`));
}

/**
 * PIN de conclusão — determinístico por obra e por hora.
 * `hourOffset` permite validar o PIN da hora anterior (ver isValidCompletionPin).
 */
export function generateCompletionPin(jobId, hourOffset = 0) {
  if (!jobId) return "------";
  const d = new Date();
  d.setHours(d.getHours() + hourOffset);
  const hourKey = d.toISOString().slice(0, 13); // YYYY-MM-DDTHH
  return sixDigits(hashStr(`completion:${jobId}:${hourKey}`));
}

/**
 * Aceita o PIN da hora atual ou da anterior — evita que a viragem de hora
 * entre gerar e inserir o código o invalide.
 */
export function isValidCompletionPin(input, jobId) {
  return input === generateCompletionPin(jobId) || input === generateCompletionPin(jobId, -1);
}
