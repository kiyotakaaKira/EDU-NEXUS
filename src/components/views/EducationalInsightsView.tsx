import { useQuery } from "@tanstack/react-query";
import { Info, Eye, CheckCircle, Layers, Cpu, BarChart2, AlertTriangle } from "lucide-react";

interface SupportingMetric {
  label: string;
  value: string;
  source: string;
}

interface InsightItem {
  id: string;
  title: string;
  finding: string;
  category: string;
  source_module: string;
  supporting_metrics: SupportingMetric[];
  interpretation: string;
}

interface InsightsApiResponse {
  status: string;
  total_insights: number;
  students_analyzed: number;
  engine_type: string;
  insights: InsightItem[];
}

export default function EducationalInsightsView() {
  const { data: insightsData, isLoading, isError, error } = useQuery<InsightsApiResponse>({
    queryKey: ["educational_insights"],
    queryFn: async () => {
      const res = await fetch("/api/insights/summary");
      if (!res.ok) throw new Error("Unable to load educational insights from server.");
      return res.json();
    }
  });

  const insights = insightsData?.insights || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20 text-yellow-400 font-bold">M12</div>
          <h1 className="text-3xl font-bold font-syne tracking-tight text-foreground">Educational Insights Engine</h1>
        </div>
        <p className="text-muted-foreground text-lg">Deterministic, evidence-backed educational intelligence derived from M5–M11 analytical evidence.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* A */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-3"><Info className="h-5 w-5 text-blue-400" /> A. What this module does</h2>
            <div className="bg-surface/50 p-4 rounded-lg border border-border/50">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Module 12 applies a rule-based synthesis engine across computed M5–M11 metrics to generate deterministic, plain-English educational insights.
              </p>
            </div>
          </section>

          {/* Loading State */}
          {isLoading && <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div></div>}

          {/* Error State */}
          {isError && (
            <div className="bg-red-500/10 border-l-4 border-l-red-500 p-4 rounded-r-lg flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <p className="text-sm text-red-400 font-medium">Unable to load educational insights: {error?.message}</p>
            </div>
          )}

          {/* E */}
          {insightsData && (
            <section className="space-y-6">
              <h2 className="text-xl font-bold font-syne flex items-center gap-2"><BarChart2 className="h-5 w-5 text-accent" /> E. Analytical Output</h2>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="card-warm p-4 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Insights</p>
                  <p className="text-2xl font-bold text-accent mt-1">{insightsData.total_insights ?? 0}</p>
                </div>
                <div className="card-warm p-4 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Students Analyzed</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{insightsData.students_analyzed?.toLocaleString() ?? "Unavailable"}</p>
                </div>
                <div className="card-warm p-4 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Engine Type</p>
                  <p className="text-lg font-bold text-green-400 mt-1">{insightsData.engine_type || "Deterministic Rule"}</p>
                </div>
              </div>

              <div className="space-y-4">
                {insights.map((ins) => (
                  <div key={ins.id} className="card-warm p-5 border-l-4 border-l-accent space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="bg-accent/10 text-accent font-mono font-bold text-xs px-2 py-0.5 rounded">{ins.id}</span>
                        <h3 className="font-bold text-base text-foreground">{ins.title}</h3>
                      </div>
                      <span className="bg-surface text-muted-foreground text-[10px] uppercase font-bold px-2 py-0.5 rounded">{ins.category}</span>
                    </div>

                    <p className="text-xs text-foreground font-medium leading-relaxed">{ins.finding}</p>

                    <div className="bg-surface/50 p-3 rounded-lg border border-border/40 space-y-1.5 text-xs">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Supporting Quantitative Metrics</p>
                      {ins.supporting_metrics?.map((m, idx) => (
                        <div key={idx} className="flex justify-between items-center border-b border-border/20 pb-1">
                          <span className="text-muted-foreground font-medium">{m.label}:</span>
                          <div className="text-right">
                            <span className="font-bold text-foreground font-mono">{m.value}</span>
                            <span className="text-[10px] text-muted-foreground/70 block font-mono">{m.source}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {ins.interpretation && (
                      <div className="text-xs text-muted-foreground italic border-t border-border/30 pt-2">
                        <strong className="not-italic text-accent">Pedagogical Recommendation:</strong> {ins.interpretation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* F */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-3"><Eye className="h-5 w-5 text-purple-400" /> F. Interpretation</h2>
            <div className="bg-purple-500/5 p-4 rounded-lg border border-purple-500/20 text-sm text-muted-foreground leading-relaxed">
              Insights are calculated deterministically from underlying dataset statistics.
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="card-warm p-5 border-t-4 border-t-yellow-500">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-muted-foreground"><Layers className="h-4 w-4" /> B. Input Data</h2>
            <span className="bg-surface border border-border px-2 py-1 rounded text-xs font-mono text-accent">M5–M11 Quantitative Metrics</span>
          </section>

          <section className="card-warm p-5 border-t-4 border-t-accent">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-muted-foreground"><Cpu className="h-4 w-4" /> C. Method</h2>
            <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
              <li>Deterministic evidence aggregation</li>
              <li>Pedagogical rule mapping</li>
              <li>Supporting quantitative evidence tracking</li>
            </ul>
          </section>

          <section className="card-warm p-5 border-t-4 border-t-green-500 bg-green-500/5">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-green-400"><CheckCircle className="h-4 w-4" /> G. Why this matters</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Translating complex data science metrics into clear pedagogical evidence empowers institutional leaders to make evidence-based policy decisions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

