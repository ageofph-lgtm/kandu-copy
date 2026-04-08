/**
 * Generates a deterministic 4-digit Daily PIN based on job ID and today's date.
 * The same PIN is generated client-side for both employer and worker.
 */
export function generateDailyPin(jobId) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const str = (jobId || '') + today;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 1000000;
  }
  return String(hash % 10000).padStart(4, '0');
}