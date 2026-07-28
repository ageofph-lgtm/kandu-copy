/**
 * Envolve uma promise com timeout — usado em fluxos onde o utilizador ficava
 * preso num spinner infinito porque a chamada nunca resolvia (#1001).
 *
 * @param {Promise} promise
 * @param {number} ms
 * @param {string} message  erro apresentado quando expira
 */
export function withTimeout(promise, ms = 15000, message = "A operação demorou demasiado tempo. Verifica a ligação e tenta novamente.") {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Mensagem legível a partir de um erro do Supabase/JS. */
export function errorMessage(err, fallback = "Ocorreu um erro. Tenta novamente.") {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  return err.message || err.error_description || err.details || err.hint || fallback;
}
