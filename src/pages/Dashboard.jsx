import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Application, Job, User } from "@/api/entities";
import LoadingScreen from "@/components/LoadingScreen";
import { createPageUrl } from "@/utils";
import { getXPLevel } from "@/lib/xp";
import { TrendingUp, Briefcase, Star, Calendar as CalIcon, ArrowLeft, Users } from "lucide-react";

const OR = "#FF6600";

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const daysAgo = (n) => { const x = startOfDay(new Date()); x.setDate(x.getDate() - n); return x; };
const eur = (n) => `€${Number(n || 0).toLocaleString("pt-PT", { maximumFractionDigits: 0 })}`;

/** Data de referência de uma obra concluída. */
const jobDate = (j) => new Date(j.completed_at || j.actual_end_date || j.end_date || j.updated_at || j.created_at);

/**
 * Dashboard (#30 Profissional · #29 Employer · #44 · #11).
 *
 * Profissional: ganhos diário/semanal/mensal, volume de obras, próximas datas.
 * Employer: pedidos por estado (a lógica de "Requests" que estava por definir),
 *           gasto e volume por período.
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await User.me();
      setUser(me);

      if (me.user_type === "worker") {
        const [apps, asWorker] = await Promise.all([
          Application.filter({ worker_id: me.id }),
          Job.filter({ worker_id: me.id }),
        ]);
        setApplications(apps);
        setJobs(asWorker);
      } else {
        const mine = await Job.filter({ employer_id: me.id });
        setJobs(mine);
        const apps = await Application.filter({ employer_id: me.id });
        setApplications(apps);
      }
    } catch (e) {
      console.error("Dashboard load error:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const isWorker = user?.user_type === "worker";

  const stats = useMemo(() => {
    const done = jobs.filter(j => j.status === "completed");
    const sum = (list) => list.reduce((s, j) => s + (Number(j.price) || 0), 0);

    const today = done.filter(j => jobDate(j) >= startOfDay(new Date()));
    const week = done.filter(j => jobDate(j) >= daysAgo(7));
    const month = done.filter(j => jobDate(j) >= daysAgo(30));

    return {
      today: { total: sum(today), count: today.length },
      week: { total: sum(week), count: week.length },
      month: { total: sum(month), count: month.length },
      allTime: { total: sum(done), count: done.length },
      active: jobs.filter(j => j.status === "in_progress").length,
      awaiting: jobs.filter(j => j.status === "completed_by_employer").length,
      open: jobs.filter(j => ["open", "pending_employer"].includes(j.status)).length,
      drafts: jobs.filter(j => j.status === "draft").length,
    };
  }, [jobs]);

  // #29 — lógica de "Requests" do Employer, explicitada por estado
  const requestBuckets = useMemo(() => {
    if (isWorker) return null;
    const byStatus = (s) => applications.filter(a => a.status === s);
    return [
      { key: "pending",  label: "Por responder", desc: "Candidaturas à espera da tua decisão", items: byStatus("pending"),  color: "#F59E0B" },
      { key: "accepted", label: "Aceites",       desc: "Profissionais a trabalhar contigo",    items: byStatus("accepted"), color: "#22C55E" },
      { key: "rejected", label: "Recusadas",     desc: "Candidaturas que não seguiram",        items: byStatus("rejected"), color: "#8A909A" },
      { key: "completed",label: "Concluídas",    desc: "Obras já finalizadas e avaliadas",     items: byStatus("completed"),color: "#3B82F6" },
    ];
  }, [applications, isWorker]);

  // #200 — próximas datas de início/fim das obras
  const upcoming = useMemo(() => {
    const now = startOfDay(new Date());
    const events = [];
    jobs.forEach(j => {
      if (j.start_date && new Date(j.start_date) >= now) {
        events.push({ id: j.id + "-s", jobId: j.id, date: new Date(j.start_date), label: "Início", title: j.title, color: "#22C55E" });
      }
      if (j.end_date && new Date(j.end_date) >= now) {
        events.push({ id: j.id + "-e", jobId: j.id, date: new Date(j.end_date), label: "Fim", title: j.title, color: "#EF4444" });
      }
    });
    return events.sort((a, b) => a.date - b.date).slice(0, 8);
  }, [jobs]);

  if (loading) return <LoadingScreen />;
  if (!user) return null;

  const bg = "var(--base)", surface = "var(--surface2)", text = "var(--text)";
  const subtext = "var(--text2)", border = "var(--hair)";
  const card = { background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: 16 };
  const level = getXPLevel(user.xp || 0);

  const periodCards = [
    { label: "Hoje",           data: stats.today },
    { label: "Últimos 7 dias", data: stats.week },
    { label: "Últimos 30 dias", data: stats.month },
  ];

  return (
    <div style={{ background: bg, minHeight: "100vh", paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ background: surface, borderBottom: `1px solid ${border}`, padding: "50px 20px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate(createPageUrl("Home"))} aria-label="Voltar"
          style={{ background: "none", border: "none", color: OR, cursor: "pointer", padding: 0, display: "flex" }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 12, color: subtext }}>{isWorker ? "Profissional" : "Empregador"}</p>
          <h1 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: text }}>Dashboard</h1>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: 11, color: subtext }}>{level.emoji} {level.name}</p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: OR }}>{user.xp || 0} XP</p>
        </div>
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* #11 — ganhos / gastos por período */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <TrendingUp size={17} color={OR} />
            <span style={{ fontWeight: 800, fontSize: 15, color: text }}>
              {isWorker ? "Ganhos" : "Investimento em obras"}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {periodCards.map(p => (
              <div key={p.label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: OR }}>{eur(p.data.total)}</p>
                <p style={{ margin: "3px 0 0", fontSize: 11, color: subtext }}>{p.label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: subtext }}>
                  {p.data.count} {p.data.count === 1 ? "obra" : "obras"}
                </p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${border}`, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: subtext }}>Total acumulado</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: text }}>
              {eur(stats.allTime.total)} · {stats.allTime.count} obras
            </span>
          </div>
        </div>

        {/* Volume de obras */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Briefcase size={17} color={OR} />
            <span style={{ fontWeight: 800, fontSize: 15, color: text }}>Volume de obras</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: isWorker ? "Em curso" : "Em curso",       value: stats.active,          color: OR },
              { label: "Aguarda avaliação",                      value: stats.awaiting,        color: "#A855F7" },
              { label: isWorker ? "Candidaturas" : "Publicadas", value: isWorker ? applications.filter(a => a.status === "pending").length : stats.open, color: "#3B82F6" },
              { label: "Concluídas",                             value: stats.allTime.count,   color: "#22C55E" },
            ].map(s => (
              <div key={s.label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: text }}>{s.value}</p>
                  <p style={{ margin: 0, fontSize: 11, color: subtext }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* #29 — Requests do Employer, com a lógica explícita */}
        {!isWorker && requestBuckets && (
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Users size={17} color={OR} />
              <span style={{ fontWeight: 800, fontSize: 15, color: text }}>Requests (candidaturas)</span>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: subtext, lineHeight: 1.5 }}>
              Cada “request” é uma candidatura de um profissional a uma das tuas obras.
              Agrupadas pelo estado em que se encontram:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {requestBuckets.map(b => (
                <button key={b.key} onClick={() => navigate(createPageUrl("Applications"))}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                    background: bg, border: `1px solid ${border}`, borderRadius: 12,
                    padding: "12px 14px", cursor: "pointer", fontFamily: "inherit",
                  }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: b.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: text }}>{b.label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: subtext }}>{b.desc}</p>
                  </div>
                  <span style={{ background: b.color + "22", color: b.color, borderRadius: 20, padding: "3px 11px", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                    {b.items.length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reputação */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Star size={17} color={OR} />
            <span style={{ fontWeight: 800, fontSize: 15, color: text }}>Reputação</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Rating", value: user.rating ? `${Number(user.rating).toFixed(1)} ⭐` : "—" },
              { label: "Avaliações", value: user.total_reviews || 0 },
              { label: "XP", value: user.xp || 0 },
            ].map(s => (
              <div key={s.label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: text }}>{s.value}</p>
                <p style={{ margin: "3px 0 0", fontSize: 11, color: subtext }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* #200 — próximas datas das obras */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <CalIcon size={17} color={OR} />
            <span style={{ fontWeight: 800, fontSize: 15, color: text, flex: 1 }}>Próximas datas</span>
            <button onClick={() => navigate(createPageUrl("Calendar"))}
              style={{ background: "none", border: "none", color: OR, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Ver calendário →
            </button>
          </div>
          {upcoming.length === 0 ? (
            <p style={{ margin: 0, color: subtext, fontSize: 13 }}>Sem datas agendadas.</p>
          ) : upcoming.map(ev => (
            <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: `1px solid ${border}` }}>
              <span style={{ background: ev.color + "22", color: ev.color, borderRadius: 8, padding: "3px 9px", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {ev.label}
              </span>
              <span style={{ flex: 1, fontSize: 13, color: text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {ev.title}
              </span>
              <span style={{ fontSize: 12, color: subtext, flexShrink: 0 }}>
                {ev.date.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
