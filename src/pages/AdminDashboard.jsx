import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/entities/User";
import { Job } from "@/entities/Job";
import { Rating } from "@/entities/Rating";
import { Blacklist } from "@/entities/Blacklist";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronRight, TrendingUp, TrendingDown, AlertTriangle, Users, Briefcase, Ban, Shield, Bell, Settings, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Hexagon Stat Card
function HexStatCard({ icon: Icon, label, value, trend, trendValue, color = "primary" }) {
  return (
    <div className="relative w-full aspect-[1/1.15]">
      <div className="absolute inset-0 hexagon bg-[var(--surface)] shadow-sm flex flex-col items-center justify-center p-4 text-center">
        <Icon className={`w-6 h-6 mb-2 ${
          color === 'primary' ? 'text-[var(--primary)]' :
          color === 'blue' ? 'text-blue-500' :
          color === 'red' ? 'text-red-500' :
          'text-yellow-500'
        }`} />
        <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
        <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{value}</p>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
            trend === 'up' ? 'text-green-500' : 'text-red-500'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Quick Action Item
function QuickActionItem({ icon: Icon, title, subtitle, actionLabel, variant = "default", onClick }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-[var(--surface)] rounded-xl shadow-sm">
      <div className={`w-12 h-14 hexagon flex items-center justify-center ${
        variant === 'warning' ? 'bg-[var(--primary)]' : 'bg-[var(--surface-secondary)]'
      }`}>
        <Icon className={`w-5 h-5 ${variant === 'warning' ? 'text-gray-900' : 'text-[var(--primary)]'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-[var(--text-primary)]">{title}</h4>
        <p className="text-sm text-[var(--text-muted)] truncate">{subtitle}</p>
      </div>
      <Button 
        size="sm" 
        onClick={onClick}
        className={variant === 'warning' ? 'btn-primary' : 'btn-secondary'}
      >
        {actionLabel}
      </Button>
    </div>
  );
}

// Activity Item
function ActivityItem({ title, subtitle, hasIndicator }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--border)] last:border-0">
      {hasIndicator && <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />}
      {!hasIndicator && <div className="w-2" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--text-primary)]">{title}</p>
        <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mb-4" />
        <p className="text-[var(--text-secondary)]">Loading dashboard...</p>
      </div>
    );
  }

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: 'grid_view' },
    { id: 'users', label: 'Users', icon: 'people' },
    { id: 'projects', label: 'Projects', icon: 'work' },
    { id: 'settings', label: 'Settings', icon: 'settings' }
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-12 hexagon bg-[var(--primary)] flex items-center justify-center">
            <Shield className="w-5 h-5 text-gray-900" />
          </div>
          <div>
            <span className="text-xl font-bold text-[var(--text-primary)]">KANDU</span>
            <p className="text-[10px] text-[var(--primary)] uppercase tracking-wider font-medium">Admin Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full bg-[var(--surface)] shadow-sm flex items-center justify-center relative">
            <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-amber-600 flex items-center justify-center text-gray-900 font-bold text-sm">
            AD
          </div>
        </div>
      </header>

      {/* Title */}
      <div className="px-6 mb-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Overview</h2>
          </div>
          <p className="text-xs text-[var(--text-muted)]">Last updated: 2m ago</p>
        </div>
      </div>

      {/* Hexagon Stats Grid */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="transform translate-y-0">
            <HexStatCard 
              icon={Users} 
              label="Total Users" 
              value={stats.totalUsers.toLocaleString()} 
              trend="up" 
              trendValue="+5%"
              color="primary"
            />
          </div>
          <div className="transform translate-y-8">
            <HexStatCard 
              icon={Briefcase} 
              label="Projects" 
              value={stats.activeJobs} 
              trend="up" 
              trendValue="+2%"
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
      <div className="px-6 mb-8">
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
      <div className="px-6 pb-24">
        <h3 className="font-bold text-[var(--text-primary)] mb-4">Recent Activity</h3>
        <div className="bg-[var(--surface)] rounded-xl shadow-sm px-4">
          <ActivityItem 
            title="New worker verification pending"
            subtitle="Worker: John Doe • 10 mins ago"
            hasIndicator={true}
          />
          <ActivityItem 
            title="Payment processed successfully"
            subtitle="Project #8821 • €4,200 • 1 hour ago"
            hasIndicator={true}
          />
          <ActivityItem 
            title="New project submitted"
            subtitle="Downtown Renovation • 2 hours ago"
            hasIndicator={false}
          />
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border)] px-4 py-2 md:hidden safe-area-bottom">
        <div className="flex items-center justify-around">
          {navTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${
                activeTab === tab.id 
                  ? 'text-[var(--primary)]' 
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {tab.id === 'projects' ? (
                <div className="w-12 h-12 -mt-8 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-lg">
                  <PlusCircle className="w-6 h-6 text-gray-900" />
                </div>
              ) : (
                <span className="material-icons-round text-2xl">{tab.icon}</span>
              )}
              <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}