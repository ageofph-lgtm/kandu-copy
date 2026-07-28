import { useEffect, useRef } from "react";
import { supabase } from "@/api/supabaseClient";

/**
 * Session timeout por inatividade (#85).
 *
 * Valor a afinar com a equipa — 30 min é o default acordado no relatório de QA.
 * Conta-se o tempo desde a última interação real do utilizador; o timestamp
 * vive em localStorage para sobreviver a refreshes e separadores.
 */
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const STORAGE_KEY = "kandu_last_activity";
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll", "visibilitychange"];

export function useSessionTimeout(enabled, onTimeout, timeoutMs = SESSION_TIMEOUT_MS) {
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    if (!enabled) return;

    const touch = () => localStorage.setItem(STORAGE_KEY, String(Date.now()));
    touch();

    const check = async () => {
      const last = Number(localStorage.getItem(STORAGE_KEY) || Date.now());
      if (Date.now() - last < timeoutMs) return;
      localStorage.removeItem(STORAGE_KEY);
      try { await supabase.auth.signOut(); } catch { /* sessão já expirada */ }
      onTimeoutRef.current?.();
    };

    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, touch, { passive: true }));
    const id = setInterval(check, 60000);

    return () => {
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, touch));
      clearInterval(id);
    };
  }, [enabled, timeoutMs]);
}
