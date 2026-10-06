import { BookOpen, Code, Database, Server, Settings2, Layers, Cpu, CheckCircle, ArrowRight, Activity, TrendingUp, AlertOctagon, Lightbulb, Link2, Shield, Target, FileText, Edit3, Clock, Users } from "lucide-react";

export default function AboutView({ setActivePage }: { setActivePage?: (page: string) => void }) {
  const modules = [
    { id: "m1", name: "M1 Dataset Explorer", icon: Target, purpose: "Profile raw UCI dataset structure & metadata.", input: "Raw CSV File", technique: "Descriptive Profiling", output: "Metadata & Schema Contract" },
    { id: "m2", name: "M2 Data Preparation", icon: Link2, purpose: "Standardize column names & category labels.", input: "UCI Raw Data", technique: "Semantic Standardization", output: "Master Parquet Dataset" },
    { id: "m3", name: "M3 Data Quality", icon: Shield, purpose: "Audit dataset completeness, uniqueness & validity.", input: "Master Dataset", technique: "Domain Range Checks", output: "Quality Audit Score" },
    { id: "m4", name: "M4 Data Cleaning", icon: Edit3, purpose: "Auditable deduplication and boundary flagging.", input: "Master Dataset", technique: "Audit Logging", output: "cleaning_audit_log.json" },
    { id: "m5", name: "M5 Descriptive Statistics", icon: Activity, purpose: "Compute 13-metric statistics & distributions.", input: "Master Dataset", technique: "Parametric/Non-Parametric", output: "Histograms & Summary Metrics" },
    { id: "m6", name: "M6 EDA & Visualizations", icon: TrendingUp, purpose: "Visually explore academic & outcome relationships.", input: "Master Dataset", technique: "Bivariate Scatter & Heatmaps", output: "Correlation Matrix" },
    { id: "m7", name: "M7 Statistical Analysis", icon: Target, purpose: "Rigorous hypothesis testing with SciPy.", input: "Master Dataset", technique: "Welch t-Test, Chi-Square", output: "p-values & Cohen's d" },
    { id: "m8", name: "M8 Feature Engineering", icon: Cpu, purpose: "Synthesize higher-order progression metrics.", input: "Master Dataset", technique: "Ratio & Delta Formulas", output: "Feature Catalog" },
    { id: "m9", name: "M9 Academic Progression", icon: Clock, purpose: "Track longitudinal Semester 1 -> Semester 2 delta.", input: "Semester Metrics", technique: "Slope Analytics", output: "Progression Trajectories" },
    { id: "m10", name: "M10 Student Cohorts", icon: Users, purpose: "Unsupervised K-Means behavioral clustering & PCA.", input: "Scaled Features", technique: "K-Means & Silhouette", output: "Behavioral Profiles & PCA Plot" },
    { id: "m11", name: "M11 Anomaly Analysis", icon: AlertOctagon, purpose: "Multivariate outlier detection with Isolation Forest.", input: "Academic Features", technique: "Isolation Forest", output: "Anomaly Scores & Outliers" },
    { id: "m12", name: "M12 Educational Insights", icon: Lightbulb, purpose: "Deterministic synthesis of pedagogical evidence.", input: "M5-M11 Outputs", technique: "Evidence Rule Engine", output: "Evidence-Based Insights" },
    { id: "m13", name: "M13 Student Digital Twin", icon: Cpu, purpose: "Explainable individual student analytical profile.", input: "Student ID Record", technique: "5D Percentile Radar", output: "Digital Twin Profile" },
    { id: "m14", name: "M14 Intervention Simulator", icon: TrendingUp, purpose: "Interactive what-if scenario exploration.", input: "User Sliders", technique: "Percentile Shift Calculation", output: "Before vs Scenario Deltas" },
  ];

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-16">
      {/* HERO */}
      <div className="text-center mb-8 animate-fade-up mt-4">
        <h1 className="text-5xl md:text-6xl font-bold font-syne tracking-tight text-foreground mb-4">EduNexus</h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
          A Multidimensional Educational Data Science Framework for Student Behavior, Engagement, Performance, and Academic Risk Analytics.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <span className="bg-accent/10 text-accent px-4 py-1.5 rounded-full text-xs font-semibold border border-accent/20 uppercase tracking-widest">Educational Data Science</span>
          <span className="bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-xs font-semibold border border-blue-500/20 uppercase tracking-widest">UCI Real Dataset (4,424 Records)</span>
          <span className="bg-green-500/10 text-green-400 px-4 py-1.5 rounded-full text-xs font-semibold border border-green-500/20 uppercase tracking-widest">14 Analytical Modules</span>
          <span className="bg-purple-500/10 text-purple-400 px-4 py-1.5 rounded-full text-xs font-semibold border border-purple-500/20 uppercase tracking-widest">Explainable Digital Twin</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card-warm p-8 border-l-4 border-l-red-500">
          <h2 className="text-xl font-bold mb-4 font-syne">The Problem</h2>
          <p className="text-muted-foreground leading-relaxed text-sm">
            Educational institutions collect demographic, admission, and semester performance logs. However, these data sources are rarely combined into explainable analytical platforms, leading to black-box machine learning predictions that lack transparency and scientific defensibility.
          </p>
        </div>

        <div className="card-warm p-8 border-l-4 border-l-green-500">
          <h2 className="text-xl font-bold mb-4 font-syne">Project Objective</h2>
          <p className="text-muted-foreground leading-relaxed text-sm mb-4">
            EduNexus converts real institutional student data into verifiable, statistically validated, and explainable educational intelligence across 14 end-to-end data science modules.
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-mono font-bold text-muted-foreground">
            RAW DATA <ArrowRight className="h-4 w-4 inline text-accent" />
            PREPARATION <ArrowRight className="h-4 w-4 inline text-accent" />
            QUALITY <ArrowRight className="h-4 w-4 inline text-accent" />
            STATISTICS <ArrowRight className="h-4 w-4 inline text-accent" />
            PROGRESSION <ArrowRight className="h-4 w-4 inline text-accent" />
            COHORTS <ArrowRight className="h-4 w-4 inline text-accent" />
            DIGITAL TWIN
          </div>
        </div>
      </div>

      {/* SYSTEM ARCHITECTURE */}
      <div className="card-warm p-8">
        <h2 className="text-2xl font-bold mb-8 font-syne flex items-center gap-2">
          <Layers className="h-6 w-6 text-accent" /> System Architecture & Data Lineage
        </h2>
        
        <div className="space-y-4">
          <div className="bg-surface border border-border p-4 rounded-lg flex flex-col md:flex-row items-center gap-4">
            <div className="bg-surface-warm border border-border px-4 py-2 rounded-md font-bold text-xs uppercase w-48 text-center shrink-0">Layer 1: Primary Data Source</div>
            <div className="text-xs font-mono text-accent">UCI Machine Learning Repository Dataset 697: Predict Students' Dropout and Academic Success (4,424 records)</div>
          </div>
          
          <div className="flex justify-center"><ArrowRight className="h-5 w-5 text-accent rotate-90" /></div>

          <div className="bg-surface border border-border p-4 rounded-lg flex flex-col md:flex-row items-center gap-4">
            <div className="bg-surface-warm border border-border px-4 py-2 rounded-md font-bold text-xs uppercase w-48 text-center shrink-0">Layer 2: Data Engineering</div>
            <div className="flex flex-wrap gap-2 flex-1">
              {['M1 Dataset Explorer', 'M2 Data Preparation', 'M3 Data Quality', 'M4 Data Cleaning'].map(m => (
                <span key={m} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded text-xs font-semibold">{m}</span>
              ))}
            </div>
          </div>

          <div className="flex justify-center"><ArrowRight className="h-5 w-5 text-accent rotate-90" /></div>

          <div className="bg-surface border border-border p-4 rounded-lg flex flex-col md:flex-row items-center gap-4">
            <div className="bg-surface-warm border border-border px-4 py-2 rounded-md font-bold text-xs uppercase w-48 text-center shrink-0">Layer 3: Core Data Science</div>
            <div className="flex flex-wrap gap-2 flex-1">
              {['M5 Descriptive Statistics', 'M6 EDA', 'M7 Statistical Analysis', 'M8 Feature Engineering'].map(m => (
                <span key={m} className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1.5 rounded text-xs font-semibold">{m}</span>
              ))}
            </div>
          </div>

          <div className="flex justify-center"><ArrowRight className="h-5 w-5 text-accent rotate-90" /></div>

          <div className="bg-surface border border-border p-4 rounded-lg flex flex-col md:flex-row items-center gap-4">
            <div className="bg-surface-warm border border-border px-4 py-2 rounded-md font-bold text-xs uppercase w-48 text-center shrink-0">Layer 4: Advanced Analytics</div>
            <div className="flex flex-wrap gap-2 flex-1">
              {['M9 Academic Progression', 'M10 Student Cohorts', 'M11 Anomaly Analysis', 'M12 Educational Insights'].map(m => (
                <span key={m} className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1.5 rounded text-xs font-semibold">{m}</span>
              ))}
            </div>
          </div>

          <div className="flex justify-center"><ArrowRight className="h-5 w-5 text-accent rotate-90" /></div>

          <div className="bg-surface border border-border p-4 rounded-lg flex flex-col md:flex-row items-center gap-4">
            <div className="bg-surface-warm border border-border px-4 py-2 rounded-md font-bold text-xs uppercase w-48 text-center shrink-0">Layer 5: Novelty Lab</div>
            <div className="flex flex-wrap gap-2 flex-1">
              {['M13 Student Digital Twin', 'M14 Intervention Simulator'].map(m => (
                <span key={m} className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-3 py-1.5 rounded text-xs font-semibold">{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODULE EXPLORER */}
      <div>
        <h2 className="text-2xl font-bold mb-6 font-syne flex items-center gap-2">
          <Settings2 className="h-6 w-6 text-accent" /> Interactive 14-Module Explorer
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <div 
              key={mod.id} 
              onClick={() => setActivePage && setActivePage(
                mod.id === 'm1' ? 'dataset_explorer' : mod.id === 'm2' ? 'data_integration' : mod.id === 'm3' ? 'data_quality' : mod.id === 'm4' ? 'data_cleaning' : mod.id === 'm5' ? 'statistics' : mod.id === 'm6' ? 'eda' : mod.id === 'm7' ? 'statistical_analysis' : mod.id === 'm8' ? 'features' : mod.id === 'm9' ? 'temporal' : mod.id === 'm10' ? 'cohorts' : mod.id === 'm11' ? 'anomalies' : mod.id === 'm12' ? 'educational_insights' : mod.id === 'm13' ? 'digital_twin' : 'intervention_simulator'
              )}
              className="bg-surface/50 border border-border/50 p-5 rounded-lg cursor-pointer hover:border-accent/50 hover:bg-surface/80 transition-colors group relative overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <mod.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground group-hover:text-accent transition-colors">{mod.name}</h3>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4 h-8">{mod.purpose}</p>
              
              <div className="space-y-2 text-[10px] font-mono border-t border-border/50 pt-3 mt-auto">
                <div className="flex justify-between"><span className="text-muted-foreground">Input:</span> <span className="text-foreground text-right">{mod.input}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Technique:</span> <span className="text-accent text-right">{mod.technique}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Output:</span> <span className="text-foreground text-right">{mod.output}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
