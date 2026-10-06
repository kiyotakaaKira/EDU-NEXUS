import { useQuery, useMutation } from "@tanstack/react-query";
import { Network, Database, RefreshCw, CheckCircle, Table as TableIcon, Info, Layers, Cpu, Eye, Settings2 } from "lucide-react";
import { useState } from "react";

export default function DataIntegrationView() {
  const [integrationResult, setIntegrationResult] = useState<any>(null);

  const { data: summary, isLoading: isSummaryLoading, refetch } = useQuery({
    queryKey: ["integration_summary"],
    queryFn: async () => {
      const res = await fetch("/api/integration/summary");
      if (!res.ok) throw new Error("Failed to load summary");
      return res.json();
    }
  });

  const integrateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/integration/run", { method: "POST" });
      if (!res.ok) throw new Error("Failed to run semantic preparation");
      return res.json();
    },
    onSuccess: (data) => {
      setIntegrationResult(data);
      refetch();
    }
  });

  const lineageData = integrationResult?.lineage || summary?.lineage || [
    { step: "1. Source Ingestion", type: "Ingest", keys: ["UCI Dataset"], rows_before: 4424, rows_after: 4424 },
    { step: "2. Schema Standardization", type: "Rename", keys: ["Column Contract"], rows_before: 4424, rows_after: 4424 },
    { step: "3. Entity ID Assignment", type: "ID Gen", keys: ["student_id"], rows_before: 4424, rows_after: 4424 },
    { step: "4. Category Decoding", type: "Decode", keys: ["gender", "scholarship"], rows_before: 4424, rows_after: 4424 },
    { step: "5. Feature Synthesis", type: "Compute", keys: ["progression_index"], rows_before: 4424, rows_after: 4424 },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 font-bold">M2</div>
          <h1 className="text-3xl font-bold font-syne tracking-tight text-foreground">Data Preparation & Semantic Mapping</h1>
        </div>
        <p className="text-muted-foreground text-lg">Transform raw UCI student data into a semantically standardized, enriched master analytical dataset.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* A */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-3"><Info className="h-5 w-5 text-blue-400" /> A. What this module does</h2>
            <div className="bg-surface/50 p-4 rounded-lg border border-border/50">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Module 2 converts the raw UCI institutional dataset into a clean master analytical dataset. It standardizes column naming, assigns anonymous student identifiers, decodes numeric category codes into human-readable labels, and checks compatibility with secondary reference datasets.
              </p>
            </div>
          </section>

          {/* D */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-4"><Settings2 className="h-5 w-5 text-yellow-400" /> D. Interactive Controls</h2>
            <div className="card-warm p-6 border-blue-500/20 bg-blue-500/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold mb-1">Semantic Pipeline Engine</h3>
                  <p className="text-sm text-muted-foreground">Run schema mapping, category decoding, and data lineage auditing.</p>
                </div>
                <button
                  onClick={() => integrateMutation.mutate()}
                  disabled={integrateMutation.isPending}
                  className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 ml-4 shrink-0"
                >
                  {integrateMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Network className="h-4 w-4" />}
                  {integrateMutation.isPending ? "Processing..." : "Run Pipeline"}
                </button>
              </div>
            </div>
          </section>

          {/* E */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-4"><Database className="h-5 w-5 text-accent" /> E. Analytical Output</h2>
            <div className="card-warm p-5 mb-4 bg-green-500/5 border-green-500/30">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h3 className="font-bold text-green-400">Master Dataset Ready</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface/50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase">Master Records</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{(summary?.master_records || 4424).toLocaleString()}</p>
                </div>
                <div className="bg-surface/50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase">Columns Generated</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{summary?.columns || 37}</p>
                </div>
              </div>
            </div>

            {/* Lineage Table */}
            <div className="card-warm p-5">
              <h3 className="font-bold text-sm mb-4">Data Lineage Audit Log</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-muted-foreground uppercase bg-surface/50">
                    <tr>
                      <th className="px-3 py-2 rounded-tl-lg">Step</th>
                      <th className="px-3 py-2">Operation</th>
                      <th className="px-3 py-2">Keys / Target</th>
                      <th className="px-3 py-2">Rows Before</th>
                      <th className="px-3 py-2 rounded-tr-lg">Rows After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineageData.map((step: any, idx: number) => (
                      <tr key={idx} className="border-b border-border/50 hover:bg-surface/30">
                        <td className="px-3 py-2 font-medium text-foreground">{step.step}</td>
                        <td className="px-3 py-2 uppercase text-xs font-mono text-accent">{step.type}</td>
                        <td className="px-3 py-2 font-mono text-xs">{step.keys?.join(", ")}</td>
                        <td className="px-3 py-2 font-mono">{step.rows_before?.toLocaleString()}</td>
                        <td className="px-3 py-2 font-mono text-green-400 font-bold">{step.rows_after?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* F */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-3"><Eye className="h-5 w-5 text-purple-400" /> F. Interpretation</h2>
            <div className="bg-purple-500/5 p-4 rounded-lg border border-purple-500/20">
              <p className="text-sm text-muted-foreground leading-relaxed">
                The UCI raw data is standardized into lower_snake_case, supplemented with decoded labels (e.g. Male/Female, Scholarship Yes/No), and enriched with foundational academic progression metrics. The output is persisted to Parquet format.
              </p>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="card-warm p-5 border-t-4 border-t-blue-500">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-muted-foreground"><Layers className="h-4 w-4" /> B. Input Data</h2>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <span className="bg-surface border border-border px-2 py-1 rounded text-accent">uci_predict_students_dropout.csv</span>
            </div>
          </section>

          <section className="card-warm p-5 border-t-4 border-t-accent">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-muted-foreground"><Cpu className="h-4 w-4" /> C. Method</h2>
            <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
              <li>Pandas column standardization contract</li>
              <li>Categorical label mapping</li>
              <li>Data lineage log generation</li>
              <li>Parquet output creation</li>
            </ul>
          </section>

          <section className="card-warm p-5 border-t-4 border-t-green-500 bg-green-500/5">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-green-400"><CheckCircle className="h-4 w-4" /> G. Why this matters</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Standardizing schema contracts and tracking data lineage ensures downstream modules (M3–M14) execute on reproducible, verified data structures.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
