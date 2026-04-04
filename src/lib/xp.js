// Centralized XP system

export const XP_LEVELS = [
  { name: "Novato",       min: 0,     max: 999,      color: "from-gray-400 to-gray-500",       emoji: "🔨" },
  { name: "Aprendiz",     min: 1000,  max: 4999,     color: "from-blue-400 to-blue-500",        emoji: "📘" },
  { name: "Profissional", min: 5000,  max: 14999,    color: "from-[#F26522] to-orange-600",     emoji: "⚡" },
  { name: "Especialista", min: 15000, max: 39999,    color: "from-purple-500 to-purple-700",    emoji: "🏅" },
  { name: "Mestre",       min: 40000, max: Infinity, color: "from-yellow-400 to-yellow-600",    emoji: "👑" },
];

export function getXPLevel(xp = 0) {
  return XP_LEVELS.find(l => xp >= l.min && xp <= l.max) || XP_LEVELS[0];
}

/** XP awarded for completing a job (to the evaluated user) */
export function calcJobXP(rating, jobPrice, isEarly = false) {
  const base = Math.min(Math.max(jobPrice * 0.1, 10), 100);
  const speedBonus = isEarly ? 1.2 : 1;
  return Math.round(base * (rating / 5) * speedBonus);
}

/** XP awarded for specific actions */
export const XP_EVENTS = {
  profile_complete:    50,
  application_sent:   10,
  application_accepted: 25,
  job_completed_self: 30,  // bonus to the worker/employer who rated
  document_verified:  100,
};

/** Apply XP to a user object and return updated xp + xp_level */
export function applyXP(currentXP = 0, amount) {
  const newXP = currentXP + amount;
  const level = getXPLevel(newXP);
  return { xp: newXP, xp_level: level.name };
}