// Obras guardadas pelo utilizador (#40).
// Ficam no dispositivo — não há coluna para favoritos na tabela users.

const key = (userId) => `kandu_favorites_${userId || "anon"}`;

export function getFavorites(userId) {
  try {
    const raw = localStorage.getItem(key(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isFavorite(userId, jobId) {
  return getFavorites(userId).includes(jobId);
}

/** Adiciona/remove e devolve a lista actualizada */
export function toggleFavorite(userId, jobId) {
  const current = getFavorites(userId);
  const next = current.includes(jobId)
    ? current.filter(id => id !== jobId)
    : [...current, jobId];
  try {
    localStorage.setItem(key(userId), JSON.stringify(next));
  } catch {
    // storage cheio ou indisponível — o favorito não persiste, mas não parte a app
  }
  return next;
}
