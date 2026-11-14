/**
 * Textos das notificações push. Ficam num módulo próprio porque o ficheiro
 * geral de traduções já está no limite de tamanho.
 * PT e EN escritos à mão; os restantes idiomas caem no EN.
 */

const PT = {
  pushInviteText: "Ativa as notificações para saberes logo de obras novas para ti, respostas às tuas candidaturas e mensagens — mesmo com o app fechado.",
  pushActivate: "Ativar",
  pushNotNow: "Agora não",
  pushIosHint: "No iPhone, adiciona o KANDU ao ecrã principal (Partilhar → Adicionar ao ecrã principal) para receberes notificações.",
  pushActivatedToast: "Notificações ativadas ✓",
  pushDeniedToast: "Permissão recusada. Podes ativá-la nas definições do browser.",
  pushUnsupported: "Este dispositivo não suporta notificações push.",
  pushSectionTitle: "Notificações no telemóvel",
  pushSectionDesc: "Obras novas, candidaturas e mensagens — mesmo com o app fechado.",
  pushOn: "Ligar",
  pushOff: "Desligar",
  pushOffToast: "Notificações desligadas neste aparelho.",
  pushStateActive: "Ativas",
  pushStateOff: "Desligadas",
  pushStateInactive: "Desativadas",
  pushStateBlocked: "Bloqueadas no browser",
  pushStateIos: "Adiciona o app ao ecrã principal",
  pushBlockedHint: "Desbloqueia as notificações nas definições do site, no browser (ícone do cadeado junto ao endereço → Notificações → Permitir).",
  jobUnavailable: "Esta obra já não está disponível.",
};

const EN = {
  pushInviteText: "Turn on notifications so you hear about new jobs for you, replies to your applications and messages — even with the app closed.",
  pushActivate: "Turn on",
  pushNotNow: "Not now",
  pushIosHint: "On iPhone, add KANDU to your Home Screen (Share → Add to Home Screen) to receive notifications.",
  pushActivatedToast: "Notifications turned on ✓",
  pushDeniedToast: "Permission denied. You can turn it on in your browser settings.",
  pushUnsupported: "This device does not support push notifications.",
  pushSectionTitle: "Phone notifications",
  pushSectionDesc: "New jobs, applications and messages — even with the app closed.",
  pushOn: "Turn on",
  pushOff: "Turn off",
  pushOffToast: "Notifications turned off on this device.",
  pushStateActive: "On",
  pushStateOff: "Off",
  pushStateInactive: "Not enabled",
  pushStateBlocked: "Blocked in the browser",
  pushStateIos: "Add the app to your Home Screen",
  pushBlockedHint: "Unblock notifications in your browser's site settings (padlock icon next to the address → Notifications → Allow).",
  jobUnavailable: "This job is no longer available.",
};

const TEXTOS = { PT, EN };

export function tPush(lang, key) {
  return TEXTOS[lang]?.[key] ?? EN[key] ?? key;
}