import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, Target } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// Type mirrors the result shape produced in BodyScan.tsx
export type BodyScanResult = {
  bodyFatRange: string;
  postureScore: number;
  symmetryScore: number;
  muscleMass: string;
  visceralFat: number;
  bodyAge: number;
  metabolicRate: number;
  measurements: {
    chest: string;
    waist: string;
    hips: string;
    shoulders: string;
    thighs: string;
  };
  postureAnalysis: {
    headAlignment: number;
    shoulderLevel: number;
    spinalCurvature: number;
    hipAlignment: number;
  };
  healthIndicators: {
    hydrationLevel: string;
    skinHealth: number;
    overallFitness: string;
  };
  progressSuggestions: string[];
  notes: string[];
};

function parseBodyFatAverage(range: string): number | null {
  // Accept formats like "18% – 24%" or "18-24%"
  const cleaned = range.replace(/\s/g, "");
  const match = cleaned.match(/(\d+(?:\.\d+)?)%?[–-](\d+(?:\.\d+)?)%?/);
  if (!match) return null;
  const low = parseFloat(match[1]);
  const high = parseFloat(match[2]);
  if (isNaN(low) || isNaN(high)) return null;
  return (low + high) / 2;
}

const color = (token: string) => `hsl(var(${token}))`;

const GaugeCard = ({ value, label }: { value: number; label: string }) => {
  const data = [{ name: label, value }];
  return (
    <Card>
      <CardContent className="p-4">
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={180} endAngle={0}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" cornerRadius={10} fill={color("--primary")} background={{ fill: color("--muted") }} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center mt-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">{Math.round(value)}%</p>
        </div>
      </CardContent>
    </Card>
  );
};

const FocusBadge = ({ text }: { text: string }) => (
  <div className="px-3 py-1 rounded-full bg-muted/50 text-sm flex items-center gap-1">
    <Target className="h-3.5 w-3.5 text-primary" />
    <span>{text}</span>
  </div>
);

export default function BodyScanResults({ result }: { result: BodyScanResult }) {
  const bfp = useMemo(() => parseBodyFatAverage(result.bodyFatRange), [result.bodyFatRange]);
  const compositionData = useMemo(() => {
    const fat = Math.max(0, Math.min(100, bfp ?? 0));
    return [
      { name: "Lean", value: 100 - fat, fill: color("--muted-foreground") },
      { name: "Fat", value: fat, fill: color("--primary") },
    ];
  }, [bfp]);

  const postureBars = [
    { name: "Head", value: result.postureAnalysis.headAlignment },
    { name: "Shoulders", value: result.postureAnalysis.shoulderLevel },
    { name: "Spine", value: result.postureAnalysis.spinalCurvature },
    { name: "Hips", value: result.postureAnalysis.hipAlignment },
  ];

  const focusTags = useMemo(() => {
    const tags: string[] = [];
    if (result.postureAnalysis.shoulderLevel < 85) tags.push("Shoulder symmetry");
    if (result.postureAnalysis.headAlignment < 85) tags.push("Neck & head alignment");
    if (result.postureAnalysis.spinalCurvature < 85) tags.push("Core & spinal stability");
    if (result.symmetryScore < 85) tags.push("Left/Right balance");
    if (tags.length === 0) tags.push("Full Body Maintenance");
    return tags;
  }, [result]);

  return (
    <section className="mt-6" aria-labelledby="results">
      <Card className="glow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Results (Beta)
          </CardTitle>
          <CardDescription>Estimates are for wellness only and not medical advice.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Composition donut + headline metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Body Composition</CardTitle>
                <CardDescription>Lean vs Fat (approx.)</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={compositionData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} paddingAngle={3}>
                        {compositionData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={(entry as any).fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded bg-background/50">
                    <p className="text-muted-foreground">Body Fat</p>
                    <p className="font-semibold">{result.bodyFatRange}</p>
                  </div>
                  <div className="p-2 rounded bg-background/50">
                    <p className="text-muted-foreground">Muscle Mass</p>
                    <p className="font-semibold">{result.muscleMass}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4 lg:col-span-2">
              <GaugeCard value={bfp ?? 0} label="Body Fat % (avg)" />
              <GaugeCard value={result.healthIndicators.skinHealth} label="Skin Health" />
              <GaugeCard value={result.postureScore} label="Posture" />
              <GaugeCard value={result.symmetryScore} label="Symmetry" />
            </div>
          </div>

          {/* Measurements */}
          <div className="space-y-3">
            <h3 className="font-semibold">Body Measurements</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(result.measurements).map(([k, v]) => (
                <div key={k} className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs capitalize text-muted-foreground">{k}</p>
                  <p className="font-bold">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Posture & Alignment */}
          <div className="space-y-3">
            <h3 className="font-semibold">Posture & Alignment</h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={postureBars}>
                  <XAxis dataKey="name" stroke={color("--muted-foreground")} />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip cursor={{ fill: "transparent" }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={color("--primary")}></Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Focus Areas */}
          <div className="space-y-3">
            <h3 className="font-semibold">Focus Areas</h3>
            <div className="flex flex-wrap gap-2">
              {focusTags.map((t) => (
                <FocusBadge key={t} text={t} />
              ))}
            </div>
          </div>

          {/* Health & Fitness Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg bg-background/50">
              <p className="text-sm text-muted-foreground">Body Age</p>
              <p className="text-2xl font-bold">{result.bodyAge} yrs</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <p className="text-sm text-muted-foreground">Visceral Fat</p>
              <p className="text-2xl font-bold">{result.visceralFat}</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <p className="text-sm text-muted-foreground">BMR</p>
              <p className="text-2xl font-bold">{result.metabolicRate}</p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-3">
            <h3 className="font-semibold">Recommendations</h3>
            <ul className="space-y-2">
              {result.progressSuggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <h3 className="font-semibold">Analysis Notes</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {result.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
