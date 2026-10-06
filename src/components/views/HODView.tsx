import { useState, useEffect, useRef, Fragment } from "react";
import { useAuth } from "@/context/AuthContext";
import { students, departmentStats, weeklyRiskTrend } from "@/data/students";
import { analyzeStudent, getBatchRiskSummary } from "@/utils/sentinelAI";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, CartesianGrid, AreaChart, Area } from "recharts";
import { Building2, Activity, TrendingDown, Cpu, ClipboardList, AlertOctagon, TrendingUp, Users, Shield, Eye, Sparkles, Plus, Download, RefreshCw, X, ChevronRight, Brain, Send } from "lucide-react";
import { askClaude } from "@/utils/claudeAI";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AIMessage, TypingIndicator } from "@/components/ui/AIMessage";
import { generateReportAPI, createEscalationAPI, getToken } from '@/utils/api';

const COLORS = ["hsl(142 71% 45%)", "hsl(0 72% 51%)", "hsl(45 100% 50%)", "hsl(25 95% 53%)"];

export default function HODView({ activePage = "dashboard" }: { activePage?: string }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Department Overview");
  
  // Scope to HOD's department
  const deptStudents = students.filter(s => s.department === user?.department);
  const summary = getBatchRiskSummary(deptStudents);
  const riskCounts = { Critical: summary.criticalCount, "At-Risk": summary.highCount, Observation: summary.moderateCount, Safe: summary.safeCount };

  const [fabOpen, setFabOpen] = useState(false);
  const [pieFilter, setPieFilter] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  
  const [auditYearFilter, setAuditYearFilter] = useState<number | "All">("All");
  const [auditStatusFilter, setAuditStatusFilter] = useState<string>("All");
  const [escalateTarget, setEscalateTarget] = useState<any | "All" | null>(null);
  const [escalationNote, setEscalationNote] = useState("");
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"retention" | "active" | "attendance" | "total" | null>(null);

  const [retentionModalOpen, setRetentionModalOpen] = useState(false);
  const [activeModalOpen, setActiveModalOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [totalModalOpen, setTotalModalOpen] = useState(false);
  const [pieModalOpen, setPieModalOpen] = useState(false);

  const kpis = [
    { id: "retention", label: "Retention Rate", val: "94.2%", icon: TrendingUp },
    { id: "sentinel", label: "Avg Sentinel Score", val: summary.avgSentinelScore, icon: Shield },
    { id: "critical", label: "Critical Priority", val: riskCounts.Critical || 0, icon: AlertOctagon, red: true },
    { id: "active", label: "Active Interventions", val: deptStudents.filter(s => s.interventionStatus === "Active").length, icon: Activity },
    { id: "attendance", label: "Avg Attendance", val: `${Math.round(deptStudents.reduce((a, b) => a + b.attendance, 0) / deptStudents.length)}%`, icon: Users },
    { id: "total", label: "Total Students", val: deptStudents.length, icon: Users },
  ];

  /* AI Chat state for HOD */
  const [oracleMode, setOracleMode] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  /* Ask Sentinel AI Chat State */
  const [messages, setMessages] = useState<{role: "assistant"|"user", content: string}[]>([
    { role: "assistant", content: `${user?.name.split(" ")[0]}, I've analyzed your department of ${deptStudents.length} students. ${riskCounts.Critical} are critical. Would you like department-wide strategy suggestions?` }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, isTyping]);

  const handleSendChat = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isTyping) return;
    
    const userMessage = chatInput.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");
    setIsTyping(true);

    const systemPrompt = `You are Sentinel, an AI HOD advisor for ${user?.name}. You analyze department performance. ${riskCounts.Critical} students are critical. Be concise, practical. Under 150 words.`;
    
    const response = await askClaude(systemPrompt, userMessage);
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setIsTyping(false);
  };

  const runMacroAnalysis = async (pattern: string) => {
    setOracleMode(true);
    setAnalyzing(true);
    const count = summary.topPattern === pattern ? 12 : 5; // mock dynamic subset
    const prompt = `You are Sentinel an AI advisor for ${user?.name}, HOD of ${user?.department}. Analyze the macro pattern "${pattern}" currently affecting ${count} students in your department. Provide 1) Root causes at department level, 2) Strategic intervention policy to implement, 3) 1-month goal. Under 200 words.`;
    const res = await askClaude(prompt, "Generate department-level strategy.");
    setAiAnalysis(res);
    setAnalyzing(false);
  };

  const handleKpiClick = (id: string) => {
    if (id === "retention") setRetentionModalOpen(true);
    if (id === "active") setActiveModalOpen(true);
    if (id === "attendance") setAttendanceModalOpen(true);
    if (id === "total") setTotalModalOpen(true);
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // FAB Actions
  const handleEscalateAll = () => {
    setEscalateTarget("All");
    setFabOpen(false);
  };

  const handleEscalateConfirm = async () => {
    if (!escalateTarget) return;
    if (escalateTarget === "All") {
      toast.success("All critical students escalated to Management.");
    } else {
      const result = await createEscalationAPI({
        studentName: escalateTarget.name,
        studentId: escalateTarget.id,
        issue: escalationNote || 'Escalated by HOD for immediate review.',
        priority: 'High'
      }, getToken());
      if (result.success) {
        toast.success(`Escalated to Principal ✓`);
        if (result.emailSent) toast.success('Principal notified via email');
      }
    }
    setEscalateTarget(null);
    setEscalationNote("");
  };

  const handleDownloadReport = async () => {
    toast("Generating Department report...");
    setFabOpen(false);
    const result = await generateReportAPI({ reportType: "Department Report" }, getToken());
    if (result.success) toast.success("Department Report generated successfully ✓");
  };

  const handleTriggerScan = () => {
    toast("Running Sentinel scan...", { duration: 2000 });
    setTimeout(() => {
      toast.success("Sentinel scan complete — 0 new flags detected.");
    }, 2000);
    setFabOpen(false);
  };

  useEffect(() => {
    const loadInterventions = async () => {
        // HOD refresh logic placeholder
    };
    const interval = setInterval(() => {
      loadInterventions();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Local Tab Navigation hidden since sidebar controls this now */}

      {activePage === "overview" && (
        <div className="space-y-6 animate-fade-up">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {kpis.map((k, idx) => {
              const Icon = k.icon;
              const clickable = ["retention", "active", "attendance", "total"].includes(k.id);
              return (
                <div 
                  key={k.label} 
                  onClick={() => handleKpiClick(k.id)}
                  className={`card-warm p-5 border-border/50 transition-all ${k.red ? "card-critical-glow border-red-500/30" : "shadow-md"} ${clickable ? "card-glow-hover cursor-pointer hover:border-accent/40 hover:-translate-y-1" : ""}`}
                  style={{ animationDelay: `${idx * 0.1}s`, animationFillMode: "both" }}
                >
                  <div className="flex items-center gap-2 section-label mb-3"><Icon className="h-4 w-4 text-accent" /> <span className="text-[11px] font-bold tracking-wide">{k.label}</span></div>
                  <p className={`text-3xl font-bold font-mono ${k.red ? "text-red-400" : "gradient-text-gold"}`}>{k.val}</p>
                </div>
              );
            })}
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card-warm p-6 card-glow-hover border-border/50">
              <h3 className="text-[13px] font-bold section-label tracking-widest mb-5">Weekly Risk Trend Line</h3>
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyRiskTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                    <XAxis dataKey="week" tick={{ fill: "#888", fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#888", fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", fontFamily: "var(--font-mono)" }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Line type="monotone" dataKey="critical" stroke="#dc2626" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="atRisk" stroke="#d97706" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="safe" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-warm p-6 card-glow-hover border-border/50 flex flex-col relative">
              {pieFilter && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-surface-warm/80 backdrop-blur-md border border-border/50 px-2 py-1 rounded shadow-sm text-[10px] z-10 font-bold tracking-wide">
                  <span className="text-muted-foreground">Showing: <span className="gradient-text-gold">{pieFilter}</span></span>
                  <button onClick={() => setPieFilter(null)} className="hover:text-chart-critical text-muted-foreground transition-colors"><X className="h-3 w-3" /></button>
                </div>
              )}
              <h3 className="text-[13px] font-bold section-label tracking-widest mb-2">Risk Distribution</h3>
              <p className="text-[10px] text-muted-foreground text-center mb-2 italic">Click a slice to filter</p>
              <div className="w-full h-[300px] cursor-pointer" onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length) {
                  const clickedStatus = e.activePayload[0].name;
                  setPieFilter(clickedStatus === pieFilter ? null : clickedStatus);
                }
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={Object.entries(riskCounts).map(([k,v]) => ({ name: k, value: v }))} 
                      cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                      onClick={(_, index) => {
                        const status = Object.keys(riskCounts)[index];
                        setPieFilter(status);
                        setPieModalOpen(true);
                      }}
                    >
                      {Object.keys(riskCounts).map((key, i) => (
                        <Cell 
                          key={i} 
                          fill={key === "Critical" ? "#dc2626" : key === "Safe" ? "#16a34a" : key === "Observation" ? "#d97706" : "#f97316"}
                          className="hover:opacity-80 transition-opacity outline-none"
                          stroke={pieFilter === key ? "var(--foreground)" : "transparent"}
                          strokeWidth={pieFilter === key ? 2 : 0}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", fontFamily: "var(--font-mono)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activePage === "analytics" && (
        <div className="space-y-6 animate-fade-up">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card-warm p-6 card-glow-hover border-border/50">
              <h3 className="text-[13px] font-bold section-label tracking-widest mb-5">Weekly Risk Trend Line</h3>
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyRiskTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                    <XAxis dataKey="week" tick={{ fill: "#888", fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#888", fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", fontFamily: "var(--font-mono)" }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Line type="monotone" dataKey="critical" stroke="#dc2626" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="atRisk" stroke="#d97706" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="safe" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-warm p-6 card-glow-hover border-border/50 flex flex-col relative">
              {pieFilter && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-surface-warm/80 backdrop-blur-md border border-border/50 px-2 py-1 rounded shadow-sm text-[10px] z-10 font-bold tracking-wide">
                  <span className="text-muted-foreground">Showing: <span className="gradient-text-gold">{pieFilter}</span></span>
                  <button onClick={() => setPieFilter(null)} className="hover:text-chart-critical text-muted-foreground transition-colors"><X className="h-3 w-3" /></button>
                </div>
              )}
              <h3 className="text-[13px] font-bold section-label tracking-widest mb-2">Risk Distribution</h3>
              <p className="text-[10px] text-muted-foreground text-center mb-2 italic">Click a slice to filter</p>
              <div className="w-full h-[300px] cursor-pointer" onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length) {
                  const clickedStatus = e.activePayload[0].name;
                  setPieFilter(clickedStatus === pieFilter ? null : clickedStatus);
                }
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={Object.entries(riskCounts).map(([k,v]) => ({ name: k, value: v }))} 
                      cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                      onClick={(_, index) => {
                        const status = Object.keys(riskCounts)[index];
                        setPieFilter(status);
                        setPieModalOpen(true);
                      }}
                    >
                      {Object.keys(riskCounts).map((key, i) => (
                        <Cell 
                          key={i} 
                          fill={key === "Critical" ? "#dc2626" : key === "Safe" ? "#16a34a" : key === "Observation" ? "#d97706" : "#f97316"}
                          className="hover:opacity-80 transition-opacity outline-none"
                          stroke={pieFilter === key ? "var(--foreground)" : "transparent"}
                          strokeWidth={pieFilter === key ? 2 : 0}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", fontFamily: "var(--font-mono)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activePage === "insights" && (
        <div className="space-y-6 animate-fade-up">
          <div className="flex items-center gap-4 border-b border-border/50 pb-5">
            <div className="h-12 w-12 rounded-xl gradient-maroon flex items-center justify-center glow-maroon shadow-md border border-accent/20">
              <TrendingDown className="h-6 w-6 text-accent animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-syne tracking-wide gradient-text-gold">Dropout Insights AI</h2>
              <p className="text-[11px] section-label mt-1">Department-level predictive macro analysis</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {["Attendance Collapse", "Hidden Talent Loss", "Disengagement", "Academic Overload"].map((p, idx) => (
                <div key={p} className="p-5 card-warm card-glow-hover border-border/50 transition-all" style={{ animationDelay: `${idx * 0.1}s`, animationFillMode: "both" }}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-sm tracking-wide font-syne group-hover:text-accent transition-colors">{p}</h3>
                    <button onClick={() => runMacroAnalysis(p)} disabled={analyzing} className="text-[10px] btn-secondary py-1.5 px-3 rounded-md font-bold transition-all shadow-sm">
                      Analyze with AI
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">Macro pattern currently flagged in the cohort. Sentinel AI can generate a targeted department strategy.</p>
                </div>
              ))}
            </div>

            <div className="card-warm border border-accent/20 p-8 relative overflow-hidden shadow-inner z-10 min-h-[400px]">
              <Cpu className="absolute -right-6 -bottom-6 h-48 w-48 text-accent/10 animate-float" />
              <h3 className="font-bold text-accent mb-6 text-lg font-syne flex items-center gap-3"><Sparkles className="h-5 w-5" /> Strategic Policy Generator</h3>
              {analyzing ? (
                <div className="space-y-4 max-w-sm relative z-10">
                  <div className="h-3 bg-accent/20 rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-accent/20 rounded w-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                  <div className="h-3 bg-accent/20 rounded w-5/6 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                  <div className="h-3 bg-accent/20 rounded w-2/3 animate-pulse" style={{ animationDelay: "0.6s" }}></div>
                </div>
              ) : aiAnalysis ? (
                <div className="text-[13px] text-foreground whitespace-pre-wrap leading-relaxed relative z-10 input-warm border-transparent p-5 rounded-xl shadow-inner bg-surface-warm/50 border border-accent/20 font-medium">
                  {aiAnalysis}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic border border-dashed border-accent/30 p-5 rounded-xl text-center bg-surface-warm/50 shadow-inner relative z-10 mt-10">Select a dropout pattern to generate an automatic policy.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activePage === "audit" && (
        <div className="card-warm overflow-x-auto overflow-hidden animate-fade-up shadow-xl border-border/50 relative z-10 flex flex-col">
          <div className="p-4 bg-surface-warm/50 border-b border-border/50 flex gap-4 items-center justify-between">
            <h3 className="text-[13px] font-bold section-label tracking-widest hidden md:block">Department Audit Log</h3>
            <div className="flex gap-2">
              <select 
                value={auditYearFilter} 
                onChange={(e) => setAuditYearFilter(e.target.value === "All" ? "All" : Number(e.target.value))}
                className="bg-surface border border-border/50 rounded-lg text-xs px-3 py-1.5 focus:outline-none focus:border-accent"
              >
                <option value="All">All Years</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
              <select 
                value={auditStatusFilter} 
                onChange={(e) => setAuditStatusFilter(e.target.value)}
                className="bg-surface border border-border/50 rounded-lg text-xs px-3 py-1.5 focus:outline-none focus:border-accent"
              >
                <option value="All">All Statuses</option>
                <option value="Critical">Critical</option>
                <option value="At-Risk">At-Risk</option>
                <option value="Observation">Observation</option>
                <option value="Safe">Safe</option>
              </select>
            </div>
          </div>
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-surface-warm/30 border-b border-border/50 text-muted-foreground">
              <tr>
                <th className="p-4 font-bold section-label text-[10px]">ID</th>
                <th className="p-4 font-bold section-label text-[10px]">Name</th>
                <th className="p-4 font-bold section-label text-[10px]">Pattern</th>
                <th className="p-4 font-bold section-label text-[10px]">Plan Type</th>
                <th className="p-4 font-bold section-label text-[10px]">Status</th>
                <th className="p-4 font-bold section-label text-[10px] text-right">Wk Flagged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {deptStudents.filter(s => {
                const matchesPie = !pieFilter || s.status === pieFilter;
                const matchesYear = auditYearFilter === "All" || s.year === auditYearFilter;
                const matchesStatus = auditStatusFilter === "All" || s.status === auditStatusFilter;
                return s.interventionStatus !== "None" && matchesPie && matchesYear && matchesStatus;
              }).map(s => {
                const ai = analyzeStudent(s);
                return (
                  <Fragment key={s.id}>
                  <tr className="hover:bg-surface-hover cursor-pointer group transition-all hover:shadow-[0_0_15px_rgba(0,0,0,0.2)]" onClick={() => toggleRow(s.id)}>
                    <td colSpan={6} className="p-0">
                      <div className="flex items-center w-full p-4">
                        <div className="w-1/6 font-mono text-[10px] section-label">{s.id}</div>
                        <div className="w-1/4 font-bold text-[13px] text-foreground group-hover:text-accent transition-colors font-syne tracking-wide flex items-center gap-2">
                           {s.name}
                           <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedRows[s.id] ? "rotate-90 text-accent" : ""}`} />
                        </div>
                        <div className="w-1/4"><span className="bg-surface border border-border/50 px-2.5 py-1.5 rounded-md text-[10px] shadow-sm font-semibold">{ai.pattern}</span></div>
                        <div className="w-1/6 text-[11px] font-medium text-muted-foreground">{ai.interventionType}</div>
                        <div className="w-1/6">
                          <span className={`px-2.5 py-1 rounded-md shadow-sm text-[10px] font-bold tracking-wider ${s.interventionStatus === "Active" ? "badge-observation" : s.interventionStatus === "Pending" ? "badge-critical" : "badge-safe"}`}>
                            {s.interventionStatus}
                          </span>
                        </div>
                        <div className="w-1/12 text-right font-mono font-medium text-muted-foreground">Wk {s.weekTriggered}</div>
                      </div>
                      
                      {expandedRows[s.id] && (
                        <div className="w-full bg-surface/30 p-5 border-t border-border/50 animate-fade-up flex justify-between items-center px-12 shadow-inner" style={{ animationDuration: '0.3s' }}>
                           <div className="flex gap-8 text-xs bg-surface-warm border border-border/50 p-4 rounded-xl shadow-sm">
                             <div className="flex flex-col"><span className="section-label mb-1 uppercase tracking-widest text-[9px]">IAT Score</span><span className="font-mono font-bold text-sm tracking-wide">{s.iat1+s.iat2}</span></div>
                             <div className="flex flex-col"><span className="section-label mb-1 uppercase tracking-widest text-[9px]">Late Subs</span><span className="font-mono font-bold text-yellow-500 text-sm tracking-wide">{s.lateSubmissions}</span></div>
                             <div className="flex flex-col"><span className="section-label mb-1 uppercase tracking-widest text-[9px]">Persona</span><span className="font-bold text-accent text-sm tracking-wide font-syne">{s.persona}</span></div>
                           </div>
                           <div className="flex gap-3">
                             <button onClick={(e) => { e.stopPropagation(); toast.success(`Mentor notified for ${s.name}`); }} className="btn-secondary py-2.5 rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 px-5">
                               Notify Mentor
                             </button>
                             <button onClick={(e) => { e.stopPropagation(); setEscalateTarget(s); }} className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_4px_10px_rgba(239,68,68,0.4)] hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] px-5 py-2.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center hover:scale-[1.02] active:scale-95">
                               Escalate to Principal
                             </button>
                           </div>
                        </div>
                      )}
                    </td>
                  </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-6 right-6 z-50">
        {fabOpen && (
           <>
            <div className="fixed inset-0 bg-background/20 backdrop-blur-sm z-40" onClick={() => setFabOpen(false)} />
            <div className="absolute bottom-16 right-0 z-50 flex flex-col gap-3 mb-2 items-end animate-in slide-in-from-bottom-5">
              <button onClick={handleEscalateAll} className="flex items-center gap-3 bg-card border border-red-500/30 text-red-500 hover:bg-red-500/10 px-4 py-2.5 rounded-full shadow-lg transition-colors group">
                <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">Escalate All Critical</span>
                <AlertOctagon className="h-5 w-5 shrink-0" />
              </button>
              <button onClick={handleDownloadReport} className="flex items-center gap-3 bg-card border border-blue-500/30 text-blue-500 hover:bg-blue-500/10 px-4 py-2.5 rounded-full shadow-lg transition-colors group">
                <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">Download Dept Report</span>
                <Download className="h-5 w-5 shrink-0" />
              </button>
              <button onClick={handleTriggerScan} className="flex items-center gap-3 bg-card border border-accent/40 text-accent hover:bg-accent/10 px-4 py-2.5 rounded-full shadow-lg transition-colors group">
                <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">Trigger Week Scan</span>
                <RefreshCw className="h-5 w-5 shrink-0" />
              </button>
            </div>
           </>
        )}
        <button 
          onClick={() => setFabOpen(!fabOpen)}
          className={`h-14 w-14 rounded-full gradient-maroon text-accent flex items-center justify-center shadow-[0_0_20px_rgba(128,0,0,0.5)] transition-transform duration-300 relative z-50 ${fabOpen ? "rotate-45" : "hover:scale-105"}`}
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Ask Sentinel AI Chat */}
      {activePage === "chat" && (
        <div className="space-y-6 animate-fade-up">
          <div className="card-warm hero-mesh flex flex-col h-[700px] shadow-2xl overflow-hidden max-w-4xl mx-auto w-full rounded-[24px]">
            <div className="bg-surface/60 backdrop-blur-md border-b border-border/50 px-6 py-4 flex items-center gap-4 z-10">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-maroon shadow-md border border-accent/20 glow-maroon">
                <Brain className="h-5 w-5 text-accent animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-syne tracking-wide gradient-text-gold">HOD Strategic Assistant</h3>
                <p className="text-[11px] section-label mt-0.5" >Department-Level Insights AI</p>
              </div>
            </div>
            
            <div className="flex flex-col overflow-y-auto p-5 scroll-smooth flex-1 hide-scrollbar">
              {messages.map((m, i) => (
                <AIMessage key={i} content={m.content} isUser={m.role === "user"} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            <div className="w-full bg-[#1A1C20] border-t border-border/10 p-5 z-10 mt-auto rounded-b-[24px]">
            <form onSubmit={handleSendChat} className="max-w-5xl mx-auto flex items-center gap-3">
              <div className="flex-1 flex items-center bg-[#131417] border border-white/5 rounded-full px-5 py-3.5 focus-within:border-accent/40 focus-within:bg-[#1A1C20] transition-colors shadow-inner">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isTyping}
                  placeholder="Ask about department patterns, retention strategies, or specific risk zones..."
                  className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-[14.5px] text-foreground/90 placeholder:text-muted-foreground/40 disabled:opacity-50"
                />
              </div>
              <button 
                type="submit" 
                disabled={!chatInput.trim() || isTyping} 
                className="h-[52px] px-8 rounded-full bg-[#1A2544] border border-[#2A3F7A]/60 flex items-center justify-center text-accent hover:bg-[#202D52] hover:border-accent/40 transition-all duration-300 disabled:opacity-40 disabled:hover:bg-[#1A2544] disabled:hover:border-[#2A3F7A]/60 shadow-[0_0_15px_rgba(26,37,68,0.5)] flex-shrink-0"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
          </div>
        </div>
      )}

      {/* SEPARATE MODALS */}
      <Dialog open={retentionModalOpen} onOpenChange={setRetentionModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide gradient-text-gold">Semester Over Semester Retention</DialogTitle></DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="space-y-4 animate-fade-up">
              <div className="flex justify-between items-center bg-surface-warm p-5 rounded-xl border border-border/50 shadow-inner">
                <div className="text-center">
                  <p className="text-[10px] section-label uppercase tracking-widest mb-1.5">Previous Sem</p>
                  <p className="text-2xl font-mono font-bold text-muted-foreground">88.2%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-chart-safe" />
                <div className="text-center">
                  <p className="text-[10px] text-accent font-bold uppercase tracking-widest mb-1.5">Current Sem</p>
                  <p className="text-2xl font-mono font-bold text-chart-safe glow-safe">94.2%</p>
                </div>
              </div>
              <p className="text-[13px] text-foreground my-2 leading-relaxed">The department has achieved a <strong className="text-chart-safe">6% increase</strong> in early retention due to the automated Sentinel scaling policies.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeModalOpen} onOpenChange={setActiveModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide gradient-text-gold">Active Interventions Roster</DialogTitle></DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="space-y-3 animate-fade-up">
              {deptStudents.filter(s => s.status === "Critical" || s.status === "Observation").map(s => (
                <div key={s.id} className="flex justify-between items-center p-4 border border-border/50 bg-surface/30 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div>
                    <p className="text-[13px] font-bold font-syne tracking-wide text-foreground mb-1">{s.name}</p>
                    <p className={`text-[10px] uppercase tracking-wider font-bold ${s.status === "Critical" ? "text-chart-critical" : "text-chart-observation"}`}>{s.status}</p>
                  </div>
                  <button onClick={() => toast.success(`Contacting Mentor Dr. R. Meenakshi regarding ${s.name}`)} className="text-[11px] font-bold tracking-wide btn-secondary px-4 py-2 rounded-lg shadow-sm">
                    Contact Mentor
                  </button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={attendanceModalOpen} onOpenChange={setAttendanceModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide gradient-text-gold">Attendance Distribution Matrix</DialogTitle></DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="space-y-4 animate-fade-up text-center">
               <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="bg-surface-warm border border-border/50 p-4 rounded-xl">
                     <p className="text-[10px] section-label font-bold mb-1">Above 85%</p>
                     <p className="text-2xl font-mono font-bold text-chart-safe">{deptStudents.filter(s => s.attendance >= 85).length}</p>
                     <p className="text-[10px] text-muted-foreground">Students</p>
                  </div>
                  <div className="bg-surface-warm border border-border/50 p-4 rounded-xl">
                     <p className="text-[10px] section-label font-bold mb-1">Below 75%</p>
                     <p className="text-2xl font-mono font-bold text-chart-critical">{deptStudents.filter(s => s.attendance < 75).length}</p>
                     <p className="text-[10px] text-muted-foreground">Critical Shortage</p>
                  </div>
               </div>
               <p className="text-muted-foreground text-xs mt-4">Full distribution chart is plotted dynamically depending on course data updates.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={totalModalOpen} onOpenChange={setTotalModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide gradient-text-gold">Department Demographics</DialogTitle></DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="space-y-4 animate-fade-up">
              <table className="w-full text-[13px] text-left border-collapse">
                <thead className="bg-surface-warm/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/50">
                  <tr><th className="p-4 font-bold section-label">Year</th><th className="p-4 font-bold section-label">Count</th><th className="p-4 font-bold section-label">At-Risk</th></tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[2,3,4].map(y => {
                     const group = deptStudents.filter(s => s.year === y);
                     return (
                       <tr key={y} className="hover:bg-surface-hover transition-colors">
                         <td className="p-4 font-bold text-foreground font-syne tracking-wide">Year {y}</td>
                         <td className="p-4 font-mono font-medium">{group.length}</td>
                         <td className="p-4 font-mono font-bold text-chart-observation">{group.filter(s => s.status === "At-Risk" || s.status === "Critical").length}</td>
                       </tr>
                     );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={pieModalOpen} onOpenChange={setPieModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide gradient-text-gold">{pieFilter} Risk Students</DialogTitle></DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 space-y-3">
             {deptStudents.filter(s => s.status === pieFilter).length === 0 ? (
                <p className="text-muted-foreground text-sm text-center">No students found for this risk level.</p>
             ) : (
                deptStudents.filter(s => s.status === pieFilter).map(s => (
                  <div key={s.id} className="flex justify-between items-center p-4 border border-border/50 bg-surface/30 rounded-xl">
                    <div>
                      <p className="text-[13px] font-bold font-syne tracking-wide text-foreground mb-1">{s.name}</p>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">{s.id}</p>
                    </div>
                  </div>
                ))
             )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!escalateTarget} onOpenChange={(open) => { if (!open) setEscalateTarget(null); }}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold font-syne tracking-wide flex items-center gap-2 text-chart-critical">
              <AlertOctagon className="h-5 w-5" /> Confirm Escalation
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="bg-red-500/10 p-3 border border-red-500/20 rounded-xl">
               <p className="text-sm font-bold text-red-500 mb-1">
                 {escalateTarget === "All" ? `Bulk Escalation (${riskCounts.Critical} students)` : `Escalate ${escalateTarget?.name}`}
               </p>
               <p className="text-xs text-red-400">Forwarding to Principal & Management</p>
            </div>
            <textarea 
              className="w-full bg-surface-hover/50 border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent/50 text-foreground resize-none" 
              rows={3} 
              onChange={(e) => setEscalationNote(e.target.value)}
              value={escalationNote}
              placeholder="Add HOD Official Note (Required)..."
            />
            <div className="flex justify-end gap-2 pr-1 mt-2">
              <button onClick={() => { setEscalateTarget(null); setEscalationNote(""); }} className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button 
                onClick={handleEscalateConfirm} 
                className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg shadow-[0_4px_10px_rgba(239,68,68,0.4)] hover:shadow-[0_0_20px_rgba(239,68,68,0.6)]"
              >Confirm Escalation</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
