import React from "react";
import { Zap } from "lucide-react";

const XP_LEVELS = [
  { name: "Novato", min: 0, max: 999, color: "from-gray-400 to-gray-500" },
  { name: "Aprendiz", min: 1000, max: 4999, color: "from-blue-400 to-blue-500" },
  { name: "Profissional", min: 5000, max: 14999, color: "from-[#F26522] to-orange-600" },
  { name: "Especialista", min: 15000, max: 39999, color: "from-purple-500 to-purple-700" },
  { name: "Mestre", min: 40000, max: Infinity, color: "from-yellow-400 to-yellow-600" }
];

export function getXPLevel(xp = 0) {
  return XP_LEVELS.find(l => xp >= l.min && xp <= l.max) || XP_LEVELS[0];
}

export default function XPDisplay({ xp = 0 }) {
  const current = getXPLevel(xp);
  const nextLevel = XP_LEVELS[XP_LEVELS.indexOf(current) + 1];
  const progress = nextLevel
    ? Math.min(100, ((xp - current.min) / (nextLevel.min - current.min)) * 100)
    : 100;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${current.color} flex items-center justify-center`}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Nível</p>
            <p className="text-sm font-bold text-gray-900">{current.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-gray-900">{xp.toLocaleString('pt-PT')}</p>
          <p className="text-xs text-gray-400">pontos XP</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${current.color} transition-all duration-500`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{current.name}</span>
        {nextLevel ? (
          <span>{nextLevel.min.toLocaleString('pt-PT')} XP → {nextLevel.name}</span>
        ) : (
          <span>🏆 Nível máximo!</span>
        )}
      </div>
    </div>
  );
}