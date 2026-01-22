import React, { useState, useEffect, useCallback } from "react";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar as CalendarIcon, 
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreVertical
} from "lucide-react";
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, isSameDay, parseISO, addMonths, subMonths, eachDayOfInterval, isSameMonth, getDay } from "date-fns";
import { pt } from "date-fns/locale";

export default function Calendar() {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      return userData;
    } catch (error) {
      console.log("User not authenticated");
      return null;
    }
  }, []);

  const loadJobs = useCallback(async (currentUser) => {
    if (!currentUser) return;
    
    try {
      let jobList = [];
      
      if (currentUser.user_type === "admin") {
        jobList = await Job.list();
      } else if (currentUser.user_type === "employer") {
        jobList = await Job.filter({ employer_id: currentUser.id });
      } else if (currentUser.user_type === "worker") {
        jobList = await Job.filter({ worker_id: currentUser.id });
      }
      
      const jobsWithDates = jobList.filter(job => job.start_date);
      setJobs(jobsWithDates);
    } catch (error) {
      console.error("Error loading jobs:", error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const currentUser = await loadUser();
      if (currentUser) {
        await loadJobs(currentUser);
      }
      setLoading(false);
    };
    init();
  }, [loadUser, loadJobs]);

  const getMonthDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Add padding for the first week
    const firstDayOfWeek = getDay(start);
    const padding = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday = 0
    const paddingDays = Array(padding).fill(null);
    
    return [...paddingDays, ...days];
  };

  const getJobsForDay = (date) => {
    if (!date) return [];
    return jobs.filter(job => {
      if (!job.start_date) return false;
      try {
        return isSameDay(parseISO(job.start_date), date);
      } catch {
        return false;
      }
    });
  };

  const getSelectedDayJobs = () => {
    return getJobsForDay(selectedDate);
  };

  const getDayStyle = (date) => {
    if (!date) return {};
    const dayJobs = getJobsForDay(date);
    const isToday = isSameDay(date, new Date());
    const isSelected = isSameDay(date, selectedDate);
    const hasJobs = dayJobs.length > 0;
    const hasInProgress = dayJobs.some(j => j.status === 'in_progress');
    
    if (isSelected) return { bg: 'bg-[var(--primary)]', text: 'text-white' };
    if (isToday) return { bg: 'bg-[var(--primary)]/20', text: 'text-[var(--primary)]' };
    if (hasInProgress) return { bg: 'bg-[var(--primary)]/30', text: 'text-[var(--primary)]' };
    if (hasJobs) return { bg: 'bg-[var(--surface-secondary)]', text: 'text-[var(--text-primary)]' };
    return { bg: '', text: 'text-[var(--text-secondary)]' };
  };

  const weekDays = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mb-4" />
        <p className="text-[var(--text-secondary)]">A carregar calendário...</p>
      </div>
    );
  }

  const monthDays = getMonthDays();
  const selectedDayJobs = getSelectedDayJobs();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)] px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Calendário</h1>
          <Button size="icon" variant="ghost">
            <CalendarIcon className="w-5 h-5 text-[var(--text-secondary)]" />
          </Button>
        </div>
        
        {/* Month Navigation */}
        <div className="flex items-center justify-between mt-4">
          <Button 
            size="icon" 
            variant="ghost"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
          </Button>
          
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            {format(currentMonth, "MMMM yyyy", { locale: pt })}
          </h2>
          
          <Button 
            size="icon" 
            variant="ghost"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[var(--surface)] mx-4 mt-4 rounded-xl border border-[var(--border)] p-4">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((day, index) => (
            <div key={index} className="text-center text-xs font-medium text-[var(--text-muted)] py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dayJobs = getJobsForDay(date);
            const style = getDayStyle(date);
            const isSelected = isSameDay(date, selectedDate);
            const isCurrentMonth = isSameMonth(date, currentMonth);

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg transition-all ${style.bg} ${!isCurrentMonth ? 'opacity-30' : ''}`}
              >
                <span className={`text-sm font-medium ${style.text}`}>
                  {format(date, "d")}
                </span>
                {dayJobs.length > 0 && !isSelected && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayJobs.slice(0, 3).map((_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-[var(--primary)]" />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            Agenda do Dia
          </h3>
          <span className="text-[var(--primary)] text-sm font-medium">
            {format(selectedDate, "d MMM", { locale: pt })}
          </span>
        </div>

        {selectedDayJobs.length > 0 ? (
          <div className="space-y-4 pb-20">
            {selectedDayJobs.map(job => (
              <div 
                key={job.id} 
                className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden"
              >
                {/* Job Image */}
                {job.image_urls?.[0] && (
                  <div className="relative h-32 bg-[var(--surface-secondary)]">
                    <img 
                      src={job.image_urls[0]} 
                      alt={job.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <Badge className="bg-[var(--primary)] text-white text-xs mb-2">
                        {job.status === 'in_progress' ? 'EM OBRA' : job.status === 'open' ? 'AGENDADO' : 'CONCLUÍDO'}
                      </Badge>
                      <h4 className="text-white font-bold">{job.title}</h4>
                    </div>
                    <Button 
                      size="icon" 
                      className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-[var(--primary)]"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </Button>
                  </div>
                )}

                {/* Job Details */}
                <div className="p-4">
                  {!job.image_urls?.[0] && (
                    <>
                      <Badge className={`text-xs mb-2 ${
                        job.status === 'in_progress' ? 'bg-yellow-500' : 
                        job.status === 'open' ? 'bg-blue-500' : 'bg-green-500'
                      } text-white`}>
                        {job.status === 'in_progress' ? 'EM OBRA' : job.status === 'open' ? 'AGENDADO' : 'CONCLUÍDO'}
                      </Badge>
                      <h4 className="font-bold text-[var(--text-primary)] mb-2">{job.title}</h4>
                    </>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {job.start_date && format(parseISO(job.start_date), "HH:mm", { locale: pt })}
                        {job.end_date && ` - ${format(parseISO(job.end_date), "HH:mm", { locale: pt })}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{job.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
            <div className="w-16 h-16 hexagon bg-[var(--surface-secondary)] flex items-center justify-center mb-4">
              <CalendarIcon className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <p className="text-[var(--text-secondary)]">Sem eventos agendados</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {format(selectedDate, "d 'de' MMMM", { locale: pt })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}