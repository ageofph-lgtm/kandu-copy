import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export const SUPPORTED_LANGUAGES = [
  { code: "PT", label: "Português", flag: "🇵🇹", dir: "ltr", font: null },
  { code: "EN", label: "English",   flag: "🇬🇧", dir: "ltr", font: null },
  { code: "ES", label: "Español",   flag: "🇪🇸", dir: "ltr", font: null },
  { code: "FR", label: "Français",  flag: "🇫🇷", dir: "ltr", font: null },
  { code: "DE", label: "Deutsch",   flag: "🇩🇪", dir: "ltr", font: null },
  { code: "HI", label: "हिन्दी",      flag: "🇮🇳", dir: "ltr", font: "Noto Sans Devanagari" },
  { code: "UR", label: "اردو",       flag: "🇵🇰", dir: "rtl", font: "Noto Nastaliq Urdu" },
  { code: "BN", label: "বাংলা",      flag: "🇧🇩", dir: "ltr", font: "Noto Sans Bengali" },
  { code: "NE", label: "नेपाली",     flag: "🇳🇵", dir: "ltr", font: "Noto Sans Devanagari" },
  { code: "ZH", label: "中文",       flag: "🇨🇳", dir: "ltr", font: "Noto Sans SC" },
];

// Cache de traduções para não repetir chamadas
const translationCache = new Map();

// Tradução via MyMemory API (gratuito, sem chave, 1000 req/dia)
// Para produção substituir por DeepL ou Google Translate
export async function translateText(text, targetLang, sourceLang = "PT") {
  if (!text || !text.trim()) return text;
  if (sourceLang === targetLang) return text;

  const cacheKey = `${sourceLang}|${targetLang}|${text}`;
  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey);

  // Mapeamento de códigos internos → ISO 639-1 que a API aceita
  const langMap = {
    PT: "pt", EN: "en", ES: "es", FR: "fr", DE: "de",
    HI: "hi", UR: "ur", BN: "bn", NE: "ne", ZH: "zh",
  };

  const from = langMap[sourceLang] || "pt";
  const to   = langMap[targetLang] || "en";

  try {
    const encoded = encodeURIComponent(text.substring(0, 500)); // limite da API
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${from}|${to}`;
    const res = await fetch(url);
    const data = await res.json();
    const translated = data?.responseData?.translatedText || text;
    translationCache.set(cacheKey, translated);
    return translated;
  } catch {
    return text; // fallback: mostrar original
  }
}

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem("kandu_lang") || "PT";
  });

  const setLang = useCallback((code) => {
    const upper = code.toUpperCase();
    localStorage.setItem("kandu_lang", upper);
    setLangState(upper);

    // Aplicar dir (RTL/LTR) no documento
    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === upper);
    document.documentElement.dir = langInfo?.dir || "ltr";
  }, []);

  useEffect(() => {
    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === lang);
    document.documentElement.dir = langInfo?.dir || "ltr";
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, translateText, SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
