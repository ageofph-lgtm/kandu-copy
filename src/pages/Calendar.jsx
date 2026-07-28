import { useState, useEffect, useCallback } from "react";
import { Job, User } from "@/api/entities";
import { useTheme } from "@/lib/ThemeContext";
import { useLanguage, getDateLocale } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";


import { format, addDays, startOfWeek, isSameDay, parseISO, addWeeks, subWeeks, isWithinInterval, startOfDay, endOfDay } from "date-fns";

export default function Calendar() {
  const { isDark } = useTheme();
  const { lang } = useLanguage();
  const dateLocale = getDateLocale(lang);
  const bg = "var(--base)";
  const surface = "var(--surface2)";
  const text = "var(--text)";
  const subtext = "var(--text2)";
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [view, setView] = useState("week");

  const loadUser = useCallback(async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.log("User not authenticated");
    }
  }, []);

  const loadJobs = useCallback(async () => {
    if (!user) return; 
    
    try {
      let jobList = [];
      
      // Admin vê todas as obras, empregador as suas, e trabalhador as suas
      if (user?.user_type === "admin") {
        jobList = await Job.list();
      } else if (user?.user_type === "employer") {
        jobList = await Job.filter({ employer_id: user.id });
      } else if (user?.user_type === "worker") {
        jobList = await Job.filter({ worker_id: user.id });
      }
      
      // #200 — obras com qualquer data definida (início e/ou fim) entram no calendário
      setJobs(jobList.filter(job => job.start_date || job.end_date));
    } catch (error) {
      console.error("Error loading jobs:", error);
    }
  }, [user]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const getWeekDays = () => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    return days;
  };

  // #200 — a obra ocupa TODOS os dias entre início e fim, não só o dia de início.
  const parse = (value) => {
    if (!value) return null;
    try { return parseISO(String(value).slice(0, 10)); } catch { return null; }
  };

  const getJobsForDay = (date) => {
    return jobs.filter(job => {
      const start = parse(job.start_date);
      const end = parse(job.end_date);
      if (!start && !end) return false;
      if (start && end) {
        try {
          return isWithinInterval(date, { start: startOfDay(start), end: endOfDay(end) });
        } catch {
          return isSameDay(start, date);
        }
      }
      return isSameDay(start || end, date);
    });
  };

  /** Etiqueta do dia para uma obra: início, fim, ambos ou em curso. */
  const dayRole = (job, date) => {
    const start = parse(job.start_date);
    const end = parse(job.end_date);
    const isStart = start && isSameDay(start, date);
    const isEnd = end && isSameDay(end, date);
    if (isStart && isEnd) return { label: "Início e fim", color: "#A855F7" };
    if (isStart) return { label: "Início", color: "#22C55E" };
    if (isEnd) return { label: "Fim", color: "#EF4444" };
    return { label: "Em curso", color: "#FF6600" };
  };

  const formatPrice = (price, type) => {
    if (type === "hourly") {
      return `€${price}/h`;
    }
    return `€${price}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open": return "bg-blue-500";
      case "in_progress": return "bg-yellow-500";
      case "completed": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const [selectedDay, setSelectedDay] = useState(new Date());
  const weekDays = getWeekDays();
  const selectedDayJobs = getJobsForDay(selectedDay);

  return (
    <div style={{background:bg,minHeight:"100vh",paddingBottom:80}}>

      {/* Top Bar */}
      <div style={{padding:"50px 20px 12px"}}>
        <h1 style={{fontWeight:800,fontSize:22,color:text,margin:0}}>{t(lang,"calendar")}</h1>
        <p style={{color:subtext,fontSize:14,margin:"4px 0 0"}}>{format(currentWeek, "MMMM yyyy", {locale:dateLocale})}</p>
      </div>

      {/* Week Nav */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",marginBottom:12}}>
        <button onClick={() => setCurrentWeek(subWeeks(currentWeek,1))} style={{background:surface,border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#FF6600",fontSize:18}}>‹</button>
        <span style={{color:subtext,fontSize:13}}>{format(weekDays[0],"d MMM",{locale:dateLocale})} — {format(weekDays[6],"d MMM",{locale:dateLocale})}</span>
        <button onClick={() => setCurrentWeek(addWeeks(currentWeek,1))} style={{background:surface,border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#FF6600",fontSize:18}}>›</button>
      </div>

      {/* Week Days Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,padding:"0 12px",marginBottom:20}}>
        {weekDays.map((day, idx) => {
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDay);
          const hasDots = getJobsForDay(day).length > 0;
          return (
            <div key={idx} onClick={() => setSelectedDay(day)} style={{display:"flex",flexDirection:"column",alignItems:"center",cursor:"pointer",gap:4}}>
              <span style={{fontSize:11,color:subtext,fontWeight:600}}>{format(day,"EEE",{locale:dateLocale}).toUpperCase()}</span>
              <div style={{width:34,height:34,borderRadius:"50%",background:isToday||isSelected?"#FF6600":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:isToday||isSelected?700:400,color:isToday||isSelected?"#FFF":text,fontSize:14}}>
                {format(day,"d")}
              </div>
              {hasDots && <div style={{width:6,height:6,borderRadius:"50%",background:"#FF6600"}} />}
              {!hasDots && <div style={{width:6,height:6}} />}
            </div>
          );
        })}
      </div>

      {/* Events for selected day */}
      <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:10}}>
        <p style={{fontWeight:700,fontSize:15,color:text,marginBottom:4}}>
          {format(selectedDay,"EEEE, d MMMM",{locale:dateLocale})}
        </p>
        {selectedDayJobs.length === 0 ? (
          <div style={{textAlign:"center",paddingTop:40}}>
            <div style={{fontSize:48,marginBottom:12}}>📅</div>
            <p style={{color:subtext}}>{t(lang,"noEventsForDay","Sem eventos para este dia")}</p>
          </div>
        ) : selectedDayJobs.map(job => {
          const role = dayRole(job, selectedDay);
          const start = parse(job.start_date);
          const end = parse(job.end_date);
          return (
            <div key={job.id} style={{background:surface,borderRadius:14,padding:14,borderLeft:`4px solid ${role.color}`,display:"flex",gap:12,alignItems:"flex-start"}}>
              <span style={{fontSize:24}}>{job.status==="in_progress"?"🏗️":"📅"}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <p style={{fontWeight:700,color:text,margin:0,fontSize:15}}>{job.title}</p>
                  <span style={{background:role.color+"22",color:role.color,borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:700,flexShrink:0}}>
                    {role.label}
                  </span>
                </div>
                <p style={{color:subtext,fontSize:13,margin:0}}>{job.location} · €{job.price}{job.price_type==="hourly"?"/h":""}</p>
                <p style={{color:subtext,fontSize:12,margin:"4px 0 0"}}>
                  {start ? format(start,"dd/MM/yyyy",{locale:dateLocale}) : "—"}
                  {end ? ` → ${format(end,"dd/MM/yyyy",{locale:dateLocale})}` : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,padding:"20px 20px 0"}}>
        <div style={{background:surface,borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
          <p style={{fontWeight:800,fontSize:18,color:"#FF6600",margin:0}}>{jobs.filter(j=>j.status==="open").length}</p>
          <p style={{color:subtext,fontSize:11,margin:0}}>{t(lang,"statsOpen","Abertas")}</p>
        </div>
        <div style={{background:surface,borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
          <p style={{fontWeight:800,fontSize:18,color:"#FF6600",margin:0}}>{jobs.filter(j=>j.status==="in_progress").length}</p>
          <p style={{color:subtext,fontSize:11,margin:0}}>{t(lang,"statsInProgress","Em Curso")}</p>
        </div>
        <div style={{background:surface,borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
          <p style={{fontWeight:800,fontSize:18,color:"#22C55E",margin:0}}>{jobs.filter(j=>j.status==="completed").length}</p>
          <p style={{color:subtext,fontSize:11,margin:0}}>{t(lang,"statsCompleted","Concluídas")}</p>
        </div>
      </div>
    </div>
  );
}