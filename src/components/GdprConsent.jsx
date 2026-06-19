import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";

export default function GdprConsent({ open, onAccept }) {
  const { lang } = useLanguage();
  const [checked, setChecked] = useState(false);

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        background: "#1C1B22", borderRadius: 20, padding: "28px 24px",
        maxWidth: 420, width: "100%",
        border: "1px solid #333",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)"
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <span style={{ fontSize: 24 }}>🛡️</span>
          <h2 style={{ color: "#FFF", fontWeight: 800, fontSize: 17, margin: 0 }}>
            {t(lang, "gdprTitle", "Privacidade & RGPD")}
          </h2>
        </div>

        {/* Body */}
        <p style={{ color: "#AAA", fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
          A <strong style={{ color: "#FFF" }}>KANDU</strong> recolhe e trata os seus dados pessoais
          (nome, email, localização) para:
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "Criar e gerir o seu perfil profissional",
            "Ligar empregadores a profissionais",
            "Verificar identidade (KYC opcional)",
            "Enviar notificações sobre obras"
          ].map((item, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "#CCC", fontSize: 13 }}>
              <span style={{ color: "#22C55E", fontSize: 16, lineHeight: 1 }}>✓</span>
              {item}
            </li>
          ))}
        </ul>
        <p style={{ color: "#666", fontSize: 11, lineHeight: 1.5, marginBottom: 20 }}>
          Dados tratados em conformidade com o RGPD (UE 2016/679).
          Pode exercer os seus direitos em qualquer momento pelo perfil.
        </p>

        {/* Checkbox */}
        <label style={{
          display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer",
          padding: "14px 16px", borderRadius: 12,
          border: checked ? "2px solid #F4621F" : "2px solid #333",
          background: "#111016", marginBottom: 20
        }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: "#F4621F", marginTop: 1, flexShrink: 0 }}
          />
          <span style={{ color: "#CCC", fontSize: 12, lineHeight: 1.5 }}>
            Li e aceito a{" "}
            <span style={{ color: "#F4621F", fontWeight: 700 }}>Política de Privacidade</span>
            {" "}e os{" "}
            <span style={{ color: "#F4621F", fontWeight: 700 }}>Termos de Utilização</span>
            {" "}da plataforma KANDU.
          </span>
        </label>

        {/* Botão */}
        <button
          onClick={() => { if (checked) onAccept(); }}
          disabled={!checked}
          style={{
            width: "100%", padding: "15px",
            background: checked ? "#F4621F" : "#333",
            border: "none", borderRadius: 13,
            color: "#FFF", fontWeight: 700, fontSize: 16,
            cursor: checked ? "pointer" : "not-allowed",
            transition: "background 0.2s"
          }}
        >
          {checked ? "✅ Aceitar e Continuar" : "Aceita os termos para continuar"}
        </button>
      </div>
    </div>
  );
}
