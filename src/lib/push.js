import { supabase } from "@/api/supabaseClient";

/** Chave pública VAPID (pode estar no código — a privada fica no servidor). */
export const VAPID_PUBLIC_KEY =
  "BGFRWPAluf5PnLdWDBoPez-hC5Kuunau7QU9hJUkB5rLcXPRE4-9XV-0XvI2ltIS5Ym2mILTLaMSTTj6SmScaXc";

const OFF_KEY = "kandu_push_off";
const SYNC_KEY = "kandu_push_synced";

/** base64url → Uint8Array (applicationServerKey) */
function base64UrlToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function etiquetaDispositivo() {
  const ua = navigator.userAgent;
  const so = /Android/i.test(ua) ? "Android" : ehIOS() ? "iOS"
    : /Windows/i.test(ua) ? "Windows" : /Mac/i.test(ua) ? "macOS"
    : /Linux/i.test(ua) ? "Linux" : "Outro";
  const browser =
    /Edg\//.test(ua) ? "Edge"
    : /OPR\//.test(ua) ? "Opera"
    : /Chrome\//.test(ua) ? "Chrome"
    : /Firefox\//.test(ua) ? "Firefox"
    : /Safari\//.test(ua) ? "Safari"
    : "Browser";
  return `${so} · ${browser}`;
}

export function suportaPush() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function ehIOS() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function appInstalada() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    navigator.standalone === true
  );
}

export function pushDesligado() {
  return localStorage.getItem(OFF_KEY) === "1";
}

/** Espera pelo service worker ativo, no máximo 5 s. */
async function swPronto(timeoutMs = 5000) {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("service worker timeout")), timeoutMs)
    ),
  ]);
}

async function registarNoServidor(sub) {
  const json = sub.toJSON();
  const { error } = await supabase.rpc("register_push_subscription", {
    p_endpoint: sub.endpoint,
    p_p256dh: json.keys?.p256dh,
    p_auth: json.keys?.auth,
    p_device: etiquetaDispositivo(),
  });
  if (error) throw error;
}

/**
 * Pede permissão (só a partir de um toque do utilizador) e regista o aparelho.
 * Devolve 'ativo' | 'negado' | 'sem_suporte' | 'ios_sem_app'.
 */
export async function ativarPush() {
  if (ehIOS() && !appInstalada() && !suportaPush()) return "ios_sem_app";
  if (!suportaPush()) return "sem_suporte";

  let permissao = Notification.permission;
  if (permissao === "default") permissao = await Notification.requestPermission();
  if (permissao !== "granted") return "negado";

  try {
    const reg = await swPronto();
    const existente = await reg.pushManager.getSubscription();
    const sub =
      existente ||
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToUint8Array(VAPID_PUBLIC_KEY),
      }));
    await registarNoServidor(sub);
    localStorage.removeItem(OFF_KEY);
    sessionStorage.setItem(SYNC_KEY, "1");
    return "ativo";
  } catch (e) {
    console.error("Push subscribe error:", e);
    return "sem_suporte";
  }
}

let tentouSync = false;

/**
 * Sem perguntar nada: se a permissão já está dada, garante a subscrição e
 * volta a ligar o aparelho à conta em uso (uma vez por sessão).
 */
export async function sincronizarPush() {
  if (tentouSync) return;
  tentouSync = true;
  if (!suportaPush() || pushDesligado()) return;
  if (Notification.permission !== "granted") return;
  if (sessionStorage.getItem(SYNC_KEY) === "1") return;

  try {
    const reg = await swPronto();
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    await registarNoServidor(sub);
    sessionStorage.setItem(SYNC_KEY, "1");
  } catch (e) {
    console.error("Push sync error:", e);
  }
}

/** Desliga neste aparelho: avisa o servidor e cancela a subscrição. */
export async function desativarPush() {
  localStorage.setItem(OFF_KEY, "1");
  sessionStorage.removeItem(SYNC_KEY);
  if (!suportaPush()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await supabase.rpc("unregister_push_subscription", { p_endpoint: sub.endpoint });
    await sub.unsubscribe();
  } catch (e) {
    console.error("Push unsubscribe error:", e);
  }
}

/**
 * Estado atual: 'ativo' | 'inativo' | 'desligado' | 'bloqueado'
 *              | 'sem_suporte' | 'ios_sem_app'
 */
export async function estadoPush() {
  if (!suportaPush()) {
    return ehIOS() && !appInstalada() ? "ios_sem_app" : "sem_suporte";
  }
  if (Notification.permission === "denied") return "bloqueado";
  if (pushDesligado()) return "desligado";
  try {
    const reg = await swPronto();
    const sub = await reg.pushManager.getSubscription();
    if (Notification.permission === "granted" && sub) return "ativo";
  } catch {
    /* sem service worker ativo */
  }
  return "inativo";
}