import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/entities/User";
import { Job } from "@/entities/Job";
import { Rating } from "@/entities/Rating";
import { Application } from "@/entities/Application";
import { Blacklist } from "@/entities/Blacklist";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Shield,
  AlertTriangle,
  Users,
  Star,
  Ban,
  Eye,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Search,
  Settings,
  Loader2,
  PlusCircle,
  ChevronRight,
  Bell
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Hexagon Stat Card
function HexStatCard({ icon: Icon, label, value, trend, trendValue, color = "primary" }) {
  const colors = {
    primary: "from-[var(--primary)] to-orange-600",
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    red: "from-red-500 to-red-600",
    yellow: "from-yellow-500 to-yellow-600"
  };

  return (
    <div className="relative w-full aspect-[1/1.15]">
      {/* Hexagon Shape */}
      <div className={`absolute inset-0 hexagon bg-gradient-to-br ${colors[color]} opacity-20`} />
      <div className="absolute inset-[2px] hexagon bg-[var(--surface)] flex flex-col items-center justify-center p-4 text-center">
        <Icon className="w-6 h-6 text-[var(--primary)] mb-2" />
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
        <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{value}</p>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
            trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-[var(--text-muted)]'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Quick Action Item
function QuickActionItem({ icon: Icon, title, subtitle, action, actionLabel, variant = "default" }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
      <div className={`w-12 h-12 hexagon flex items-center justify-center ${
        variant === 'warning' ? 'bg-[var(--primary)]' : 'bg-[var(--surface-secondary)]'
      }`}>
        <Icon className={`w-5 h-5 ${variant === 'warning' ? 'text-white' : 'text-[var(--primary)]'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-[var(--text-primary)]">{title}</h4>
        <p className="text-sm text-[var(--text-muted)] truncate">{subtitle}</p>
      </div>
      <Button 
        size="sm" 
        variant={variant === 'warning' ? 'default' : 'outline'}
        className={variant === 'warning' ? 'bg-[var(--primary)] hover:bg-[var(--primary-dark)]' : 'border-[var(--border)]'}
        onClick={action}
      >
        {actionLabel}
      </Button>
    </div>
  );
}

// Activity Item
function ActivityItem({ title, subtitle, time, hasIndicator }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--border)] last:border-0">
      {hasIndicator && (
        <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
      )}
      {!hasIndicator && <div className="w-2" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--text-primary)]">{title}</p>
        <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--text-muted)]">{time}</span>
        <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [lowRatings, setLowRatings] = useState([]);
  const [blacklistEntries, setBlacklistEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setCurrentUser(userData);

      if (userData.user_type !== 'admin') {
        navigate(createPageUrl("Dashboard"));
        return;
      }
      
      const [allUsers, allJobs, allRatings, allBlacklist] = await Promise.all([
        User.list("-created_date"),
        Job.list("-created_date"),
        Rating.list("-created_date"),
        Blacklist.list("-created_date")
      ]);

      setUsers(allUsers.filter(u => u.user_type !== 'admin'));
      setJobs(allJobs);
      setBlacklistEntries(allBlacklist);
      setLowRatings(allRatings.filter(r => r.rating <= 2));

    } catch (error) {
      console.error("Error loading admin data:", error);
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = {
    totalUsers: users.length,
    activeJobs: jobs.filter(j => j.status === 'open').length,
    lowRatingsCount: lowRatings.length,
    blacklistCount: blacklistEntries.length
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mb-4" />
        <p className="text-[var(--text-secondary)]">A carregar painel...</p>
      </div>
    );
  }

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)] px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">KANDU</h1>
              <p className="text-xs text-[var(--primary)] uppercase tracking-wider">Admin Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="relative">
              <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-orange-600 flex items-center justify-center text-white text-xs font-bold">
              AD
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="px-4 py-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h2>
            <h3 className="text-2xl font-bold text-[var(--text-primary)]">Overview</h3>
          </div>
          <p className="text-xs text-[var(--text-muted)]">Atualizado: 2m atrás</p>
        </div>
      </div>

      {/* Hexagon Stats Grid */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="transform translate-y-0">
            <HexStatCard 
              icon={Users} 
              label="Total Users" 
              value={stats.totalUsers.toLocaleString()} 
              trend="up" 
              trendValue="+5%"
            />
          </div>
          <div className="transform translate-y-8">
            <HexStatCard 
              icon={Briefcase} 
              label="Projects" 
              value={stats.activeJobs} 
              trend="neutral" 
              trendValue="0%"
              color="blue"
            />
          </div>
          <div className="transform -translate-y-4">
            <HexStatCard 
              icon={AlertTriangle} 
              label="Reports" 
              value={stats.lowRatingsCount} 
              trend="up" 
              trendValue="+20%"
              color="yellow"
            />
          </div>
          <div className="transform translate-y-4">
            <HexStatCard 
              icon={Ban} 
              label="Blacklist" 
              value={stats.blacklistCount} 
              trend="down" 
              trendValue="-1%"
              color="red"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[var(--text-primary)]">Quick Actions</h3>
          <button className="text-[var(--primary)] text-sm font-medium">View All</button>
        </div>
        <div className="space-y-3">
          <QuickActionItem 
            icon={AlertTriangle}
            title="Review Flagged User"
            subtitle="High Priority • User #8821"
            actionLabel="Review"
            variant="warning"
          />
          <QuickActionItem 
            icon={Briefcase}
            title="Approve Project"
            subtitle="Project ID #90210"
            actionLabel="Approve"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4 mt-8 pb-24">
        <h3 className="font-bold text-[var(--text-primary)] mb-4">Recent Activity</h3>
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] px-4">
          <ActivityItem 
            title="New worker verification pending"
            subtitle="Worker: John Doe • 10 mins ago"
            time=""
            hasIndicator={true}
          />
          <ActivityItem 
            title="Payment processed successfully"
            subtitle="Project #8821 • €4,200 • 1 hour ago"
            time=""
            hasIndicator={true}
          />
          <ActivityItem 
            title="New project submitted"
            subtitle="Downtown Renovation • 2 hours ago"
            time=""
            hasIndicator={false}
          />
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border)] px-4 py-2 md:hidden">
        <div className="flex items-center justify-around">
          {navTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${
                activeTab === tab.id 
                  ? 'text-[var(--primary)] bg-[var(--primary)]/10' 
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {tab.id === 'projects' ? (
                <div className="w-10 h-10 -mt-6 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-lg">
                  <PlusCircle className="w-6 h-6 text-white" />
                </div>
              ) : (
                <tab.icon className="w-5 h-5" />
              )}
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}