import { useQuery } from "@tanstack/react-query";
import { Cpu, Settings2, CheckCircle, Info, Eye, Layers } from "lucide-react";

export default function FeatureEngineeringView() {
  const { data: featureData, isLoading } = useQuery({
    queryKey: ["feature_catalog"],
    queryFn: async () => {
      const res = await fetch("/api/features/summary");
      if (!res.ok) throw new Error("Failed to load feature summary");
      return res.json();
    }
  });

  if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div></div>;

  const catalog = featureData?.catalog || [];
  const distributions = featureData?.distributions || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400 font-bold">M8</div>
          <h1 className="text-3xl font-bold font-syne tracking-tight text-foreground">Feature Engineering</h1>
        </div>
        <p className="text-muted-foreground text-lg">Synthesize higher-order progression metrics with documented formulas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* A */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-3"><Info className="h-5 w-5 text-blue-400" /> A. What this module does</h2>
            <div className="bg-surface/50 p-4 rounded-lg border border-border/50">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Module 8 constructs transparent, higher-order engineered features capturing academic progression, approval rates, financial risk indicators, and performance stability.
              </p>
            </div>
          </section>

          {/* D */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-4"><Settings2 className="h-5 w-5 text-yellow-400" /> D. Interactive Controls</h2>
            <div className="card-warm p-5">
              <p className="text-sm text-muted-foreground text-center py-2">Features are automatically synthesized during M2 master dataset construction.</p>
            </div>
          </section>

          {/* E - Catalog */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-4"><Cpu className="h-5 w-5 text-accent" /> E. Analytical Output — Feature Catalog</h2>
            <div className="card-warm p-5 mb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-muted-foreground uppercase bg-surface/50">
                    <tr>
                      <th className="px-3 py-2">Feature Name</th>
                      <th className="px-3 py-2">Formula</th>
                      <th className="px-3 py-2">Source Columns</th>
                      <th className="px-3 py-2">Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalog.map((item: any) => (
                      <tr key={item.name} className="border-b border-border/50 hover:bg-surface/30">
                        <td className="px-3 py-2 font-mono text-accent font-bold">{item.name}</td>
                        <td className="px-3 py-2 font-mono text-[11px] bg-surface/40 rounded">{item.formula}</td>
                        <td className="px-3 py-2 text-muted-foreground text-[11px]">{item.source_columns}</td>
                        <td className="px-3 py-2 text-foreground font-mono">{item.range}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Distribution Summary */}
            <div className="card-warm p-5">
              <h3 className="font-bold text-sm mb-4">Engineered Feature Distribution Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {distributions.map((d: any) => (
                  <div key={d.name} className="bg-surface/50 p-4 rounded-lg border border-border/40 space-y-2">
                    <p className="font-bold text-xs text-accent font-mono">{d.name}</p>
                    <p className="text-[11px] text-muted-foreground">{d.interpretation}</p>
                    <div className="grid grid-cols-3 gap-2 text-center pt-2 text-xs border-t border-border/30">
                      <div><span className="text-[10px] text-muted-foreground block uppercase">Mean</span><span className="font-bold">{d.mean}</span></div>
                      <div><span className="text-[10px] text-muted-foreground block uppercase">Median</span><span className="font-bold">{d.median}</span></div>
                      <div><span className="text-[10px] text-muted-foreground block uppercase">Std Dev</span><span className="font-bold">{d.std_dev}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* F */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-3"><Eye className="h-5 w-5 text-purple-400" /> F. Interpretation</h2>
            <div className="bg-purple-500/5 p-4 rounded-lg border border-purple-500/20 text-sm text-muted-foreground leading-relaxed">
              Synthesized features provide richer inputs for clustering (M10), anomaly detection (M11), and Digital Twin profiling (M13).
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="card-warm p-5 border-t-4 border-t-orange-500">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-muted-foreground"><Layers className="h-4 w-4" /> B. Input Data</h2>
            <span className="bg-surface border border-border px-2 py-1 rounded text-xs font-mono text-accent">master_analytical_dataset.csv</span>
          </section>

          <section className="card-warm p-5 border-t-4 border-t-accent">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-muted-foreground"><Cpu className="h-4 w-4" /> C. Method</h2>
            <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
              <li>Weighted progression formulas</li>
              <li>Approval rate normalizations</li>
              <li>Financial risk flag logic</li>
            </ul>
          </section>

          <section className="card-warm p-5 border-t-4 border-t-green-500 bg-green-500/5">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-green-400"><CheckCircle className="h-4 w-4" /> G. Why this matters</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Higher-order features transform raw static grades into dynamic indicators of student progress and stability.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
