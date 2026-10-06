import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Info, CheckCircle, Eye, BarChart2, Settings2, Layers, Cpu } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

const TARGET_COLORS: Record<string, string> = {
  Graduate: "#10b981",
  Dropout: "#ef4444",
  Enrolled: "#f59e0b"
};

export default function EDAView() {
  const [xCol, setXCol] = useState<string>("admission_grade");
  const [yCol, setYCol] = useState<string>("curricular_units_2nd_sem_grade");

  const { data: edaSummary, isLoading } = useQuery({
    queryKey: ["eda_summary"],
    queryFn: async () => {
      const res = await fetch("/api/eda/summary");
      if (!res.ok) throw new Error("EDA summary not available");
      return res.json();
    }
  });

  const { data: bivariateData } = useQuery({
    queryKey: ["bivariate", xCol, yCol],
    queryFn: async () => {
      const res = await fetch(`/api/eda/bivariate?x=${xCol}&y=${yCol}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!xCol && !!yCol
  });

  const corrMatrix = edaSummary?.correlation_matrix || {};
  const corrCols = Object.keys(corrMatrix);
  const scatterPoints = bivariateData?.points || edaSummary?.scatter_sample || [];

  function corrColor(val: number): string {
    if (val >= 0.5) return "#10b981";
    if (val >= 0.2) return "#3b82f6";
    if (val >= 0) return "#6b7280";
    if (val >= -0.2) return "#f59e0b";
    return "#ef4444";
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400 font-bold">M6</div>
          <h1 className="text-3xl font-bold font-syne tracking-tight text-foreground">Exploratory Data Analysis</h1>
        </div>
        <p className="text-muted-foreground text-lg">Explore bivariate scatter relationships, correlation heatmaps, and outcome distributions on UCI real data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* A */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-3"><Info className="h-5 w-5 text-blue-400" /> A. What this module does</h2>
            <div className="bg-surface/50 p-4 rounded-lg border border-border/50">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Module 6 visually inspects academic performance metrics, admission entrance scores, and socio-economic indicators across final academic outcomes (Graduate, Dropout, Enrolled).
              </p>
            </div>
          </section>

          {/* D */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-4"><Settings2 className="h-5 w-5 text-yellow-400" /> D. Interactive Controls</h2>
            <div className="card-warm p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">X Axis Metric:</label>
                <select value={xCol} onChange={e => setXCol(e.target.value)} className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-foreground">
                  <option value="admission_grade">Admission Grade</option>
                  <option value="previous_qualification_grade">Previous Qualification Grade</option>
                  <option value="age_at_enrollment">Age at Enrollment</option>
                  <option value="curricular_units_1st_sem_grade">Sem 1 Grade</option>
                  <option value="curricular_units_2nd_sem_grade">Sem 2 Grade</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Y Axis Metric:</label>
                <select value={yCol} onChange={e => setYCol(e.target.value)} className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-foreground">
                  <option value="curricular_units_2nd_sem_grade">Sem 2 Grade</option>
                  <option value="curricular_units_1st_sem_grade">Sem 1 Grade</option>
                  <option value="academic_progression_index">Academic Progression Index</option>
                  <option value="admission_grade">Admission Grade</option>
                </select>
              </div>
            </div>
          </section>

          {/* E */}
          {isLoading && <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div></div>}

          {edaSummary && (
            <section className="space-y-6">
              <h2 className="text-xl font-bold font-syne flex items-center gap-2"><BarChart2 className="h-5 w-5 text-accent" /> E. Analytical Output</h2>
              
              {/* Bivariate Scatter */}
              <div className="card-warm p-6">
                <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-muted-foreground">Bivariate Scatter ({xCol} vs {yCol})</h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis type="number" dataKey={bivariateData ? "x" : "sem1_grade"} stroke="#888" fontSize={11} />
                      <YAxis type="number" dataKey={bivariateData ? "y" : "sem2_grade"} stroke="#888" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1b1e', borderColor: '#333' }} />
                      <Scatter data={scatterPoints} fill="#8b5cf6" opacity={0.6} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Correlation Matrix */}
              <div className="card-warm p-6">
                <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-muted-foreground">Pearson Correlation Matrix</h3>
                <div className="overflow-x-auto">
                  <table className="text-xs border-collapse w-full">
                    <thead>
                      <tr>
                        <th className="p-1 text-muted-foreground"></th>
                        {corrCols.map(c => (
                          <th key={c} className="p-1 text-muted-foreground font-mono text-[9px] truncate max-w-[80px]">{c.replace(/_grade|_sem_/g, "").slice(0, 10)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {corrCols.map((row) => (
                        <tr key={row}>
                          <td className="p-1 text-muted-foreground font-mono text-[10px] pr-2">{row.replace(/_grade|_sem_/g, "").slice(0, 12)}</td>
                          {corrCols.map((col) => {
                            const val = corrMatrix[row]?.[col] ?? 0;
                            return (
                              <td key={col} className="p-1 text-center font-mono font-bold rounded" style={{ backgroundColor: `${corrColor(val)}22`, color: corrColor(val) }}>
                                {val.toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* F */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-3"><Eye className="h-5 w-5 text-purple-400" /> F. Interpretation</h2>
            <div className="bg-purple-500/5 p-4 rounded-lg border border-purple-500/20 text-sm text-muted-foreground leading-relaxed">
              Bivariate relationships confirm strong correlation between Semester 1 and Semester 2 academic grades (r &gt; 0.8), while admission entrance grades display moderate positive correlation with final academic completion.
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="card-warm p-5 border-t-4 border-t-teal-500">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-muted-foreground"><Layers className="h-4 w-4" /> B. Input Data</h2>
            <span className="bg-surface border border-border px-2 py-1 rounded text-xs font-mono text-accent">master_analytical_dataset.csv</span>
          </section>

          <section className="card-warm p-5 border-t-4 border-t-accent">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-muted-foreground"><Cpu className="h-4 w-4" /> C. Method</h2>
            <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
              <li>Pearson correlation matrix computation</li>
              <li>Bivariate scatter plotting</li>
              <li>Grouped summary distributions</li>
            </ul>
          </section>

          <section className="card-warm p-5 border-t-4 border-t-green-500 bg-green-500/5">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-green-400"><CheckCircle className="h-4 w-4" /> G. Why this matters</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              EDA allows data scientists to discover linear patterns and cluster structures prior to formal hypothesis testing in M7.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
