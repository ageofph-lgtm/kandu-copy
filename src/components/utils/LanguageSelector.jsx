import { useLanguage, SUPPORTED_LANGUAGES } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";
import { toast } from "sonner";

export default function LanguageSelector({ onSelect, compact = false }) {
  const { lang, setLang } = useLanguage();

  const handleSelect = (code) => {
    setLang(code);
    toast.success(t(code, "languageSaved"));
    if (onSelect) onSelect(code);
  };

  if (compact) {
    // Versão compacta para o Profile
    return (
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {SUPPORTED_LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => handleSelect(l.code)}
            style={{
              display:"flex", alignItems:"center", gap:6,
              padding:"7px 14px", borderRadius:50,
              border: lang === l.code ? "2px solid #F4621F" : "1.5px solid #333",
              background: lang === l.code ? "rgba(244,98,31,0.12)" : "transparent",
              color: lang === l.code ? "#F4621F" : "#aaa",
              fontWeight: lang === l.code ? 700 : 400,
              fontSize:13, cursor:"pointer", fontFamily:"inherit",
              transition:"all 0.18s",
            }}
          >
            <span style={{fontSize:16}}>{l.flag}</span>
            {l.label}
          </button>
        ))}
      </div>
    );
  }

  // Versão full — ecrã de entrada
  return (
    <div style={{
      minHeight:"100vh", background:"#111016",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"40px 24px", textAlign:"center",
    }}>
      {/* Logo */}
      <div style={{
        width:72, height:72, borderRadius:"50%",
        background:"#F4621F", display:"flex",
        alignItems:"center", justifyContent:"center",
        fontSize:32, fontWeight:900, color:"#fff",
        marginBottom:28,
        boxShadow:"0 0 32px rgba(244,98,31,0.4)",
      }}>K</div>

      <h1 style={{fontSize:28, fontWeight:800, color:"#fff", marginBottom:8}}>
        {t(lang, "chooseLanguage")}
      </h1>
      <p style={{fontSize:14, color:"#666", marginBottom:40, maxWidth:300}}>
        {t(lang, "languageSubtitle")}
      </p>

      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(2, 1fr)",
        gap:10, width:"100%", maxWidth:360,
      }}>
        {SUPPORTED_LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => handleSelect(l.code)}
            style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"14px 16px", borderRadius:14,
              border: lang === l.code ? "2px solid #F4621F" : "1px solid #222",
              background: lang === l.code ? "rgba(244,98,31,0.12)" : "#1a1a1a",
              color: lang === l.code ? "#F4621F" : "#ccc",
              fontWeight: lang === l.code ? 700 : 400,
              fontSize:14, cursor:"pointer", textAlign:"left",
              fontFamily:"inherit", transition:"all 0.18s",
            }}
          >
            <span style={{fontSize:22, flexShrink:0}}>{l.flag}</span>
            <div>
              <div style={{fontWeight:700, fontSize:14, lineHeight:1.2}}>{l.label}</div>
              <div style={{fontSize:11, color:"#555", marginTop:2}}>{l.code}</div>
            </div>
            {lang === l.code && (
              <span style={{marginLeft:"auto", color:"#F4621F", fontSize:18}}>✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
