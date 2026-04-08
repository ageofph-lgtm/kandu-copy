import React, { useState } from "react";
import { generateDailyPin } from "@/lib/dailyPin";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function DailyPinDisplay({ jobId }) {
  const [visible, setVisible] = useState(false);
  const pin = generateDailyPin(jobId);

  return (
    <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mt-3">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="w-4 h-4 text-amber-600" />
        <p className="text-xs font-bold text-amber-800">PIN Diário de Validação</p>
      </div>
      <p className="text-xs text-amber-600 mb-3">
        Mostre este PIN ao profissional para confirmar a conclusão do trabalho.
      </p>
      <div className="flex items-center gap-3">
        <div className="flex gap-2">
          {pin.split('').map((digit, i) => (
            <div
              key={i}
              className="w-12 h-14 bg-white rounded-xl border-2 border-amber-300 flex items-center justify-center shadow-sm"
            >
              <span className="text-2xl font-bold text-amber-700">
                {visible ? digit : '•'}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setVisible(v => !v)}
          className="p-2 rounded-full bg-amber-100 hover:bg-amber-200 transition-colors"
        >
          {visible ? <EyeOff className="w-5 h-5 text-amber-700" /> : <Eye className="w-5 h-5 text-amber-700" />}
        </button>
      </div>
      <p className="text-[10px] text-amber-500 mt-2">Renova automaticamente à meia-noite.</p>
    </div>
  );
}