import React, { useState, useEffect } from "react";
import { Menu, Shield, GraduationCap, BookOpen, Users, Building2, Crown, X, LogOut, Bell, ChevronRight, Home, TrendingUp, Brain, Play, Edit3, AlertTriangle, Link2, Cpu, Activity, ClipboardList, Target, Globe, CheckSquare, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthUser } from "@/types/auth";
import { useAuth } from "@/context/AuthContext";
import { NotificationCenter } from "./NotificationCenter";

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
}

const ROLE_ICONS: Record<string, React.ElementType> = {
  Student: GraduationCap,
  "Subject Teacher": BookOpen,
  Mentor: Users,
  HOD: Building2,
  Principal: Shield,
  Chairman: Crown,
};

const SIDEBAR_NAV: Record<string, NavItem[]> = {
  Student: [
    { icon: Home, label: "My Dashboard", id: "dashboard" },
    { icon: TrendingUp, label: "My Progress", id: "progress" },
    { icon: Brain, label: "Ask Sentinel AI", id: "chat" },
    { icon: Play, label: "Concept Videos", id: "videos" },
  ],
  "Subject Teacher": [
    { icon: BarChart3, label: "Class Overview", id: "overview" },
    { icon: Edit3, label: "Mark Entry", id: "markentry" },
    { icon: AlertTriangle, label: "At-Risk Students", id: "atrisk" },
    { icon: Brain, label: "Ask Sentinel AI", id: "chat" }
  ],
  Mentor: [
    { icon: Users, label: "Mentee Dashboard", id: "mentees" },
    { icon: Shield, label: "Intervention Plans", id: "plans" },
    { icon: Link2, label: "Peer Bridge", id: "peerbridge" },
    { icon: Cpu, label: "Dropout Oracle AI", id: "oracle" },
    { icon: Brain, label: "Ask Sentinel AI", id: "chat" },
  ],
  HOD: [
    { icon: Building2, label: "Department Overview", id: "overview" },
    { icon: Activity, label: "Risk Analytics", id: "analytics" },
    { icon: TrendingDown, label: "Dropout Insights AI", id: "insights" },
    { icon: ClipboardList, label: "Intervention Audit", id: "audit" },
    { icon: Brain, label: "Ask Sentinel AI", id: "chat" },
  ],
  Principal: [
    { icon: Shield, label: "Institution Overview", id: "overview" },
    { icon: AlertTriangle, label: "Escalation Panel", id: "escalation" },
    { icon: CheckSquare, label: "Compliance Tracker", id: "compliance" },
    { icon: TrendingDown, label: "Dropout Insights AI", id: "insights" },
    { icon: Globe, label: "Cross-Dept Analytics", id: "analytics" },
    { icon: Brain, label: "Ask Sentinel AI", id: "chat" },
  ],
  Chairman: [
    { icon: Crown, label: "Strategic Dashboard", id: "strategic" },
    { icon: Target, label: "Industry Readiness", id: "industry" },
    { icon: Globe, label: "SDG 4 Impact", id: "sdg" },
    { icon: FileText, label: "Institution Report", id: "report" },
    { icon: Brain, label: "Ask Sentinel AI", id: "chat" },
  ],
};

import { BarChart3, TrendingDown } from "lucide-react";

interface Props {
  user: AuthUser;
  children: React.ReactNode;
}

