import { useState, useEffect } from "react";

/**
 * OfflineBanner (#70/#71) — banner vermelho quando offline, confirmação
 * verde (2.5s) quando a ligação é restaurada. Montado globalmente.
 */
export default function OfflineBanner() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [justRestored, setJustRestored] = useState(false);

  useEffect(() => {
    const goOffline = () => { setOnline(false); setJustRestored(false); };
    const goOnline = () => {
      setOnline(true);
      setJustRestored(true);
      setTimeout(() => setJustRestored(false), 2500);
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (online && !justRestored) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 10000,
        textAlign: "center",
        padding: "8px 12px",
        fontSize: 13,
        fontWeight: 700,
        color: "#FFF",
        background: online ? "#16A34A" : "#DC2626",
        boxShadow: "0 2px 8px rgba(0,0,0,.25)",
      }}
    >
      {online ? "✅ Ligação restaurada" : "🔌 Sem ligação — algumas funções podem estar indisponíveis"}
    </div>
  );
}