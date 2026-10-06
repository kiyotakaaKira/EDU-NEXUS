import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Cpu, User, Target, TrendingUp, Users, CheckCircle, Info, BarChart2, Layers } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

export default function DigitalTwinView() {
  const [selectedId, setSelectedId] = useState<string>("");

  const { data: studentsList } = useQuery({
    queryKey: ["digital_twin_students"],
    queryFn: async () => {
      const res = await fetch("/api/digital-twin/students?limit=100");
      if (!res.ok) throw new Error("Failed to load students");
      return res.json();
    }
  });

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["digital_twin_profile", selectedId],
    queryFn: async () => {
      const id = selectedId || (studentsList?.[0]?.student_id);
      if (!id) return null;
      const res = await fetch(`/api/digital-twin/profile/${id}`);
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
    enabled: !!(selectedId || studentsList?.length > 0)
  });

  const activeId = selectedId || studentsList?.[0]?.student_id;
  const prof = profileData?.profile;
  const radar = profileData?.radar_dimensions || [];
  const pct = profileData?.percentiles || {};
  const cohort = profileData?.assigned_cohort;

  const radarData = radar.map((d: any) => ({
    dimension: d.dimension,
    Student: d.value,
    "Population Median": 50
  }));

  const percentileData = [
    { name: "Entry Grade", student: pct.admission_grade_pct, population: 50 },
    { name: "Sem 1 Grade", student: pct.sem1_grade_pct, population: 50 },
    { name: "Sem 2 Grade", student: pct.sem2_grade_pct, population: 50 },
    { name: "Sem 1 Approval", student: pct.sem1_approval_pct, population: 50 },
    { name: "Sem 2 Approval", student: pct.sem2_approval_pct, population: 50 },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400 font-bold text-sm">M13</div>
          <h1 className="text-3xl font-bold font-syne tracking-tight text-foreground">Student Success Digital Twin</h1>
        </div>
        <p className="text-muted-foreground text-lg">Explainable, deterministic analytical profile of any individual student record.</p>
      </div>

      <div className="bg-teal-500/5 border border-teal-500/20 rounded-lg p-4">
        <p className="text-xs text-teal-300 leading-relaxed">
          <strong>NOTE:</strong> This is an EXPLAINABLE ANALYTICAL PROFILE, not a generative AI simulation. All values are calculated deterministically from the UCI real dataset. Student IDs are anonymous internal analytical identifiers only.
        </p>
      </div>

      {/* Student Selector */}
      <div className="card-warm p-4 flex flex-col sm:flex-row items-center gap-4">
        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Select Student:</label>
        <select
          className="flex-1 bg-surface border border-border text-foreground rounded-lg px-4 py-2 text-sm focus:border-accent focus:outline-none"
          value={activeId}
          onChange={e => setSelectedId(e.target.value)}
        >
          {studentsList?.map((s: any) => (
            <option key={s.student_id} value={s.student_id}>
              {s.student_id} — Age {s.age}, Admission: {s.admission_grade.toFixed(0)}/200, Outcome: {s.target}
            </option>
          ))}
        </select>
      </div>

      {profileLoading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div></div>}

      {profileData && prof && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Profile + Cohort */}
          <div className="space-y-4">
            {/* Academic Profile */}
            <div className="card-warm p-5 border-t-4 border-t-teal-500">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wider text-muted-foreground"><User className="h-4 w-4" /> Academic Profile</h3>
              <div className="space-y-2 text-sm">
                {[
                  ["Student ID", prof.student_id],
                  ["Gender", prof.gender],
                  ["Age", prof.age_at_enrollment],
                  ["Outcome", prof.target],
                  ["Admission Grade", `${prof.admission_grade.toFixed(1)} / 200`],
                  ["Prev. Qualification", `${prof.previous_qualification_grade.toFixed(1)}`],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between border-b border-border/30 pb-1">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium text-foreground">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Academic Progression */}
            <div className="card-warm p-5">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wider text-muted-foreground"><TrendingUp className="h-4 w-4" /> Semester Performance</h3>
              <div className="space-y-2 text-sm">
                {[
                  ["Sem 1 Enrolled", prof.sem1_enrolled],
                  ["Sem 1 Approved", prof.sem1_approved],
                  ["Sem 1 Grade", `${prof.sem1_grade.toFixed(2)} / 20`],
                  ["Sem 2 Enrolled", prof.sem2_enrolled],
                  ["Sem 2 Approved", prof.sem2_approved],
                  ["Sem 2 Grade", `${prof.sem2_grade.toFixed(2)} / 20`],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between border-b border-border/30 pb-1">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-bold text-accent">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Socioeconomic */}
            <div className="card-warm p-5">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wider text-muted-foreground"><Layers className="h-4 w-4" /> Socioeconomic Context</h3>
              <div className="space-y-2 text-sm">
                {[
                  ["Scholarship", prof.scholarship],
                  ["Debtor", prof.debtor],
                  ["Tuition Fees", prof.tuition_fees],
                  ["Displaced", prof.displaced],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between border-b border-border/30 pb-1">
                    <span className="text-muted-foreground">{k}</span>
                    <span className={`font-bold ${v === "Yes" ? "text-green-400" : v === "No" ? "text-muted-foreground" : "text-accent"}`}>{v as string}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cohort Card */}
            {cohort && (
              <div className="card-warm p-5 bg-purple-500/5 border border-purple-500/20">
                <h3 className="font-bold text-sm mb-3 text-purple-400 flex items-center gap-2"><Users className="h-4 w-4" /> Assigned Behavioral Cohort</h3>
                <p className="font-bold text-foreground">{cohort.label}</p>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p>Cohort Size: {cohort.size?.toLocaleString()} students ({cohort.percentage}%)</p>
                  <p>Cohort Graduate Rate: {cohort.graduate_rate}%</p>
                  <p>Cohort Avg Sem2 Grade: {cohort.avg_sem2_grade}/20</p>
                </div>
              </div>
            )}
          </div>

          {/* Center: Radar Chart */}
          <div className="space-y-4">
            <div className="card-warm p-5">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wider text-muted-foreground"><BarChart2 className="h-4 w-4" /> 5-Dimensional Analytical Radar (Percentile)</h3>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fill: "#888", fontSize: 10 }} />
                    <Radar name="Student" dataKey="Student" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.35} />
                    <Radar name="Population Median" dataKey="Population Median" stroke="#6b7280" fill="#6b7280" fillOpacity={0.1} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1b1e', borderColor: '#333' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-2 text-xs">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-teal-500"></div> This Student</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-gray-500"></div> Population Median</div>
              </div>
            </div>

            {/* Population Comparison Bar */}
            <div className="card-warm p-5">
              <h3 className="font-bold text-sm mb-4 uppercase tracking-wider text-muted-foreground">Population Percentile Positions</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={percentileData} margin={{ top: 5, right: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" fontSize={10} />
                    <YAxis domain={[0, 100]} stroke="#888" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1b1e', borderColor: '#333' }} />
                    <Bar dataKey="student" name="Student Percentile" fill="#14b8a6" radius={[4,4,0,0]} />
                    <Bar dataKey="population" name="Population Median" fill="#4b5563" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right: Evidence Summary */}
          <div className="space-y-4">
            <div className="card-warm p-5 border-t-4 border-t-green-500 bg-green-500/5">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wider text-green-400"><CheckCircle className="h-4 w-4" /> Evidence Summary</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{profileData.evidence_summary}</p>
            </div>

            <div className="card-warm p-5">
              <h3 className="font-bold text-sm mb-4 uppercase tracking-wider text-muted-foreground">Population Percentile Details</h3>
              <div className="space-y-3">
                {Object.entries(pct).map(([key, val]: [string, any]) => {
                  const label = key.replace(/_pct$/, "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                  const pctNum = Number(val);
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-bold text-foreground">{pctNum}th percentile</span>
                      </div>
                      <div className="h-1.5 bg-surface rounded-full">
                        <div className="h-1.5 bg-teal-500 rounded-full" style={{ width: `${pctNum}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card-warm p-5 bg-blue-500/5 border border-blue-500/20">
              <h3 className="font-bold text-sm mb-3 text-blue-400 flex items-center gap-2"><Info className="h-4 w-4" /> Module Purpose</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The Digital Twin is an <strong>explainable analytical profile</strong>. It shows how this student record compares with the entire population across 5 academic dimensions, which behavioral cohort they belong to, and generates a data-driven evidence summary deterministically from computed metrics.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
