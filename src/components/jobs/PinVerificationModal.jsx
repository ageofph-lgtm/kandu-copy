import { useState } from "react";
import { X, KeyRound } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";

export default function PinVerificationModal({ onClose, onVerify, jobTitle }) {
  const { lang } = useLanguage();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleVerify = () => {
    if (pin.length < 4) { setError(t(lang,"pinTooShort")); return; }
    onVerify(pin);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:20, padding:24, width:"100%", maxWidth:360, boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:"50%", background:"#FFF3E0", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <KeyRound size={20} style={{ color:"#F26522" }} />
            </div>
            <div>
              <p style={{ margin:0, fontWeight:700, fontSize:15 }}>{t(lang,"pinVerification")}</p>
              <p style={{ margin:0, fontSize:12, color:"#888" }}>{jobTitle}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer" }}>
            <X size={20} style={{ color:"#888" }} />
          </button>
        </div>

        <p style={{ margin:"0 0 16px", fontSize:13, color:"#555", textAlign:"center" }}>
          {t(lang,"pinInstructions")}
        </p>

        <input
          type="number"
          maxLength={6}
          value={pin}
          onChange={e => { setPin(e.target.value.slice(0,6)); setError(""); }}
          placeholder={t(lang,"pinPlaceholder")}
          style={{ width:"100%", textAlign:"center", fontSize:24, fontWeight:700, letterSpacing:8,
            padding:"12px 16px", border:"2px solid #F26522", borderRadius:12, outline:"none",
            boxSizing:"border-box", marginBottom: error ? 6 : 16 }}
        />
        {error && <p style={{ color:"#ef4444", fontSize:12, margin:"0 0 12px", textAlign:"center" }}>{error}</p>}

        <button onClick={handleVerify}
          style={{ width:"100%", background:"#F26522", color:"#fff", border:"none", borderRadius:12,
            padding:"13px", fontWeight:700, fontSize:15, cursor:"pointer" }}>
          {t(lang,"verify")}
        </button>
      </div>
    </div>
  );
}
