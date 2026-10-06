import React, { useState, useEffect } from "react";
import {
  Menu, Shield, GraduationCap, BookOpen, Users, Building2, Crown, X, LogOut,
  ChevronRight, Home, TrendingUp, Edit3, Link2, Cpu, Activity, Target, FileText,
  Clock, AlertOctagon, Lightbulb
} from "lucide-react";
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

interface NavGroup {
  name: string;
  items: NavItem[];
}

const EDUNEXUS_NAV: NavGroup[] = [
  {
    name: "OVERVIEW",
    items: [
      { icon: Home, label: "Dashboard", id: "dashboard" }
    ]
  },
  {
    name: "DATA FOUNDATION",
    items: [
      { icon: Target, label: "M1 Dataset Explorer", id: "dataset_explorer" },
      { icon: Link2, label: "M2 Data Preparation", id: "data_integration" },
      { icon: Shield, label: "M3 Data Quality", id: "data_quality" },
      { icon: Edit3, label: "M4 Data Cleaning", id: "data_cleaning" },
    ]
  },
  {
    name: "CORE ANALYTICS",
    items: [
      { icon: Activity, label: "M5 Descriptive Statistics", id: "statistics" },
      { icon: TrendingUp, label: "M6 EDA & Visualizations", id: "eda" },
      { icon: Target, label: "M7 Statistical Analysis", id: "statistical_analysis" },
      { icon: Cpu, label: "M8 Feature Engineering", id: "features" },
    ]
  },
  {
    name: "ADVANCED ANALYTICS",
    items: [
      { icon: Clock, label: "M9 Academic Progression", id: "temporal" },
      { icon: Users, label: "M10 Student Cohorts", id: "cohorts" },
      { icon: AlertOctagon, label: "M11 Anomaly Analysis", id: "anomalies" },
    ]
  },
  {
    name: "INTELLIGENCE",
    items: [
      { icon: Lightbulb, label: "M12 Educational Insights", id: "educational_insights" },
    ]
  },
  {
    name: "NOVELTY LAB",
    items: [
      { icon: Cpu, label: "M13 Student Digital Twin", id: "digital_twin" },
      { icon: TrendingUp, label: "M14 Intervention Simulator", id: "intervention_simulator" },
    ]
  },
  {
    name: "MACHINE LEARNING",
    items: [
      { icon: Activity, label: "M15 ML Model Hub", id: "ml_hub" },
    ]
  },
  {
    name: "PROJECT",
    items: [
      { icon: FileText, label: "About & Architecture", id: "about" },
    ]
  }
];

interface Props {
  user: AuthUser;
  children: React.ReactNode;
}

export default function DashboardLayout({ user, children }: Props) {
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = EDUNEXUS_NAV;
  const [activePage, setActivePage] = useState(navItems[0]?.items[0]?.id || "dashboard");
  const getActiveLabel = () => {
    for (const group of navItems) {
      const found = group.items.find(i => i.id === activePage);
      if (found) return found.label;
    }
    return "Dashboard";
  };
  const activeLabel = getActiveLabel();

  useEffect(() => {
    document.title = `${activeLabel} | EduNexus Data Science`;
  }, [activeLabel]);

  const RoleIcon = ROLE_ICONS[user.role] || Shield;

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
        <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-accent/15 to-transparent pointer-events-none" />

        {/* Logo */}
        <div className="flex flex-col items-start gap-2 border-b border-border/50 px-5 pt-6 pb-4 relative z-10 w-full hover:bg-surface/50 transition-colors">
          <div className="flex items-center gap-3 w-full">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 border border-accent/30 text-accent font-bold text-lg flex-shrink-0">
              ⚡
            </div>
            <div className="min-w-0 flex-1 flex flex-col items-start">
              <h1 className="text-base font-bold tracking-tight text-foreground font-syne">EduNexus</h1>
              <p className="text-[10px] font-medium uppercase tracking-widest text-accent">Data Science Framework</p>
            </div>
            <button className="ml-auto lg:hidden btn-ghost p-1" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* User Role */}
        <div className="px-3 py-3 border-b border-border/50 relative z-10 w-full">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium bg-surface-warm border border-border/60">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20 text-accent font-bold">
              <RoleIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-foreground truncate font-bold">{user.name}</p>
              <p className="text-[10px] text-accent truncate">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 space-y-4 p-3 overflow-y-auto relative z-10 hide-scrollbar pb-6">
          {navItems.map((group) => (
            <div key={group.name}>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2 ml-2">
                {group.name}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button 
                      key={item.id} 
                      onClick={() => { setActivePage(item.id); setSidebarOpen(false); }}
                      className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all cursor-pointer group",
                        isActive ? "bg-accent text-white font-bold shadow" : "btn-ghost text-muted-foreground hover:text-foreground"
                      )}>
                      <Icon className={cn("h-4 w-4 flex-shrink-0 transition-colors", isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sign Out */}
        <div className="p-3 border-t border-border/50 relative z-10">
          <button onClick={logout} className="btn-secondary flex w-full items-center justify-center gap-2 px-3 py-2 text-xs hover:text-red-400">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0 relative z-10 w-full">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-background/80 backdrop-blur-md px-4 border-b border-border/50">
          <button className="lg:hidden flex-shrink-0 btn-ghost p-1" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-foreground" />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground bg-surface-warm px-2 py-1 rounded border border-border">{user.role}</span>
            <ChevronRight className="h-4 w-4 text-border" />
            <span className="text-accent font-bold bg-accent/10 px-2.5 py-1 rounded border border-accent/20">{activeLabel}</span>
          </div>

          <div className="ml-auto flex items-center gap-4 flex-shrink-0">
            <NotificationCenter />
          </div>
        </header>

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
