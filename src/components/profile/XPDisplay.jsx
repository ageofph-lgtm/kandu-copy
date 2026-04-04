import React from "react";
import { Zap } from "lucide-react";
import { XP_LEVELS, getXPLevel } from "@/lib/xp";

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