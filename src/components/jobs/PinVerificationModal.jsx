import React, { useState } from "react";
import { generateDailyPin } from "@/lib/dailyPin";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export default function PinVerificationModal({ jobId, jobTitle, employerName, onVerified, onCancel }) {
  const [pinValue, setPinValue] = useState("");
  const [error, setError] = useState(false);

  const correctPin = generateDailyPin(jobId);

  // FIX: input único aceita o PIN completo (sem precisar clicar dígito a dígito)
  const handleInputChange = (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPinValue(v);
    setError(false);
    if (v.length === 4) {
      // Auto-validar quando os 4 dígitos estão preenchidos
      setTimeout(() => {
        if (v === correctPin) {
          onVerified();
        } else {
          setError(true);
          setPinValue("");
        }
      }, 150);
    }
  };

  const handleConfirm = () => {
    if (pinValue === correctPin) {
      onVerified();
    } else {
      setError(true);
      setPinValue("");
    }
  };

  const pinComplete = pinValue.length === 4;

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#FF6600]" />
            Código de Conclusão
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* FIX: Copywriting "à prova de erro" — o profissional sabe de onde vem o PIN */}
          <div style={{background:"#FF660015", border:"1px solid #FF660040", borderRadius:12, padding:14}}>
            <p style={{fontWeight:700, fontSize:14, color:"#FF6600", margin:"0 0 6px"}}>{jobTitle}</p>
            <p style={{fontSize:14, color:"#333", margin:0, lineHeight:1.5}}>
              👉 Peça agora ao{" "}
              <strong style={{color:"#FF6600"}}>
                {employerName ? `cliente ${employerName}` : "cliente"}
              </strong>{" "}
              o código de 4 dígitos que aparece no telemóvel dele.
            </p>
          </div>

          {/* Visualização dos 4 dígitos */}
          <div style={{display:"flex", justifyContent:"center", gap:10, marginBottom:4}}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                width:52, height:60,
                background: i < pinValue.length ? (error ? "#FEE2E2" : "#FFF7F0") : "#F9F9F9",
                border: `2px solid ${
                  error ? "#EF4444"
                  : i < pinValue.length ? "#FF6600"
                  : i === pinValue.length ? "#FF6600"
                  : "#E5E5E5"
                }`,
                borderRadius:12,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:28, fontWeight:700,
                color: error ? "#EF4444" : "#FF6600",
                boxShadow: i === pinValue.length ? "0 0 0 3px #FF660030" : "none",
                transition:"all 0.15s"
              }}>
                {pinValue[i] ? "●" : ""}
              </div>
            ))}
          </div>

          {/* Input nativo numérico (mobile keyboard abre direto) */}
          <div style={{display:"flex", justifyContent:"center"}}>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Toque aqui e insira o código"
              value={pinValue}
              onChange={handleInputChange}
              autoFocus
              style={{
                textAlign:"center",
                fontSize:18,
                padding:"12px 20px",
                borderRadius:12,
                border: error ? "2px solid #EF4444" : "2px solid #FF6600",
                background: error ? "#FEE2E2" : "#FFF7F0",
                color: error ? "#EF4444" : "#FF6600",
                width:"100%",
                outline:"none",
                letterSpacing:8,
                fontWeight:700
              }}
            />
          </div>

          {error && (
            <p style={{textAlign:"center", fontSize:13, color:"#EF4444", fontWeight:600, margin:0}}>
              ❌ Código incorreto. Verifique com o cliente.
            </p>
          )}

          <div style={{display:"flex", gap:10}}>
            <button onClick={onCancel}
              style={{flex:1, padding:"12px 0", background:"transparent", border:"1px solid #E5E5E5", borderRadius:12, color:"#666", fontWeight:600, fontSize:14, cursor:"pointer"}}>
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!pinComplete}
              style={{flex:1, padding:"12px 0", background:pinComplete?"#FF6600":"#E5E5E5", border:"none", borderRadius:12, color:pinComplete?"#FFF":"#AAA", fontWeight:700, fontSize:14, cursor:pinComplete?"pointer":"not-allowed", transition:"background 0.2s"}}>
              Confirmar ✓
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
