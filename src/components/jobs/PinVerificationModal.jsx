import React, { useState } from "react";
import { generateDailyPin } from "@/lib/dailyPin";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, X } from "lucide-react";

export default function PinVerificationModal({ jobId, jobTitle, onVerified, onCancel }) {
  const [input, setInput] = useState(['', '', '', '']);
  const [error, setError] = useState(false);

  const correctPin = generateDailyPin(jobId);

  const handleDigit = (index, value) => {
    const v = value.replace(/\D/, '').slice(-1);
    const next = [...input];
    next[index] = v;
    setInput(next);
    setError(false);
    if (v && index < 3) {
      document.getElementById(`pin-input-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !input[index] && index > 0) {
      document.getElementById(`pin-input-${index - 1}`)?.focus();
    }
  };

  const handleConfirm = () => {
    const entered = input.join('');
    if (entered === correctPin) {
      onVerified();
    } else {
      setError(true);
      setInput(['', '', '', '']);
      document.getElementById('pin-input-0')?.focus();
    }
  };

  const pinComplete = input.every(d => d !== '');

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#F26522]" />
            Inserir PIN de Validação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="bg-orange-50 rounded-xl p-3">
            <p className="text-sm font-semibold text-gray-800">{jobTitle}</p>
            <p className="text-xs text-gray-500 mt-1">
              Peça ao empregador o PIN diário para confirmar que esteve fisicamente no local.
            </p>
          </div>

          <div className="flex justify-center gap-3">
            {input.map((digit, i) => (
              <input
                key={i}
                id={`pin-input-${i}`}
                type="number"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-14 h-16 text-center text-3xl font-bold border-2 rounded-xl outline-none transition-colors ${
                  error
                    ? 'border-red-400 bg-red-50 text-red-600'
                    : digit
                      ? 'border-[#F26522] bg-orange-50 text-[#F26522]'
                      : 'border-gray-200 bg-white text-gray-900'
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-center text-sm text-red-500 font-medium">
              PIN incorreto. Verifique com o empregador.
            </p>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!pinComplete}
              className="flex-1 bg-[#F26522] hover:bg-orange-600"
            >
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}