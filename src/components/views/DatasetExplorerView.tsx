import { useQuery } from "@tanstack/react-query";
import { Database, Info, Layers, Cpu, Eye, CheckCircle, BarChart2, Settings2, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const DOMAIN_COLORS: Record<string, string> = {
  DEMOGRAPHIC: "#8b5cf6",
  APPLICATION: "#3b82f6",
  SOCIOECONOMIC: "#f59e0b",
  ACADEMIC_SEM1: "#10b981",
  ACADEMIC_SEM2: "#06b6d4",
  MACROECONOMIC: "#f97316",
  OUTCOME: "#ef4444",
  GENERAL: "#6b7280"
};

export default function DatasetExplorerView() {
  const { data: summaryData, isLoading, error } = useQuery({
    queryKey: ["dataset_summary"],
    queryFn: async () => {
      const res = await fetch("/api/datasets/summary");
      if (!res.ok) throw new Error("Failed to fetch dataset summary");
      return res.json();
    }
  });

  if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div></div>;

  if (error) return (
    <div className="card-warm p-8 text-center border border-red-500/20 bg-red-500/5">
      <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold mb-2">Dataset Not Available</h2>
      <p className="text-muted-foreground text-sm">Ensure the backend is running and the UCI dataset is present in data/raw/.</p>
    </div>
  );

  const domainDist = Object.entries(summaryData?.domain_distribution || {})
    .filter(([k]) => k !== "GENERAL")
    .map(([name, count]) => ({ name, count }));

  const targetDist = Object.entries(summaryData?.target_distribution || {}).map(([name, count]) => ({ name, count }));

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-accent font-bold">M1</div>
          <h1 className="text-3xl font-bold font-syne tracking-tight text-foreground">Dataset Explorer</h1>
        </div>
        <p className="text-muted-foreground text-lg">Profile the UCI real student dropout prediction dataset — schema, provenance, and structural anatomy.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* A */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-3"><Info className="h-5 w-5 text-blue-400" /> A. What this module does</h2>
            <div className="bg-surface/50 p-4 rounded-lg border border-border/50">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Module 1 profiles the official UCI Machine Learning Repository dataset "Predict Students' Dropout and Academic Success" (ID 697). It maps physical structure, variable schemas, analytical domains, target distribution, and data completeness. All downstream modules M2–M14 derive their analytical foundation from this dataset.
              </p>
            </div>
          </section>

          {/* D */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-4"><Settings2 className="h-5 w-5 text-yellow-400" /> D. Interactive Controls</h2>
            <div className="card-warm p-6 border-blue-500/20 bg-blue-500/5">
              <p className="text-sm text-muted-foreground text-center py-2">No interactive parameters — M1 automatically profiles the dataset on load. Use the Column Explorer below to inspect individual variables.</p>
            </div>
          </section>

          {/* E - KPIs */}
          <section>
            <h2 className="text-xl font-bold font-syne flex items-center gap-2 mb-4"><BarChart2 className="h-5 w-5 text-accent" /> E. Analytical Output</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: "Total Records", value: summaryData?.total_records?.toLocaleString() },
                { label: "Total Variables", value: summaryData?.total_variables },
                { label: "Numeric Variables", value: summaryData?.numeric_variables_count },
                { label: "Categorical Variables", value: summaryData?.categorical_variables_count },
                { label: "Missing Values", value: summaryData?.missing_values_count ?? "0" },
                { label: "Duplicate Rows", value: summaryData?.duplicate_rows_count ?? "0" }
              ].map(({ label, value }) => (
                <div key={label} className="card-warm p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-2xl font-bold text-accent">{value}</p>
                </div>
              ))}
            </div>

            {/* Domain Distribution Chart */}
            <div className="card-warm p-5 mb-4">
              <h3 className="font-bold text-sm mb-4">Variables by Analytical Domain</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={domainDist} layout="vertical" margin={{ left: 60, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                    <XAxis type="number" stroke="#888" fontSize={11} />
                    <YAxis dataKey="name" type="category" stroke="#888" fontSize={10} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1b1e', borderColor: '#333', borderRadius: '8px' }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {domainDist.map((entry) => (
                        <Cell key={entry.name} fill={DOMAIN_COLORS[entry.name] || "#8b5cf6"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Target Distribution */}
            <div className="card-warm p-5 mb-4">
              <h3 className="font-bold text-sm mb-4">Target Variable Distribution (Outcome Classes)</h3>
              <div className="flex gap-4 flex-wrap">
                {targetDist.map((t: any, i: number) => (
                  <div key={t.name} className="flex-1 min-w-[120px] bg-surface/50 p-4 rounded-lg text-center border border-border/40">
                    <p className="text-xs text-muted-foreground uppercase">{t.name}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: ["#10b981", "#ef4444", "#f59e0b"][i] }}>{Number(t.count).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{summaryData?.total_records ? Math.round((t.count / summaryData.total_records) * 100) : 0}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Column Explorer Table */}
            <div className="card-warm p-5">
              <h3 className="font-bold text-sm mb-4">Column Explorer — Variable Schema</h3>
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-muted-foreground uppercase bg-surface/50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Variable</th>
                      <th className="px-3 py-2">Domain</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Unique</th>
                      <th className="px-3 py-2">Missing%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData?.column_explorer?.filter((c: any) => !c.name.includes("_label")).map((col: any) => (
                      <tr key={col.name} className="border-b border-border/50 hover:bg-surface/30">
                        <td className="px-3 py-2 font-mono text-accent">{col.name}</td>
                        <td className="px-3 py-2 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: (DOMAIN_COLORS[col.domain] || "#6b7280") + "99" }}>{col.domain}</span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{col.type}</td>
                        <td className="px-3 py-2">{col.unique_values}</td>
                        <td className="px-3 py-2 text-green-400">{col.missing_pct}%</td>
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
                The UCI dataset contains {summaryData?.total_records?.toLocaleString() || "4,424"} real student records from a Portuguese higher education institution with zero missing values. Three outcome classes (Graduate, Dropout, Enrolled) are imbalanced — graduates represent the majority class. All 37 source variables are encoded numerically with decoded label columns produced by M2. The dataset is analytically complete and immediately ready for M2 integration.
              </p>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="card-warm p-5 border-t-4 border-t-accent">
            <h2 className="text-sm font-bold font-syne flex items-center gap-2 mb-3 uppercase tracking-wider text-muted-foreground"><Layers className="h-4 w-4" /> B. Input Data</h2>
            <div className="space-y-2 text-xs">
              <div className="bg-surface border border-border px-3 py-2 rounded font-mono">uci_predict_students_dropout.csv</div>
              <p className="text-muted-foreground">UCI Machine Learning Repository Dataset ID 697</p>
            </div>
          </section>

          <section className="card-warm p-5 border-t-4 border-t-blue-500">
            <h2 className="text-sm font-bold font-syne flex items-center gap-2 mb-3 uppercase tracking-wider text-muted-foreground"><Cpu className="h-4 w-4" /> C. Method</h2>
            <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
              <li>Pandas `read_csv()` with separator auto-detection</li>
              <li>Schema standardization via column map contract</li>
              <li>Variable domain taxonomy assignment</li>
              <li>Null/duplicate counting (`isnull().sum()`)</li>
            </ul>
          </section>

          <section className="card-warm p-5 border-t-4 border-t-green-500 bg-green-500/5">
            <h2 className="text-sm font-bold font-syne flex items-center gap-2 mb-3 uppercase tracking-wider text-green-400"><CheckCircle className="h-4 w-4" /> G. Why this matters</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Data provenance is the analytical foundation of every subsequent module. Without understanding variable schemas, domains, and structural integrity, no statistical test or machine learning result is scientifically defensible. M1 ensures complete analytical transparency.
            </p>
          </section>

          {/* Extended CSV Note */}
          <section className="card-warm p-5 border-t-4 border-t-yellow-500 bg-yellow-500/5">
            <h2 className="text-sm font-bold mb-3 text-yellow-400 uppercase">Secondary Dataset Status</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-yellow-400">EduNexus Extended CSV</strong> was audited but could not be reliably merged with the UCI primary source due to absence of a shared entity-level join key (different row counts, different institutional contexts). It is retained as an independent educational reference dataset.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
