import { useQuery } from "@tanstack/react-query";
import { Clock, TrendingUp, Info, CheckCircle, Eye, Layers, Cpu, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function TemporalAnalyticsView() {
  const { data: progressionData, isLoading, error } = useQuery({
    queryKey: ["progression_analytics"],
    queryFn: async () => {
      const res = await fetch("/api/temporal/summary");
      if (!res.ok) throw new Error("Failed to load progression analytics");
      return res.json();
    }
  });

  if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div></div>;

  const semComp = progressionData?.semester_comparison || {};
  const trendDist = progressionData?.trend_distribution || {};
  const progressionByOutcome = progressionData?.progression_by_outcome || [];
  const histogram = progressionData?.histogram || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 font-bold">M9</div>
          <h1 className="text-3xl font-bold font-syne tracking-tight text-foreground">Academic Progression Analytics</h1>
        </div>
        <p className="text-muted-foreground text-lg">Analyze longitudinal academic progression across Semester 1 and Semester 2 stages.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* A */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-3"><Info className="h-5 w-5 text-blue-400" /> A. What this module does</h2>
            <div className="bg-surface/50 p-4 rounded-lg border border-border/50">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Module 9 tracks longitudinal academic shifts from Semester 1 to Semester 2. It compares grade deltas, approved course unit changes, and classifies student performance into Improving, Stable, or Declining progression trajectories.
              </p>
            </div>
          </section>

          {/* E */}
          {progressionData && (
            <section className="space-y-6">
              <h2 className="text-xl font-bold font-syne flex items-center gap-2"><BarChart2 className="h-5 w-5 text-accent" /> E. Analytical Output</h2>

              {/* Trajectory Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card-warm p-4 text-center border-l-4 border-l-green-500">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Improving Trajectory</p>
                  <p className="text-3xl font-bold text-green-400 mt-1">{trendDist.Improving?.pct}%</p>
                  <p className="text-xs text-muted-foreground mt-1">{trendDist.Improving?.count?.toLocaleString()} students</p>
                </div>
                <div className="card-warm p-4 text-center border-l-4 border-l-blue-500">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Stable Trajectory</p>
                  <p className="text-3xl font-bold text-blue-400 mt-1">{trendDist.Stable?.pct}%</p>
                  <p className="text-xs text-muted-foreground mt-1">{trendDist.Stable?.count?.toLocaleString()} students</p>
                </div>
                <div className="card-warm p-4 text-center border-l-4 border-l-red-500">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Declining Trajectory</p>
                  <p className="text-3xl font-bold text-red-400 mt-1">{trendDist.Declining?.pct}%</p>
                  <p className="text-xs text-muted-foreground mt-1">{trendDist.Declining?.count?.toLocaleString()} students</p>
                </div>
              </div>

              {/* Progression by Outcome Chart */}
              <div className="card-warm p-6">
                <h3 className="font-bold text-sm mb-4 uppercase tracking-wider text-muted-foreground">Semester 1 vs Semester 2 Grade Progression by Outcome</h3>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={progressionByOutcome} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="target" stroke="#888" fontSize={11} />
                      <YAxis domain={[0, 20]} stroke="#888" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1b1e', borderColor: '#333' }} />
                      <Bar dataKey="sem1_grade" name="Sem 1 Grade" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="sem2_grade" name="Sem 2 Grade" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Grade Delta Distribution */}
              <div className="card-warm p-6">
                <h3 className="font-bold text-sm mb-4 uppercase tracking-wider text-muted-foreground">Grade Delta Distribution (Sem 2 − Sem 1)</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={histogram} margin={{ top: 5, right: 10, left: -10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="bin" stroke="#888" fontSize={10} angle={-25} textAnchor="end" />
                      <YAxis stroke="#888" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1b1e', borderColor: '#333' }} />
                      <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          )}

          {/* F */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-3"><Eye className="h-5 w-5 text-purple-400" /> F. Interpretation</h2>
            <div className="bg-purple-500/5 p-4 rounded-lg border border-purple-500/20 text-sm text-muted-foreground leading-relaxed">
              Students who maintain or improve performance from Semester 1 to Semester 2 display high graduation completion rates. A drop of more than 2.0 grade points between semesters serves as a key indicator of academic disengagement.
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="card-warm p-5 border-t-4 border-t-cyan-500">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-muted-foreground"><Layers className="h-4 w-4" /> B. Input Data</h2>
            <span className="bg-surface border border-border px-2 py-1 rounded text-xs font-mono text-accent">master_analytical_dataset.csv</span>
          </section>

          <section className="card-warm p-5 border-t-4 border-t-accent">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-muted-foreground"><Cpu className="h-4 w-4" /> C. Method</h2>
            <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
              <li>Longitudinal grade comparison</li>
              <li>Trajectory classification thresholds</li>
              <li>Histogram delta binning</li>
            </ul>
          </section>

          <section className="card-warm p-5 border-t-4 border-t-green-500 bg-green-500/5">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-green-400"><CheckCircle className="h-4 w-4" /> G. Why this matters</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Longitudinal progression metrics identify academic fatigue and trajectory changes before final program completion.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
