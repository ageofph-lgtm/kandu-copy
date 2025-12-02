
import React, { useState, useEffect, useCallback } from "react";
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

  const weekDays = getWeekDays();

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Calendário</h1>
          <Button size="icon" variant="outline">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Navigation Week */}
        <div className="flex items-center justify-between mt-3">
          <Button 
            size="icon" 
            variant="outline"
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="text-center">
            <p className="font-semibold text-gray-900">
              {format(weekDays[0], "d MMM", { locale: pt })} - {format(weekDays[6], "d MMM", { locale: pt })}
            </p>
            <p className="text-sm text-gray-500">
              {format(currentWeek, "yyyy", { locale: pt })}
            </p>
          </div>
          
          <Button 
            size="icon" 
            variant="outline"
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="bg-white border-b grid grid-cols-7 text-center py-2 text-xs font-medium text-gray-600">
        {weekDays.map((day, index) => (
          <div key={index} className={`py-1 ${isSameDay(day, new Date()) ? 'text-blue-600 font-bold' : ''}`}>
            <div>{format(day, "EEE", { locale: pt })}</div>
            <div className={`text-lg ${isSameDay(day, new Date()) ? 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7 divide-x">
          {weekDays.map((day, index) => {
            const dayJobs = getJobsForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div key={index} className="min-h-24 p-1">
                {dayJobs.map((job) => (
                  <div
                    key={job.id}
                    className={`mb-1 p-2 rounded text-xs ${getStatusColor(job.status)} text-white`}
                  >
                    <div className="font-medium truncate">{job.title}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="truncate">{formatPrice(job.price, job.price_type)}</span>
                      <span className="text-xs opacity-75">{job.category}</span>
                    </div>
                  </div>
                ))}
                
                {/* Empty state */}
                {dayJobs.length === 0 && (
                  <div className="h-16 flex items-center justify-center">
                    {user?.user_type === "employer" && (
                      <Button size="sm" variant="ghost" className="text-xs text-gray-400">
                        <Plus className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white border-t p-4">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-blue-600">
              {jobs.filter(j => j.status === 'open').length}
            </div>
            <div className="text-xs text-gray-600">Abertas</div>
          </div>
          
          <div>
            <div className="text-lg font-bold text-yellow-600">
              {jobs.filter(j => j.status === 'in_progress').length}
            </div>
            <div className="text-xs text-gray-600">Em Curso</div>
          </div>
          
          <div>
            <div className="text-lg font-bold text-green-600">
              {jobs.filter(j => j.status === 'completed').length}
            </div>
            <div className="text-xs text-gray-600">Concluídas</div>
          </div>
          
          <div>
            <div className="text-lg font-bold text-purple-600">
              €{jobs.reduce((sum, j) => sum + (j.price || 0), 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </div>
      </div>
    </div>
  );
}
