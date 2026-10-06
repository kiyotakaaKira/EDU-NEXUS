import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { students } from "@/data/students";
import { analyzeStudent } from "@/utils/sentinelAI";
import { Shield, Brain, Cpu, Send, CheckCircle, Clock, AlertTriangle, BookOpen, Plus, Search, Filter, Phone, Mail, MoreVertical, X, Users } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AIMessage, TypingIndicator } from "@/components/ui/AIMessage";
import { askClaude } from "@/utils/claudeAI";
import { sendParentAlertAPI, scheduleMeetingAPI, sendInterventionPlanAPI, getToken } from '@/utils/api';

export default function MentorView({ activePage = "dashboard", setActivePage }: { activePage?: string, setActivePage?: (p: string) => void }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState(students[0]);
  const [scheduleStudent, setScheduleStudent] = useState<any>(null);
  const [alertStudent, setAlertStudent] = useState<any>(null);

  useEffect(() => {
    setActiveTab("All");
  }, [activePage]);
  const [searchQuery, setSearchQuery] = useState("");
  const [fabOpen, setFabOpen] = useState(false);
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>({});
  const [meetingDateStr, setMeetingDateStr] = useState("");

  const stats = [
    { id: "total", label: "Total Mentees", val: students.length },
    { id: "critical", label: "Critical Priority", val: students.filter(s => s.status === "Critical").length },
    { id: "active", label: "Interventions Active", val: students.filter(s => s.interventionStatus === "Active").length },
    { id: "resolved", label: "Resolved Cases", val: students.filter(s => s.interventionStatus === "Resolved").length },
  ];

  const [totalModalOpen, setTotalModalOpen] = useState(false);
  const [criticalModalOpen, setCriticalModalOpen] = useState(false);
  const [activeModalOpen, setActiveModalOpen] = useState(false);
  const [resolvedModalOpen, setResolvedModalOpen] = useState(false);

  const handleKpiClick = (id: string) => {
    if (id === "total") setTotalModalOpen(true);
    if (id === "critical") setCriticalModalOpen(true);
    if (id === "active") setActiveModalOpen(true);
    if (id === "resolved") setResolvedModalOpen(true);
  };

  const filtered = students.filter(s => {
    const matchesTab = 
      activeTab === "All" ? true :
      activeTab === "My Mentees" ? true :
      activeTab === "Critical" ? s.status === "Critical" : true;
      
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  const [oracleResult, setOracleResult] = useState("");
  const [oracleLoading, setOracleLoading] = useState(false);

  const handleOracleAnalyze = async (studentId: string) => {
    setOracleLoading(true);
    const st = students.find(s => s.id === studentId)!;
    const prompt = `You are Sentinel's Dropout Oracle AI. Analyze student ${st.name} (Att: ${st.attendance}%, IAT: ${st.iat1+st.iat2}/100, Sentinel: ${st.sentinelScore}/100, Drift: ${st.driftType}). Generate: 1) Dropout probability %, 2) 3 Root causes, 3) 4-Week Plan, 4) What NOT to do, 5) Exact opening line to say to them.`;
    const res = await askClaude(prompt, "Please run full dropout oracle analysis.");
    setOracleResult(res);
    setOracleLoading(false);
  };

  /* Assistant Chat State */
  const [messages, setMessages] = useState<{role: "assistant"|"user", content: string}[]>([
    { role: "assistant", content: `${user?.name.split(" ")[0]}, you have ${stats[1].val} critical students this week. How can I help you plan today's interventions?` }
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

    const systemPrompt = `You are Sentinel, an AI intervention specialist for mentor ${user?.name}. You know all mentee data. Give specific, actionable intervention advice. Under 150 words.`;
    const response = await askClaude(systemPrompt, userMessage);
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setIsTyping(false);
  };

  const handleParentAlert = async (student: any) => {
    const result = await sendParentAlertAPI({
      studentName: student.name,
      studentId: student.id,
      attendance: student.attendance,
      message: `Urgent: ${student.name} attendance is at ${student.attendance}%`
    }, getToken());
    
    if (result.success) {
      toast.success(result.emailSent 
        ? `Alert sent! Email delivered to parent ✓` 
        : `Alert saved. Email delivery pending.`);
      setAlertStudent(null);
    }
  };

  const handleScheduleMeeting = async (student: any, date: string, time: string) => {
    const result = await scheduleMeetingAPI({
      studentName: student.name,
      studentId: student.id,
      date,
      time,
      studentEmail: ''
    }, getToken());
    
    if (result.success) {
      toast.success(`Meeting scheduled for ${date} at ${time} ✓`);
      if (result.emailSent) toast.success('Confirmation email sent to student');
      setScheduleStudent(null);
    }
  };

  const handleSendPlan = async (student: any, planText: string) => {
    const result = await sendInterventionPlanAPI({
      studentName: student.name,
      studentId: student.id,
      plan: planText,
      studentEmail: ''
    }, getToken());
    
    if (result.success) {
      toast.success(`Plan saved and sent to ${student.name} ✓`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* KPI Strip */}
      {activePage !== "chat" && activePage !== "oracle" && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
        {stats.map((s, idx) => (
          <div key={s.id} onClick={() => handleKpiClick(s.id)} className="card-warm card-glow-hover p-5 border-border/50 shadow-md cursor-pointer transition-all hover:-translate-y-1" style={{ animationDelay: `${idx * 0.1}s`, animationFillMode: "both" }}>
            <p className="text-[11px] font-bold section-label">{s.label}</p>
            <p className="text-3xl font-bold font-mono mt-2 gradient-text-gold">{s.val}</p>
          </div>
        ))}
      </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Side: Mentees & Oracle */}
        <div className="lg:col-span-3 space-y-6">
          {activePage === "mentees" && (
          <div className="card-warm overflow-hidden animate-fade-up shadow-xl border-border/50 z-10 relative">
            <div className="border-b border-border/50 p-4 bg-surface-warm/50 flex flex-col gap-5">
              <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                {["All", "My Mentees", "Critical"].map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === t ? "nav-active btn-primary shadow-sm" : "btn-ghost text-muted-foreground"}`}>
                    {t}
                  </button>
                ))}
              </div>
              
              <div className="relative shadow-inner">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search mentees by name or ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full input-warm pl-10 pr-4 py-3 text-sm focus:border-accent"
                />
              </div>
            </div>
            
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar">
              {filtered.map(s => {
                const ai = analyzeStudent(s);
                return (
                  <div key={s.id} className={`rounded-xl border border-border/50 bg-surface/50 p-4 card-glow-hover shadow-sm relative flex flex-col justify-between transition-all ${s.status === "Critical" ? "card-critical-glow bg-red-500/5 hover:bg-red-500/10" : s.status === "Safe" ? "shadow-[0_0_15px_rgba(74,222,128,0.1)] border-chart-safe/30 hover:bg-chart-safe/5" : ""}`}>
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 cursor-pointer group" onClick={() => { setSelectedStudent(s); handleOracleAnalyze(s.id); setActivePage?.("oracle"); }}>
                          <p className="font-bold text-foreground group-hover:text-accent transition-colors font-syne tracking-wide">{s.name}</p>
                          <p className="text-[10px] section-label mt-1">{s.id}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-2.5 py-1 rounded-md shadow-sm text-[10px] font-bold tracking-wider ${s.status === "Critical" ? "badge-critical" : s.status === "Safe" ? "badge-safe" : "badge-observation"}`}>
                            {s.status}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="text-muted-foreground hover:text-foreground focus:outline-none">
                              <MoreVertical className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border-border min-w-[150px]">
                              <DropdownMenuItem onClick={() => toast.success(`Peer Bridge activated for ${s.name}`)} className="text-xs cursor-pointer focus:bg-surface focus:text-accent">
                                Assign Peer Mentor
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSendPlan(s, `Custom intervention plan generated by Sentinel for ${s.name}: Focus on improving IAT performance and attendance.`)} className="text-xs cursor-pointer focus:bg-surface focus:text-accent">
                                Auto-Gen Intervention
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-border" />
                              <DropdownMenuItem onClick={() => toast.success(`${s.name} escalated to HOD.`)} className="text-xs cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-500">
                                Escalate to HOD
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-4 mb-4 cursor-pointer" onClick={() => { setSelectedStudent(s); handleOracleAnalyze(s.id); setActivePage?.("oracle"); }}>
                        <div className="bg-background border border-border/50 hover:border-accent/30 transition-colors rounded-lg p-2 text-center shadow-sm">
                          <p className="text-[9px] section-label uppercase">Att</p>
                          <p className={`text-sm font-mono font-bold mt-1 ${s.attendance < 75 ? "text-chart-critical" : "text-foreground"}`}>{s.attendance}%</p>
                        </div>
                        <div className="bg-background border border-border/50 hover:border-accent/30 transition-colors rounded-lg p-2 text-center shadow-sm">
                          <p className="text-[9px] section-label uppercase">IAT</p>
                          <p className={`text-sm font-mono font-bold mt-1 ${(s.iat1+s.iat2) < 50 ? "text-orange-400" : "text-foreground"}`}>{s.iat1+s.iat2}</p>
                        </div>
                        <div 
                          className="bg-background border-2 hover:border-accent/80 transition-colors rounded-full aspect-square flex flex-col items-center justify-center relative shadow-sm w-[52px] h-[52px] mx-auto" 
                          style={{ borderColor: s.sentinelScore >= 75 ? 'hsl(142 71% 45%)' : s.sentinelScore >= 50 ? 'hsl(25 95% 53%)' : 'hsl(0 72% 51%)' }}
                        >
                          <p className="text-[8px] section-label mb-0.5 leading-none">Score</p>
                          <p className={`text-sm font-mono font-bold leading-none ${s.sentinelScore >= 75 ? "text-chart-safe" : s.sentinelScore >= 50 ? "text-chart-observation" : "text-chart-critical"}`}>{s.sentinelScore}</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground italic line-clamp-2 border-l-2 border-accent/70 pl-3 py-1 mb-2">
                        {ai.recommendation}
                      </p>
                      
                      {studentNotes[s.id] && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-2 rounded mb-2 flex justify-between items-start group">
                          <p className="text-[10px] text-yellow-500 flex-1">{studentNotes[s.id]}</p>
                          <button onClick={() => {
                            const newNotes = {...studentNotes};
                            delete newNotes[s.id];
                            setStudentNotes(newNotes);
                          }} className="text-yellow-500/50 hover:text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => setScheduleStudent(s)} className="flex-1 btn-secondary py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all shadow-sm">
                        Schedule Meeting
                      </button>
                      
                      {s.status === "Critical" && (
                        <button onClick={() => setAlertStudent(s)} className="flex-1 shrink-0 bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_4px_10px_rgba(239,68,68,0.4)] hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95">
                          <AlertTriangle className="h-3 w-3" /> Parent Alert
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {/* Dropout Oracle Panel */}
          {activePage === "oracle" && (
          <div className="card-warm p-8 overflow-hidden relative min-h-[500px] animate-fade-up z-10 border border-accent/20">
            <Cpu className="absolute -right-6 -bottom-6 h-48 w-48 text-accent/10 animate-float" />
            <h3 className="text-xl font-bold gradient-text-gold font-syne flex items-center gap-3 mb-6"><Cpu className="h-6 w-6 text-accent" /> Dropout Oracle AI Analysis</h3>
            <p className="text-sm font-medium mb-6">Currently analyzing: <strong className="text-accent tracking-wide">{selectedStudent.name}</strong></p>
            
            {oracleLoading ? (
              <div className="space-y-4 max-w-lg">
                <div className="h-4 bg-accent/20 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-accent/20 rounded w-3/4 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                <div className="h-4 bg-accent/20 rounded w-5/6 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
              </div>
            ) : oracleResult ? (
              <div className="input-warm border border-accent/20 p-5 rounded-2xl text-[13px] text-foreground whitespace-pre-wrap leading-relaxed shadow-inner">
                {oracleResult}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic mt-10 p-6 border border-dashed border-accent/30 rounded-2xl bg-surface-warm/50 text-center shadow-inner">Select a student from the Dashboard list to generate an oracle analysis. Since you are in the standalone Oracle view, it is displaying the last selected mentee ({selectedStudent.name}).</div>
            )}
          </div>
          )}
        </div>

        {/* Mentor Sentinel Chat (Ask Sentinel AI) */}
        {activePage === "chat" && (
        <div className="lg:col-span-3 space-y-6 animate-fade-up">
          <div className="card-warm hero-mesh flex flex-col h-[700px] shadow-2xl overflow-hidden max-w-4xl mx-auto w-full rounded-[24px]">
            <div className="bg-surface/60 backdrop-blur-md border-b border-border/50 px-6 py-4 flex items-center gap-4 z-10">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-maroon shadow-md border border-accent/20 glow-maroon">
                <Brain className="h-5 w-5 text-accent animate-sentinel-beat" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-syne tracking-wide gradient-text-gold">Mentor Assistant</h3>
                <p className="text-[11px] section-label mt-0.5" >Intervention Specialist AI</p>
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
                  placeholder="Ask about interventions..."
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

        {/* Intervention Log (Interventions Page only) */}
        {activePage === "plans" && (
        <div className="lg:col-span-3 space-y-6 animate-fade-up">
          <div className="card-warm p-6 card-glow-hover">
            <h3 className="text-xl font-bold font-syne mb-6 flex items-center gap-3 tracking-wide"><Clock className="h-6 w-6 text-accent" /> Recent Interventions</h3>
            <div className="space-y-4">
              {students.filter(s => s.interventionStatus !== "None").slice(0, 5).map((s, idx) => (
                <div key={s.id} className="text-[13px] px-5 py-4 rounded-xl border border-border/50 bg-surface-warm flex justify-between items-center transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md cursor-pointer group" style={{ animationDelay: `${idx * 0.1}s`, animationFillMode: "both" }}>
                  <div>
                    <p className="font-bold text-foreground group-hover:text-accent transition-colors tracking-wide font-syne">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">{analyzeStudent(s).interventionType}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span className={`px-2.5 py-1 rounded-md shadow-sm text-[10px] font-bold tracking-wider ${s.interventionStatus === "Active" ? "badge-observation" : s.interventionStatus === "Pending" ? "badge-critical" : "badge-safe"}`}>
                      {s.interventionStatus}
                    </span>
                    <p className="text-[9px] section-label">Wk {s.weekTriggered}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* Peer Bridge */}
        {activePage === "peerbridge" && (
        <div className="lg:col-span-3 space-y-6 animate-fade-up">
          <div className="card-warm p-6 border-border/50 shadow-xl">
            <div className="flex items-center gap-4 mb-6 border-b border-border/50 pb-5">
              <div className="h-10 w-10 rounded-xl gradient-maroon flex items-center justify-center glow-maroon shadow-md">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-syne tracking-wide gradient-text-gold">Peer Bridge</h2>
                <p className="text-[11px] section-label mt-0.5">AI-suggested peer pairings for collaborative learning</p>
              </div>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Active Pairs", val: "8", color: "text-chart-safe" },
                { label: "Study Sessions", val: "14", color: "text-blue-400" },
                { label: "Avg Improvement", val: "+12%", color: "text-chart-observation" },
              ].map((k, i) => (
                <div key={i} className="p-4 rounded-xl bg-surface-warm border border-border/50 text-center">
                  <p className="text-[10px] section-label font-bold mb-1">{k.label}</p>
                  <p className={`text-3xl font-mono font-bold ${k.color}`}>{k.val}</p>
                </div>
              ))}
            </div>

            {/* Peer Pairings */}
            <h3 className="text-[11px] font-bold section-label tracking-widest mb-4">Sentinel-Suggested Peer Pairs</h3>
            <div className="space-y-3">
              {[
                { mentor: "Sanjay R.", mentee: "Priya D.", reason: "Strong IAT performer paired with below-pass student. Same department.", tag: "Academic Support", tagColor: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
                { mentor: "Karthik S.", mentee: "Arun Kumar", reason: "Top attendance with peer who has 68.5%. Can motivate regularity.", tag: "Attendance Boost", tagColor: "text-chart-safe bg-chart-safe/10 border-chart-safe/20" },
                { mentor: "Rahul G.", mentee: "Meera J.", reason: "High model exam scorer paired with low model exam achiever.", tag: "Exam Strategy", tagColor: "text-chart-observation bg-chart-observation/10 border-chart-observation/20" },
                { mentor: "Deepak V.", mentee: "Anitha B.", reason: "Both at-risk — mutual accountability pair with weekly check-ins.", tag: "Accountability", tagColor: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
              ].map((pair, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-surface-warm/50 border border-border/50 hover:border-accent/30 transition-all">
                  <div className="flex items-center gap-2 min-w-[200px]">
                    <div className="h-8 w-8 rounded-full gradient-maroon flex items-center justify-center shadow-sm flex-shrink-0">
                      <span className="text-[10px] font-bold text-accent">{pair.mentor.split(" ")[0][0]}{pair.mentor.split(" ")[1]?.[0]}</span>
                    </div>
                    <div>
                      <p className="text-[12px] font-bold font-syne">{pair.mentor}</p>
                      <p className="text-[9px] section-label">Peer Mentor</p>
                    </div>
                    <div className="mx-2 text-accent/50 font-bold">→</div>
                    <div>
                      <p className="text-[12px] font-bold font-syne">{pair.mentee}</p>
                      <p className="text-[9px] section-label">Peer Mentee</p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{pair.reason}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${pair.tagColor}`}>{pair.tag}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-border/50 flex justify-end gap-3">
              <button onClick={() => toast.success("Pair groups notified via email!")} className="btn-primary text-[11px] font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md glow-maroon">
                Notify All Pairs
              </button>
            </div>
          </div>
        </div>
        )}


      </div>

      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-6 right-6 z-50">
        {fabOpen && (
           <>
            <div className="fixed inset-0 bg-background/20 backdrop-blur-sm z-40" onClick={() => setFabOpen(false)} />
            <div className="absolute bottom-16 right-0 z-50 flex flex-col gap-3 mb-2 items-end animate-in slide-in-from-bottom-5">
              <button 
                onClick={() => { toast.success("Automated check-in emails dispatched to all mentees."); setFabOpen(false); }} 
                className="flex items-center gap-3 bg-card border border-blue-500/30 text-blue-500 hover:bg-blue-500/10 px-4 py-2.5 rounded-full shadow-lg transition-colors group"
              >
                <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 whitespace-nowrap">Mass Check-in Ping</span>
                <Mail className="h-5 w-5 shrink-0" />
              </button>
              <button 
                onClick={() => { toast.success("Intervention Log exported successfully."); setFabOpen(false); }} 
                className="flex items-center gap-3 bg-card border border-accent/40 text-accent hover:bg-accent/10 px-4 py-2.5 rounded-full shadow-lg transition-colors group"
              >
                <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 whitespace-nowrap">Export Log</span>
                <BookOpen className="h-5 w-5 shrink-0" />
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
      {/* MODALS */}
      <Dialog open={totalModalOpen} onOpenChange={setTotalModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide gradient-text-gold">Total Mentees</DialogTitle></DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
             <p className="text-3xl font-mono font-bold text-foreground mb-2">{stats[0].val}</p>
             <p className="text-[13px] leading-relaxed">Active mentees assigned to you for this semester.</p>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={criticalModalOpen} onOpenChange={setCriticalModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide text-chart-critical">Critical Priority</DialogTitle></DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
             <p className="text-3xl font-mono font-bold text-chart-critical mb-2">{stats[1].val}</p>
             <p className="text-[13px] leading-relaxed">Students requiring immediate parent outreach and HOD escalation.</p>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={activeModalOpen} onOpenChange={setActiveModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide gradient-text-gold">Active Interventions</DialogTitle></DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
             <p className="text-3xl font-mono font-bold text-foreground mb-2">{stats[2].val}</p>
             <p className="text-[13px] leading-relaxed">Mentees currently undergoing academic recovery programs.</p>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={resolvedModalOpen} onOpenChange={setResolvedModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide text-chart-safe">Resolved Cases</DialogTitle></DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
             <p className="text-3xl font-mono font-bold text-chart-safe mb-2">{stats[3].val}</p>
             <p className="text-[13px] leading-relaxed">Successful interventions resulting in student re-engagement.</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!scheduleStudent} onOpenChange={(open) => { if (!open) setScheduleStudent(null); }}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold font-syne tracking-wide gradient-text-gold">Schedule Meeting</DialogTitle>
          </DialogHeader>
          {scheduleStudent && (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-bold text-foreground">With: {scheduleStudent.name}</p>
              <input type="datetime-local" onChange={(e) => setMeetingDateStr(e.target.value)} className="w-full bg-surface-hover/50 border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent/50 text-foreground" />
              <textarea 
                className="w-full bg-surface-hover/50 border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent/50 text-foreground resize-none" 
                rows={2} 
                placeholder="Meeting Agenda..."
              />
              <div className="flex justify-end gap-2 pr-1 mt-2">
                <button onClick={() => setScheduleStudent(null)} className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button 
                  onClick={() => { 
                    const d = new Date(meetingDateStr || Date.now());
                    handleScheduleMeeting(scheduleStudent, d.toLocaleDateString(), d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
                  }} 
                  className="px-5 py-2 text-xs font-bold btn-primary rounded-lg shadow-md"
                >Confirm Appointment</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!alertStudent} onOpenChange={(open) => { if (!open) setAlertStudent(null); }}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold font-syne tracking-wide flex items-center gap-2 text-chart-critical">
              <AlertTriangle className="h-5 w-5" /> Initiate Parent Alert
            </DialogTitle>
          </DialogHeader>
          {alertStudent && (
            <div className="flex flex-col gap-4">
              <div className="bg-red-500/10 p-3 border border-red-500/20 rounded-xl">
                 <p className="text-sm font-bold text-red-500 mb-1">Target: Parent of {alertStudent.name}</p>
                 <p className="text-xs text-red-400">Reason: High Risk / Poor Academic Trajectory</p>
              </div>
              
              <div className="flex flex-col gap-2 mt-2">
                <button onClick={() => handleParentAlert(alertStudent)} className="flex items-center gap-3 p-3 bg-surface hover:bg-surface-hover border border-border rounded-xl text-sm font-bold transition-all text-left group">
                  <div className="bg-accent/10 p-2 rounded-lg group-hover:bg-accent/20"><Phone className="h-4 w-4 text-accent" /></div>
                  <div className="flex-1">Send Automated SMS <p className="text-[10px] text-muted-foreground font-normal">Immediate delivery</p></div>
                </button>
                <button onClick={() => handleParentAlert(alertStudent)} className="flex items-center gap-3 p-3 bg-surface hover:bg-surface-hover border border-border rounded-xl text-sm font-bold transition-all text-left group">
                  <div className="bg-blue-500/10 p-2 rounded-lg group-hover:bg-blue-500/20"><Mail className="h-4 w-4 text-blue-400" /></div>
                  <div className="flex-1">Send Official Email <p className="text-[10px] text-muted-foreground font-normal">Formal warning template</p></div>
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
