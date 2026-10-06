import { useQuery } from "@tanstack/react-query";
import { AlertOctagon, Cpu, CheckCircle, Info, Eye, AlertTriangle, Layers, BarChart2 } from "lucide-react";
import { useState } from "react";

interface AnomalyRecord {
  student_id: string;
  target: string;
  age: number;
  admission_grade: number;
  sem1_grade: number;
  sem2_grade: number;
  anomaly_score: number;
  evidence: string;
}

interface AnomalyApiResponse {
  status: string;
  total_students: number;
  anomalies_detected: number;
  anomaly_rate: number;
  contamination: number;
  records: AnomalyRecord[];
  disclaimer: string;
}

export default function AnomalyAnalysisView() {
  const [contamination, setContamination] = useState<number>(0.05);

  const { data: anomalyData, isLoading, isError, error } = useQuery<AnomalyApiResponse>({
    queryKey: ["anomalies", contamination],
    queryFn: async () => {
      const res = await fetch(`/api/anomalies/summary?contamination=${contamination}`);
      if (!res.ok) throw new Error("Unable to load anomaly analysis from server.");
      return res.json();
    }
  });

  const records = anomalyData?.records || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20 text-red-400 font-bold">M11</div>
          <h1 className="text-3xl font-bold font-syne tracking-tight text-foreground">Anomaly & Outlier Analysis</h1>
        </div>
        <p className="text-muted-foreground text-lg">Multivariate Isolation Forest anomaly detection across academic and demographic dimensions.</p>
      </div>

      {/* Critical Methodology Alert */}
      <div className="bg-red-500/10 border-l-4 border-l-red-500 p-4 rounded-r-lg">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <h4 className="font-bold text-xs text-red-400 uppercase tracking-wider">Methodology Note — Anomaly vs. Risk</h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {anomalyData?.disclaimer || "Isolation Forest detects statistical multivariate outliers. An anomaly represents unusual feature combinations, NOT necessarily academic failure or risk."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* A */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-3"><Info className="h-5 w-5 text-blue-400" /> A. What this module does</h2>
            <div className="bg-surface/50 p-4 rounded-lg border border-border/50">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Module 11 uses an unsupervised <strong>Isolation Forest</strong> algorithm to isolate multivariate outliers across admission grades, semester progression, age, and academic loads.
              </p>
            </div>
          </section>

          {/* D */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-4"><AlertOctagon className="h-5 w-5 text-yellow-400" /> D. Interactive Controls</h2>
            <div className="card-warm p-5 flex items-center justify-between">
              <span className="font-bold text-xs text-muted-foreground uppercase">Contamination Threshold:</span>
              <div className="flex gap-2">
                {[0.01, 0.03, 0.05, 0.10].map(c => (
                  <button
                    key={c}
                    onClick={() => setContamination(c)}
                    className={`px-3 py-1.5 rounded-md font-bold text-xs transition-colors ${contamination === c ? "bg-accent text-white" : "bg-surface border border-border text-muted-foreground"}`}
                  >
                    {(c * 100).toFixed(0)}%
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Loading State */}
          {isLoading && <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div></div>}

          {/* Error State */}
          {isError && (
            <div className="bg-red-500/10 border-l-4 border-l-red-500 p-4 rounded-r-lg flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <p className="text-sm text-red-400 font-medium">Unable to load anomaly analysis: {error?.message}</p>
            </div>
          )}

          {/* E */}
          {anomalyData && (
            <section className="space-y-6">
              <h2 className="text-xl font-bold font-syne flex items-center gap-2"><BarChart2 className="h-5 w-5 text-accent" /> E. Analytical Output</h2>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="card-warm p-4 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Students</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{anomalyData.total_students?.toLocaleString() ?? "Unavailable"}</p>
                </div>
                <div className="card-warm p-4 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Anomalies Detected</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">{anomalyData.anomalies_detected ?? 0}</p>
                </div>
                <div className="card-warm p-4 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Anomaly Rate</p>
                  <p className="text-2xl font-bold text-accent mt-1">{anomalyData.anomaly_rate ?? 0}%</p>
                </div>
              </div>

              {/* Sample Outliers Table */}
              <div className="card-warm p-6">
                <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-muted-foreground">Detected Multivariate Outliers ({records.length} Records Shown)</h3>
                {records.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No anomaly records detected for the selected contamination threshold.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[10px] text-muted-foreground uppercase bg-surface/50">
                        <tr>
                          <th className="px-3 py-2">Student ID</th>
                          <th className="px-3 py-2">Outcome</th>
                          <th className="px-3 py-2">Age</th>
                          <th className="px-3 py-2">Admission Grade</th>
                          <th className="px-3 py-2">Sem 1 Grade</th>
                          <th className="px-3 py-2">Sem 2 Grade</th>
                          <th className="px-3 py-2">Anomaly Score</th>
                          <th className="px-3 py-2">Key Driver Evidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((row) => (
                          <tr key={row.student_id} className="border-b border-border/50 hover:bg-surface/30 font-mono">
                            <td className="px-3 py-2 text-accent font-bold">{row.student_id}</td>
                            <td className="px-3 py-2 text-foreground font-sans font-medium">{row.target}</td>
                            <td className="px-3 py-2 text-muted-foreground">{row.age}</td>
                            <td className="px-3 py-2">{row.admission_grade?.toFixed(1)}</td>
                            <td className="px-3 py-2">{row.sem1_grade?.toFixed(1)}</td>
                            <td className="px-3 py-2">{row.sem2_grade?.toFixed(1)}</td>
                            <td className="px-3 py-2 text-red-400 font-bold">{row.anomaly_score?.toFixed(4)}</td>
                            <td className="px-3 py-2 text-muted-foreground font-sans text-[11px]">{row.evidence}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* F */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-3"><Eye className="h-5 w-5 text-purple-400" /> F. Interpretation</h2>
            <div className="bg-purple-500/5 p-4 rounded-lg border border-purple-500/20 text-sm text-muted-foreground leading-relaxed">
              Outliers identified by Isolation Forest represent students with atypical parameter profiles across entrance metrics and semester completion rates.
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="card-warm p-5 border-t-4 border-t-red-500">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-muted-foreground"><Layers className="h-4 w-4" /> B. Input Data</h2>
            <span className="bg-surface border border-border px-2 py-1 rounded text-xs font-mono text-accent">master_analytical_dataset.csv</span>
          </section>

          <section className="card-warm p-5 border-t-4 border-t-accent">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-muted-foreground"><Cpu className="h-4 w-4" /> C. Method</h2>
            <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
              <li>Isolation Forest multivariate tree isolation</li>
              <li>Contamination hyperparameter tuning</li>
              <li>Anomaly score distribution computation</li>
            </ul>
          </section>

          <section className="card-warm p-5 border-t-4 border-t-green-500 bg-green-500/5">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-green-400"><CheckCircle className="h-4 w-4" /> G. Why this matters</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Isolation Forest captures non-linear, multi-dimensional anomalies that univariate bounds (IQR or Z-Score) miss completely.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

