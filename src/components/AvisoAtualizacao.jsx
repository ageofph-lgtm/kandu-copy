import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { tVersao } from "@/components/utils/versionTranslations";
import { vigiarVersao, aplicar } from "@/lib/versao";

/**
 * Cartão fixo com o aviso de versão nova. Sem botão de fechar: enquanto
 * houver versão nova fica visível e o título do separador fica marcado.
 */
export default function AvisoAtualizacao() {
  const { lang } = useLanguage();
  const [visivel, setVisivel] = useState(false);
  const [aAtualizar, setAAtualizar] = useState(false);

  useEffect(() => vigiarVersao(() => setVisivel(true)), []);

  useEffect(() => {
    if (!visivel) return;
    const original = document.title;
    document.title = tVersao(lang, "versaoNovaPrefixo") + original.replace(/^●\s*(Versão nova|New version)\s*—\s*/i, "");
    return () => { document.title = original; };
  }, [visivel, lang]);

  if (!visivel) return null;

  const atualizar = () => {
    setAAtualizar(true);
    aplicar();
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0"
      style={{
        zIndex: 200,
        padding: "10px 12px",
        paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        maxWidth: 640, margin: "0 auto",
        background: "#F4621F", color: "#1A1A1E",
        border: "1px solid rgba(255,255,255,.55)", borderRadius: 18,
        padding: "14px 16px",
        boxShadow: "0 18px 44px -16px rgba(120,50,15,.6)",
      }}>
        <span style={{ position: "relative", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Sparkles size={22} className="animate-ping" style={{ position: "absolute", opacity: .7 }} />
          <Sparkles size={22} />
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, lineHeight: 1.25 }}>
            {tVersao(lang, "versaoNovaTitulo")}
          </p>
          <p style={{ margin: "3px 0 0", fontSize: 12, lineHeight: 1.35, color: "#3D2A20" }}>
            {tVersao(lang, "versaoNovaSub")}
          </p>
        </div>

        <button
          type="button"
          onClick={atualizar}
          disabled={aAtualizar}
          style={{
            flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 8,
            background: "#1A1A1E", color: "#FFFFFF",
            border: "none", borderRadius: 12,
            padding: "11px 18px", fontSize: 13, fontWeight: 800,
            cursor: aAtualizar ? "wait" : "pointer",
            boxShadow: "0 8px 18px -10px rgba(0,0,0,.5)",
          }}
        >
          {aAtualizar && <Loader2 size={15} className="animate-spin" />}
          {aAtualizar ? tVersao(lang, "versaoAtualizando") : tVersao(lang, "versaoAtualizar")}
        </button>
      </div>
    </div>
  );
}