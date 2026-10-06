import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { students, conceptVideos } from "@/data/students";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { PlayCircle, TrendingUp, AlertTriangle, CheckCircle, Clock, BookOpen, Brain, Send, Target, Shield, Activity, CheckSquare } from "lucide-react";
import { askClaude } from "@/utils/claudeAI";
import { toast } from "sonner";
import { TooltipProvider, Tooltip as UITooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AIMessage, TypingIndicator } from "@/components/ui/AIMessage";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning ☀️";
  if (h < 17) return "Good Afternoon 🌤️";
  return "Good Evening 🌙";
};

export default function StudentView({ activePage = "dashboard" }: { activePage?: string }) {
  const { user } = useAuth();
  const student = students.find(s => s.id === user?.studentId);
  
  if (!student) {
    return <div className="p-10 text-center text-red-500">Student record not found for {user?.userId}.</div>;
  }

  return <StudentViewContent student={student} activePage={activePage} />;
}

function StudentViewContent({ student, activePage }: { student: any; activePage: string }) {

  const [ringOffset, setRingOffset] = useState(283);
  useEffect(() => {
    const timer = setTimeout(() => {
      setRingOffset(283 - (283 * student.sentinelScore) / 100);
    }, 100);
    return () => clearTimeout(timer);
  }, [student.sentinelScore]);

  const scoreColor = student.sentinelScore >= 75 ? "hsl(142 71% 45%)" : student.sentinelScore >= 50 ? "hsl(25 95% 53%)" : "hsl(0 72% 51%)";

  const chartData = student.weeklyAttendance.map((val, i) => ({ week: `W${i + 1}`, attendance: val }));
  
  // Interactive State
  const [attModalOpen, setAttModalOpen] = useState(false);
  const [iatModalOpen, setIatModalOpen] = useState(false);
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [lateModalOpen, setLateModalOpen] = useState(false);
  const [videoStatuses, setVideoStatuses] = useState<Record<string, "Idle" | "Watching" | "Completed">>({});
  
  const initialGoals = [
    { id: 1, text: "Attend all 5 theory classes this week", completed: false },
    { id: 2, text: "Submit OOP Assignment before deadline", completed: false },
    { id: 3, text: "Complete 2 LMS modules on arrays", completed: false },
    { id: 4, text: "Revise IAT 1 weak topics via YouTube", completed: false },
    { id: 5, text: "Attend Python Lab session tracking", completed: false }
  ];
  const [goals, setGoals] = useState(initialGoals);
  
  const toggleGoal = (id: number) => {
    const newGoals = goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g);
    setGoals(newGoals);
    if (!goals.find(g => g.id === id)?.completed && newGoals.every(g => g.completed)) {
      toast.success("Awesome! You've crushed all your goals for the week! 🏆");
    }
  };

  const handleVideoAction = (title: string) => {
    const status = videoStatuses[title] || "Idle";
    if (status === "Idle") {
      setVideoStatuses(prev => ({ ...prev, [title]: "Watching" }));
      toast("Video playing. Window locked until completion to ensure focus.");
      setTimeout(() => {
        setVideoStatuses(prev => ({ ...prev, [title]: "Completed" }));
        toast.success(`Completed: ${title}. Sentinel Score boosted!`);
      }, 5000); // 5 sec mock duration
    }
  };

  // Chatbot State
  const [messages, setMessages] = useState<{role: "assistant"|"user", content: string}[]>([
    { role: "assistant", content: `Hi ${student.name.split(" ")[0]}! I'm Sentinel. I can see your overall status is ${student.status}. How are you feeling about this semester?` }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendChat = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isTyping) return;
    
    const userMessage = chatInput.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");
    setIsTyping(true);

    const systemPrompt = `You are Sentinel, a warm empathetic AI academic counselor for a student at Chennai Institute of Technology named ${student.name}. You know their academic data: Attendance ${student.attendance}%, IAT Total ${student.iat1+student.iat2}/100, Model ${student.model}/100, Sentinel Score ${student.sentinelScore}/100. Speak like a supportive senior. Never lecture. Keep responses under 100 words. If distressed, gently suggest speaking to their mentor Dr. R. Meenakshi. Use Indian English phrasing.`;
    
    const response = await askClaude(systemPrompt, userMessage);
    
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setIsTyping(false);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-6 relative z-10 w-full animate-fade-up">
        <div>
          <p className="text-xl font-medium text-muted-foreground shimmer-gold">Welcome back, {getGreeting()}</p>
          <h1 className="text-4xl font-bold tracking-tight gradient-text-gold font-syne mt-1">{student.name}</h1>
          <p className="text-sm font-mono text-muted-foreground mt-2">{student.id} · {student.department} · Year {student.year}</p>
        </div>
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border shadow-sm ${
            student.status === "Safe" ? "badge-safe" : 
            student.status === "Critical" ? "badge-critical" : 
            student.status === "Observation" ? "badge-observation" : "badge-at-risk"
          }`}>
          <span className="text-sm font-semibold tracking-wide">{student.status} Status</span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-background/50 border border-current text-foreground opacity-90 mx-1">"{student.persona}"</span>
        </div>
      </div>

      {activePage === "dashboard" && (
        <div className="grid gap-6 md:grid-cols-3 animate-fade-up stagger-1">
          {/* Sentinel Score Ring */}
          <div className="col-span-1 border-border/50 card-warm card-glow-hover p-6 flex flex-col items-center justify-center text-center">
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger>
                  <h3 className="text-sm font-semibold text-muted-foreground w-full text-left mb-4 flex items-center gap-1 cursor-help hover:text-foreground transition-colors font-syne tracking-wide">CIT Sentinel Score ⓘ</h3>
                </TooltipTrigger>
                <TooltipContent className="tooltip-warm max-w-[200px]">
                  <p className="text-xs">Your unified health score calculated by our AI based on attendance, marks, and engagement.</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>

            <div className="relative h-40 w-40">
              <svg className="h-full w-full -rotate-90 transform drop-shadow-lg" viewBox="0 0 100 100">
                <circle className="stroke-surface-hover" strokeWidth="8" fill="transparent" r="45" cx="50" cy="50" />
                <circle 
                  className="transition-all duration-1000 ease-out" 
                  stroke={scoreColor} 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                  fill="transparent" 
                  r="45" cx="50" cy="50" 
                  strokeDasharray="283" 
                  style={{ strokeDashoffset: ringOffset }} 
                  filter="drop-shadow(0 0 12px currentColor)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center fade-slide-up" style={{ animationDelay: '0.3s' }}>
                <span className="text-5xl font-bold gradient-text-gold font-mono">{student.sentinelScore}</span>
                <span className="text-[9px] section-label mt-1 opacity-70">out of 100</span>
              </div>
            </div>
            <p className="mt-6 text-xs text-muted-foreground bg-surface px-4 py-3 rounded-lg border border-border w-full italic">
              {student.reasoningNote}
            </p>
          </div>

          {/* My Stats Grid */}
          <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
            <div 
              onClick={() => setAttModalOpen(true)}
              className={`p-5 cursor-pointer card-warm card-glow-hover transition-all ${student.attendance < 75 ? "card-critical-glow" : ""}`}
            >
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2"><Clock className="h-4 w-4 text-accent" /> Attendance</p>
              <p className={`text-4xl font-bold font-mono mb-1 ${student.attendance < 75 ? "text-chart-critical" : "gradient-text-gold"}`}>{student.attendance}%</p>
              <div className="h-1.5 w-full bg-background/50 rounded-full overflow-hidden mb-2 border border-border/30">
                <div className={`h-full ${student.attendance < 75 ? "bg-red-500" : "progress-warm"} transition-all duration-1000 animate-progress`} style={{ "--target-width": `${student.attendance}%` } as React.CSSProperties} />
              </div>
              {student.attendance < 75 && <p className="text-[10px] text-red-500 font-bold bg-red-500/10 px-2 py-1 rounded inline-block mt-1">⚠️ Below 75% minimum requirement!</p>}
            </div>

            <div 
              onClick={() => setIatModalOpen(true)}
              className={`p-5 cursor-pointer card-warm card-glow-hover transition-all ${(student.iat1+student.iat2) < 50 ? "card-critical-glow" : ""}`}
            >
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2"><BookOpen className="h-4 w-4 text-accent" /> IAT Total</p>
              <p className={`text-4xl font-bold font-mono mb-1 ${(student.iat1+student.iat2) < 50 ? "text-chart-critical" : "gradient-text-gold"}`}>{student.iat1 + student.iat2}<span className="text-sm opacity-50 font-normal">/100</span></p>
              <div className="h-1.5 w-full bg-background/50 rounded-full overflow-hidden mb-2 border border-border/30">
                <div className={`h-full ${(student.iat1+student.iat2) < 50 ? "bg-red-500" : "progress-warm"} transition-all duration-1000 animate-progress`} style={{ "--target-width": `${student.iat1+student.iat2}%` } as React.CSSProperties} />
              </div>
              {(student.iat1+student.iat2) < 50 && <p className="text-[10px] text-orange-400 font-bold bg-orange-500/10 px-2 py-1 rounded inline-block mt-1">Focus needed on weak areas.</p>}
            </div>

            <div 
              onClick={() => setModelModalOpen(true)}
              className="p-5 cursor-pointer card-warm card-glow-hover transition-all"
            >
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2"><Target className="h-4 w-4 text-accent" /> Model Exam</p>
              <p className="text-4xl font-bold font-mono gradient-text-gold mb-1">{student.model}<span className="text-sm opacity-50 font-normal">/100</span></p>
              <div className="h-1.5 w-full bg-background/50 rounded-full overflow-hidden mb-2 border border-border/30">
                <div className="h-full progress-warm transition-all duration-1000 animate-progress" style={{ "--target-width": `${student.model}%` } as React.CSSProperties} />
              </div>
            </div>

            <div 
              onClick={() => setLateModalOpen(true)}
              className={`p-5 cursor-pointer card-warm card-glow-hover transition-all ${student.lateSubmissions > 3 ? "card-critical-glow" : ""}`}
            >
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-accent" /> Late Subs</p>
              <p className={`text-4xl font-bold font-mono ${student.lateSubmissions > 3 ? "text-chart-critical drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "gradient-text-gold"}`}>{student.lateSubmissions}</p>
              {student.lateSubmissions > 3 && <p className="text-[10px] text-orange-400 font-medium mt-1">High number of missed deadlines.</p>}
            </div>
          </div>
        </div>
      )}

      {activePage === "progress" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-up">
          {/* Section 1: Weekly Attendance Chart */}
          <div className="md:col-span-2 lg:col-span-2 card-warm p-6 card-glow-hover stagger-1">
            <h3 className="text-sm font-bold font-syne text-foreground mb-6 flex items-center gap-2 tracking-wide"><TrendingUp className="h-4 w-4 text-accent" /> Your Attendance Journey</h3>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(20 12% 20%)" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: "hsl(30 10% 45%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "hsl(30 10% 45%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "hsl(20 14% 14%)", border: "1px solid hsl(20 12% 22%)", borderRadius: "8px", color: "hsl(35 25% 88%)", boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}
                    itemStyle={{ color: "hsl(42 95% 52%)" }}
                  />
                  <ReferenceLine y={75} stroke="hsl(0 70% 52%)" strokeDasharray="5 5" label={{ position: 'insideTopLeft', value: '75% Min', fill: 'hsl(0 70% 52%)', fontSize: 10 }} />
                  <Line type="monotone" dataKey="attendance" stroke="url(#goldGradient)" strokeWidth={3} dot={{ r: 4, fill: "hsl(42 95% 52%)", strokeWidth: 0 }} activeDot={{ r: 6, fill: "hsl(0 85% 28%)", stroke: "hsl(42 95% 52%)", strokeWidth: 2 }} />
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(42 95% 48%)" />
                      <stop offset="100%" stopColor="hsl(38 100% 65%)" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Section 2: IAT Performance Bar Chart */}
          <div className="md:col-span-1 lg:col-span-1 card-warm p-6 card-glow-hover stagger-2">
            <h3 className="text-sm font-bold font-syne text-foreground mb-6 flex items-center gap-2 tracking-wide"><BookOpen className="h-4 w-4 text-accent" /> IAT Performance</h3>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: 'IAT 1', score: student.iat1 }, { name: 'IAT 2', score: student.iat2 }]} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(20 12% 20%)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "hsl(30 10% 45%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "hsl(30 10% 45%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(20 12% 20%)', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: "hsl(20 14% 14%)", border: "1px solid hsl(20 12% 22%)", borderRadius: "8px", color: "hsl(35 25% 88%)" }}
                  />
                  <Bar dataKey="score" fill="hsl(42 95% 52%)" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Section 3: Drift Analysis Card */}
          <div className="md:col-span-1 lg:col-span-1 rounded-[20px] border border-accent/20 bg-accent/5 p-6 flex flex-col relative overflow-hidden stagger-3 hover:bg-accent/10 transition-colors">
            <Brain className="absolute -right-6 -bottom-6 h-36 w-36 text-accent/10 mix-blend-overlay rotate-[15deg] animate-float" />
            <h3 className="text-sm font-bold font-syne text-accent mb-4 z-10 tracking-wide flex items-center gap-2">
              <Activity className="h-5 w-5" /> Drift Analysis
            </h3>
            <div className="z-10 bg-background/40 border border-border/50 rounded-xl p-4 mb-4">
              <p className="text-sm font-bold text-foreground">Pattern: <span className="gradient-text-gold">{student.persona}</span></p>
              <p className="text-xs text-muted-foreground mt-1">
                {student.driftType === "None" ? "Consistent academic performance with no major drop-offs detected." 
                : student.driftType === "Lab Drift" ? "You show high engagement in theory, but frequently skip practical lab sessions."
                : student.driftType === "Theory Drift" ? "You excel in hands-on labs but exhibit a steady decline in theory class attendance."
                : "Sudden drop in both attendance and scores detected over the last two weeks."}
              </p>
            </div>
            <div className="z-10">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">What to do next</p>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1" /> Attend the next 3 consecutive lab sessions.</li>
                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1" /> Complete the pending LMS module on Data Structures.</li>
                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1" /> Review the suggested Concept Video for IAT weak points.</li>
              </ul>
            </div>
          </div>
          
          {/* Section 4: My Goals Checklist */}
          <div className="md:col-span-1 lg:col-span-2 card-warm p-6 min-h-[300px] flex flex-col relative overflow-hidden stagger-4">
            {goals.every(g => g.completed) && (
              <div className="absolute top-0 left-0 w-full card-warm glow-gold text-accent text-center py-2.5 text-xs font-bold border-b border-accent/30 flex items-center justify-center gap-2 animate-fade-up shadow-md z-20">
                <Target className="h-4 w-4" /> <span className="gradient-text-gold tracking-wide uppercase">Goals Completed ({goals.filter(g => g.completed).length}/{goals.length})</span>
              </div>
            )}
            <div className="flex items-center justify-between mb-6 z-10">
              <h3 className={`text-lg font-bold font-syne text-foreground tracking-wide flex items-center gap-2 ${goals.every(g => g.completed) ? "mt-8" : ""}`}>
                <CheckSquare className="h-5 w-5 text-accent" /> Weekly Goals Checklist
              </h3>
              <p className={`text-sm font-bold font-mono ${goals.every(g => g.completed) ? "text-chart-safe" : "text-muted-foreground"}`}>{goals.filter(g => g.completed).length} / {goals.length}</p>
            </div>
            
            <div className="w-full h-1.5 bg-surface-hover rounded-full overflow-hidden mb-5 border border-border/30 z-10">
              <div className="h-full progress-warm transition-all duration-500" style={{ width: `${(goals.filter(g => g.completed).length / goals.length) * 100}%` }} />
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto w-full hide-scrollbar z-10">
              {goals.map((goal, idx) => (
                <div 
                  key={goal.id} 
                  onClick={() => toggleGoal(goal.id)}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer hover:-translate-y-0.5 shadow-sm group ${goal.completed ? "bg-chart-safe/10 border-chart-safe/30" : "bg-surface text-foreground border-border/60 hover:border-accent/40"}`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 shadow-sm ${goal.completed ? "bg-chart-safe border-chart-safe" : "border-muted-foreground/50 group-hover:border-accent/50 group-hover:bg-accent/5"}`}>
                    {goal.completed && <CheckCircle className="h-4 w-4 text-white" />}
                  </div>
                  <p className={`text-sm tracking-wide ${goal.completed ? "line-through text-chart-safe opacity-70" : "font-medium"}`}>
                    {goal.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activePage === "videos" && (
      <div className="animate-fade-up">
        <h3 className="text-xl tracking-tight font-bold font-syne text-foreground mb-6 flex items-center gap-2"><PlayCircle className="h-[22px] w-[22px] text-accent" /> Recommended Concept Videos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {conceptVideos.map((video, idx) => (
            <div 
              key={idx} 
              className="flex flex-col p-4 transition-all card-warm shadow-md card-glow-hover group"
              style={{ animationDelay: `${idx * 0.1}s`, animationFillMode: "both" }}
            >
              <div 
                className="relative h-40 w-full mb-4 overflow-hidden rounded-lg shadow-sm border border-border/50 bg-surface-hover group-hover:border-accent/30 transition-colors"
                title={video.title}
              >
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors cursor-pointer" onClick={() => window.open(video.url, '_blank')}>
                  <div className="btn-primary rounded-full p-2.5 shadow-lg group-hover:scale-110 group-hover:shadow-[0_0_20px_hsl(42_95%_52%/_0.5)] transition-all flex items-center justify-center">
                    <PlayCircle className="h-8 w-8 text-black" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white shadow">{video.duration}</div>
              </div>
              <div className="flex flex-col justify-between flex-1">
                <div>
                  <div className="mb-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-surface border border-border text-foreground">{video.topic}</span>
                  </div>
                  <h4 className="font-semibold text-sm line-clamp-2 leading-snug text-foreground mb-4">{video.title}</h4>
                </div>
                <button 
                  onClick={() => window.open(video.url, '_blank')}
                  className="w-full py-2 rounded-xl border border-accent/20 bg-accent/5 text-accent text-xs font-bold hover:bg-accent hover:text-black transition-colors"
                >
                  Watch Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {activePage === "chat" && (
      <div className="animate-fade-up">
        {/* Ask Sentinel AI Chatbot */}
        <div className="card-warm hero-mesh flex flex-col h-[700px] overflow-hidden shadow-2xl max-w-4xl mx-auto rounded-[24px]">
          {/* Chat Header */}
          <div className="bg-surface/60 backdrop-blur-md border-b border-border/50 px-6 py-4 flex items-center gap-4 z-10">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-maroon shadow-[0_0_15px_hsl(0_85%_28%/_0.5)] bg-surface/50 border border-accent/20">
              <Shield className="h-5 w-5 text-accent animate-sentinel-beat" />
            </div>
            <div>
              <h3 className="font-bold gradient-text-gold font-syne text-lg tracking-wide">Ask Sentinel</h3>
              <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-mono">Private Session</p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex flex-col overflow-y-auto p-5 scroll-smooth flex-1 hide-scrollbar">
            {messages.map((m, i) => (
              <AIMessage key={i} content={m.content} isUser={m.role === "user"} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="w-full bg-[#1A1C20] border-t border-border/10 p-5 z-10 mt-auto rounded-b-[24px]">
            <form onSubmit={handleSendChat} className="max-w-5xl mx-auto flex items-center gap-3">
              <div className="flex-1 flex items-center bg-[#131417] border border-white/5 rounded-full px-5 py-3.5 focus-within:border-accent/40 focus-within:bg-[#1A1C20] transition-colors shadow-inner">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isTyping}
                  placeholder="Type your message to Sentinel..."
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

      {/* MODALS */}
      <Dialog open={attModalOpen} onOpenChange={setAttModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide gradient-text-gold">Attendance Insights</DialogTitle></DialogHeader>
          <div className="py-4 text-muted-foreground text-[13px] leading-relaxed">
            <p>You need to attend <strong>12</strong> more consecutive classes to reach the safe zone of 75%.</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={iatModalOpen} onOpenChange={setIatModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide gradient-text-gold">IAT Score Breakdown</DialogTitle></DialogHeader>
          <div className="py-4 text-muted-foreground text-[13px] leading-relaxed">
            <p>Score breakdown: IAT1 ({student.iat1}), IAT2 ({student.iat2}).</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={modelModalOpen} onOpenChange={setModelModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide gradient-text-gold">Model Exam Performance</DialogTitle></DialogHeader>
          <div className="py-4 text-muted-foreground text-[13px] leading-relaxed">
            <p>Excellent progress. Aiming for 90+ in the final University Exams.</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={lateModalOpen} onOpenChange={setLateModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide text-orange-400">Late Submissions Alert</DialogTitle></DialogHeader>
          <div className="py-4 text-muted-foreground text-[13px] leading-relaxed">
            <p>Ensure you submit the pending OOP assignment by Friday to avoid further penalties.</p>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
