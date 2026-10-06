import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Target, Play, HelpCircle, CheckCircle, XCircle, TrendingUp, Info, Eye } from "lucide-react";

export default function StatisticalAnalysisView() {
  const [testType, setTestType] = useState("pearson");
  const [var1, setVar1] = useState("admission_grade");
  const [var2, setVar2] = useState("curricular_units_2nd_sem_grade");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: columns } = useQuery({
    queryKey: ["stat_analysis_columns"],
    queryFn: async () => {
      const res = await fetch("/api/statistics/columns");
      if (!res.ok) throw new Error("Failed to fetch columns");
      return res.json();
    }
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/statistical_analysis/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_type: testType, var1, var2 })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Test failed");
      }
      return res.json();
    },
    onSuccess: (data) => { setResult(data); setError(null); },
    onError: (err: Error) => { setError(err.message); setResult(null); }
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20 text-red-400 font-bold">M7</div>
          <h1 className="text-3xl font-bold font-syne tracking-tight text-foreground">Statistical Analysis</h1>
        </div>
        <p className="text-muted-foreground text-lg">Formal inferential hypothesis testing with p-values, effect sizes, and scientific interpretations.</p>
      </div>

      <div className="bg-surface/50 p-4 rounded-lg border border-border/50">
        <h2 className="text-sm font-bold flex items-center gap-2 mb-2 text-blue-400 uppercase tracking-wider">
          <Info className="h-4 w-4" /> A. What this module does
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Module 7 executes SciPy hypothesis tests: Pearson correlation, Spearman correlation, Welch's t-Test, and Chi-Square test of independence on UCI dataset variables.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="card-warm p-6">
            <h3 className="text-lg font-bold mb-4">Configure Statistical Test</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Statistical Test</label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                  className="w-full bg-surface border border-border rounded-md px-2 py-2 text-sm text-foreground"
                >
                  <option value="pearson">Pearson Correlation (Parametric)</option>
                  <option value="spearman">Spearman Correlation (Non-Parametric)</option>
                  <option value="t-test">Independent t-Test (Welch's)</option>
                  <option value="chi-square">Chi-Square Test of Independence</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Variable 1</label>
                <select
                  value={var1}
                  onChange={(e) => setVar1(e.target.value)}
                  className="w-full bg-surface border border-border rounded-md px-2 py-2 text-sm text-foreground"
                >
                  {columns?.numeric?.map((col: string) => <option key={col} value={col}>{col}</option>)}
                  {testType === "chi-square" && columns?.categorical?.map((col: string) => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Variable 2</label>
                <select
                  value={var2}
                  onChange={(e) => setVar2(e.target.value)}
                  className="w-full bg-surface border border-border rounded-md px-2 py-2 text-sm text-foreground"
                >
                  {testType === "t-test" || testType === "chi-square"
                    ? columns?.categorical?.map((col: string) => <option key={col} value={col}>{col}</option>)
                    : columns?.numeric?.map((col: string) => <option key={col} value={col}>{col}</option>)
                  }
                </select>
              </div>

              <button
                onClick={() => testMutation.mutate()}
                disabled={testMutation.isPending}
                className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 mt-2"
              >
                {testMutation.isPending ? <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" /> : <Play className="h-4 w-4" />}
                Run Hypothesis Test
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {error && (
            <div className="card-warm p-6 border border-red-500/30 bg-red-500/5 mb-4">
              <p className="text-red-400 font-medium text-sm">{error}</p>
            </div>
          )}

          {result ? (
            <div className="card-warm p-6 border-accent/20 bg-surface/30 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block bg-accent text-white px-3 py-1 rounded-full text-xs font-bold mb-2">{result.test_name}</span>
                  <h3 className="text-2xl font-bold font-syne">{result.decision}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Variables: <span className="font-mono text-accent">{result.variables?.join(" ↔ ")}</span></p>
                </div>
                {result.p_value < result.alpha ? (
                  <CheckCircle className="h-10 w-10 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="h-10 w-10 text-yellow-500 flex-shrink-0" />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-surface/50 border border-border/40 p-3 rounded">
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Null Hypothesis (H0)</p>
                  <p className="text-sm text-foreground">{result.hypotheses?.H0}</p>
                </div>
                <div className="bg-surface/50 border border-border/40 p-3 rounded">
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Alternative Hypothesis (H1)</p>
                  <p className="text-sm text-foreground">{result.hypotheses?.H1}</p>
                </div>
              </div>

              <div className="bg-surface/50 p-4 rounded-lg border border-border/50">
                <p className="text-foreground text-sm leading-relaxed">{result.interpretation}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface p-3 rounded-md text-center">
                  <p className="text-xs text-muted-foreground">Test Statistic</p>
                  <p className="text-xl font-bold">{typeof result.statistic === 'number' ? result.statistic.toFixed(4) : result.statistic}</p>
                </div>
                <div className="bg-surface p-3 rounded-md text-center">
                  <p className="text-xs text-muted-foreground">p-value</p>
                  <p className={`text-xl font-bold ${result.p_value < result.alpha ? 'text-green-400' : 'text-yellow-400'}`}>
                    {result.p_value < 0.001 ? "< 0.001" : result.p_value.toFixed(4)}
                  </p>
                </div>
                <div className="bg-surface p-3 rounded-md text-center">
                  <p className="text-xs text-muted-foreground">Alpha (α)</p>
                  <p className="text-xl font-bold">{result.alpha}</p>
                </div>
                <div className="bg-surface p-3 rounded-md text-center">
                  <p className="text-xs text-muted-foreground">Sample (n)</p>
                  <p className="text-xl font-bold">{result.sample_size?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ) : !error ? (
            <div className="card-warm p-6 h-full flex flex-col items-center justify-center text-center text-muted-foreground border-dashed border-2 min-h-[350px]">
              <Target className="h-12 w-12 opacity-50 mb-4 text-accent" />
              <h3 className="text-lg font-bold mb-2 text-foreground">Select Variables & Run Test</h3>
              <p className="max-w-md text-sm">Choose two variables above to evaluate statistical significance, p-values, and effect size.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
