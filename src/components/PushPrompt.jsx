import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { tPush } from "@/components/utils/pushTranslations";
import { suportaPush, ehIOS, appInstalada, ativarPush, pushDesligado } from "@/lib/push";
import { toast } from "sonner";

const SNOOZE_KEY = "kandu_push_snooze";
const SETE_DIAS = 7 * 24 * 60 * 60 * 1000;

/**
 * Cartão discreto, depois do login, a convidar a ativar as notificações.
 * «Agora não» esconde-o durante 7 dias.
 */
export default function PushPrompt() {
  const { lang } = useLanguage();
  const [visivel, setVisivel] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const iosSemApp = ehIOS() && !appInstalada();

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (pushDesligado()) return;
    if (Notification.permission !== "default") return;
    if (!suportaPush() && !iosSemApp) return;
    const snooze = Number(localStorage.getItem(SNOOZE_KEY) || 0);
    if (snooze && Date.now() - snooze < SETE_DIAS) return;
    setVisivel(true);
  }, [iosSemApp]);

  if (!visivel) return null;

  const ativar = async () => {
    setOcupado(true);
    try {
      const r = await ativarPush();
      if (r === "ativo") toast.success(tPush(lang, "pushActivatedToast"));
      else if (r === "negado") toast.info(tPush(lang, "pushDeniedToast"));
      else if (r === "ios_sem_app") toast.info(tPush(lang, "pushIosHint"));
      else toast.info(tPush(lang, "pushUnsupported"));
      setVisivel(false);
    } finally {
      setOcupado(false);
    }
  };

  const agoraNao = () => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now()));
    setVisivel(false);
  };

  return (
    <div style={{ maxWidth: 560, margin: "10px auto 0", padding: "0 12px" }}>
      <div style={{
        display: "flex", gap: 12, alignItems: "flex-start",
        background: "var(--surface2)", border: "1px solid var(--hair)",
        borderLeft: "3px solid #F4621F", borderRadius: 14, padding: "12px 14px",
        boxShadow: "0 8px 24px -18px var(--shadow)",
      }}>
        <img
          src="/kandu-icon-192.png"
          alt="KANDU"
          style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, objectFit: "contain" }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>
            {tPush(lang, "pushInviteText")}
          </p>
          {iosSemApp && (
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>
              {tPush(lang, "pushIosHint")}
            </p>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              onClick={ativar}
              disabled={ocupado}
              style={{
                background: "#F4621F", border: "none", borderRadius: 10,
                padding: "7px 16px", color: "#fff", fontWeight: 700, fontSize: 13,
                cursor: ocupado ? "wait" : "pointer",
              }}
            >
              {ocupado ? "…" : tPush(lang, "pushActivate")}
            </button>
            <button
              onClick={agoraNao}
              style={{
                background: "transparent", border: "1px solid var(--hair)", borderRadius: 10,
                padding: "7px 14px", color: "var(--text2)", fontWeight: 600, fontSize: 13,
                cursor: "pointer",
              }}
            >
              {tPush(lang, "pushNotNow")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}