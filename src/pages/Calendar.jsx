import React, { useState, useEffect, useCallback } from "react";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, Clock, MapPin, MoreVertical } from "lucide-react";
import { format, startOfMonth, endOfMonth, isSameDay, parseISO, addMonths, subMonths, eachDayOfInterval, isSameMonth, getDay } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export default function Calendar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);
      
      let jobList = [];
      if (userData.user_type === "admin") {
        jobList = await Job.list();
      } else if (userData.user_type === "employer") {
        jobList = await Job.filter({ employer_id: userData.id });
      } else if (userData.user_type === "worker") {
        jobList = await Job.filter({ worker_id: userData.id });
      }
      
      setJobs(jobList.filter(job => job.start_date));
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getMonthDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    const firstDayOfWeek = getDay(start);
    const padding = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
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

  const getDayStyle = (date) => {
    if (!date) return { wrapper: '', text: 'text-transparent' };
    const dayJobs = getJobsForDay(date);
    const isToday = isSameDay(date, new Date());
    const isSelected = isSameDay(date, selectedDate);
    const hasJobs = dayJobs.length > 0;
    const hasInProgress = dayJobs.some(j => j.status === 'in_progress');
    
    if (isSelected) return { wrapper: 'hexagon bg-[var(--primary)]', text: 'text-gray-900 font-bold' };
    if (hasInProgress) return { wrapper: 'hexagon bg-[var(--primary)]/30', text: 'text-[var(--primary)] font-bold' };
    if (hasJobs) return { wrapper: 'hexagon bg-[var(--surface)]', text: 'text-[var(--text-primary)]' };
    if (isToday) return { wrapper: '', text: 'text-[var(--primary)] font-bold' };
    return { wrapper: '', text: 'text-[var(--text-secondary)]' };
  };

  const weekDays = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
  const selectedDayJobs = getJobsForDay(selectedDate);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mb-4" />
        <p className="text-[var(--text-secondary)]">A carregar calendário...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-[var(--surface)] shadow-sm flex items-center justify-center">
          <span className="material-icons-round text-[var(--text-secondary)]">menu</span>
        </button>
        <h1 className="text-lg font-bold text-[var(--text-primary)]">Work Calendar</h1>
        <button className="w-10 h-10 rounded-full bg-[var(--surface)] shadow-sm flex items-center justify-center relative">
          <span className="material-icons-round text-[var(--text-secondary)]">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--primary)] rounded-full" />
        </button>
      </header>

      {/* Month Navigation */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="w-10 h-10 rounded-full bg-[var(--surface)] shadow-sm flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
          
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {format(currentMonth, "MMMM yyyy", { locale: pt })}
          </h2>
          
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="w-10 h-10 rounded-full bg-[var(--surface)] shadow-sm flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="px-6 mb-6">
        <div className="bg-[var(--surface)] rounded-2xl shadow-sm p-4">
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
            {getMonthDays().map((date, index) => {
              if (!date) return <div key={`empty-${index}`} className="aspect-square" />;

              const dayJobs = getJobsForDay(date);
              const style = getDayStyle(date);
              const isCurrentMonth = isSameMonth(date, currentMonth);

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg transition-all ${!isCurrentMonth ? 'opacity-30' : ''}`}
                >
                  <div className={`w-10 h-10 flex items-center justify-center ${style.wrapper}`}>
                    <span className={`text-sm ${style.text}`}>
                      {format(date, "d")}
                    </span>
                  </div>
                  {dayJobs.length > 0 && !isSameDay(date, selectedDate) && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="px-6 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Today's Schedule</h3>
          <span className="text-[var(--primary)] text-sm font-medium">
            {format(selectedDate, "MMM d", { locale: pt })}
          </span>
        </div>

        {selectedDayJobs.length > 0 ? (
          <div className="space-y-4">
            {selectedDayJobs.map(job => (
              <div 
                key={job.id} 
                className="bg-[var(--surface)] rounded-2xl shadow-sm overflow-hidden"
              >
                {job.image_urls?.[0] && (
                  <div className="relative h-32">
                    <img src={job.image_urls[0]} alt={job.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold text-white ${
                        job.status === 'in_progress' ? 'bg-green-500' : 'bg-blue-500'
                      }`}>
                        {job.status === 'in_progress' ? 'ON-SITE' : 'PENDING'}
                      </span>
                      <h4 className="text-white font-bold mt-1">{job.title}</h4>
                    </div>
                    <button className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-lg">
                      <ChevronRight className="w-5 h-5 text-gray-900" />
                    </button>
                  </div>
                )}

                <div className="p-4">
                  {!job.image_urls?.[0] && (
                    <>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        job.status === 'in_progress' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {job.status === 'in_progress' ? 'ON-SITE' : 'PENDING'}
                      </span>
                      <h4 className="font-bold text-[var(--text-primary)] mt-2">{job.title}</h4>
                    </>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-[var(--text-secondary)]">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-[var(--primary)]" />
                      <span>07:00 AM - 03:00 PM</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-sm text-[var(--text-secondary)]">
                    <MapPin className="w-4 h-4 text-[var(--primary)]" />
                    <span className="truncate">{job.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-[var(--surface)] rounded-2xl">
            <div className="w-16 h-18 hexagon bg-[var(--surface-secondary)] flex items-center justify-center mb-4">
              <span className="material-icons-round text-3xl text-[var(--text-muted)]">event</span>
            </div>
            <p className="text-[var(--text-secondary)]">No events scheduled</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {format(selectedDate, "MMMM d", { locale: pt })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}