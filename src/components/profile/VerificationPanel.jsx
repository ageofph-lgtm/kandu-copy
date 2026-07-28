import { useState, useRef } from "react";
import { toast } from "sonner";
import { User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { ShieldCheck, BadgeCheck, Phone, Upload, Loader2, Check } from "lucide-react";
import { VERIFICATION_LEVELS, computeVerificationLevel, generateOtp } from "@/lib/verification";
import { isValidPhonePT, normalizePhonePT, validateFile, DOC_MIME_TYPES } from "@/lib/validation";

/**
 * Painel de verificação do perfil (#1, #3).
 *
 *   telemóvel confirmado    → Verified Professional
 *   documento de identidade → Ultra Verified Professional
 *
 * Nota: o envio de SMS ainda não tem provider em produção. Até lá o código é
 * gerado no cliente e mostrado ao utilizador — está assinalado na UI como
 * fluxo de teste e não deve ser comunicado como prova anti-fraude.
 */
export default function VerificationPanel({ user, onUpdate }) {
  const [phone, setPhone] = useState(user?.phone || "");
  const [otpSent, setOtpSent] = useState(null);      // código esperado
  const [otpInput, setOtpInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const level = computeVerificationLevel(user);
  const isVerified = level === "verified" || level === "ultra_verified";
  const isUltra = level === "ultra_verified";

  const sendOtp = () => {
    if (!isValidPhonePT(phone)) {
      toast.error("Número inválido. Usa um número português (ex: 912 345 678).");
      return;
    }
    const code = generateOtp();
    setOtpSent(code);
    setOtpInput("");
    toast.info(`Código de verificação: ${code}`, { duration: 12000 });
  };

  const confirmOtp = async () => {
    if (otpInput.trim() !== otpSent) {
      toast.error("Código incorreto. Verifica e tenta novamente.");
      return;
    }
    setBusy(true);
    try {
      const patch = {
        phone: normalizePhonePT(phone),
        phone_verified: true,
        verification_level: user?.id_verified ? "ultra_verified" : "verified",
      };
      await User.updateMyUserData(patch);
      setOtpSent(null);
      toast.success("Telemóvel verificado ✅ — és agora um profissional Verificado.");
      onUpdate?.(patch);
    } catch (e) {
      toast.error("Não foi possível guardar a verificação: " + (e.message || ""));
    }
    setBusy(false);
  };

  const handleIdUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const check = validateFile(file, { accept: DOC_MIME_TYPES });
    if (!check.ok) { toast.error(check.error); return; }

    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      const patch = {
        id_document_url: file_url,
        id_verified: true,
        verification_level: "ultra_verified",
      };
      await User.updateMyUserData(patch);
      toast.success("Documento submetido 🛡️ — perfil Ultra Verificado.");
      onUpdate?.(patch);
    } catch (e) {
      toast.error("Erro ao enviar o documento: " + (e.message || ""));
    }
    setUploading(false);
  };

  const card = {
    background: "var(--surface2)", border: "1px solid var(--hair)",
    borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 12,
  };
  const input = {
    width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--hair)",
    background: "var(--surface)", color: "var(--text)", fontSize: 14, outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Estado actual */}
      <div style={{ ...card, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 26 }}>{VERIFICATION_LEVELS[level].emoji}</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: VERIFICATION_LEVELS[level].color }}>
            {user?.user_type === "worker" ? VERIFICATION_LEVELS[level].labelPro : VERIFICATION_LEVELS[level].label}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text2)" }}>
            {VERIFICATION_LEVELS[level].description}
          </p>
        </div>
      </div>

      {/* Passo 1 — telemóvel */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isVerified ? <Check size={16} color="#22C55E" /> : <Phone size={16} color="#3B82F6" />}
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
            1 · Verificar telemóvel
          </span>
          {isVerified && (
            <span style={{ marginLeft: "auto", background: "#22C55E22", color: "#22C55E", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
              Confirmado
            </span>
          )}
        </div>

        {!isVerified && (
          <>
            <input style={input} inputMode="tel" placeholder="912 345 678"
              value={phone} onChange={e => setPhone(e.target.value)} />
            {!otpSent ? (
              <button onClick={sendOtp}
                style={{ background: "#3B82F6", color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Enviar código
              </button>
            ) : (
              <>
                <input style={input} inputMode="numeric" maxLength={6} placeholder="Código de 6 dígitos"
                  value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/\D/g, ""))} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setOtpSent(null)}
                    style={{ flex: 1, background: "transparent", color: "var(--text2)", border: "1px solid var(--hair)", borderRadius: 10, padding: "10px", fontSize: 13, cursor: "pointer" }}>
                    Cancelar
                  </button>
                  <button onClick={confirmOtp} disabled={busy || otpInput.length < 6}
                    style={{ flex: 2, background: otpInput.length === 6 ? "#22C55E" : "#333", color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontWeight: 700, fontSize: 13, cursor: otpInput.length === 6 ? "pointer" : "not-allowed" }}>
                    {busy ? "A confirmar..." : "Confirmar"}
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: "var(--text2)" }}>
                  ⓘ Fluxo de teste — o SMS ainda não é enviado por um provider real.
                </p>
              </>
            )}
          </>
        )}
      </div>

      {/* Passo 2 — documento de identidade */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isUltra ? <BadgeCheck size={16} color="#22C55E" /> : <ShieldCheck size={16} color="#8A909A" />}
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
            2 · Documento de identidade
          </span>
          {isUltra && (
            <span style={{ marginLeft: "auto", background: "#22C55E22", color: "#22C55E", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
              Ultra Verificado
            </span>
          )}
        </div>

        {!isUltra && (
          <>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>
              Envia o Cartão de Cidadão, Passaporte ou Título de Residência. Só a equipa
              KANDU tem acesso — o documento nunca é mostrado a outros utilizadores (RGPD).
            </p>
            <input ref={fileRef} type="file" accept="application/pdf,image/jpeg,image/png"
              onChange={handleIdUpload} style={{ display: "none" }} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading || !isVerified}
              title={!isVerified ? "Confirma primeiro o telemóvel" : undefined}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: isVerified ? "#22C55E22" : "transparent",
                color: isVerified ? "#22C55E" : "#555",
                border: `1px solid ${isVerified ? "#22C55E44" : "var(--hair)"}`,
                borderRadius: 10, padding: "10px", fontWeight: 700, fontSize: 13,
                cursor: isVerified && !uploading ? "pointer" : "not-allowed",
              }}>
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? "A enviar..." : isVerified ? "Enviar documento" : "Confirma primeiro o telemóvel"}
            </button>
            <p style={{ margin: 0, fontSize: 11, color: "var(--text2)" }}>PDF, JPG ou PNG · máx. 8 MB</p>
          </>
        )}
      </div>
    </div>
  );
}
