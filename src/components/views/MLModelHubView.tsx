import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Activity, BrainCircuit, RefreshCw, AlertCircle, BarChart3, TrendingUp, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { useToast } from "@/components/ui/use-toast";

const API_BASE = "http://localhost:8000/api/ml";

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
  cv_score: number;
  classes: string[];
}

interface ShapFeature {
  feature: string;
  importance: number;
}

interface ModelInfo {
  name: string;
  is_trained: boolean;
  metrics: ModelMetrics | null;
  shap: ShapFeature[] | null;
}

export default function MLModelHubView() {
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const { data: modelsData, isLoading, refetch } = useQuery<{ models: ModelInfo[] }>({
    queryKey: ["ml_models"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/models`);
      if (!res.ok) throw new Error("Failed to fetch models");
      return res.json();
    },
  });

  const trainMutation = useMutation({
    mutationFn: async (modelName: string) => {
      const res = await fetch(`${API_BASE}/train`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_name: modelName }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Training failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Model Trained Successfully",
        description: data.message,
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Training Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTrain = (modelName: string) => {
    trainMutation.mutate(modelName);
  };

  const models = modelsData?.models || [];
  const activeModelDetails = models.find(m => m.name === selectedModel);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <BrainCircuit className="h-8 w-8 text-accent" />
          Machine Learning Model Hub
        </h2>
        <p className="text-muted-foreground max-w-3xl">
          Train, evaluate, and interpret predictive models for student dropout and academic success.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Model Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-surface/50 border border-border/60 rounded-xl p-4 backdrop-blur-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Search className="h-4 w-4" /> Available Models
            </h3>
            
            {isLoading ? (
              <div className="flex justify-center p-4"><RefreshCw className="h-5 w-5 animate-spin text-accent" /></div>
            ) : (
              <div className="space-y-2">
                {models.map((model) => (
                  <div
                    key={model.name}
                    onClick={() => setSelectedModel(model.name)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedModel === model.name ? 'border-accent bg-accent/10 shadow-sm' : 'border-border/50 hover:border-accent/50 bg-background'}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{model.name}</span>
                      {model.is_trained ? (
                        <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" title="Trained"></span>
                      ) : (
                        <span className="flex h-2 w-2 rounded-full bg-slate-300" title="Untrained"></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Model Details */}
        <div className="lg:col-span-3">
          {!selectedModel ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-surface/30 border border-border/50 rounded-xl border-dashed">
              <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">Select a model from the list to view details or train it.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header Action */}
              <div className="flex justify-between items-center bg-surface border border-border/60 p-5 rounded-xl shadow-sm">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{selectedModel}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeModelDetails?.is_trained ? "Model is trained and ready for prediction." : "Model has not been trained yet."}
                  </p>
                </div>
                <button
                  onClick={() => handleTrain(selectedModel)}
                  disabled={trainMutation.isPending}
                  className="bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow shadow-accent/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {trainMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                  {trainMutation.isPending ? "Training..." : (activeModelDetails?.is_trained ? "Retrain Model" : "Train Model")}
                </button>
              </div>

              {/* Metrics (if trained) */}
              {activeModelDetails?.is_trained && activeModelDetails.metrics && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard label="Accuracy" value={activeModelDetails.metrics.accuracy} />
                    <MetricCard label="F1 Score" value={activeModelDetails.metrics.f1} />
                    <MetricCard label="ROC-AUC" value={activeModelDetails.metrics.roc_auc} />
                    <MetricCard label="CV Score (3-Fold)" value={activeModelDetails.metrics.cv_score} />
                  </div>

                  {/* SHAP Chart */}
                  {activeModelDetails.shap && activeModelDetails.shap.length > 0 && (
                    <div className="bg-surface border border-border/60 rounded-xl p-5 shadow-sm">
                      <h4 className="text-base font-semibold mb-4 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-accent" /> SHAP Feature Importance
                      </h4>
                      <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={activeModelDetails.shap} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis dataKey="feature" type="category" width={120} stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(val) => val.length > 20 ? val.substring(0, 18) + '...' : val} />
                            <RechartsTooltip
                              contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                              itemStyle={{ color: 'hsl(var(--foreground))' }}
                              formatter={(value: number) => [value.toFixed(4), "Importance"]}
                            />
                            <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                              {activeModelDetails.shap.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="hsl(var(--accent))" opacity={1 - (index * 0.05)} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string, value: number }) {
  // Convert 0-1 to percentage for display
  const percentage = (value * 100).toFixed(1);
  return (
    <div className="bg-surface border border-border/60 rounded-xl p-4 shadow-sm relative overflow-hidden group hover:border-accent/50 transition-colors">
      <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <TrendingUp className="w-20 h-20 text-accent" />
      </div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <h4 className="text-2xl font-bold text-foreground">{percentage}%</h4>
      </div>
    </div>
  );
}
