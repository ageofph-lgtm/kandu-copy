const PT = {
  versaoNovaTitulo: "Há uma versão nova do KANDU",
  versaoNovaSub: "Termina o que estás a fazer e atualiza — a página recarrega.",
  versaoAtualizar: "Atualizar agora",
  versaoAtualizando: "A atualizar…",
  versaoNovaPrefixo: "● Versão nova — ",
};

const EN = {
  versaoNovaTitulo: "There's a new version of KANDU",
  versaoNovaSub: "Finish what you're doing and update — the page will reload.",
  versaoAtualizar: "Update now",
  versaoAtualizando: "Updating…",
  versaoNovaPrefixo: "● New version — ",
};

const TEXTOS = { PT, EN };

export function tVersao(lang, key) {
  return TEXTOS[lang]?.[key] ?? EN[key] ?? key;
}