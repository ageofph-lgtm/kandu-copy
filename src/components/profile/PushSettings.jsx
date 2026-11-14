import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { tPush } from "@/components/utils/pushTranslations";
import { estadoPush, ativarPush, desativarPush } from "@/lib/push";
import { toast } from "sonner";
import { Bell } from "lucide-react";

/** Secção «Notificações no telemóvel» do perfil (ligar/desligar + estado). */
export default function PushSettings() {
  const { lang } = useLanguage();
  const [estado, setEstado] = useState("inativo");
  const [ocupado, setOcupado] = useState(false);

  const refresh = useCallback(async () => setEstado(await estadoPush()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const ativo = estado === "ativo";
  const indisponivel = estado === "sem_suporte" || estado === "ios_sem_app" || estado === "bloqueado";

  const alternar = async () => {
    if (indisponivel) return;
    setOcupado(true);
    try {
      if (ativo) {
        await desativarPush();
        await refresh();
        toast.success(tPush(lang, "pushOffToast"));
      } else {
        const r = await ativarPush();
        await refresh();
        if (r === "ativo") toast.success(tPush(lang, "pushActivatedToast"));
        else if (r === "negado") toast.info(tPush(lang, "pushDeniedToast"));
        else if (r === "ios_sem_app") toast.info(tPush(lang, "pushIosHint"));
        else toast.info(tPush(lang, "pushUnsupported"));
      }
    } finally {
      setOcupado(false);
    }
  };

  const etiquetas = {
    ativo: tPush(lang, "pushStateActive"),
    desligado: tPush(lang, "pushStateOff"),
    bloqueado: tPush(lang, "pushStateBlocked"),
    inativo: tPush(lang, "pushStateInactive"),
    sem_suporte: tPush(lang, "pushUnsupported"),
    ios_sem_app: tPush(lang, "pushStateIos"),
  };
  const etiqueta = etiquetas[estado] || etiquetas.inativo;
  const cor = ativo ? "#22C55E" : estado === "bloqueado" ? "#EF4444" : "var(--text2)";

  return (
    <div style={{
      background: "var(--surface2)", borderRadius: 14, border: "1px solid var(--hair)",
      boxShadow: "inset 0 1.5px 0 var(--edge-hi), 0 8px 24px -16px var(--shadow)", padding: 16,
    }}>
      <p style={{ color: "var(--text2)", fontSize: 12, margin: "0 0 10px", fontWeight: 600 }}>
        {tPush(lang, "pushSectionTitle")}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Bell size={18} color={cor} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
            {etiqueta}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text2)", lineHeight: 1.4 }}>
            {tPush(lang, "pushSectionDesc")}
          </p>
        </div>
        <button
          type="button"
          onClick={alternar}
          disabled={ocupado || indisponivel}
          aria-label={ativo ? tPush(lang, "pushOff") : tPush(lang, "pushOn")}
          aria-pressed={ativo}
          style={{
            width: 48, height: 28, borderRadius: 999, border: "none", flexShrink: 0,
            background: ativo ? "#F4621F" : "var(--hair)",
            opacity: indisponivel ? 0.45 : 1,
            cursor: indisponivel ? "not-allowed" : ocupado ? "wait" : "pointer",
            position: "relative", transition: "background .18s",
          }}
        >
          <span style={{
            position: "absolute", top: 3, left: ativo ? 23 : 3,
            width: 22, height: 22, borderRadius: "50%", background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,.35)", transition: "left .18s",
          }} />
        </button>
      </div>
      {estado === "bloqueado" && (
        <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>
          {tPush(lang, "pushBlockedHint")}
        </p>
      )}
      {estado === "ios_sem_app" && (
        <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>
          {tPush(lang, "pushIosHint")}
        </p>
      )}
    </div>
  );
}