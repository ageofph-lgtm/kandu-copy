import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/api/supabaseClient";
import { useTheme } from "@/lib/ThemeContext";
import { Search, SlidersHorizontal, X, Star, ChevronDown, ChevronUp } from "lucide-react";

const SKILLS = ["Alvenaria","Canalização","Carpintaria","Construção Civil","Electricidade","HVAC","Impermeabilização","Isolamentos","Jardinagem","Ladrilhador","Logística","Mecânica","Pavimentos","Pintura","Soldadura","Telhados"];
const CITIES = ["Lisboa","Porto","Braga","Aveiro","Coimbra","Faro","Funchal","Cascais","Almada","Amadora","Loures","Odivelas","Santarém","Setúbal","Guimarães","Évora","Leiria"];
const LEVELS = ["Iniciante","Intermédio","Avançado","Mestre"];

const DEFAULT_FILTERS = {
  search: "",
  skills: [],
  city: "",
  minRating: 0,
  minXp: 0,
  minExperience: 0,
  level: "",
  verified: false,
  sortBy: "rating",
};

function FilterChip({ label, active, onClick, color = "#F4621F" }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${active ? color : "#333"}`,
      background: active ? color : "transparent", color: active ? "#fff" : "#aaa",
      fontSize: 13, fontWeight: active ? 700 : 400, cursor: "pointer",
      transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0,
    }}>{label}</button>
  );
}

function WorkerCard({ worker, navigate }) {
  const initials = (worker.full_name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const typeColor = "#F4621F";
  const xpLevel = worker.xp >= 5000 ? "Mestre" : worker.xp >= 2000 ? "Avançado" : worker.xp >= 500 ? "Intermédio" : "Iniciante";
  const levelColor = { Mestre: "#F59E0B", Avançado: "#8B5CF6", Intermédio: "#3B82F6", Iniciante: "#6B7280" }[xpLevel];

  return (
    <div
      onClick={() => navigate(`${createPageUrl("Profile")}?userId=${worker.id}`)}
      style={{
        background: "#1C1B22", borderRadius: 18, padding: 16, cursor: "pointer",
        border: "1px solid #2a2836", transition: "all 0.18s",
        display: "flex", flexDirection: "column", gap: 12,
        width: "100%", boxSizing: "border-box", overflow: "hidden",
      }}
      onMouseEnter={e => { e.currentTarget.style.border = "1px solid #F4621F66"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.border = "1px solid #2a2836"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* Topo: avatar + nome + badges */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 54, height: 54, borderRadius: "50%", flexShrink: 0,
          background: typeColor + "33", border: `2.5px solid ${typeColor}55`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, fontWeight: 900, color: typeColor, overflow: "hidden",
        }}>
          {worker.avatar_url
            ? <img src={worker.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            : initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
              {worker.full_name || "Profissional"}
            </span>
            {worker.verified && <span style={{ fontSize: 11, background: "#22c55e22", color: "#22c55e", padding: "1px 7px", borderRadius: 10, fontWeight: 700 }}>✓ Verificado</span>}
          </div>
          {worker.city && <p style={{ margin: "3px 0 0", fontSize: 12, color: "#888" }}>📍 {worker.city}</p>}
        </div>
        {/* Rating destaque */}
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#F59E0B" }}>
            {worker.rating ? Number(worker.rating).toFixed(1) : "—"}
          </div>
          <div style={{ fontSize: 10, color: "#888" }}>⭐ rating</div>
        </div>
      </div>

      {/* Skills */}
      {worker.skills?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {worker.skills.slice(0, 4).map((s, i) => (
            <span key={i} style={{ background: "#F4621F18", color: "#F4621F", padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{s}</span>
          ))}
          {worker.skills.length > 4 && <span style={{ color: "#666", fontSize: 12, padding: "3px 6px" }}>+{worker.skills.length - 4}</span>}
        </div>
      )}

      {/* Stats: XP, experiência, trabalhos */}
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { label: "XP", value: (worker.xp || 0).toLocaleString(), color: levelColor },
          { label: "Experiência", value: worker.experience_years ? `${worker.experience_years}a` : "—" },
          { label: "Trabalhos", value: worker.completed_jobs || 0 },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: "#111016", borderRadius: 10, padding: "7px 6px", textAlign: "center"
          }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: s.color || "#fff" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
        <div style={{ flex: 1, background: "#111016", borderRadius: 10, padding: "7px 6px", textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: levelColor }}>{xpLevel}</div>
          <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>Nível</div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#F4621F", fontWeight: 600, textAlign: "right" }}>
        Ver perfil completo →
      </div>
    </div>
  );
}

export default function Workers() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const PER_PAGE = 20;

  const fetchWorkers = useCallback(async (f = filters, p = 0) => {
    setLoading(true);
    try {
      let q = supabase
        .from("users")
        .select("*", { count: "exact" })
        .eq("user_type", "worker");

      // Filtros textuais
      if (f.search.trim()) {
        q = q.or(`full_name.ilike.%${f.search.trim()}%,bio.ilike.%${f.search.trim()}%`);
      }
      if (f.city) q = q.eq("city", f.city);
      if (f.level) {
        const xpMap = { Iniciante: [0, 499], Intermédio: [500, 1999], Avançado: [2000, 4999], Mestre: [5000, 999999] };
        const [min, max] = xpMap[f.level];
        q = q.gte("xp", min).lte("xp", max);
      }
      if (f.minRating > 0) q = q.gte("rating", f.minRating);
      if (f.minXp > 0) q = q.gte("xp", f.minXp);
      if (f.minExperience > 0) q = q.gte("experience_years", f.minExperience);
      if (f.verified) q = q.eq("verified", true);

      // Sort
      const sorts = {
        rating: { col: "rating", asc: false },
        xp: { col: "xp", asc: false },
        experience: { col: "experience_years", asc: false },
        jobs: { col: "completed_jobs", asc: false },
        name: { col: "full_name", asc: true },
        recent: { col: "created_at", asc: false },
      };
      const s = sorts[f.sortBy] || sorts.rating;
      q = q.order(s.col, { ascending: s.asc, nullsFirst: false });

      q = q.range(p * PER_PAGE, (p + 1) * PER_PAGE - 1);

      const { data, count, error } = await q;
      if (error) throw error;

      // Filtro de skills no cliente (arrays não têm suporte directo simples no PostgREST)
      let result = data || [];
      if (f.skills.length > 0) {
        result = result.filter(w => f.skills.every(sk => w.skills?.includes(sk)));
      }

      if (p === 0) setWorkers(result);
      else setWorkers(prev => [...prev, ...result]);
      setTotal(count || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(0);
    fetchWorkers(filters, 0);
  }, [filters]);

  const setFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));
  const toggleSkill = (skill) => setFilters(prev => ({
    ...prev,
    skills: prev.skills.includes(skill) ? prev.skills.filter(s => s !== skill) : [...prev.skills, skill]
  }));
  const resetFilters = () => setFilters(DEFAULT_FILTERS);
  const hasActiveFilters = filters.skills.length > 0 || filters.city || filters.minRating > 0 || filters.minXp > 0 || filters.minExperience > 0 || filters.level || filters.verified || filters.search;

  const bg = "#111016";
  const surface = "#1C1B22";
  const border = "#2a2836";
  const text = "#fff";
  const subtext = "#888";

  return (
    <div style={{ minHeight: "100vh", background: bg, paddingBottom: 80, overflowX: "hidden", width: "100%", boxSizing: "border-box" }}>

      {/* Header */}
      <div style={{ background: surface, padding: "50px 16px 16px", borderBottom: `1px solid ${border}`, width: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "#F4621F", fontSize: 22, cursor: "pointer", padding: 0 }}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: text }}>🔍 Encontrar Profissionais</h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: subtext }}>
              {loading ? "A carregar..." : `${total} profissionais disponíveis`}
            </p>
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            style={{
              padding: "9px 14px", borderRadius: 12, cursor: "pointer",
              background: hasActiveFilters ? "#F4621F" : surface,
              border: `1.5px solid ${hasActiveFilters ? "#F4621F" : border}`,
              color: hasActiveFilters ? "#fff" : subtext,
              display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 13,
            }}
          >
            <SlidersHorizontal size={16} />
            Filtros
            {hasActiveFilters && <span style={{ background: "#fff", color: "#F4621F", borderRadius: 10, fontSize: 11, fontWeight: 800, padding: "1px 6px" }}>
              {[filters.skills.length > 0, filters.city, filters.minRating > 0, filters.minXp > 0, filters.minExperience > 0, filters.level, filters.verified].filter(Boolean).length}
            </span>}
          </button>
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
          <input
            value={filters.search}
            onChange={e => setFilter("search", e.target.value)}
            placeholder="Pesquisar por nome, bio, especialidade..."
            style={{
              width: "100%", padding: "12px 12px 12px 40px", borderRadius: 12,
              background: "#111016", border: `1.5px solid ${border}`, color: text,
              fontSize: 14, outline: "none", boxSizing: "border-box",
            }}
          />
          {filters.search && (
            <button onClick={() => setFilter("search", "")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#555" }}>
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Painel de filtros expandível */}
      {showFilters && (
        <div style={{ background: "#161520", borderBottom: `1px solid ${border}`, padding: "16px 20px" }}>

          {/* Sort */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: subtext, fontSize: 12, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>Ordenar por</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { val: "rating", label: "⭐ Rating" },
                { val: "xp", label: "🔥 XP" },
                { val: "experience", label: "🏆 Experiência" },
                { val: "jobs", label: "💼 Trabalhos" },
                { val: "name", label: "🔤 Nome" },
                { val: "recent", label: "🆕 Recente" },
              ].map(opt => (
                <FilterChip key={opt.val} label={opt.label} active={filters.sortBy === opt.val} onClick={() => setFilter("sortBy", opt.val)} color="#3B82F6" />
              ))}
            </div>
          </div>

          {/* Skills */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: subtext, fontSize: 12, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Competências {filters.skills.length > 0 && `(${filters.skills.length} selecionadas)`}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SKILLS.map(s => (
                <FilterChip key={s} label={s} active={filters.skills.includes(s)} onClick={() => toggleSkill(s)} />
              ))}
            </div>
          </div>

          {/* Cidade */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: subtext, fontSize: 12, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>Cidade</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <FilterChip label="Todas" active={!filters.city} onClick={() => setFilter("city", "")} color="#6B7280" />
              {CITIES.map(c => (
                <FilterChip key={c} label={c} active={filters.city === c} onClick={() => setFilter("city", c === filters.city ? "" : c)} />
              ))}
            </div>
          </div>

          {/* Nível XP */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: subtext, fontSize: 12, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>Nível</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <FilterChip label="Todos" active={!filters.level} onClick={() => setFilter("level", "")} color="#6B7280" />
              {LEVELS.map(l => (
                <FilterChip key={l} label={l} active={filters.level === l} onClick={() => setFilter("level", l === filters.level ? "" : l)} />
              ))}
            </div>
          </div>

          {/* Rating mínimo */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: subtext, fontSize: 12, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Rating mínimo: {filters.minRating > 0 ? `${filters.minRating}⭐` : "Qualquer"}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {[0, 3, 3.5, 4, 4.5].map(r => (
                <FilterChip key={r} label={r === 0 ? "Qualquer" : `${r}+`} active={filters.minRating === r} onClick={() => setFilter("minRating", r)} color="#F59E0B" />
              ))}
            </div>
          </div>

          {/* Experiência mínima */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: subtext, fontSize: 12, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Experiência mínima: {filters.minExperience > 0 ? `${filters.minExperience} anos` : "Qualquer"}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {[0, 1, 2, 5, 10].map(y => (
                <FilterChip key={y} label={y === 0 ? "Qualquer" : `${y}+ anos`} active={filters.minExperience === y} onClick={() => setFilter("minExperience", y)} color="#8B5CF6" />
              ))}
            </div>
          </div>

          {/* Verificado */}
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setFilter("verified", !filters.verified)}
              style={{
                padding: "8px 16px", borderRadius: 12, cursor: "pointer",
                background: filters.verified ? "#22c55e" : surface,
                border: `1.5px solid ${filters.verified ? "#22c55e" : border}`,
                color: filters.verified ? "#fff" : subtext, fontWeight: 600, fontSize: 13,
              }}
            >
              ✓ Apenas verificados
            </button>
          </div>

          {/* Reset */}
          {hasActiveFilters && (
            <button onClick={resetFilters} style={{
              width: "100%", padding: "11px", borderRadius: 12, border: "1px solid #444",
              background: "transparent", color: "#EF4444", fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>
              🗑️ Limpar todos os filtros
            </button>
          )}
        </div>
      )}

      {/* Active filter pills (sempre visíveis) */}
      {hasActiveFilters && !showFilters && (
        <div style={{ padding: "10px 16px", display: "flex", gap: 6, flexWrap: "wrap", background: "#161520", borderBottom: `1px solid ${border}` }}>
          {filters.skills.map(s => (
            <span key={s} onClick={() => toggleSkill(s)} style={{ background: "#F4621F22", color: "#F4621F", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
              {s} <X size={11} />
            </span>
          ))}
          {filters.city && <span onClick={() => setFilter("city", "")} style={{ background: "#F4621F22", color: "#F4621F", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>📍 {filters.city} <X size={11} /></span>}
          {filters.minRating > 0 && <span onClick={() => setFilter("minRating", 0)} style={{ background: "#F59E0B22", color: "#F59E0B", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>⭐ {filters.minRating}+ <X size={11} /></span>}
          {filters.level && <span onClick={() => setFilter("level", "")} style={{ background: "#8B5CF622", color: "#8B5CF6", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>{filters.level} <X size={11} /></span>}
          {filters.verified && <span onClick={() => setFilter("verified", false)} style={{ background: "#22c55e22", color: "#22c55e", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>✓ Verificado <X size={11} /></span>}
        </div>
      )}

      {/* Lista de workers */}
      <div style={{ padding: "16px 16px 0", width: "100%", boxSizing: "border-box" }}>
        {loading && page === 0 ? (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <div style={{ width: 40, height: 40, border: "3px solid #F4621F", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: subtext, fontSize: 14 }}>A carregar profissionais...</p>
          </div>
        ) : workers.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ color: text, fontWeight: 700, fontSize: 16 }}>Nenhum resultado</p>
            <p style={{ color: subtext, fontSize: 14, marginTop: 6 }}>Tenta ajustar os filtros</p>
            <button onClick={resetFilters} style={{ marginTop: 16, padding: "10px 24px", background: "#F4621F", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
              Limpar filtros
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {workers.map(w => <WorkerCard key={w.id} worker={w} navigate={navigate} />)}

            {/* Load more */}
            {workers.length < total && (
              <button
                onClick={() => { const next = page + 1; setPage(next); fetchWorkers(filters, next); }}
                disabled={loading}
                style={{
                  width: "100%", padding: "14px", borderRadius: 14, marginTop: 8, marginBottom: 16,
                  border: "1.5px solid #333", background: "transparent", color: "#F4621F",
                  fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}
              >
                {loading ? "A carregar..." : `Ver mais (${total - workers.length} restantes)`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
