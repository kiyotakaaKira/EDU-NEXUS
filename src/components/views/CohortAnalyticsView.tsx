import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, BarChart2, Info, Eye, Layers, Cpu, CheckCircle, AlertTriangle } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface PcaPoint {
  student_id: string;
  pc1: number;
  pc2: number;
  cluster: number;
  target: string;
}

interface ClusterProfile {
  cluster_id: number;
  label: string;
  size: number;
  percentage: number;
  avg_admission_grade: number;
  avg_sem1_grade: number;
  avg_sem2_grade: number;
  avg_sem2_approved: number;
  dropout_rate: number;
  graduate_rate: number;
}

interface CohortApiResponse {
  status: string;
  total_students: number;
  n_clusters: number;
  silhouette_score: number;
  davies_bouldin_score: number;
  pca_explained_variance: number;
  cluster_profiles: ClusterProfile[];
  pca_points: PcaPoint[];
}

const CLUSTER_COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

export default function CohortAnalyticsView() {
  const [selectedK, setSelectedK] = useState<number>(4);

  const { data: cohortData, isLoading, isError, error } = useQuery<CohortApiResponse>({
    queryKey: ["cohorts", selectedK],
    queryFn: async () => {
      const res = await fetch(`/api/cohorts/summary?k=${selectedK}`);
      if (!res.ok) throw new Error("Unable to load cohort analysis from server.");
      return res.json();
    }
  });

  const cohorts = cohortData?.cluster_profiles || [];
  const pcaPoints = cohortData?.pca_points || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 font-bold">M10</div>
          <h1 className="text-3xl font-bold font-syne tracking-tight text-foreground">Cohort Analytics & Segmentation</h1>
        </div>
        <p className="text-muted-foreground text-lg">Unsupervised K-Means clustering with PCA 2D scatter visualization and behavioral profiles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* A */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-3"><Info className="h-5 w-5 text-blue-400" /> A. What this module does</h2>
            <div className="bg-surface/50 p-4 rounded-lg border border-border/50">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Module 10 segments students into K behavioral cohorts using K-Means clustering on standardized academic features. PCA reduces multi-dimensional space to 2D for visualization.
              </p>
            </div>
          </section>

          {/* D */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-4"><Users className="h-5 w-5 text-yellow-400" /> D. Interactive Controls</h2>
            <div className="card-warm p-4 flex items-center justify-between">
              <span className="font-bold text-sm text-muted-foreground uppercase">Number of Clusters (K):</span>
              <div className="flex gap-2">
                {[2, 3, 4, 5, 6].map(k => (
                  <button
                    key={k}
                    onClick={() => setSelectedK(k)}
                    className={`px-4 py-1.5 rounded-md font-bold text-xs transition-colors ${selectedK === k ? "bg-accent text-white" : "bg-surface border border-border text-muted-foreground"}`}
                  >
                    K = {k}
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
              <p className="text-sm text-red-400 font-medium">Unable to load cohort analysis: {error?.message}</p>
            </div>
          )}

          {cohortData && (
            <section className="space-y-6">
              <h2 className="text-xl font-bold font-syne flex items-center gap-2"><BarChart2 className="h-5 w-5 text-accent" /> E. Analytical Output</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card-warm p-4 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Students</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{cohortData.total_students?.toLocaleString() ?? "Unavailable"}</p>
                </div>
                <div className="card-warm p-4 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Silhouette Score</p>
                  <p className="text-2xl font-bold text-accent mt-1">{cohortData.silhouette_score ?? "Unavailable"}</p>
                </div>
                <div className="card-warm p-4 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Davies-Bouldin</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{cohortData.davies_bouldin_score ?? "Unavailable"}</p>
                </div>
                <div className="card-warm p-4 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">PCA Explained Var</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">{cohortData.pca_explained_variance ?? 0}%</p>
                </div>
              </div>

              {/* PCA 2D Scatter */}
              <div className="card-warm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">PCA 2D Cluster Scatter Plot</h3>
                  <div className="flex gap-3 text-[11px] font-mono">
                    {Array.from({ length: selectedK }).map((_, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ backgroundColor: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}></span>
                        Cluster {i}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis type="number" dataKey="pc1" stroke="#888" fontSize={11} label={{ value: "Principal Component 1 (PC1)", position: "insideBottom", offset: -10 }} />
                      <YAxis type="number" dataKey="pc2" stroke="#888" fontSize={11} label={{ value: "PC2", angle: -90, position: "insideLeft" }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1b1e', borderColor: '#333', borderRadius: '8px' }} />
                      <Scatter data={pcaPoints} opacity={0.75}>
                        {pcaPoints.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CLUSTER_COLORS[entry.cluster % CLUSTER_COLORS.length]} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Behavioral Profiles */}
              <div className="card-warm p-6">
                <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-muted-foreground">Behavioral Cohort Profiles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cohorts.map((c) => (
                    <div key={c.cluster_id} className="bg-surface/50 border border-border/50 p-4 rounded-lg space-y-2" style={{ borderLeftWidth: '4px', borderLeftColor: CLUSTER_COLORS[c.cluster_id % CLUSTER_COLORS.length] }}>
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-sm text-foreground">{c.label}</h4>
                        <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded font-mono font-bold">{c.percentage}% ({c.size} students)</span>
                      </div>
                      <div className="space-y-1 text-xs border-t border-border/30 pt-2 text-muted-foreground font-mono">
                        <div className="flex justify-between"><span>Graduate Rate:</span> <span className="font-bold text-green-400">{c.graduate_rate}%</span></div>
                        <div className="flex justify-between"><span>Dropout Rate:</span> <span className="font-bold text-red-400">{c.dropout_rate}%</span></div>
                        <div className="flex justify-between"><span>Avg Sem 1 Grade:</span> <span className="font-bold text-foreground">{c.avg_sem1_grade}/20</span></div>
                        <div className="flex justify-between"><span>Avg Sem 2 Grade:</span> <span className="font-bold text-foreground">{c.avg_sem2_grade}/20</span></div>
                        <div className="flex justify-between"><span>Avg Admission Grade:</span> <span className="font-bold text-foreground">{c.avg_admission_grade}/200</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* F */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-3"><Eye className="h-5 w-5 text-purple-400" /> F. Interpretation</h2>
            <div className="bg-purple-500/5 p-4 rounded-lg border border-purple-500/20 text-sm text-muted-foreground leading-relaxed">
              Unsupervised clustering isolates distinct student behavioral archetypes without outcome label supervision during training.
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="card-warm p-5 border-t-4 border-t-indigo-500">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-muted-foreground"><Layers className="h-4 w-4" /> B. Input Data</h2>
            <span className="bg-surface border border-border px-2 py-1 rounded text-xs font-mono text-accent">master_analytical_dataset.csv</span>
          </section>

          <section className="card-warm p-5 border-t-4 border-t-accent">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-muted-foreground"><Cpu className="h-4 w-4" /> C. Method</h2>
            <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
              <li>StandardScaler feature scaling</li>
              <li>K-Means clustering algorithm</li>
              <li>Silhouette Score evaluation</li>
              <li>PCA 2D projection</li>
            </ul>
          </section>

          <section className="card-warm p-5 border-t-4 border-t-green-500 bg-green-500/5">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-wider text-green-400"><CheckCircle className="h-4 w-4" /> G. Why this matters</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Behavioral segmentation allows institutions to deliver tailored support strategies based on empirical student clusters.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

