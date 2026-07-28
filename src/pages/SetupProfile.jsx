import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/api/supabaseClient";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { withTimeout, errorMessage } from "@/lib/net";
import {
  isValidNIF, isValidCompanyNIF, isValidPhonePT, normalizePhonePT, isCorporateEmail,
} from "@/lib/validation";

const OR = "#F4621F";

const PROFILES = [
  { type: "worker",   emoji: "⛑️", title: "Profissional", desc: "Candidate-se a obras e mostre as suas habilidades" },
  { type: "employer", emoji: "💼", title: "Empregador",   desc: "Publique trabalhos e encontre profissionais qualificados" },
];

// ── estilos partilhados ──────────────────────────────────────────────────────
const page = {
  minHeight: "100vh",
  background: "radial-gradient(900px 500px at 15% -8%, rgba(255,106,0,.13), transparent 55%), #0B0C0E",
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  padding: "40px 20px", fontFamily: "'Chakra Petch', sans-serif",
};
const field = (invalid) => ({
  width: "100%", padding: "12px 14px", borderRadius: 10,
  border: `1.5px solid ${invalid ? "#ef4444" : "#333"}`,
  background: "#1a1a24", color: "#fff", fontFamily: "inherit", fontSize: 14,
  outline: "none", boxSizing: "border-box",
});
const label = { display: "block", color: "#8A909A", fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.6 };
const errText = { color: "#f87171", fontSize: 12, margin: "5px 0 0" };

function Field({ id, title, hint, error, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label htmlFor={id} style={label}>{title}</label>
      {children}
      {error
        ? <p style={errText}>⚠️ {error}</p>
        : hint ? <p style={{ color: "#555", fontSize: 11, margin: "5px 0 0" }}>{hint}</p> : null}
    </div>
  );
}

