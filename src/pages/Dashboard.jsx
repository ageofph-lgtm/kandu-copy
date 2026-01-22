import React, { useState, useEffect } from "react";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { translations } from "../components/utils/translations";
import { Search, Bell, Loader2, MapPin, Calendar, MessageCircle, Briefcase, Plus, FileText, ChevronRight } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const t = (key) => {
    return translations[user?.language || 'PT']?.[key] || translations.PT[key] || key;
  };

  const loadUserAndJobs = React.useCallback(async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);

      if (!userData.user_type) {
        navigate(createPageUrl("SetupProfile"));
        return;
      }

      const jobList = await Job.list("-created_date");
      setJobs(jobList);
    } catch (error) {
      console.error("Error loading data:", error);
      if (error.response?.status === 401 || error.message?.includes('401')) {
        navigate(createPageUrl("SetupProfile"));
      }
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    loadUserAndJobs();
  }, [loadUserAndJobs]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mb-4" />
        <p className="text-[var(--text-secondary)]">A carregar...</p>
      </div>
    );
  }

  const stats = {
    activeJobs: jobs.filter(j => j.status === 'open').length,
    inProgress: jobs.filter(j => j.status === 'in_progress').length,
    earnings: jobs.filter(j => j.status === 'completed').reduce((sum, j) => sum + (j.price || 0), 0)
  };

  // Honeycomb navigation items
  const honeycombItems = [
    { 
      icon: "map", 
      label: "Map View", 
      color: "text-blue-500",
      bgColor: "bg-white dark:bg-[var(--surface)]",
      url: createPageUrl("Dashboard")
    },
    { 
      icon: "calendar_today", 
      label: "Calendar", 
      color: "text-purple-500",
      bgColor: "bg-white dark:bg-[var(--surface)]",
      url: createPageUrl("Calendar")
    },
    { 
      icon: "work", 
      label: "Browse Jobs", 
      color: "text-gray-900",
      bgColor: "bg-[var(--primary)]",
      isPrimary: true,
      url: createPageUrl("MyJobs")
    },
    { 
      icon: "add_circle", 
      label: "Post a Project", 
      color: "text-[var(--primary)]",
      bgColor: "bg-gray-900 dark:bg-white",
      isDark: true,
      url: createPageUrl("NewJob")
    },
    { 
      icon: "description", 
      label: "My Apps", 
      color: "text-green-500",
      bgColor: "bg-white dark:bg-[var(--surface)]",
      url: createPageUrl("Applications")
    },
    { 
      icon: "chat_bubble", 
      label: "Chat", 
      color: "text-orange-500",
      bgColor: "bg-white dark:bg-[var(--surface)]",
      url: createPageUrl("Chat")
    }
  ];

  const recentUpdates = jobs.slice(0, 3);

  return (
    <div className="min-h-screen bg-[var(--background)] relative overflow-hidden">
      {/* Background blur decorations */}
      <div className="blur-decoration blur-primary w-64 h-64 top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
      <div className="blur-decoration blur-blue w-64 h-64 bottom-20 right-0 translate-x-1/2 translate-y-1/2" />

      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex justify-between items-center relative z-20">
        <div>
          <p className="text-sm text-[var(--text-muted)] font-medium">Welcome back,</p>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {user?.full_name || 'Utilizador'}
          </h1>
        </div>
        <div className="relative">
          <button 
            onClick={() => navigate(createPageUrl("Notifications"))}
            className="w-10 h-10 rounded-full bg-[var(--surface)] shadow-sm flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
          >
            <Bell className="w-5 h-5" />
          </button>
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[var(--background)]" />
        </div>
      </header>

      {/* Search */}
      <div className="px-6 mb-8 relative z-20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
          <input 
            type="text"
            placeholder="Find professionals or services..."
            className="w-full py-3 pl-10 pr-4 bg-[var(--surface)] border-none rounded-xl shadow-sm text-sm focus:ring-2 focus:ring-[var(--primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
          />
        </div>
      </div>

      {/* Honeycomb Navigation Grid */}
      <main className="flex-grow flex flex-col justify-center items-center relative z-10 px-6">
        <div className="flex flex-col items-center justify-center gap-1 w-full max-w-xs mx-auto">
          {/* Row 1 */}
          <div className="flex justify-center gap-4 mb-[-25px]">
            {honeycombItems.slice(0, 2).map((item, index) => (
              <Link
                key={index}
                to={item.url}
                className={`hex-wrapper ${item.bgColor} shadow-lg flex flex-col items-center justify-center group ${item.isPrimary ? 'shadow-[var(--primary)]/30' : ''}`}
              >
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                  <span className={`material-icons-round text-3xl ${item.color} mb-2 group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </span>
                  <span className={`text-xs font-semibold leading-tight ${item.isDark ? 'text-white dark:text-gray-900' : 'text-[var(--text-primary)]'}`}>
                    {item.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Row 2 - Main actions */}
          <div className="flex justify-center gap-4 mb-[-25px]">
            {honeycombItems.slice(2, 4).map((item, index) => (
              <Link
                key={index}
                to={item.url}
                className={`hex-wrapper ${item.bgColor} shadow-xl flex flex-col items-center justify-center z-10 group cursor-pointer ${item.isPrimary ? 'shadow-[var(--primary)]/30' : ''}`}
              >
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                  <span className={`material-icons-round text-4xl ${item.color} mb-2 group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </span>
                  <span className={`text-sm font-bold leading-tight ${item.isDark ? 'text-white dark:text-gray-900' : 'text-gray-900'}`}>
                    {item.label.split(' ').map((word, i) => <span key={i}>{word}<br/></span>)}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Row 3 */}
          <div className="flex justify-center gap-4">
            {honeycombItems.slice(4, 6).map((item, index) => (
              <Link
                key={index}
                to={item.url}
                className={`hex-wrapper ${item.bgColor} shadow-lg flex flex-col items-center justify-center group`}
              >
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                  <span className={`material-icons-round text-3xl ${item.color} mb-2 group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </span>
                  <span className="text-xs font-semibold leading-tight text-[var(--text-primary)]">
                    {item.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Helper text */}
        <p className="text-sm text-[var(--text-muted)] mt-8">
          Tap a hexagon to navigate
        </p>
      </main>

      {/* Stats Cards */}
      <div className="px-6 mt-8 mb-6 relative z-20">
        <div className="grid grid-cols-2 gap-4">
          <div className="stat-card-primary rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-icons-round text-gray-900 text-lg">payments</span>
              <span className="text-xs font-medium text-gray-900/70">Earnings</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">€{stats.earnings.toLocaleString()}</p>
          </div>
          <div className="stat-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-icons-round text-blue-500 text-lg">work</span>
              <span className="text-xs font-medium text-[var(--text-muted)]">Active Jobs</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.inProgress} Projects</p>
          </div>
        </div>
      </div>

      {/* Recent Updates */}
      <div className="px-6 pb-24 relative z-20">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Recent Updates</h3>
        <div className="space-y-3">
          {recentUpdates.map((job, index) => (
            <div 
              key={job.id}
              className="glass-panel rounded-xl p-4 border border-[var(--border)] flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-[var(--text-primary)] truncate">{job.title}</h4>
                <p className="text-sm text-[var(--text-muted)]">{job.location}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}