import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, ShieldCheck, Loader2, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PhoneVerificationModal({ phone, onVerified, onCancel }) {
  const [stage, setStage] = useState("send"); // "send" | "verify"
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    try {
      await base44.functions.invoke("smsVerification", { action: "send", phone });
      setStage("verify");
    } catch (e) {
      setError("Erro ao enviar SMS. Verifique o número e tente novamente.");
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (code.length < 4) return;
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("smsVerification", { action: "verify", phone, code });
      if (res.data?.valid) {
        onVerified();
      } else {
        setError("Código inválido. Tente novamente.");
      }
    } catch (e) {
      setError("Erro na verificação. Tente novamente.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        {stage === "send" ? (
          <>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Phone className="w-8 h-8 text-[#F26522]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Verificação por SMS</h2>
              <p className="text-sm text-gray-500 mt-2">
                Para publicar este anúncio, precisamos de verificar o seu número de telefone.
              </p>
              <div className="mt-3 bg-orange-50 rounded-xl px-4 py-2">
                <p className="text-sm font-semibold text-[#F26522]">{phone || "Número não definido"}</p>
              </div>
            </div>
            {error && <p className="text-sm text-red-500 text-center mb-3">{error}</p>}
            <Button
              onClick={handleSend}
              disabled={loading || !phone}
              className="w-full h-12 bg-[#F26522] hover:bg-orange-600 text-white font-bold rounded-2xl"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar código SMS"}
            </Button>
            <Button variant="ghost" onClick={onCancel} className="w-full mt-2 text-gray-500">
              Cancelar
            </Button>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Introduza o código</h2>
              <p className="text-sm text-gray-500 mt-2">
                Enviámos um código SMS para <strong>{phone}</strong>
              </p>
            </div>
            <Input
              placeholder="_ _ _ _ _ _"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="h-14 text-center text-3xl font-bold tracking-widest rounded-xl border-gray-200 mb-3"
              inputMode="numeric"
            />
            {error && <p className="text-sm text-red-500 text-center mb-3">{error}</p>}
            <Button
              onClick={handleVerify}
              disabled={loading || code.length < 4}
              className="w-full h-12 bg-[#F26522] hover:bg-orange-600 text-white font-bold rounded-2xl"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verificar e Publicar"}
            </Button>
            <button
              onClick={() => { setStage("send"); setCode(""); setError(null); }}
              className="w-full mt-3 text-sm text-gray-400 flex items-center justify-center gap-1 hover:text-gray-600"
            >
              <RefreshCw className="w-3 h-3" /> Reenviar código
            </button>
          </>
        )}
      </div>
    </div>
  );
}