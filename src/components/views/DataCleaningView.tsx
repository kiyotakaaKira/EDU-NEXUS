import { useQuery, useMutation } from "@tanstack/react-query";
import { Edit3, CheckCircle, RefreshCw, AlertTriangle, Info, Layers, Cpu, Eye, Settings2, BarChart2 } from "lucide-react";
import { useState } from "react";

export default function DataCleaningView() {
  const [cleaningResult, setCleaningResult] = useState<any>(null);

  const { data: auditData, isLoading: isAuditLoading, refetch } = useQuery({
    queryKey: ["cleaning_audit"],
    queryFn: async () => {
      const res = await fetch("/api/cleaning/summary");
      if (!res.ok) throw new Error("Failed to load cleaning log");
      return res.json();
    }
  });

  const cleanMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/cleaning/run", { method: "POST" });
      if (!res.ok) throw new Error("Failed to run cleaning pipeline");
      return res.json();
    },
    onSuccess: (data) => {
      setCleaningResult(data);
      refetch();
    }
  });

  const log = cleaningResult?.audit_log || auditData?.audit_log;
  const operations = log?.cleaning_operations || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20 text-yellow-400 font-bold">M4</div>
          <h1 className="text-3xl font-bold font-syne tracking-tight text-foreground">Data Cleaning Studio</h1>
        </div>
        <p className="text-muted-foreground text-lg">Apply reproducible, auditable cleaning operations to produce an analysis-ready dataset.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* A */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-3"><Info className="h-5 w-5 text-blue-400" /> A. What this module does</h2>
            <div className="bg-surface/50 p-4 rounded-lg border border-border/50">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Module 4 applies reproducible cleaning transformations: schema normalization, duplicate verification, range boundary audits, and categorical label mapping. All operations generate an explicit audit trail in <code className="text-accent font-mono">cleaning_audit_log.json</code>.
              </p>
            </div>
          </section>

          {/* D */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-4"><Settings2 className="h-5 w-5 text-yellow-400" /> D. Interactive Controls</h2>
            <div className="card-warm p-6 border-yellow-500/20 bg-yellow-500/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold mb-1">Cleaning Pipeline</h3>
                  <p className="text-sm text-muted-foreground">Executes audit operations and saves clean dataset artifacts.</p>
                </div>
                <button
                  onClick={() => cleanMutation.mutate()}
                  disabled={cleanMutation.isPending}
                  className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 ml-4 shrink-0"
                >
                  {cleanMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Edit3 className="h-4 w-4" />}
                  {cleanMutation.isPending ? "Cleaning..." : "Execute Pipeline"}
                </button>
              </div>
            </div>
          </section>

          {/* E */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-4"><BarChart2 className="h-5 w-5 text-accent" /> E. Analytical Output</h2>
            {log && (
              <div className="space-y-4">
                <div className="card-warm p-5 bg-green-500/5 border-green-500/30">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h3 className="font-bold text-green-400">Cleaning Audit Trail Logged</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-surface/50 p-3 rounded text-center">
                      <p className="text-[10px] text-muted-foreground uppercase">Rows Before</p>
                      <p className="text-xl font-bold text-foreground mt-1">{log.rows_before?.toLocaleString()}</p>
                    </div>
                    <div className="bg-surface/50 p-3 rounded text-center">
                      <p className="text-[10px] text-muted-foreground uppercase">Rows After</p>
                      <p className="text-xl font-bold text-green-400 mt-1">{log.rows_after?.toLocaleString()}</p>
                    </div>
                    <div className="bg-surface/50 p-3 rounded text-center">
                      <p className="text-[10px] text-muted-foreground uppercase">Duplicates Removed</p>
                      <p className="text-xl font-bold text-foreground mt-1">{log.duplicates_removed}</p>
                    </div>
                    <div className="bg-surface/50 p-3 rounded text-center">
                      <p className="text-[10px] text-muted-foreground uppercase">Invalid Flagged</p>
                      <p className="text-xl font-bold text-yellow-400 mt-1">{log.invalid_records_flagged}</p>
                    </div>
                  </div>
                </div>

                <div className="card-warm p-5">
                  <h3 className="font-bold text-sm mb-4">Reproducible Cleaning Audit Log</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[10px] text-muted-foreground uppercase bg-surface/50">
                        <tr>
                          <th className="px-3 py-2">Operation</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Target Columns</th>
                          <th className="px-3 py-2">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {operations.map((op: any, i: number) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-surface/30">
                            <td className="px-3 py-2 font-medium text-foreground">{op.operation}</td>
                            <td className="px-3 py-2 font-mono text-green-400 font-bold">{op.status}</td>
                            <td className="px-3 py-2 font-mono text-accent text-[11px]">{op.affected_columns?.slice(0, 3).join(", ")}</td>
                            <td className="px-3 py-2 text-muted-foreground">{op.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* F */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-3"><Eye className="h-5 w-5 text-purple-400" /> F. Interpretation</h2>
            <div className="bg-purple-500/5 p-4 rounded-lg border border-purple-500/20">
              <p className="text-sm text-muted-foreground leading-relaxed">
                All cleaning operations are auditable and non-destructive. Raw values are preserved in flags rather than arbitrarily Winsorized, ensuring absolute data fidelity.
              </p>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="card-warm p-5 border-t-4 border-t-yellow-500">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-muted-foreground"><Layers className="h-4 w-4" /> B. Input Data</h2>
            <span className="bg-surface border border-border px-2 py-1 rounded text-xs font-mono text-accent">master_analytical_dataset.csv</span>
          </section>

          <section className="card-warm p-5 border-t-4 border-t-accent">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-muted-foreground"><Cpu className="h-4 w-4" /> C. Method</h2>
            <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
              <li>Header normalization</li>
              <li>Duplicate record check</li>
              <li>Category label mapping</li>
              <li>JSON audit trail generation</li>
            </ul>
          </section>

          <section className="card-warm p-5 border-t-4 border-t-green-500 bg-green-500/5">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-green-400"><CheckCircle className="h-4 w-4" /> G. Why this matters</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Transparent, auditable data cleaning ensures all analytical results in M5–M14 can be independently audited and verified.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
