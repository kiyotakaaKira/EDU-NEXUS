import { useQuery } from "@tanstack/react-query";
import { Users, FileText, CheckCircle, AlertTriangle, Cpu, Layers, Activity, Lightbulb, BookOpen, Target, TrendingUp, Award, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ['#8b5cf6', '#ef4444', '#f59e0b', '#10b981'];

export default function DashboardView({ setActivePage }: { setActivePage?: (page: string) => void }) {
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ["dataset_summary"],
    queryFn: async () => {
      const res = await fetch("/api/datasets/summary");
      if (!res.ok) throw new Error("Failed to load dataset");
      return res.json();
    }
  });

  const { data: statsData } = useQuery({
    queryKey: ["statistics_summary"],
    queryFn: async () => {
      const res = await fetch("/api/statistics/summary");
      if (!res.ok) return null;
      return res.json();
    }
  });

  const { data: pipelineData } = useQuery({
    queryKey: ["pipeline_status"],
    queryFn: async () => {
      const res = await fetch("/api/pipeline/status");
      if (!res.ok) return null;
      return res.json();
    }
  });

  const { data: progressionData } = useQuery({
    queryKey: ["progression_dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/temporal/summary");
      if (!res.ok) return null;
      return res.json();
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div></div>;
  }

  const targetDist = statsData?.target_distribution || {};
  const total = statsData?.total_students || 0;
  const gradPct = total > 0 ? Math.round(((targetDist["Graduate"]?.count || 0) / total) * 100) : 0;
  const dropoutPct = total > 0 ? Math.round(((targetDist["Dropout"]?.count || 0) / total) * 100) : 0;

  const pieData = Object.entries(targetDist).map(([k, v]: [string, any]) => ({
    name: k, value: v.count
  }));

  const semProgressionChartData = progressionData?.progression_by_outcome?.map((p: any) => ({
    target: p.target,
    "Sem 1 Grade": p.sem1_grade,
    "Sem 2 Grade": p.sem2_grade
  })) || [];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold font-syne tracking-tight text-foreground">EduNexus Educational Intelligence Center</h1>
        <p className="text-muted-foreground">UCI Predict Students' Dropout and Academic Success — Real Data Analytics Platform</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card-warm p-4 flex flex-col items-center text-center justify-center">
          <Users className="h-5 w-5 text-accent mb-2" />
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Students Analysed</p>
          <p className="text-xl font-bold text-foreground mt-1">{(statsData?.total_students || 0).toLocaleString()}</p>
        </div>
        <div className="card-warm p-4 flex flex-col items-center text-center justify-center">
          <Award className="h-5 w-5 text-green-400 mb-2" />
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Graduate Rate</p>
          <p className="text-xl font-bold text-green-400 mt-1">{gradPct}%</p>
        </div>
        <div className="card-warm p-4 flex flex-col items-center text-center justify-center">
          <AlertTriangle className="h-5 w-5 text-red-400 mb-2" />
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Dropout Rate</p>
          <p className="text-xl font-bold text-red-400 mt-1">{dropoutPct}%</p>
        </div>
        <div className="card-warm p-4 flex flex-col items-center text-center justify-center">
          <Target className="h-5 w-5 text-blue-400 mb-2" />
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Avg Admission Grade</p>
          <p className="text-xl font-bold text-foreground mt-1">{statsData?.avg_admission_grade || "—"}</p>
        </div>
        <div className="card-warm p-4 flex flex-col items-center text-center justify-center">
          <BarChart2 className="h-5 w-5 text-purple-400 mb-2" />
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Avg Sem 1 Grade</p>
          <p className="text-xl font-bold text-foreground mt-1">{statsData?.avg_sem1_grade || "—"}/20</p>
        </div>
        <div className="card-warm p-4 flex flex-col items-center text-center justify-center">
          <TrendingUp className="h-5 w-5 text-yellow-400 mb-2" />
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Avg Sem 2 Grade</p>
          <p className="text-xl font-bold text-foreground mt-1">{statsData?.avg_sem2_grade || "—"}/20</p>
        </div>
      </div>

      {/* Pipeline */}
      <div className="card-warm p-6">
        <h3 className="text-lg font-bold mb-6 font-syne flex items-center gap-2">
          <Layers className="h-5 w-5 text-accent" /> Data Science Pipeline Status (M1–M14)
        </h3>
        <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-2 overflow-x-auto pb-4 hide-scrollbar">
          {pipelineData?.steps?.map((step: any, idx: number) => {
            const isLast = idx === pipelineData.steps.length - 1;
            const pageMap: Record<string, string> = {
              m1: 'dataset_explorer', m2: 'data_integration', m3: 'data_quality', m4: 'data_cleaning',
              m5: 'statistics', m6: 'eda', m7: 'statistical_analysis', m8: 'features',
              m9: 'temporal', m10: 'cohorts', m11: 'anomalies', m12: 'educational_insights',
              m13: 'digital_twin', m14: 'intervention_simulator'
            };
            return (
              <div key={step.id} className="flex items-center min-w-fit">
                <div
                  onClick={() => setActivePage && setActivePage(pageMap[step.id] || 'dashboard')}
                  className={`flex flex-col items-center justify-center w-20 h-20 rounded-full border-2 cursor-pointer transition-transform hover:scale-105 ${step.ready ? 'bg-accent/10 border-accent/50 text-foreground shadow-[0_0_15px_rgba(139,92,246,0.1)]' : 'bg-surface border-border text-muted-foreground'}`}
                >
                  <span className="font-bold text-xs uppercase">{step.id}</span>
                  <span className="text-[9px] text-center mt-1 px-1 leading-tight">{step.module.split(' ').slice(1).join(' ')}</span>
                  {step.ready && <CheckCircle className="h-3.5 w-3.5 text-accent mt-1" />}
                </div>
                {!isLast && (
                  <div className={`h-1 w-6 md:w-8 rounded-full mx-1 ${step.ready ? 'bg-accent/50' : 'bg-border'}`}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Executive Findings */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold font-syne flex items-center gap-2 px-1">
          <Lightbulb className="h-6 w-6 text-yellow-400" /> Executive Findings — Real UCI Data
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="card-warm p-5 border-l-4 border-l-green-500 cursor-pointer hover:bg-surface/60" onClick={() => setActivePage && setActivePage('statistics')}>
            <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded font-mono uppercase mb-2 inline-block">M5 Descriptive Statistics</span>
            <h4 className="font-bold text-foreground text-sm">Overall Graduation Rate</h4>
            <p className="text-2xl font-bold text-green-400 my-2">{gradPct}%</p>
            <p className="text-xs text-muted-foreground">{(targetDist["Graduate"]?.count || 0).toLocaleString()} students achieved graduation out of {total.toLocaleString()} total enrolled records.</p>
          </div>

          <div className="card-warm p-5 border-l-4 border-l-red-500 cursor-pointer hover:bg-surface/60" onClick={() => setActivePage && setActivePage('statistics')}>
            <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-mono uppercase mb-2 inline-block">M5 Descriptive Statistics</span>
            <h4 className="font-bold text-foreground text-sm">Academic Dropout Rate</h4>
            <p className="text-2xl font-bold text-red-400 my-2">{dropoutPct}%</p>
            <p className="text-xs text-muted-foreground">{(targetDist["Dropout"]?.count || 0).toLocaleString()} students did not complete their academic program.</p>
          </div>

          <div className="card-warm p-5 border-l-4 border-l-blue-500 cursor-pointer hover:bg-surface/60" onClick={() => setActivePage && setActivePage('statistical_analysis')}>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-mono uppercase mb-2 inline-block">M7 Statistical Analysis</span>
            <h4 className="font-bold text-foreground text-sm">Scholarship Impact on Outcomes</h4>
            <p className="text-2xl font-bold text-blue-400 my-2">p &lt; 0.001</p>
            <p className="text-xs text-muted-foreground">Chi-Square test confirms highly significant statistical association between scholarship status and graduation outcome.</p>
          </div>

          <div className="card-warm p-5 border-l-4 border-l-purple-500 cursor-pointer hover:bg-surface/60" onClick={() => setActivePage && setActivePage('temporal')}>
            <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded font-mono uppercase mb-2 inline-block">M9 Academic Progression</span>
            <h4 className="font-bold text-foreground text-sm">Semester Progression Trajectory</h4>
            <p className="text-2xl font-bold text-purple-400 my-2">{progressionData?.trend_distribution?.Declining?.pct || "—"}% Declining</p>
            <p className="text-xs text-muted-foreground">Students showing declining academic trajectory from Semester 1 to Semester 2.</p>
          </div>

          <div className="card-warm p-5 border-l-4 border-l-yellow-500 cursor-pointer hover:bg-surface/60" onClick={() => setActivePage && setActivePage('cohorts')}>
            <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded font-mono uppercase mb-2 inline-block">M10 Student Cohorts</span>
            <h4 className="font-bold text-foreground text-sm">Avg Admission Grade</h4>
            <p className="text-2xl font-bold text-yellow-400 my-2">{statsData?.avg_admission_grade || "—"}/200</p>
            <p className="text-xs text-muted-foreground">Mean admission grade across the full UCI student population (0–200 scale).</p>
          </div>

          <div className="card-warm p-5 border-l-4 border-l-teal-500 cursor-pointer hover:bg-surface/60" onClick={() => setActivePage && setActivePage('digital_twin')}>
            <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded font-mono uppercase mb-2 inline-block">M13 Digital Twin</span>
            <h4 className="font-bold text-foreground text-sm">Student Analytical Profile</h4>
            <p className="text-2xl font-bold text-teal-400 my-2">NEW</p>
            <p className="text-xs text-muted-foreground">Explore any individual student record with 5-dimensional percentile radar and cohort comparison.</p>
          </div>
        </div>
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-warm p-6 relative">
          <h3 className="text-sm font-bold mb-4 uppercase text-muted-foreground tracking-wider">Student Academic Outcome Distribution</h3>
          <div className="h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                  {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#1a1b1e', borderColor: '#333', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-2xl font-bold">{gradPct}%</span>
              <span className="block text-[10px] text-muted-foreground uppercase">Graduates</span>
            </div>
          </div>
          <div className="flex gap-4 justify-center mt-3">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                <span className="text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-warm p-6">
          <h3 className="text-sm font-bold mb-4 uppercase text-muted-foreground tracking-wider">Semester 1 vs Semester 2 Grade by Academic Outcome</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={semProgressionChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="target" stroke="#888" fontSize={11} />
                <YAxis domain={[0, 20]} stroke="#888" fontSize={11} label={{ value: 'Grade /20', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#888' }} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1a1b1e', borderColor: '#333' }} />
                <Bar dataKey="Sem 1 Grade" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Sem 2 Grade" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Dataset Provenance Card */}
      <div className="card-warm p-6 border-t-4 border-t-accent">
        <h3 className="text-sm font-bold mb-4 uppercase text-muted-foreground tracking-wider flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> Primary Dataset — Verified Real Data Source
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface/50 p-4 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase mb-1">Dataset Name</p>
            <p className="font-bold text-sm">Predict Students' Dropout and Academic Success</p>
          </div>
          <div className="bg-surface/50 p-4 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase mb-1">Source</p>
            <p className="font-bold text-sm">UCI Machine Learning Repository (ID 697)</p>
          </div>
          <div className="bg-surface/50 p-4 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase mb-1">Records / Variables</p>
            <p className="font-bold text-sm">{summaryData?.total_records?.toLocaleString() || "4,424"} records × {summaryData?.total_variables || 37} variables</p>
          </div>
        </div>
      </div>
    </div>
  );
}
