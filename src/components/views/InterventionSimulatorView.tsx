import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { TrendingUp, User, Sliders, AlertTriangle, ArrowRight, BarChart2, Info, CheckCircle, RotateCcw } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function InterventionSimulatorView() {
  const [selectedId, setSelectedId] = useState<string>("");
  const [newApproved, setNewApproved] = useState<number>(6);
  const [newGrade, setNewGrade] = useState<number>(14.0);

  const { data: studentsList } = useQuery({
    queryKey: ["digital_twin_students"],
    queryFn: async () => {
      const res = await fetch("/api/digital-twin/students?limit=100");
      if (!res.ok) throw new Error("Failed to load students");
      return res.json();
    }
  });

  const activeId = selectedId || studentsList?.[0]?.student_id;

  const { data: simData, isLoading: simLoading, refetch } = useQuery({
    queryKey: ["intervention_simulation", activeId, newApproved, newGrade],
    queryFn: async () => {
      if (!activeId) return null;
      const res = await fetch("/api/intervention-simulator/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: activeId,
          new_sem2_approved: Number(newApproved),
          new_sem2_grade: Number(newGrade)
        })
      });
      if (!res.ok) throw new Error("Simulation failed");
      return res.json();
    },
    enabled: !!activeId
  });

  const baseline = simData?.baseline;
  const scenario = simData?.scenario;
  const deltas = simData?.deltas || [];
  const radarComparison = simData?.radar_comparison || [];

  const radarChartData = radarComparison.map((r: any) => ({
    dimension: r.dimension,
    Before: r.before,
    "What-If Scenario": r.scenario
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20 text-yellow-400 font-bold text-sm">M14</div>
          <h1 className="text-3xl font-bold font-syne tracking-tight text-foreground">Academic Intervention Simulator</h1>
        </div>
        <p className="text-muted-foreground text-lg">Interactive what-if scenario exploration tool for academic interventions.</p>
      </div>

      {/* Scientific Disclaimer Alert */}
      <div className="bg-yellow-500/10 border-l-4 border-l-yellow-500 p-4 rounded-r-lg">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="h-4 w-4 text-yellow-400" />
          <h4 className="font-bold text-xs text-yellow-400 uppercase tracking-wider">Methodology & Causal Disclaimer</h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {simData?.disclaimer || "Scenario analysis demonstrates empirical dataset associations and percentile shifts. It does NOT guarantee causal educational outcomes."}
        </p>
      </div>

      {/* Student Selector & Control Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Selector */}
        <div className="card-warm p-5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Select Student Target:</label>
          <select
            className="w-full bg-surface border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:border-accent focus:outline-none mb-4"
            value={activeId}
            onChange={e => setSelectedId(e.target.value)}
          >
            {studentsList?.map((s: any) => (
              <option key={s.student_id} value={s.student_id}>
                {s.student_id} — Outcome: {s.target} (Sem2 Grade: {s.sem2_grade.toFixed(1)})
              </option>
            ))}
          </select>

          {baseline && (
            <div className="space-y-2 text-xs border-t border-border/40 pt-3">
              <div className="flex justify-between"><span className="text-muted-foreground">Baseline Outcome:</span> <span className="font-bold text-foreground">{baseline.profile?.target}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Baseline Sem 2 Approved:</span> <span className="font-bold text-foreground">{baseline.profile?.sem2_approved} units</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Baseline Sem 2 Grade:</span> <span className="font-bold text-foreground">{baseline.profile?.sem2_grade?.toFixed(2)}/20</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Baseline Cohort:</span> <span className="font-bold text-accent text-[11px]">{baseline.cohort}</span></div>
            </div>
          )}
        </div>

        {/* Sliders */}
        <div className="card-warm p-5 md:col-span-2 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2 uppercase tracking-wider text-muted-foreground"><Sliders className="h-4 w-4" /> Adjustable Intervention Controls</h3>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Simulated Semester 2 Approved Course Units</span>
              <span className="font-bold text-accent">{newApproved} units</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={newApproved}
              onChange={e => setNewApproved(Number(e.target.value))}
              className="w-full accent-accent bg-surface h-2 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Simulated Semester 2 Average Grade (/20)</span>
              <span className="font-bold text-accent">{Number(newGrade).toFixed(1)} / 20</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={newGrade}
              onChange={e => setNewGrade(Number(e.target.value))}
              className="w-full accent-accent bg-surface h-2 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                if (baseline) {
                  setNewApproved(baseline.profile?.sem2_approved || 6);
                  setNewGrade(baseline.profile?.sem2_grade || 12.0);
                }
              }}
              className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset to Baseline
            </button>
          </div>
        </div>
      </div>

      {simLoading && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div></div>}

      {simData && baseline && scenario && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Overlay Comparison */}
          <div className="card-warm p-5">
            <h3 className="font-bold text-sm mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2"><BarChart2 className="h-4 w-4" /> Before vs What-If Percentile Radar</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarChartData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fill: '#888', fontSize: 10 }} />
                  <Radar name="Before" dataKey="Before" stroke="#6b7280" fill="#6b7280" fillOpacity={0.2} />
                  <Radar name="What-If Scenario" dataKey="What-If Scenario" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1b1e', borderColor: '#333' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2 text-xs">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-gray-500"></div> Baseline</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-yellow-500"></div> What-If Scenario</div>
            </div>
          </div>

          {/* Metric Deltas Table */}
          <div className="space-y-4">
            <div className="card-warm p-5">
              <h3 className="font-bold text-sm mb-4 uppercase tracking-wider text-muted-foreground">Simulated Impact & Percentile Movements</h3>
              <div className="space-y-3">
                {deltas.map((d: any) => (
                  <div key={d.metric} className="bg-surface/50 p-3 rounded-lg border border-border/40 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-foreground">{d.metric}</p>
                      <p className="text-[11px] text-muted-foreground">Baseline: {d.before} → Scenario: {d.scenario}</p>
                    </div>
                    <div className={`text-sm font-bold px-2 py-1 rounded ${d.delta > 0 ? "bg-green-500/10 text-green-400" : d.delta < 0 ? "bg-red-500/10 text-red-400" : "bg-surface text-muted-foreground"}`}>
                      {d.delta > 0 ? `+${d.delta}` : d.delta}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-warm p-5 bg-yellow-500/5 border border-yellow-500/20">
              <h3 className="font-bold text-sm mb-2 text-yellow-400 flex items-center gap-2"><Info className="h-4 w-4" /> Analytical Explanation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                By adjusting <strong>Semester 2 Approved Units</strong> to {scenario.sem2_approved} and <strong>Grade</strong> to {scenario.sem2_grade}/20, the student's <strong>Academic Progression Index Percentile</strong> moves from <strong>{baseline.percentiles?.progression_index_pct}th percentile</strong> to <strong>{scenario.percentiles?.progression_index_pct}th percentile</strong> across the historical population baseline.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
