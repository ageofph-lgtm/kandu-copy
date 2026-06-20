import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { createPageUrl } from "@/utils";

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://bktwvgwokrnqvkpvemfv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdHd2Z3dva3JucXZrcHZlbWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMDA4NTIsImV4cCI6MjA4NzY3Njg1Mn0.iXy-25dVVTXBQvh-EEKBhlRlE4iExXE3LyGle0quk8E";

const DEV_EMAILS = [
  "lucasfelipesantos@gmail.com",
  "urielramoss@gmail.com",
  "ageofph@gmail.com",
  "phtoledo9@gmail.com",
  "syntrophystudio@gmail.com",
  "renanvieira8523@gmail.com",
];

const SEED_PASSWORD = "Kandu2026!";

const TYPE_CONFIG = {
  worker:   { label: "Profissional", color: "#3b82f6", emoji: "👷" },
  employer: { label: "Empregador",   color: "#F4621F", emoji: "💼" },
  admin:    { label: "Admin",        color: "#8b5cf6", emoji: "🛡️" },
};

export default function DevPicker() {
  const navigate = useNavigate();
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState("all");
  const [impersonating, setImpersonating] = useState(null);
  const [error, setError]             = useState("");
  const [callerEmail, setCallerEmail] = useState("");
  const [page, setPage]               = useState(0);
  const PER_PAGE = 30;

  // Criar cliente dedicado (sem depender do supabase global)
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false }
  });

  // Verificar sessão e email do caller
  useEffect(() => {
    // Ler a sessão do localStorage directamente
    const sessionKey = Object.keys(localStorage).find(k => k.includes("supabase.auth.token") || k.includes("sb-"));
    
    // Abordagem alternativa: verificar via fetch da sessão
    db.auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email;
      if (email) setCallerEmail(email);
      // NÃO redirecionar automaticamente — mostrar o picker se o email está na lista
      // Se não está na lista, o picker vai mostrar a mensagem de acesso negado
    });
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Usar fetch directo à REST API para garantir que não há problema de sessão
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/users?select=id,email,full_name,user_type,avatar_url,rating,city,xp&order=user_type.asc,full_name.asc&limit=200`,
        {
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          }
        }
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      // Filtrar admin@kandu.pt e credenciados da lista de impersonation
      const fakes = (data || []).filter(u => 
        u.email !== "admin@kandu.pt" && !DEV_EMAILS.includes(u.email)
      );
      setUsers(fakes);
    } catch (e) {
      setError(`Erro ao carregar utilizadores: ${e.message}`);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleImpersonate = async (user) => {
    setImpersonating(user.id);
    setError("");
    try {
      const { error: signInErr } = await db.auth.signInWithPassword({
        email: user.email,
        password: SEED_PASSWORD,
      });
      if (signInErr) throw new Error(signInErr.message);
      // Dar tempo ao Supabase para persistir a sessão
      await new Promise(r => setTimeout(r, 500));
      const dest = user.user_type === "admin" ? "AdminDashboard" : "Home";
      navigate(createPageUrl(dest), { replace: true });
      // Force reload para garantir que o Layout lê a nova sessão
      setTimeout(() => window.location.href = createPageUrl(dest), 100);
    } catch (e) {
      setError(`Não foi possível entrar como ${user.full_name}: ${e.message}`);
      setImpersonating(null);
    }
  };

  const handleEnterAsAdmin = async () => {
    setImpersonating("admin");
    setError("");
    try {
      const { error: err } = await db.auth.signInWithPassword({
        email: "admin@kandu.pt",
        password: "KanduAdmin2026!",
      });
      if (err) throw err;
      await new Promise(r => setTimeout(r, 500));
      navigate(createPageUrl("AdminDashboard"), { replace: true });
      setTimeout(() => window.location.href = createPageUrl("AdminDashboard"), 100);
    } catch (e) {
      setError(`Erro ao entrar como admin: ${e.message}`);
      setImpersonating(null);
    }
  };

  const handleContinueAsOwn = () => {
    navigate(createPageUrl("Home"), { replace: true });
  };

  const applyTypeFilter = (list) => {
    if (filter === "all") return list;
    return list.filter(u => u.user_type === filter);
  };

  const filtered = applyTypeFilter(
    users.filter(u => {
      const term = search.toLowerCase();
      return (
        (u.full_name || "").toLowerCase().includes(term) ||
        (u.email || "").toLowerCase().includes(term) ||
        (u.city || "").toLowerCase().includes(term)
      );
    })
  );

  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const workersCount = users.filter(u => u.user_type === "worker").length;
  const employersCount = users.filter(u => u.user_type === "employer").length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a0f 0%, #111016 60%, #1a0a00 100%)",
      color: "#fff",
      fontFamily: "'Chakra Petch', 'Exo 2', sans-serif",
      padding: "24px 16px 80px",
    }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28 }}>🧪</span>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#F4621F" }}>
                Dev Mode — Seletor de Utilizador
              </h1>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#aaa" }}>
              Escolhe um perfil para testar ou continua com a tua conta
              {callerEmail && <span style={{ color: "#F4621F55", marginLeft: 8 }}>({callerEmail})</span>}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={handleContinueAsOwn}
              style={{
                padding: "10px 18px", borderRadius: 10, border: "2px solid #444",
                background: "transparent", color: "#fff", cursor: "pointer",
                fontFamily: "inherit", fontSize: 13, fontWeight: 600,
              }}
            >
              ✋ Continuar como eu
            </button>
            <button
              onClick={handleEnterAsAdmin}
              disabled={!!impersonating}
              style={{
                padding: "10px 18px", borderRadius: 10, border: "2px solid #8b5cf6",
                background: impersonating === "admin" ? "#8b5cf6" : "rgba(139,92,246,0.15)",
                color: "#c4b5fd", cursor: "pointer",
                fontFamily: "inherit", fontSize: 13, fontWeight: 600,
              }}
            >
              {impersonating === "admin" ? "⏳ A entrar..." : "🛡️ Entrar como Admin"}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", borderRadius: 10, padding: "10px 16px", marginBottom: 16, color: "#f87171", fontSize: 13 }}>
            ⚠️ {error}
            <button onClick={() => setError("")} style={{ marginLeft: 8, background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 13 }}>✕</button>
          </div>
        )}

        {/* Filtros */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="🔍 Pesquisar nome, email ou cidade..."
            style={{
              flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 10,
              border: "1.5px solid #333", background: "#1a1a24", color: "#fff",
              fontFamily: "inherit", fontSize: 13, outline: "none",
            }}
          />
          {[
            { key: "all", label: `Todos (${users.length})` },
            { key: "worker", label: `👷 Workers (${workersCount})` },
            { key: "employer", label: `💼 Employers (${employersCount})` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPage(0); }}
              style={{
                padding: "9px 16px", borderRadius: 10, cursor: "pointer",
                fontFamily: "inherit", fontSize: 12, fontWeight: 600,
                border: filter === f.key ? "2px solid #F4621F" : "2px solid #333",
                background: filter === f.key ? "rgba(244,98,31,0.2)" : "transparent",
                color: filter === f.key ? "#F4621F" : "#aaa",
              }}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={loadUsers}
            style={{
              padding: "9px 14px", borderRadius: 10, cursor: "pointer",
              fontFamily: "inherit", fontSize: 12, fontWeight: 600,
              border: "2px solid #333", background: "transparent", color: "#aaa",
            }}
          >
            🔄 Recarregar
          </button>
        </div>

        {/* Stats */}
        <div style={{ fontSize: 12, color: "#555", marginBottom: 12 }}>
          A mostrar {Math.min(paginated.length + page * PER_PAGE, filtered.length)} de {filtered.length} utilizadores
          {filtered.length !== users.length ? ` (filtrado de ${users.length})` : ""}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#555" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <div>A carregar utilizadores...</div>
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#555" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👻</div>
            <div>Nenhum utilizador encontrado</div>
            <div style={{ fontSize: 12, marginTop: 8, color: "#444" }}>URL: {SUPABASE_URL}</div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {paginated.map(user => {
                const cfg = TYPE_CONFIG[user.user_type] || TYPE_CONFIG.worker;
                const isLoading = impersonating === user.id;
                return (
                  <div
                    key={user.id}
                    onClick={() => !impersonating && handleImpersonate(user)}
                    style={{
                      background: isLoading ? `${cfg.color}22` : "rgba(255,255,255,0.04)",
                      border: `1.5px solid ${isLoading ? cfg.color : "#2a2a3a"}`,
                      borderRadius: 14, padding: "14px 16px",
                      cursor: impersonating ? "not-allowed" : "pointer",
                      transition: "all 0.15s ease",
                      opacity: impersonating && !isLoading ? 0.5 : 1,
                      position: "relative", overflow: "hidden",
                    }}
                    onMouseEnter={e => { if (!impersonating) { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.background = `${cfg.color}11`; } }}
                    onMouseLeave={e => { if (!impersonating) { e.currentTarget.style.borderColor = "#2a2a3a"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; } }}
                  >
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: cfg.color, borderRadius: "14px 14px 0 0" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                        background: `linear-gradient(135deg, ${cfg.color}44, ${cfg.color}22)`,
                        border: `2px solid ${cfg.color}66`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: 18, color: cfg.color,
                        overflow: "hidden",
                      }}>
                        {user.avatar_url
                          ? <img src={user.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                          : (user.full_name?.charAt(0) || "?").toUpperCase()
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {isLoading ? "⏳ A entrar..." : user.full_name || user.email}
                        </div>
                        <div style={{ fontSize: 11, color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                      <span style={{
                        background: `${cfg.color}22`, color: cfg.color,
                        borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600
                      }}>
                        {cfg.emoji} {cfg.label}
                      </span>
                      <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#555" }}>
                        {user.rating > 0 && <span>⭐ {user.rating?.toFixed(1)}</span>}
                        {user.city && <span>📍 {user.city}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 20 }}>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #333", background: "transparent", color: page === 0 ? "#444" : "#fff", cursor: page === 0 ? "default" : "pointer", fontFamily: "inherit" }}>
                  ← Anterior
                </button>
                <span style={{ padding: "8px 16px", color: "#aaa", fontSize: 13 }}>
                  {page + 1} / {totalPages}
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #333", background: "transparent", color: page === totalPages - 1 ? "#444" : "#fff", cursor: page === totalPages - 1 ? "default" : "pointer", fontFamily: "inherit" }}>
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}