export default function DashboardLayout({ user, children }: Props) {
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = SIDEBAR_NAV[user.role] || [];
  const [activePage, setActivePage] = useState(navItems[0]?.id || "dashboard");
  const activeLabel = navItems.find(n => n.id === activePage)?.label || "Dashboard";

  useEffect(() => {
    document.title = `${activeLabel} | CIT-Sentinel`;
  }, [activeLabel]);

  const RoleIcon = ROLE_ICONS[user.role] || Shield;
  const SEMESTER_WEEK = 6;
  const SEMESTER_TOTAL = 16;
  const semProgress = Math.round((SEMESTER_WEEK / SEMESTER_TOTAL) * 100);

  return (
    <div className="flex min-h-screen bg-background relative z-0">
      <div className="fixed inset-0 pointer-events-none bg-dot-pattern opacity-40 z-[-1]" />
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r-0 bg-sidebar transition-transform duration-300 lg:static lg:translate-x-0 relative",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Right border gradient decoration */}
        <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-accent/15 to-transparent pointer-events-none" />
        {/* Logo Area */}
        <div className="flex flex-col items-start gap-2 border-b border-border/50 px-5 pt-6 pb-4 relative z-10 w-full hover:bg-surface/50 transition-colors">
          <img src="/cit-logo-light.png" alt="CIT Logo" className="h-12 w-auto object-contain mb-2" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div className="flex items-center gap-3 w-full">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400 overflow-hidden flex-shrink-0">
              <span className="text-lg">🦋</span>
            </div>
            <div className="min-w-0 flex-1 flex flex-col items-start">
              <h1 className="text-sm font-bold tracking-tight text-foreground leading-tight">CIT-Sentinel</h1>
              <p className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground leading-tight">Chennai Inst. of Tech</p>
            </div>
            <button className="ml-auto lg:hidden btn-ghost p-1" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* User Role Badge */}
        <div className="px-3 py-4 border-b border-border/50 relative z-10 w-full">
          <p className="mb-2 px-2 section-label">Logged in as</p>
          <div className="flex items-center gap-3 rounded-xl px-3 py-3 font-medium bg-surface-warm border border-border/60 card-glow-hover cursor-pointer group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-maroon glow-maroon transition-transform group-hover:scale-105">
              <RoleIcon className="h-4 w-4 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground truncate">{user.name}</p>
              <p className="text-xs text-accent truncate">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto relative z-10 hide-scrollbar">
          <p className="section-label mb-3 ml-2 mt-2">ROLE VIEWS</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button key={item.id} onClick={() => { setActivePage(item.id); setSidebarOpen(false); }}
                className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer group",
                  isActive ? "nav-active" : "btn-ghost"
                )}>
                <Icon className={cn("h-4 w-4 flex-shrink-0 transition-colors", isActive ? "text-accent tooltip-glow" : "text-muted-foreground/70 group-hover:text-foreground")} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 pt-2 space-y-3 relative z-10">
          <div className="card-warm p-4 space-y-4 card-glow-hover cursor-help border-t-0 shadow-lg">
            <h4 className="text-xs font-bold text-foreground font-syne tracking-wide">Semester IV Progress</h4>
            <div className="flex justify-between items-end">
              <p className="section-label tracking-wider">Week {SEMESTER_WEEK} of {SEMESTER_TOTAL}</p>
              <p className="text-[11px] font-mono font-bold text-accent">{semProgress}%</p>
            </div>
            
            <div className="h-1.5 w-full rounded-full bg-background overflow-hidden border border-border/50">
              <div className="h-full rounded-full progress-warm transition-all duration-1000 animate-progress" style={{ "--target-width": `${semProgress}%` } as any} />
            </div>

            <div className="flex flex-col gap-2 mt-3">
              <div className="w-full text-center week-pill-upcoming cursor-help transition-all hover:scale-[1.02] active:scale-95 px-2 py-1.5" title="2 weeks away">IAT 2 — Wk 8</div>
              <div className="w-full text-center week-pill-danger cursor-help transition-all hover:scale-[1.02] active:scale-95 px-2 py-1.5" title="6 weeks away">Model — Wk 12</div>
              <div className="w-full text-center btn-ghost bg-surface text-[11px] py-1 border border-border cursor-help transition-all hover:scale-[1.02] active:scale-95" title="10 weeks away">End Sem — Wk 16</div>
            </div>

            <div className="pt-3 mt-2 divider-warm bg-transparent w-full"></div>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground font-medium">Students Monitored</p>
                <p className="text-[11px] font-mono text-foreground font-bold">60</p>
              </div>
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded px-2.5 py-1 w-fit mt-1 cursor-pointer hover:bg-green-500/20 transition-colors">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 sentinel-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                <span className="text-[9px] font-bold text-green-400 tracking-wider">MILVUS ACTIVE</span>
              </div>
            </div>
          </div>
          <button onClick={logout} className="btn-secondary flex w-full items-center justify-center gap-2 px-3 py-2.5 text-sm hover:text-red-400 hover:border-red-500/30 group active:scale-95">
            <LogOut className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 relative z-10 w-full">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-background/80 backdrop-blur-md px-4 hero-mesh border-b-0 shadow-[0_1px_0_hsl(20_12%_20%),_0_4px_20px_hsl(0_0%_0%/_0.2)]">
          <button className="lg:hidden flex-shrink-0 btn-ghost p-1" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-foreground" />
          </button>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <span className="section-label">Viewing as</span>
            <span className="font-semibold text-foreground text-xs ml-1 bg-surface-warm px-2 py-1 rounded-md border border-border shadow-sm">{user.role}</span>
            <ChevronRight className="h-4 w-4 text-border" />
            <span className="text-foreground font-medium bg-accent/10 text-accent px-2.5 py-1 rounded-md border border-accent/20 text-xs shadow-sm">{activeLabel}</span>
          </div>
          
          <div className="sm:hidden text-sm font-semibold text-foreground">
            {activeLabel}
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-4 flex-shrink-0">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground bg-surface/80 backdrop-blur rounded-full px-3 py-1.5 border border-border section-label shadow-sm">
              Week {SEMESTER_WEEK} / 16 — Semester IV
            </div>
            <NotificationCenter />
            
            <div className="h-6 w-px bg-border hidden sm:block mx-1" />

            {/* Avatar & Logout */}
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">{user.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{user.userId}</span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-maroon text-accent font-bold text-sm border-2 border-accent/20 shadow-md group-hover:glow-maroon transition-all">
                {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
            </div>
          </div>
        </header>

        <div className="h-[2px] w-full shadow-[0_0_10px_hsl(220_60%_25%/_0.5)] z-20 relative" style={{ background: "linear-gradient(90deg, hsl(220 60% 25%), hsl(42 95% 52%), hsl(220 60% 25%))" }} />

        <main className="flex-1 p-4 md:p-6 overflow-x-hidden relative">
          <div className="animate-fade-up mx-auto max-w-7xl relative z-10" key={activePage}>
            {React.isValidElement(children) 
              ? React.cloneElement(children as React.ReactElement<any>, { activePage, setActivePage }) 
              : children}
          </div>
        </main>
      </div>
    </div>
  );
}
