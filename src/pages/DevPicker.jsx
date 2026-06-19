import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { createPageUrl } from "@/utils";

const DEV_EMAILS = [
  "lucasfelipesantos@gmail.com",
  "urielramoss@gmail.com",
  "ageofph@gmail.com",
];

const SEED_PASSWORD = "Kandu2026!";

const TYPE_CONFIG = {
  worker:   { label: "Profissional", color: "#3b82f6", emoji: "👷" },
  employer: { label: "Empregador",   color: "#F4621F", emoji: "💼" },
  admin:    { label: "Admin",        color: "#8b5cf6", emoji: "🛡️" },
};

export default function DevPicker() {
  const navigate = useNavigate();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("all");   // all | worker | employer
  const [impersonating, setImpersonating] = useState(null);
  const [error, setError]       = useState("");
  const [page, setPage]         = useState(0);
  const PER_PAGE = 30;

  // Garantir que só emails credenciados acedem
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email;
      if (!email || !DEV_EMAILS.includes(email)) {
        navigate(createPageUrl("Home"), { replace: true });
      }
    });
  }, [navigate]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("users")
      .select("id,email,full_name,user_type,avatar_url,rating,city,xp")
      .neq("email", "admin@kandu.pt")
      .order("user_type", { ascending: true })
      .order("full_name", { ascending: true });

    if (filter !== "all") q = q.eq("user_type", filter);

    const { data, error: err } = await q;
    if (err) { setError(err.message); setLoading(false); return; }
    setUsers(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleImpersonate = async (user) => {
    setImpersonating(user.id);
    setError("");
    try {
      // Fazer sign-in com a password seed do utilizador fake
      const email = user.email;
      const password = SEED_PASSWORD;
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) throw new Error(signInErr.message);
      // Redirecionar conforme tipo
      const dest = user.user_type === "admin" ? "AdminDashboard" : "Home";
      navigate(createPageUrl(dest), { replace: true });
    } catch (e) {
      setError(`Não foi possível entrar como ${user.full_name}: ${e.message}`);
      setImpersonating(null);
    }
  };

  const handleEnterAsAdmin = async () => {
    setImpersonating("admin");
    setError("");
    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: "admin@kandu.pt",
        password: "KanduAdmin2026!",
      });
      if (err) throw err;
      navigate(createPageUrl("AdminDashboard"), { replace: true });
    } catch (e) {
      setError(`Erro ao entrar como admin: ${e.message}`);
      setImpersonating(null);
    }
  };

  const handleContinueAsOwn = () => {
    navigate(createPageUrl("Home"), { replace: true });
  };

  const filtered = users.filter(u => {
    const term = search.toLowerCase();
    return (
      (u.full_name || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term) ||
      (u.city || "").toLowerCase().includes(term)
    );
  });

  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a0f 0%, #111016 60%, #1a0a00 100%)",
      color: "#fff",
      fontFamily: "'Chakra Petch', sans-serif",
      padding: "24px 16px",
    }}>
      {/* Header */}
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
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
            </p>
          </div>
          {/* Acções rápidas */}
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
          {["all", "worker", "employer"].map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(0); }}
              style={{
                padding: "9px 16px", borderRadius: 10, cursor: "pointer",
                fontFamily: "inherit", fontSize: 12, fontWeight: 600,
                border: filter === f ? "2px solid #F4621F" : "2px solid #333",
                background: filter === f ? "rgba(244,98,31,0.2)" : "transparent",
                color: filter === f ? "#F4621F" : "#aaa",
              }}
            >
              {f === "all" ? `Todos (${users.length})` : f === "worker" ? `👷 Workers (${users.filter(u => u.user_type==="worker").length})` : `💼 Employers (${users.filter(u => u.user_type==="employer").length})`}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
          A mostrar {paginated.length} de {filtered.length} utilizadores
          {filtered.length !== users.length ? ` (filtrado de ${users.length})` : ""}
        </div>

        {/* Grid de users */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#555" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <div>A carregar utilizadores...</div>
          </div>
        ) : (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 12,
            }}>
              {paginated.map(user => {
                const cfg = TYPE_CONFIG[user.user_type] || TYPE_CONFIG.worker;
                const isLoading = impersonating === user.id;
                return (
                  <div
                    key={user.id}
                    onClick={() => !impersonating && handleImpersonate(user)}
                    style={{
                      background: isLoading ? `rgba(${cfg.color === "#3b82f6" ? "59,130,246" : "244,98,31"},0.25)` : "rgba(255,255,255,0.04)",
                      border: `1.5px solid ${isLoading ? cfg.color : "#2a2a3a"}`,
                      borderRadius: 14,
                      padding: "14px 16px",
                      cursor: impersonating ? "not-allowed" : "pointer",
                      transition: "all 0.15s ease",
                      opacity: impersonating && !isLoading ? 0.5 : 1,
                      position: "relative",
                      overflow: "hidden",
                    }}
                    onMouseEnter={e => { if (!impersonating) e.currentTarget.style.borderColor = cfg.color; }}
                    onMouseLeave={e => { if (!impersonating) e.currentTarget.style.borderColor = "#2a2a3a"; }}
                  >
                    {/* Accent bar */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: cfg.color, borderRadius: "14px 14px 0 0" }} />

                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                      {/* Avatar */}
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%",
                        background: `linear-gradient(135deg, ${cfg.color}44, ${cfg.color}22)`,
                        border: `2px solid ${cfg.color}66`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 20, flexShrink: 0, overflow: "hidden",
                      }}>
                        {user.avatar_url
                          ? <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                          : cfg.emoji}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {isLoading ? "⏳ A entrar..." : (user.full_name || user.email)}
                        </div>
                        <div style={{ fontSize: 11, color: "#666", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {user.email}
                        </div>
                      </div>
                    </div>

                    {/* Meta */}
                    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "3px 8px",
                        borderRadius: 20, background: `${cfg.color}22`, color: cfg.color,
                        border: `1px solid ${cfg.color}44`,
                      }}>
                        {cfg.label}
                      </span>
                      {user.city && (
                        <span style={{ fontSize: 10, color: "#777", padding: "3px 8px", borderRadius: 20, background: "#1a1a24", border: "1px solid #333" }}>
                          📍 {user.city}
                        </span>
                      )}
                      {user.rating > 0 && (
                        <span style={{ fontSize: 10, color: "#facc15", padding: "3px 8px", borderRadius: 20, background: "#1a1a10", border: "1px solid #444" }}>
                          ⭐ {Number(user.rating).toFixed(1)}
                        </span>
                      )}
                      {user.xp > 0 && (
                        <span style={{ fontSize: 10, color: "#60a5fa", padding: "3px 8px", borderRadius: 20, background: "#0a1020", border: "1px solid #1e3a5f" }}>
                          XP {user.xp}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #333", background: "#1a1a24", color: page === 0 ? "#444" : "#fff", cursor: page === 0 ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                >← Anterior</button>
                <span style={{ padding: "8px 16px", color: "#666", fontSize: 13 }}>
                  {page + 1} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #333", background: "#1a1a24", color: page >= totalPages - 1 ? "#444" : "#fff", cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                >Próximo →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