export default function SetupProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);          // 1 = escolher tipo · 2 = dados da conta
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    full_name: "", phone: "", nif: "",
    employer_type: "simple", company: "", city: "",
    gdpr: false,
  });
  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => (p[k] ? { ...p, [k]: undefined } : p));
  };

  const selectedType = PROFILES[activeIndex].type;
  const isEmployer = selectedType === "employer";
  const isCia = isEmployer && form.employer_type === "cia";

  useEffect(() => {
    let alive = true;

    const hydrate = async (authUser) => {
      if (!alive) return;
      const { data: profile } = await supabase
        .from("users").select("user_type, full_name, phone, nif, city")
        .eq("id", authUser.id).maybeSingle();
      if (!alive) return;
      if (profile?.user_type) { navigate(createPageUrl("Home")); return; }
      setUser(authUser);
      setForm(p => ({
        ...p,
        full_name: profile?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || "",
        phone: profile?.phone || "",
        nif: profile?.nif || "",
        city: profile?.city || "",
      }));
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session?.user) { setUser(null); setLoading(false); return; }
      hydrate(session.user);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { if (alive) setLoading(false); return; }
      hydrate(session.user);
    });

    return () => { alive = false; subscription.unsubscribe(); };
  }, [navigate]);

  // ── validação client-side (#19 — não depender do `required` do HTML) ──
  const validate = useCallback(() => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Indica o teu nome completo.";
    else if (form.full_name.trim().length < 3) e.full_name = "Nome demasiado curto.";

    // Telemóvel obrigatório: é o que desbloqueia o estado "Verified" (#3)
    if (!form.phone.trim()) e.phone = "O número de telemóvel é obrigatório.";
    else if (!isValidPhonePT(form.phone)) e.phone = "Número inválido. Ex: 912 345 678";

    // NIF obrigatório no signup (#17)
    if (!form.nif.trim()) e.nif = "O NIF é obrigatório.";
    else if (isCia) {
      if (!isValidCompanyNIF(form.nif)) e.nif = "NIF de empresa inválido (deve começar por 5, 6 ou 9).";
    } else if (!isValidNIF(form.nif)) {
      e.nif = "NIF inválido — verifica os 9 dígitos.";
    }

    if (isEmployer && !form.employer_type) e.employer_type = "Escolhe o tipo de empregador.";
    if (isCia && !form.company.trim()) e.company = "Indica o nome da empresa.";

    // Cia Employer não pode usar email pessoal (#18)
    if (isCia && user?.email && !isCorporateEmail(user.email)) {
      e.company = "Contas Cia Employer exigem email de domínio próprio da empresa (não @gmail, @hotmail, …). Faz login com o email corporativo.";
    }

    // RGPD não pode ser contornado (#87)
    if (!form.gdpr) e.gdpr = "Tens de aceitar os Termos e a Política de Privacidade (RGPD).";

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form, isEmployer, isCia, user]);

  const handleConfirm = async () => {
    if (!user) { navigate(createPageUrl("Login")); return; }
    if (!validate()) { setError("Corrige os campos assinalados para continuar."); return; }

    setSaving(true);
    setError("");
    try {
      const now = new Date().toISOString();
      const payload = {
        id: user.id,
        email: user.email,
        full_name: form.full_name.trim(),
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        user_type: selectedType,
        phone: normalizePhonePT(form.phone),
        nif: form.nif.replace(/\s/g, ""),
        city: form.city || null,
        status: "active",
        verification_level: "basic",
        gdpr_accepted_at: now,
        updated_at: now,
        ...(isEmployer ? { employer_type: form.employer_type, company: form.company.trim() || null } : {}),
      };

      // FIX #1001: a chamada podia nunca resolver e o botão ficava preso em
      // "Processing" para sempre. Agora tem timeout e o erro é mostrado.
      const { error: upsertErr } = await withTimeout(
        supabase.from("users").upsert(payload, { onConflict: "id" }),
        15000
      );
      if (upsertErr) throw upsertErr;

      navigate(createPageUrl("Home"), { replace: true });
    } catch (e) {
      console.error("SetupProfile error:", e);
      setError(errorMessage(e, "Não foi possível criar a conta. Tenta novamente."));
    } finally {
      // FIX #1001: garantido em todos os caminhos — nunca fica em loading.
      setSaving(false);
    }
  };

  // ── estados de carregamento / sem sessão ──
  if (loading) {
    return (
      <div style={{ ...page, justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#FFF" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
          <p style={{ color: "#AAA" }}>A verificar sessão...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={page}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <h2 style={{ color: "#FFF", fontWeight: 800, marginBottom: 8 }}>Sessão não encontrada</h2>
        <p style={{ color: "#AAA", marginBottom: 24 }}>Faz login para continuar</p>
        <button onClick={() => navigate(createPageUrl("Login"))}
          style={{ padding: "14px 40px", background: OR, border: "none", borderRadius: 13, color: "#FFF", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
          Ir para Login
        </button>
      </div>
    );
  }

  // ── PASSO 1 — escolher tipo de perfil ──
  if (step === 1) {
    return (
      <div style={page}>
        <img
          src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/90321a683_Gemini_Generated_Image_k4rh2gk4rh2gk4rh.png"
          style={{ height: 56, objectFit: "contain", marginBottom: 28 }} alt="KANDU"
        />
        <h2 style={{ color: "#FFF", fontWeight: 800, fontSize: 22, marginBottom: 6, textAlign: "center" }}>
          Como vais usar o KANDU?
        </h2>
        <p style={{ color: "#888", fontSize: 13, marginBottom: 32, textAlign: "center" }}>{user.email}</p>

        <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
          {PROFILES.map((p, idx) => (
            <div key={p.type} onClick={() => setActiveIndex(idx)}
              style={{
                background: activeIndex === idx ? "#1f1d2b" : "#161520",
                border: `2px solid ${activeIndex === idx ? OR : "#2a2836"}`,
                borderRadius: 16, padding: "20px 22px", display: "flex", alignItems: "center", gap: 18,
                cursor: "pointer", transition: "all 0.15s",
                boxShadow: activeIndex === idx ? "0 0 20px rgba(244,98,31,0.15)" : "none",
              }}>
              <span style={{ fontSize: 40 }}>{p.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 17, color: "#FFF", marginBottom: 4 }}>{p.title}</div>
                <div style={{ fontSize: 13, color: "#888" }}>{p.desc}</div>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                border: `2px solid ${activeIndex === idx ? OR : "#444"}`,
                background: activeIndex === idx ? OR : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {activeIndex === idx && <span style={{ color: "#FFF", fontSize: 12, fontWeight: 900 }}>✓</span>}
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => { setError(""); setStep(2); }}
          style={{
            width: "100%", maxWidth: 420, padding: 16, background: OR, border: "none",
            borderRadius: 14, color: "#FFF", fontWeight: 700, fontSize: 17, cursor: "pointer",
            boxShadow: "0 4px 20px rgba(244,98,31,0.3)",
          }}>
          Continuar como {PROFILES[activeIndex].title} →
        </button>
      </div>
    );
  }

  // ── PASSO 2 — dados da conta (página dedicada por tipo, #1002) ──
  return (
    <div style={{ ...page, justifyContent: "flex-start", paddingTop: 48 }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <button onClick={() => { setStep(1); setError(""); }}
          style={{ background: "none", border: "none", color: OR, fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 16, fontFamily: "inherit" }}>
          ← Voltar
        </button>

        <h2 style={{ color: "#FFF", fontWeight: 800, fontSize: 22, margin: "0 0 6px" }}>
          {isEmployer ? "💼 Criar conta de Empregador" : "⛑️ Criar conta de Profissional"}
        </h2>
        <p style={{ color: "#888", fontSize: 13, margin: "0 0 24px" }}>
          {isEmployer
            ? "Estes dados são usados para validar a empresa e publicar anúncios."
            : "Estes dados são usados para te verificar e mostrar aos empregadores."}
        </p>

        {error && (
          <div style={{ color: "#f87171", fontSize: 13, marginBottom: 16, padding: "10px 14px", background: "rgba(239,68,68,0.1)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)" }}>
            ⚠️ {error}
          </div>
        )}

        {isEmployer && (
          <Field id="employer_type" title="Tipo de empregador *" error={errors.employer_type}>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { value: "simple", label: "Simple Employer", desc: "Cliente particular" },
                { value: "cia",    label: "Cia Employer",    desc: "Empresa registada" },
              ].map(opt => (
                <button key={opt.value} type="button" onClick={() => set("employer_type", opt.value)}
                  style={{
                    flex: 1, textAlign: "left", padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                    border: `2px solid ${form.employer_type === opt.value ? OR : "#2a2836"}`,
                    background: form.employer_type === opt.value ? "#1f1d2b" : "#161520",
                    fontFamily: "inherit",
                  }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#FFF" }}>{opt.label}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#888" }}>{opt.desc}</p>
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field id="full_name" title={isCia ? "Nome do responsável *" : "Nome completo *"} error={errors.full_name}>
          <input id="full_name" style={field(errors.full_name)} value={form.full_name}
            onChange={e => set("full_name", e.target.value)} placeholder="Ex: Maria Silva" />
        </Field>

        {isCia && (
          <Field id="company" title="Nome da empresa *" error={errors.company}
            hint="Deve corresponder ao registo comercial (Empresa Online).">
            <input id="company" style={field(errors.company)} value={form.company}
              onChange={e => set("company", e.target.value)} placeholder="Ex: Construções Silva, Lda." />
          </Field>
        )}

        <Field id="nif" title={isCia ? "NIF da empresa *" : "NIF *"} error={errors.nif}
          hint="9 dígitos — validado com dígito de controlo.">
          <input id="nif" inputMode="numeric" maxLength={11} style={field(errors.nif)} value={form.nif}
            onChange={e => set("nif", e.target.value.replace(/[^\d\s]/g, ""))} placeholder="123 456 789" />
        </Field>

        <Field id="phone" title="Telemóvel *" error={errors.phone}
          hint="Confirma-o depois no perfil para ficares Verificado ✅">
          <input id="phone" inputMode="tel" style={field(errors.phone)} value={form.phone}
            onChange={e => set("phone", e.target.value)} placeholder="912 345 678" />
        </Field>

        {/* RGPD — bloqueia a criação da conta (#87) */}
        <label htmlFor="gdpr" style={{
          display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer",
          background: "#161520", border: `1.5px solid ${errors.gdpr ? "#ef4444" : "#2a2836"}`,
          borderRadius: 12, padding: "12px 14px", margin: "6px 0 4px",
        }}>
          <input id="gdpr" type="checkbox" checked={form.gdpr}
            onChange={e => set("gdpr", e.target.checked)}
            style={{ width: 18, height: 18, accentColor: OR, marginTop: 1, flexShrink: 0 }} />
          <span style={{ color: "#CCC", fontSize: 12, lineHeight: 1.5 }}>
            Li e aceito os <strong style={{ color: OR }}>Termos de Utilização</strong> e a{" "}
            <strong style={{ color: OR }}>Política de Privacidade (RGPD)</strong>. Autorizo o tratamento
            dos meus dados para efeitos de intermediação de trabalho.
          </span>
        </label>
        {errors.gdpr && <p style={errText}>⚠️ {errors.gdpr}</p>}

        <button onClick={handleConfirm} disabled={saving}
          style={{
            width: "100%", marginTop: 18, padding: 16,
            background: saving ? "#555" : OR, border: "none", borderRadius: 14,
            color: "#FFF", fontWeight: 700, fontSize: 17,
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: saving ? "none" : "0 4px 20px rgba(244,98,31,0.3)",
          }}>
          {saving ? "⏳ A criar conta..." : "Criar conta ✓"}
        </button>

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
