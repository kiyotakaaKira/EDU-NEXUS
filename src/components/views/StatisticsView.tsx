import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Activity, BarChart2, Database, Info, Layers, Cpu, Eye, Settings2, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function StatisticsView() {
  const [selectedColumn, setSelectedColumn] = useState<string>("admission_grade");

  const { data: columns } = useQuery({
    queryKey: ["stat_columns"],
    queryFn: async () => {
      const res = await fetch("/api/statistics/columns");
      if (!res.ok) throw new Error("Failed to load columns");
      return res.json();
    }
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats", selectedColumn],
    queryFn: async () => {
      if (!selectedColumn) return null;
      const res = await fetch(`/api/statistics/variable/${selectedColumn}`);
      if (!res.ok) throw new Error("Stats not available");
      return res.json();
    },
    enabled: !!selectedColumn
  });

  const chartData = stats?.histogram || stats?.categories?.map((c: any) => ({ range: c.category, count: c.count })) || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 font-bold">M5</div>
          <h1 className="text-3xl font-bold font-syne tracking-tight text-foreground">Descriptive Statistics</h1>
        </div>
        <p className="text-muted-foreground text-lg">Compute 13-metric statistical summaries and distribution profiles for real UCI variables.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* A */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-3"><Info className="h-5 w-5 text-blue-400" /> A. What this module does</h2>
            <div className="bg-surface/50 p-4 rounded-lg border border-border/50">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Module 5 calculates 13 parametric and non-parametric descriptive statistics (Mean, Median, Mode, Variance, Std Dev, Min, Q1, Q3, Max, IQR, Skewness, Kurtosis, CV%) for any numeric attribute in the UCI student dataset.
              </p>
            </div>
          </section>

          {/* D */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-4"><Settings2 className="h-5 w-5 text-yellow-400" /> D. Interactive Controls</h2>
            <div className="card-warm p-5">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Select Variable to Analyse:</label>
              <select
                value={selectedColumn}
                onChange={(e) => setSelectedColumn(e.target.value)}
                className="w-full max-w-md bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
              >
                {columns?.numeric?.map((col: string) => <option key={col} value={col}>{col} (Numeric)</option>)}
                {columns?.categorical?.map((col: string) => <option key={col} value={col}>{col} (Categorical)</option>)}
              </select>
            </div>
          </section>

          {/* E */}
          {isLoading && (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div></div>
          )}

          {stats && (
            <section>
              <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-4"><BarChart2 className="h-5 w-5 text-accent" /> E. Analytical Output</h2>
              
              {stats.type === "numeric" && stats.stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                  {Object.entries(stats.stats).map(([k, v]: [string, any]) => (
                    <div key={k} className="card-warm p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">{k.replace(/_/g, " ")}</p>
                      <p className="text-lg font-bold text-accent mt-1">{v}</p>
                    </div>
                  ))}
                </div>
              )}

              {stats.type === "categorical" && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="card-warm p-4 text-center"><p className="text-xs text-muted-foreground">Sample Size</p><p className="text-2xl font-bold mt-1">{stats.sample_size}</p></div>
                  <div className="card-warm p-4 text-center"><p className="text-xs text-muted-foreground">Cardinality</p><p className="text-2xl font-bold mt-1">{stats.cardinality}</p></div>
                  <div className="card-warm p-4 text-center"><p className="text-xs text-muted-foreground">Mode Category</p><p className="text-xl font-bold text-accent mt-1">{stats.mode}</p></div>
                </div>
              )}

              {/* Distribution Chart */}
              <div className="card-warm p-6">
                <h3 className="font-bold text-sm mb-4 uppercase tracking-wider text-muted-foreground">Distribution Bins / Categories</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="range" stroke="#888" fontSize={10} angle={-25} textAnchor="end" />
                      <YAxis stroke="#888" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1b1e', borderColor: '#333' }} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          )}

          {/* F */}
          {stats && (
            <section>
              <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-3"><Eye className="h-5 w-5 text-purple-400" /> F. Interpretation</h2>
              <div className="bg-purple-500/5 p-4 rounded-lg border border-purple-500/20 text-sm text-muted-foreground leading-relaxed">
                Variable <strong>{selectedColumn}</strong> ({stats.type}) evaluated across {stats.sample_size?.toLocaleString()} student records.
                {stats.type === "numeric" && ` Mean = ${stats.stats?.mean}, Median = ${stats.stats?.median}, Skewness = ${stats.stats?.skewness}.`}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="card-warm p-5 border-t-4 border-t-purple-500">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-muted-foreground"><Layers className="h-4 w-4" /> B. Input Data</h2>
            <span className="bg-surface border border-border px-2 py-1 rounded text-xs font-mono text-accent">master_analytical_dataset.csv</span>
          </section>

          <section className="card-warm p-5 border-t-4 border-t-accent">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-muted-foreground"><Cpu className="h-4 w-4" /> C. Method</h2>
            <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
              <li>13-metric statistical calculation engine</li>
              <li>Parametric (mean, std) & non-parametric (median, IQR)</li>
              <li>Histogram binning via NumPy</li>
            </ul>
          </section>

          <section className="card-warm p-5 border-t-4 border-t-green-500 bg-green-500/5">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-green-400"><CheckCircle className="h-4 w-4" /> G. Why this matters</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Profiling continuous and categorical variables is essential for validating parametric assumptions prior to inferential testing in M7.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
