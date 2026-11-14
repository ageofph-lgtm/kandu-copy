/**
 * Aviso de versão nova: compara o ficheiro que está aberto com o que está
 * publicado. Não faz chamadas à API — só lê o /index.html público.
 */

const CHAVE_AUTO = "kandu:atualizacao-automatica";
const INTERVALO = 2 * 60 * 1000;   // verifica de 2 em 2 minutos
const MINIMO_ENTRE = 30 * 1000;    // no máximo uma verificação a cada 30 s
const JANELA_AUTO = 10 * 60 * 1000; // atualização sozinha: 1x por versão / 10 min

/** Pathname do <script type="module" src="/assets/..."> da página aberta. */
export function entradaDoDocumento() {
  const script = document.querySelector('script[type="module"][src*="/assets/"]');
  if (!script) return null;
  try {
    return new URL(script.getAttribute("src"), window.location.origin).pathname;
  } catch {
    return null;
  }
}

/** Pathname da entrada publicada agora (lida do /index.html, sem cache). */
export async function consultarPublicada() {
  const res = await fetch("/index.html?_v=" + Date.now(), { cache: "no-store" });
  if (!res.ok) return null;
  const html = await res.text();
  const m =
    html.match(/<script[^>]+type=["']module["'][^>]+src=["']([^"']*\/assets\/[^"']+)["']/i) ||
    html.match(/<script[^>]+src=["']([^"']*\/assets\/[^"']+\.js)["']/i);
  if (!m) return null;
  try {
    return new URL(m[1], window.location.origin).pathname;
  } catch {
    return null;
  }
}

function lerMarca() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_AUTO) || "null");
  } catch {
    return null;
  }
}

function gravarMarca(alvo) {
  try {
    localStorage.setItem(CHAVE_AUTO, JSON.stringify({ alvo, quando: Date.now() }));
  } catch {
    /* sem storage — segue sem marca */
  }
}

let aRecarregar = false;

/** Recarrega uma única vez, com o service worker atualizado e o _v novo. */
export function aplicar() {
  if (aRecarregar) return;
  aRecarregar = true;

  (async () => {
    try {
      const reg = await Promise.race([
        navigator.serviceWorker?.getRegistration?.(),
        new Promise((r) => setTimeout(() => r(null), 2000)),
      ]);
      if (reg?.update) {
        await Promise.race([reg.update(), new Promise((r) => setTimeout(r, 2000))]);
      }
    } catch {
      /* segue para o reload mesmo assim */
    }

    const params = new URLSearchParams(window.location.search);
    params.set("_v", String(Date.now()));
    window.location.replace(
      window.location.pathname + "?" + params.toString() + window.location.hash
    );
  })();
}

/**
 * Vigia a versão publicada. Chama `aoDetetar(publicada)` quando há versão
 * nova e não é caso de atualizar sozinho. Devolve a função para parar.
 */
export function vigiarVersao(aoDetetar) {
  let interagiu = false;
  let ultimaVerificacao = 0;
  let parado = false;

  const marcarInteragiu = () => {
    interagiu = true;
    window.removeEventListener("pointerdown", marcarInteragiu);
    window.removeEventListener("keydown", marcarInteragiu);
  };
  window.addEventListener("pointerdown", marcarInteragiu, { passive: true });
  window.addEventListener("keydown", marcarInteragiu);

  const verificar = async (arranque = false) => {
    if (parado) return;
    if (!arranque && document.visibilityState !== "visible") return;
    const agora = Date.now();
    if (!arranque && agora - ultimaVerificacao < MINIMO_ENTRE) return;
    ultimaVerificacao = agora;

    const atual = entradaDoDocumento();
    if (!atual) return;

    // Já estamos na versão para onde atualizámos sozinhos → limpa a marca
    const marca = lerMarca();
    if (marca?.alvo === atual) {
      try { localStorage.removeItem(CHAVE_AUTO); } catch { /* ignora */ }
      return;
    }

    let publicada = null;
    try {
      publicada = await consultarPublicada();
    } catch {
      return; // erro de rede: ignora
    }
    if (!publicada || publicada === atual) return;

    const recente = marca?.alvo === publicada && Date.now() - (marca?.quando || 0) < JANELA_AUTO;
    const podeSozinho = (arranque || !interagiu) && !recente;

    if (podeSozinho) {
      gravarMarca(publicada);
      aplicar();
      return;
    }
    aoDetetar(publicada);
  };

  verificar(true);

  const id = setInterval(() => verificar(false), INTERVALO);
  const aoVoltar = () => {
    if (document.visibilityState === "visible") verificar(false);
  };
  document.addEventListener("visibilitychange", aoVoltar);
  window.addEventListener("focus", () => verificar(false));
  window.addEventListener("online", () => verificar(false));

  return () => {
    parado = true;
    clearInterval(id);
    document.removeEventListener("visibilitychange", aoVoltar);
    window.removeEventListener("pointerdown", marcarInteragiu);
    window.removeEventListener("keydown", marcarInteragiu);
  };
}