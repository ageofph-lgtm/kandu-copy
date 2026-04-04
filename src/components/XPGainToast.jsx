import React, { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { getXPLevel } from "@/lib/xp";

/**
 * Animated XP gain popup.
 * Props: xpGained (number), newXP (number), show (bool), onDone (fn)
 */
export default function XPGainToast({ xpGained, newXP, show, onDone }) {
  const [visible, setVisible] = useState(false);
  const level = getXPLevel(newXP);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 3000);
    return () => clearTimeout(t);
  }, [show]);

  if (!visible) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-bounce">
      <div className="bg-white border-2 border-[#F26522] rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-3 min-w-[220px]">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${level.color} flex items-center justify-center shrink-0`}>
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">XP Ganho!</p>
          <p className="text-2xl font-black text-[#F26522]">+{xpGained} XP</p>
          <p className="text-xs text-gray-400">{level.emoji} {level.name} · {newXP.toLocaleString("pt-PT")} total</p>
        </div>
      </div>
    </div>
  );
}