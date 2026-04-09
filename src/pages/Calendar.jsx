import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar as CalendarIcon, 
  Clock,
  MapPin,
  Euro,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, parseISO, addWeeks, subWeeks } from "date-fns";
import { pt } from "date-fns/locale";

export default function Calendar() {
  const { isDark } = useTheme();
  const bg = isDark ? "#1A1A1A" : "#FFFFFF";
  const surface = isDark ? "#2A2A2A" : "#F5F5F5";
  const text = isDark ? "#FFFFFF" : "#1A1A1A";
  const subtext = isDark ? "#AAAAAA" : "#666666";
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
      
      const jobsWithDates = jobList.filter(job => job.start_date);
      setJobs(jobsWithDates);
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

  const getJobsForDay = (date) => {
    return jobs.filter(job => {
      if (!job.start_date) return false;
      try {
        return isSameDay(parseISO(job.start_date), date);
      } catch {
        return false;
      }
    });
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
        <h1 style={{fontWeight:800,fontSize:22,color:text,margin:0}}>Calendário</h1>
        <p style={{color:subtext,fontSize:14,margin:"4px 0 0"}}>{format(currentWeek, "MMMM yyyy", {locale:pt})}</p>
      </div>

      {/* Week Nav */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",marginBottom:12}}>
        <button onClick={() => setCurrentWeek(subWeeks(currentWeek,1))} style={{background:surface,border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#FF6600",fontSize:18}}>‹</button>
        <span style={{color:subtext,fontSize:13}}>{format(weekDays[0],"d MMM",{locale:pt})} — {format(weekDays[6],"d MMM",{locale:pt})}</span>
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
              <span style={{fontSize:11,color:subtext,fontWeight:600}}>{format(day,"EEE",{locale:pt}).toUpperCase()}</span>
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
          {format(selectedDay,"EEEE, d MMMM",{locale:pt})}
        </p>
        {selectedDayJobs.length === 0 ? (
          <div style={{textAlign:"center",paddingTop:40}}>
            <div style={{fontSize:48,marginBottom:12}}>📅</div>
            <p style={{color:subtext}}>Sem eventos para este dia</p>
          </div>
        ) : selectedDayJobs.map(job => (
          <div key={job.id} style={{background:surface,borderRadius:14,padding:14,borderLeft:"4px solid #FF6600",display:"flex",gap:12,alignItems:"flex-start"}}>
            <span style={{fontSize:24}}>{job.status==="in_progress"?"🏗️":"📅"}</span>
            <div style={{flex:1}}>
              <p style={{fontWeight:700,color:text,margin:"0 0 4px",fontSize:15}}>{job.title}</p>
              <p style={{color:subtext,fontSize:13,margin:0}}>{job.location} · €{job.price}{job.price_type==="hourly"?"/h":""}</p>
              <p style={{color:"#AAAAAA",fontSize:12,margin:"4px 0 0"}}>{format(parseISO(job.start_date),"dd/MM/yyyy",{locale:pt})}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,padding:"20px 20px 0"}}>
        <div style={{background:surface,borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
          <p style={{fontWeight:800,fontSize:18,color:"#FF6600",margin:0}}>{jobs.filter(j=>j.status==="open").length}</p>
          <p style={{color:subtext,fontSize:11,margin:0}}>Abertas</p>
        </div>
        <div style={{background:surface,borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
          <p style={{fontWeight:800,fontSize:18,color:"#FF6600",margin:0}}>{jobs.filter(j=>j.status==="in_progress").length}</p>
          <p style={{color:subtext,fontSize:11,margin:0}}>Em Curso</p>
        </div>
        <div style={{background:surface,borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
          <p style={{fontWeight:800,fontSize:18,color:"#22C55E",margin:0}}>{jobs.filter(j=>j.status==="completed").length}</p>
          <p style={{color:subtext,fontSize:11,margin:0}}>Concluídas</p>
        </div>
      </div>
    </div>
  );
}