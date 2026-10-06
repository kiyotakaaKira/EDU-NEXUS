import { useState, useRef, useEffect, Fragment } from "react";
import { useAuth } from "@/context/AuthContext";
import { students } from "@/data/students";
import { analyzeStudent } from "@/utils/sentinelAI";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, CartesianGrid } from "recharts";
import { Search, Download, Plus, AlertCircle, ChevronDown, ChevronUp, BookOpen, Send, Shield, Sparkles, UserCheck, Activity, BrainCircuit, FileText } from "lucide-react";
import { toast } from "sonner";
import { askClaude } from "@/utils/claudeAI";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AIMessage, TypingIndicator } from "@/components/ui/AIMessage";
import { generateReportAPI, getToken } from '@/utils/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function TeacherView({ activePage = "dashboard" }: { activePage?: string }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Show All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Name (A-Z)");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedStudentForNote, setSelectedStudentForNote] = useState<any>(null);
  const [noteText, setNoteText] = useState("");
  const [fabOpen, setFabOpen] = useState(false);
  const [loadingReport, setLoadingReport] = useState<string | null>(null);
  
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  const [avgModalOpen, setAvgModalOpen] = useState(false);
  const [belowPassModalOpen, setBelowPassModalOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [interventionModalOpen, setInterventionModalOpen] = useState(false);
  const [localStudents, setLocalStudents] = useState(() => students.map(s => ({
    ...s,
    // explicitly mask fields the teacher shouldn't see directly
    lmsActivity: undefined,
    driftType: undefined,
    reasoningNote: undefined,
    interventionStatus: undefined
  })));

  useEffect(() => {
    if (activePage === "atrisk") setActiveTab("Critical Only");
    else if (activePage === "overview") setActiveTab("Show All");
  }, [activePage]);

  const classStudents = localStudents;

  let displayStudents = classStudents.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    
    // In Teacher view context:
    // Safe = (iat1+iat2)>=70 AND attendance>=75
    // Critical = (iat1+iat2)<50 OR attendance<65
    // At-Risk = between
    const total = s.iat1 + s.iat2;
    const isCritical = total < 50 || s.attendance < 65;
    const isSafe = total >= 70 && s.attendance >= 75;
    const isAtRisk = !isCritical && !isSafe;

    if (activeTab === "Critical Only") return isCritical;
    if (activeTab === "At-Risk Only") return isAtRisk;
    if (activeTab === "Safe Only") return isSafe;
    return true;
  });

  if (sortBy === "Name (A-Z)") {
    displayStudents.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "Attendance (Low-High)") {
    displayStudents.sort((a, b) => a.attendance - b.attendance);
  } else if (sortBy === "Sentinel Score (Low-High)") {
    displayStudents.sort((a, b) => a.sentinelScore - b.sentinelScore);
  }

  const avgIat = Math.round(classStudents.reduce((acc, s) => acc + (s.iat1 + s.iat2), 0) / classStudents.length);
  const belowPass = classStudents.filter(s => (s.iat1 + s.iat2) < 50).length;
  const avgAtt = Math.round(classStudents.reduce((acc, s) => acc + s.attendance, 0) / classStudents.length);
  const interventionNeeded = classStudents.filter(s => analyzeStudent(s).riskLevel !== "Low" && (s.iat1 + s.iat2) >= 50).length;

  const distData = [
    { range: "<50", count: classStudents.filter(s => (s.iat1 + s.iat2) < 50).length },
    { range: "50-60", count: classStudents.filter(s => (s.iat1 + s.iat2) >= 50 && (s.iat1 + s.iat2) < 60).length },
    { range: "60-75", count: classStudents.filter(s => (s.iat1 + s.iat2) >= 60 && (s.iat1 + s.iat2) < 75).length },
    { range: "75-90", count: classStudents.filter(s => (s.iat1 + s.iat2) >= 75 && (s.iat1 + s.iat2) < 90).length },
    { range: ">90", count: classStudents.filter(s => (s.iat1 + s.iat2) >= 90).length },
  ];

  /* Chatbot state */
  const [messages, setMessages] = useState<{role: "assistant"|"user", content: string}[]>([
    { role: "assistant", content: `${user?.name.split(" ")[0]}, I've analyzed your class of ${classStudents.length} students. ${interventionNeeded} are at risk. Would you like teaching strategy suggestions for the most common weak areas?` }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  /* Quick Entry State */
  const [quickEntryId, setQuickEntryId] = useState("");
  const [quickEntryMarks, setQuickEntryMarks] = useState("");

  const handleQuickEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickEntryId && quickEntryMarks) {
      const studentId = quickEntryId.toUpperCase();
      const marks = parseInt(quickEntryMarks) || 0;
      
      const studentExists = localStudents.find(s => s.id === studentId);
      if (!studentExists) {
        toast.error(`Student with ID ${studentId} not found`);
        return;
      }

      setLocalStudents(prev => prev.map(s => 
        s.id === studentId ? { ...s, iat1: marks } : s
      ));
      
      toast.success(`IAT-1 marks updated for ${studentExists.name} (${studentId})`);
      setQuickEntryId("");
      setQuickEntryMarks("");
    }
  };

  const handleMarkChange = (studentId: string, field: "iat1" | "iat2" | "model", value: string) => {
    const numValue = parseInt(value) || 0;
    setLocalStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, [field]: numValue } : s
    ));
  };

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, isTyping]);

  const handleSendChat = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isTyping) return;
    
    const userMessage = chatInput.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");
    setIsTyping(true);

    const systemPrompt = `You are Sentinel, an AI teaching assistant for ${user?.name} at Chennai Institute of Technology. You analyze class performance patterns and suggest teaching strategies specific to Anna University syllabus. Class average IAT is ${avgIat}/100. ${belowPass} students are failing. Be concise, practical, and list specific methods. Under 150 words.`;
    
    const response = await askClaude(systemPrompt, userMessage);
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setIsTyping(false);
  };

  const handleDownloadReport = async () => {
    toast("Generating class report...");
    generatePDF("Class Report");
    const result = await generateReportAPI({ reportType: "Class Report" }, getToken());
    if (result.success) toast.success("Class report exported to Excel ✓");
  };

  const generatePDF = (reportType: string) => {
    setLoadingReport(reportType);
    toast(`Preparing PDF: ${reportType}...`);
    
    setTimeout(() => {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(reportType, 14, 22);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      doc.text(`Class Teacher: ${user?.name || ''}`, 14, 35);
      doc.text(`Total Students: ${classStudents.length}`, 14, 40);

      let head = [['ID', 'Name', 'Attendance', 'IAT-1', 'IAT-2', 'Model', 'Status']];
      let body = classStudents.map(s => [
        s.id,
        s.name,
        `${s.attendance}%`,
        s.iat1.toString(),
        s.iat2.toString(),
        s.model.toString(),
        (s.iat1 + s.iat2) < 50 ? 'Below Pass' : 'Safe'
      ]);

      if (reportType === "Attendance Summary") {
        head = [['ID', 'Name', 'Attendance', 'Status']];
        body = classStudents.map(s => [
          s.id,
          s.name,
          `${s.attendance}%`,
          s.attendance < 75 ? 'Critical' : 'Good'
        ]);
      } else if (reportType === "IAT Analysis") {
        head = [['ID', 'Name', 'IAT Total', 'Risk']];
        body = classStudents.map(s => [
          s.id,
          s.name,
          (s.iat1 + s.iat2).toString(),
          analyzeStudent(s).riskLevel
        ]);
      }

      autoTable(doc, {
        startY: 45,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [26, 37, 68] },
      });

      doc.save(`${reportType.replace(/\\s+/g, '_')}.pdf`);
      setLoadingReport(null);
      toast.success(`${reportType} downloaded successfully!`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Stats - Show on all except chat */}
      {activePage !== "chat" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
          {[
            { id: "avg", label: "Class Avg IAT", val: `${avgIat}/100`, color: "text-blue-400" },
            { id: "below", label: "Below Pass Marking", val: belowPass, color: "text-chart-critical" },
            { id: "att", label: "Class Avg Attendance", val: `${avgAtt}%`, color: avgAtt >= 75 ? "text-chart-safe" : "text-orange-400" },
            { id: "int", label: "Need Intervention", val: interventionNeeded, color: "text-chart-observation" },
          ].map((s, i) => (
            <div key={i} onClick={() => {
                if (s.id === "avg") setAvgModalOpen(true);
                if (s.id === "below") setBelowPassModalOpen(true);
                if (s.id === "att") setAttendanceModalOpen(true);
                if (s.id === "int") setInterventionModalOpen(true);
              }}
              className="card-warm card-glow-hover p-5 border-border/50 shadow-md cursor-pointer transition-all hover:-translate-y-1" style={{ animationDelay: `${i * 0.1}s`, animationFillMode: "both" }}>
              <p className="text-[11px] font-bold section-label">{s.label}</p>
              <p className={`text-3xl font-bold font-mono mt-2 ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Main Content (Table + Chart) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Class Health Summary & Distribution (Dashboard Only) */}
          {activePage === "overview" && (
            <div className="grid md:grid-cols-2 gap-6 animate-fade-up z-10">
              <div className="card-warm p-6 card-glow-hover border-border/50">
                <h3 className="text-[13px] font-bold section-label tracking-widest mb-3">Class Health Summary</h3>
            <div className="w-full h-5 mt-3 mb-3 rounded-full overflow-hidden flex shadow-inner border border-border/50 bg-surface-warm">
              <div 
                className="bg-chart-safe hover:brightness-110 transition-all shadow-[0_0_10px_rgba(74,222,128,0.3)] animate-progress flex items-center justify-center overflow-hidden" 
                style={{ "--target-width": `${(classStudents.length - interventionNeeded - belowPass) / classStudents.length * 100}%` } as any} 
                title={`Safe: ${classStudents.length - interventionNeeded - belowPass}`}
              >
                {(classStudents.length - interventionNeeded - belowPass) > 5 && <span className="text-[9px] font-bold text-white whitespace-nowrap">{classStudents.length - interventionNeeded - belowPass} Safe</span>}
              </div>
              <div 
                className="bg-chart-observation hover:brightness-110 transition-all shadow-[0_0_10px_rgba(250,204,21,0.3)] animate-progress flex items-center justify-center overflow-hidden" 
                style={{ "--target-width": `${interventionNeeded / classStudents.length * 100}%` } as any} 
                title={`At-Risk: ${interventionNeeded}`}
              >
                {interventionNeeded > 5 && <span className="text-[9px] font-bold text-black/80 whitespace-nowrap">{interventionNeeded} At-Risk</span>}
              </div>
              <div 
                className="bg-chart-critical hover:brightness-110 transition-all shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-progress flex items-center justify-center overflow-hidden" 
                style={{ "--target-width": `${belowPass / classStudents.length * 100}%` } as any} 
                title={`Critical/Below Pass: ${belowPass}`}
              >
                {belowPass > 5 && <span className="text-[9px] font-bold text-white whitespace-nowrap">{belowPass} Critical</span>}
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-2 mb-6">
               <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-chart-safe glow-safe"></span> Safe Zone</span>
               <span className="flex items-center gap-1.5 ">Intervention Zone <span className="w-2 h-2 rounded-full bg-chart-critical glow-critical"></span></span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
              <div>
                <p className="text-[10px] font-bold section-label uppercase mb-3 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-chart-critical"></span> Critical Attention
                </p>
                <div className="space-y-2">
                  {classStudents.filter(s => (s.iat1 + s.iat2) < 50).slice(0, 3).map(s => (
                    <div key={s.id} className="flex justify-between items-center bg-surface/40 p-2 rounded-lg border border-border/30">
                      <span className="text-[11px] font-bold truncate pr-2">{s.name}</span>
                      <span className="text-[10px] font-mono text-chart-critical font-bold">{s.iat1 + s.iat2}</span>
                    </div>
                  ))}
                  {belowPass === 0 && <p className="text-[11px] text-muted-foreground italic">No critical students</p>}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold section-label uppercase mb-3 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-chart-safe"></span> Top Performers
                </p>
                <div className="space-y-2">
                  {classStudents.filter(s => (s.iat1 + s.iat2) > 85).slice(0, 3).map(s => (
                    <div key={s.id} className="flex justify-between items-center bg-surface/40 p-2 rounded-lg border border-border/30">
                      <span className="text-[11px] font-bold truncate pr-2">{s.name}</span>
                      <span className="text-[10px] font-mono text-chart-safe font-bold">{s.iat1 + s.iat2}</span>
                    </div>
                  ))}
                  {classStudents.filter(s => (s.iat1 + s.iat2) > 85).length === 0 && <p className="text-[11px] text-muted-foreground italic">None currently above 85%</p>}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between p-3 rounded-xl bg-accent/5 border border-accent/10">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-[10px] section-label font-bold uppercase leading-none">Intervention Success</p>
                  <p className="text-[11px] text-muted-foreground mt-1">4 resolved this week</p>
                </div>
              </div>
              <span className="text-sm font-bold font-mono text-accent">82%</span>
            </div>
          </div>
          
          <div className="card-warm p-6 card-glow-hover border-border/50">
            <h3 className="text-[13px] font-bold section-label tracking-widest mb-5">IAT Score Distribution</h3>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distData}>
                  <XAxis dataKey="range" tick={{ fill: "#888", fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", fontFamily: "var(--font-mono)" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {distData.map((d, i) => <Cell key={i} fill={d.range === "<50" ? "#dc2626" : d.range === ">90" ? "#16a34a" : "#d97706"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Table Section (Marks, At-Risk, Dashboard) */}
      {(activePage === "overview" || activePage === "atrisk") && (
        <div className="card-warm overflow-hidden animate-fade-up shadow-xl border-border/50 relative z-10">
          <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-5 justify-between items-center bg-surface-warm/50">
              <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                {["Show All", "Critical Only", "At-Risk Only", "Safe Only"].map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === t ? "nav-active btn-primary shadow-sm" : "btn-ghost text-muted-foreground"}`}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                <form onSubmit={handleQuickEntrySubmit} className="flex gap-2 input-warm rounded-xl p-1.5 items-center mr-2 shadow-inner">
                   <input 
                     type="text" 
                     placeholder="ID (e.g. S01)" 
                     value={quickEntryId}
                     onChange={e => setQuickEntryId(e.target.value)}
                     className="w-24 bg-transparent text-xs text-foreground px-2 focus:outline-none placeholder:text-muted-foreground/50 uppercase font-bold tracking-widest" 
                   />
                   <div className="w-px bg-border/50 h-5" />
                   <input 
                     type="number" 
                     placeholder="Marks" 
                     value={quickEntryMarks}
                     onChange={e => setQuickEntryMarks(e.target.value)}
                     className="w-16 bg-transparent text-xs font-mono font-bold text-foreground px-2 focus:outline-none placeholder:text-muted-foreground/50" 
                     max="100"
                     min="0"
                   />
                   <button type="submit" disabled={!quickEntryId || !quickEntryMarks} className="bg-accent/15 text-accent hover:bg-accent hover:text-maroon transition-colors p-1.5 rounded-lg disabled:opacity-50">
                     <Send className="h-3.5 w-3.5" />
                   </button>
                </form>

                <div className="relative flex-1 sm:w-48 shadow-inner rounded-xl">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="text" placeholder="Search name/ID..." value={search} onChange={e => setSearch(e.target.value)} className="w-full input-warm pl-10 pr-4 py-2.5 text-xs focus:border-accent" />
                </div>
                
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-surface border border-border/50 text-foreground text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-accent"
                >
                  <option value="Name (A-Z)">Sort: Name</option>
                  <option value="Attendance (Low-High)">Sort: Attendance</option>
                  <option value="Sentinel Score (Low-High)">Sort: Score</option>
                </select>

                <button onClick={handleDownloadReport} className="btn-ghost p-2.5 rounded-xl border border-transparent hover:border-border transition-colors flex items-center justify-center bg-surface hover:bg-surface-hover">
                  <Download className="h-4 w-4 text-muted-foreground hover:text-white" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="border-b border-border text-muted-foreground bg-surface-warm/30">
                  <tr>
                    <th className="p-4 font-bold section-label text-[10px]">Student</th>
                    <th className="p-4 font-bold section-label text-[10px]">IAT1</th>
                    <th className="p-4 font-bold section-label text-[10px]">IAT2</th>
                    <th className="p-4 font-bold section-label text-[10px]">Total</th>
                    <th className="p-4 font-bold section-label text-[10px]">Model</th>
                    <th className="p-4 font-bold section-label text-[10px]">Att%</th>
                    <th className="p-4 font-bold section-label text-[10px] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {displayStudents.map(s => {
                    const total = s.iat1 + s.iat2;
                    return (
                        <tr key={s.id} className="hover:bg-surface-hover hover:shadow-[0_0_15px_rgba(0,0,0,0.2)] transition-all cursor-pointer group" onClick={() => { setSelectedProfile(s); setProfileModalOpen(true); }}>
                          <td className="p-4">
                            <div className="font-bold text-[13px] text-foreground group-hover:text-accent transition-colors font-syne tracking-wide">{s.name}</div>
                            <div className="font-mono text-[10px] section-label mt-1">{s.id}</div>
                          </td>
                          <td className="p-4 font-mono font-medium">{s.iat1}</td>
                          <td className="p-4 font-mono font-medium">{s.iat2}</td>
                          <td className={`p-4 font-mono font-bold ${total < 50 ? "text-chart-critical" : "text-chart-safe"}`}>{total}</td>
                          <td className="p-4 font-mono font-medium">{s.model}</td>
                          <td className={`p-4 font-mono font-bold ${s.attendance < 75 ? "text-chart-critical" : "text-foreground"}`}>{s.attendance}%</td>
                          <td className="p-4 text-right">
                            <button className="text-[10px] font-bold btn-ghost px-3 py-1.5 rounded-lg border border-accent/30 text-accent hover:bg-accent/10 transition-all shadow-sm">
                              View Profile
                            </button>
                          </td>
                        </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mark Entry Page */}
        {activePage === "markentry" && (
          <div className="space-y-6 animate-fade-up">
            <div className="card-warm p-6 border-border/50 shadow-xl">
              <div className="flex items-center gap-4 mb-6 border-b border-border/50 pb-5">
                <div className="h-10 w-10 rounded-xl gradient-maroon flex items-center justify-center glow-maroon shadow-md">
                  <BookOpen className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-syne tracking-wide gradient-text-gold">Mark Entry Desk</h2>
                  <p className="text-[11px] section-label mt-0.5">Enter IAT / Model / Assignment marks per student</p>
                </div>
              </div>

              {/* Real-time Health Bar in Mark Entry Desk */}
              <div className="mb-8 p-4 rounded-2xl bg-surface/30 border border-border/30">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[10px] font-bold section-label uppercase tracking-widest">Impact on Class Health</p>
                  <div className="flex gap-4 text-[9px] font-bold opacity-70">
                    <span className="text-chart-safe">SAFE: {classStudents.length - interventionNeeded - belowPass}</span>
                    <span className="text-chart-observation">AT-RISK: {interventionNeeded}</span>
                    <span className="text-chart-critical">CRITICAL: {belowPass}</span>
                  </div>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-surface-warm border border-border/20 shadow-inner">
                  <div className="bg-chart-safe transition-all duration-500" style={{ width: `${(classStudents.length - interventionNeeded - belowPass) / classStudents.length * 100}%` }} />
                  <div className="bg-chart-observation transition-all duration-500" style={{ width: `${interventionNeeded / classStudents.length * 100}%` }} />
                  <div className="bg-chart-critical transition-all duration-500" style={{ width: `${belowPass / classStudents.length * 100}%` }} />
                </div>
              </div>

              {/* Exam type selector */}
              <div className="flex gap-3 mb-6 flex-wrap">
                {["IAT-1", "IAT-2", "Model Exam", "Assignment"].map(exam => (
                  <button key={exam} className="px-4 py-2 rounded-lg text-xs font-bold transition-all btn-ghost border border-border/50 hover:btn-primary hover:border-accent/30">
                    {exam}
                  </button>
                ))}
                <span className="ml-auto text-[11px] text-muted-foreground font-bold my-auto section-label">Max Marks: 50</span>
              </div>

              {/* Marks Table */}
              <div className="overflow-x-auto rounded-xl border border-border/50">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-surface-warm/50 border-b border-border/50">
                    <tr>
                      <th className="text-left p-4 text-[10px] font-bold section-label tracking-widest">Student ID</th>
                      <th className="text-left p-4 text-[10px] font-bold section-label tracking-widest">Name</th>
                      <th className="text-center p-4 text-[10px] font-bold section-label tracking-widest">IAT-1 (/50)</th>
                      <th className="text-center p-4 text-[10px] font-bold section-label tracking-widest">IAT-2 (/50)</th>
                      <th className="text-center p-4 text-[10px] font-bold section-label tracking-widest">Model (/100)</th>
                      <th className="text-center p-4 text-[10px] font-bold section-label tracking-widest">Status</th>
                      <th className="text-center p-4 text-[10px] font-bold section-label tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {classStudents.map((s, i) => {
                      const total = s.iat1 + s.iat2;
                      const status = total < 50 ? "Below Pass" : total < 70 ? "Average" : "Good";
                      const statusColor = total < 50 ? "text-chart-critical" : total < 70 ? "text-chart-observation" : "text-chart-safe";
                      return (
                        <tr key={s.id} className="hover:bg-surface-hover transition-colors group" style={{ animationDelay: `${i * 0.03}s` }}>
                          <td className="p-4 font-mono text-[11px] font-bold section-label">{s.id}</td>
                          <td className="p-4 font-bold text-[13px] font-syne tracking-wide">{s.name}</td>
                          <td className="p-4 text-center">
                            <input
                              type="number"
                              value={s.iat1}
                              onChange={(e) => handleMarkChange(s.id, "iat1", e.target.value)}
                              min={0} max={50}
                              className="w-16 text-center bg-surface-warm/50 border border-border/50 rounded-lg px-2 py-1.5 text-[13px] font-mono font-bold focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all font-mono"
                            />
                          </td>
                          <td className="p-4 text-center">
                            <input
                              type="number"
                              value={s.iat2}
                              onChange={(e) => handleMarkChange(s.id, "iat2", e.target.value)}
                              min={0} max={50}
                              className="w-16 text-center bg-surface-warm/50 border border-border/50 rounded-lg px-2 py-1.5 text-[13px] font-mono font-bold focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all font-mono"
                            />
                          </td>
                          <td className="p-4 text-center">
                            <input
                              type="number"
                              value={s.model}
                              onChange={(e) => handleMarkChange(s.id, "model", e.target.value)}
                              min={0} max={100}
                              className="w-20 text-center bg-surface-warm/50 border border-border/50 rounded-lg px-2 py-1.5 text-[13px] font-mono font-bold focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all font-mono"
                            />
                          </td>
                          <td className="p-4 text-center">
                            <span className={`text-[11px] font-bold ${statusColor}`}>{status}</span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => toast.success(`Marks saved for ${s.name}`)}
                              className="text-[10px] font-bold btn-ghost px-3 py-1.5 rounded-lg border border-accent/30 text-accent hover:bg-accent/10 transition-all shadow-sm"
                            >
                              Save
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-border/50">
                <button onClick={() => toast("Marks exported to CSV")} className="btn-ghost border border-border/50 text-[11px] font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm hover:border-accent/30">
                  <Download className="h-4 w-4" /> Export CSV
                </button>
                <button onClick={() => toast.success("All marks submitted to Sentinel")} className="btn-primary text-[11px] font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-md glow-maroon">
                  Submit All Marks
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Teacher's Sentinel Assistant (Chat View) */}
        {activePage === "chat" && (
        <div className="lg:col-span-3 card-warm hero-mesh flex flex-col h-[700px] shadow-2xl overflow-hidden max-w-4xl mx-auto w-full rounded-[24px] animate-fade-up">
          <div className="bg-surface/60 backdrop-blur-md border-b border-border/50 px-6 py-4 flex items-center gap-4 z-10">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-maroon shadow-md border border-accent/20 glow-maroon">
              <Sparkles className="h-5 w-5 text-accent animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-syne tracking-wide gradient-text-gold">Teaching Assistant AI</h3>
              <p className="text-[11px] section-label mt-0.5">Class-level patterns & strategies</p>
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
                  placeholder="Ask for strategy tips..."
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
        )}
        
        {/* Reports Page */}
        {activePage === "reports" && (
          <div className="lg:col-span-3 space-y-6 animate-fade-up">
            <h2 className="text-xl font-bold font-syne tracking-wide flex items-center gap-2 mb-6">
              <FileText className="h-5 w-5 text-accent" /> Downloadable Reports
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Class Performance Report", desc: "Detailed breakdown of IAT, Model Exams, and Grades.", icon: BookOpen },
                { title: "Attendance Summary", desc: "Comprehensive attendance logs and absentee tracking.", icon: Activity },
                { title: "IAT Analysis", desc: "AI-generated insights on IAT performance trajectories.", icon: BrainCircuit }
              ].map((report, idx) => (
                <div key={idx} className="card-warm p-6 rounded-2xl border border-border/50 shadow-md flex flex-col justify-between" style={{ animationDelay: `${idx * 0.15}s` }}>
                  <div>
                    <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 border border-accent/20">
                      <report.icon className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="font-bold text-foreground text-[15px] mb-2">{report.title}</h3>
                    <p className="text-muted-foreground text-[12px] leading-relaxed mb-6">{report.desc}</p>
                  </div>
                  <button 
                    onClick={() => generatePDF(report.title)}
                    disabled={loadingReport === report.title}
                    className="w-full btn-primary py-3 rounded-xl text-xs font-bold transition-all shadow-sm flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                  >
                    {loadingReport === report.title ? (
                      <span className="flex items-center gap-2"><div className="w-3.5 h-3.5 border-2 border-background/20 border-t-background rounded-full animate-spin" /> Generating...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Download className="h-4 w-4" /> Generate Report</span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      {/* Close outer grid */}
      </div>

      {/* MODALS */}
      <Dialog open={avgModalOpen} onOpenChange={setAvgModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide text-blue-400">Class Average IAT</DialogTitle></DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
             <p className="text-3xl font-mono font-bold text-foreground mb-2">{avgIat}/100</p>
             <p className="text-[13px] leading-relaxed">The average Internal Assessment Test score across all students in your class.</p>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={belowPassModalOpen} onOpenChange={setBelowPassModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide text-chart-critical">Below Pass Marking</DialogTitle></DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
             <p className="text-3xl font-mono font-bold text-chart-critical mb-2">{belowPass}</p>
             <p className="text-[13px] leading-relaxed">Number of students currently scoring below 50% in combined IATs.</p>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={attendanceModalOpen} onOpenChange={setAttendanceModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide text-orange-400">Class Avg Attendance</DialogTitle></DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
             <p className="text-3xl font-mono font-bold text-foreground mb-2">{avgAtt}%</p>
             <p className="text-[13px] leading-relaxed">Class wide attendance average currently tracked.</p>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={interventionModalOpen} onOpenChange={setInterventionModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide text-chart-observation">Need Intervention</DialogTitle></DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
             <p className="text-3xl font-mono font-bold text-chart-observation mb-2">{interventionNeeded}</p>
             <p className="text-[13px] leading-relaxed">Students flagged by Sentinel as requiring mentor or teacher support.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-6 right-6 z-50">
        {fabOpen && (
           <>
            <div className="fixed inset-0 bg-background/20 backdrop-blur-sm z-40" onClick={() => setFabOpen(false)} />
            <div className="absolute bottom-16 right-0 z-50 flex flex-col gap-3 mb-2 items-end animate-in slide-in-from-bottom-5">
              <button onClick={() => { toast.success("Class report exported to Excel"); setFabOpen(false); }} className="flex items-center gap-3 bg-card border border-blue-500/30 text-blue-500 hover:bg-blue-500/10 px-4 py-2.5 rounded-full shadow-lg transition-colors group whitespace-nowrap">
                <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">Download Class Report</span>
                <Download className="h-5 w-5 shrink-0" />
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



      {/* NEW MODALS: Student Profile and Add Note */}
      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="sm:max-w-[700px] border-border/50 bg-surface-warm shadow-2xl p-6">
          {selectedProfile && (() => {
            const aiData = analyzeStudent(selectedProfile);
            return (
              <>
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-xl font-bold font-syne tracking-wide flex items-center gap-3">
                    {selectedProfile.name}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-muted-foreground">
                      {selectedProfile.id}
                    </span>
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mini chart for student */}
                  <div className="bg-surface-warm border border-border/50 rounded-xl p-4 shadow-sm">
                    <p className="text-[10px] font-bold section-label tracking-widest uppercase mb-4">Performance Trajectory</p>
                    <div className="h-40 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'IAT 1', score: selectedProfile.iat1, fill: selectedProfile.iat1 < 25 ? '#dc2626' : '#16a34a' },
                          { name: 'IAT 2', score: selectedProfile.iat2, fill: selectedProfile.iat2 < 25 ? '#dc2626' : '#16a34a' },
                          { name: 'Model', score: selectedProfile.model, fill: selectedProfile.model < 50 ? '#dc2626' : '#d97706' }
                        ]} margin={{top:0, right:0, left:-25, bottom:0}}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                          <XAxis dataKey="name" tick={{fontSize: 10, fill: '#888', fontFamily: 'var(--font-mono)'}} axisLine={false} tickLine={false} />
                          <YAxis tick={{fontSize: 10, fill: '#888', fontFamily: 'var(--font-mono)'}} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }} />
                          <Bar dataKey="score" radius={[4,4,0,0]}>
                            {
                              [selectedProfile.iat1, selectedProfile.iat2, selectedProfile.model].map((val, index) => (
                                <Cell key={`cell-${index}`} fill={index === 2 ? (val < 50 ? '#dc2626' : '#d97706') : (val < 25 ? '#dc2626' : '#16a34a')} />
                              ))
                            }
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* AI Context & Actions */}
                  <div className="flex flex-col gap-3">
                    <div className="bg-chart-critical/5 border border-chart-critical/20 rounded-xl p-4 flex-1 shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-chart-critical/5 rounded-bl-full pointer-events-none" />
                      <p className="text-[11px] font-bold text-chart-critical tracking-widest uppercase mb-2 flex items-center gap-1.5"><BrainCircuit className="h-3.5 w-3.5" /> Sentinel Context</p>
                      <p className="text-[13px] text-foreground font-bold mb-2 tracking-wide font-syne">{aiData.pattern}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed italic border-l-2 border-chart-critical/40 pl-3">{aiData.recommendation}</p>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <button onClick={() => { setSelectedStudentForNote(selectedProfile); setProfileModalOpen(false); }} className="w-full btn-ghost border border-border/50 py-2.5 rounded-lg text-[11px] font-bold transition-all shadow-sm hover:border-accent hover:text-accent">
                         Add Internal Note
                      </button>
                      <div className="flex gap-2">
                        <button onClick={() => toast("Assigning Concept Video: 'Algorithms Basics'")} className="flex-1 btn-secondary py-2.5 rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5" /> Assign Video
                        </button>
                        <button onClick={() => toast.success(`Referral for ${selectedProfile.name} sent to Mentor`)} className="flex-1 bg-accent/15 border border-accent/30 text-accent font-bold py-2.5 rounded-lg text-[11px] hover:bg-accent hover:text-maroon transition-all shadow-sm flex items-center justify-center gap-1.5">
                          <UserCheck className="h-3.5 w-3.5" /> Mentor Referral
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedStudentForNote} onOpenChange={(open) => { if (!open) setSelectedStudentForNote(null); }}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold font-syne tracking-wide gradient-text-gold">Add Internal Note</DialogTitle>
          </DialogHeader>
          {selectedStudentForNote && (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-bold text-foreground">For: {selectedStudentForNote.name}</p>
              <textarea 
                className="w-full bg-surface-hover/50 border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent/50 text-foreground resize-none" 
                rows={4} 
                placeholder="Write your note here... (Visible only to you and mentors)"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <div className="flex justify-end gap-2 pr-1">
                <button 
                  onClick={() => { setSelectedStudentForNote(null); setNoteText(""); }} 
                  className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                >Cancel</button>
                <button 
                  onClick={() => { 
                    toast.success("Internal note saved successfully!"); 
                    setSelectedStudentForNote(null); 
                    setNoteText("");
                  }} 
                  disabled={!noteText.trim()}
                  className="px-5 py-2 text-xs font-bold btn-primary rounded-lg shadow-md disabled:opacity-50"
                >Save Note</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
