import React, { useMemo, useState, useId } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  RadarChart,
  Radar,
  PolarGrid,
  PolarRadiusAxis,
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
  const id = useId();
  const gradientId = `gauge-${String(id).replace(/:/g, "")}`;
  const data = [{ name: label, value }];
  return (
    <Card className="glow-card">
      <CardContent className="p-4">
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={180} endAngle={0}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={color("--primary")} />
                  <stop offset="100%" stopColor={color("--primary-glow")} />
                </linearGradient>
              </defs>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" cornerRadius={999} fill={`url(#${gradientId})`} background={{ fill: "hsl(var(--muted-foreground) / 0.25)" }} />
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

export default function BodyScanResults({ result, user }: { result: BodyScanResult; user?: { heightCm?: number; age?: number; sex?: 'male' | 'female' | 'unspecified' } }) {
  const bfp = useMemo(() => parseBodyFatAverage(result.bodyFatRange), [result.bodyFatRange]);
  const compositionData = useMemo(() => {
    const fat = Math.max(0, Math.min(100, bfp ?? 0));
    return [
      { name: "Lean", value: 100 - fat, fill: "hsl(var(--muted-foreground) / 0.25)" },
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

  // Derived metrics
  const heightM = user?.heightCm ? user.heightCm / 100 : undefined;
  const bmr = Number(result.metabolicRate || 0);
  const weightEstimateKg = useMemo(() => {
    if (!user?.heightCm || !user?.sex || !user?.age) return null;
    const sexAdj = user.sex === 'male' ? 5 : -161; // Mifflin St Jeor
    const w = (bmr - 6.25 * user.heightCm + 5 * user.age - sexAdj) / 10;
    return Number.isFinite(w) && w > 0 ? w : null;
  }, [bmr, user?.heightCm, user?.age, user?.sex]);

  const bmi = useMemo(() => (weightEstimateKg && heightM ? weightEstimateKg / (heightM * heightM) : null), [weightEstimateKg, heightM]);
  const fmi = useMemo(() => (bmi != null && bfp != null ? bmi * (bfp / 100) : null), [bmi, bfp]);
  const lmi = useMemo(() => (bmi != null && fmi != null ? bmi - fmi : null), [bmi, fmi]);
  const weeklyRMR = useMemo(() => Math.round(bmr * 7), [bmr]);

  const [plan, setPlan] = useState<'maint' | 'cut' | 'bulk'>('maint');
  const activity = 1.35; // light activity default
  const tdee = bmr * activity;
  const adjMap = { maint: 1, cut: 0.85, bulk: 1.15 } as const;
  const cals = Math.round(tdee * adjMap[plan]);
  const proteinG = weightEstimateKg ? Math.round(weightEstimateKg * 1.8) : null;
  const fatG = weightEstimateKg ? Math.round(weightEstimateKg * 0.8) : null;
  const carbsG = weightEstimateKg && proteinG != null && fatG != null ? Math.max(0, Math.round((cals - (proteinG * 4 + fatG * 9)) / 4)) : null;

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  const percentile = useMemo(() => {
    if (bfp == null) return null;
    const sex = user?.sex === 'female' ? 'female' : 'male';
    const range = sex === 'male' ? { min: 5, max: 35 } : { min: 15, max: 45 };
    const pct = 100 - ((bfp - range.min) / (range.max - range.min)) * 100;
    return clamp(Math.round(pct), 1, 99);
  }, [bfp, user?.sex]);

  const riskData = useMemo(() => {
    const bf = bfp ?? 0;
    const vis = result.visceralFat || 0; // 5,10,15 scale
    const ps = result.postureScore || 0;
    const bmiVal = bmi ?? 0;
    const cardio = clamp(((bf - 18) * 3) + vis * 3, 0, 100);
    const diabetes = clamp(((bf - 20) * 3.5) + vis * 2, 0, 100);
    const joint = clamp(((bmiVal - 25) * 8), 0, 100);
    const sleep = clamp(((bf - 22) * 2) + vis * 3, 0, 100);
    const posture = clamp(100 - ps, 0, 100);
    return [
      { subject: 'Cardio', A: cardio },
      { subject: 'Diabetes', A: diabetes },
      { subject: 'Joints', A: joint },
      { subject: 'Sleep', A: sleep },
      { subject: 'Posture', A: posture },
    ];
  }, [bfp, result.visceralFat, result.postureScore, bmi]);

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
            <Card className="glow-card">
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
    <p className="text-sm text-muted-foreground">Fitness Age</p>
    <p className="text-2xl font-bold">{result.bodyAge} yrs</p>
  </div>
  <div className="p-4 rounded-lg bg-background/50">
    <p className="text-sm text-muted-foreground">Visceral Fat</p>
    <p className="text-2xl font-bold">{result.visceralFat}</p>
  </div>
  <div className="p-4 rounded-lg bg-background/50">
    <p className="text-sm text-muted-foreground">BMR (Daily)</p>
    <p className="text-2xl font-bold">{Math.round(bmr)} kcal</p>
  </div>
</div>

{/* Advanced Metrics */}
<div className="space-y-3">
  <h3 className="font-semibold">Advanced Metrics</h3>
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
    <Card className="glow-card">
      <CardHeader className="pb-2"><CardTitle className="text-base">Body Fat %</CardTitle></CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{bfp != null ? bfp.toFixed(1) + '%' : '—'}</div>
        <div className="mt-2 h-2 rounded bg-muted">
          <div className="h-2 rounded bg-primary" style={{width: `${bfp ? Math.round(bfp) : 0}%`}} />
        </div>
      </CardContent>
    </Card>
    <Card className="glow-card">
      <CardHeader className="pb-2"><CardTitle className="text-base">Lean Mass Index</CardTitle><CardDescription>kg/m²</CardDescription></CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{lmi != null ? lmi.toFixed(1) : '—'}</div>
        <div className="mt-2 h-2 rounded bg-muted">
          <div className="h-2 rounded bg-primary" style={{width: `${lmi != null ? Math.round(clamp(((lmi - 12) / 8) * 100, 0, 100)) : 0}%`}} />
        </div>
      </CardContent>
    </Card>
    <Card className="glow-card">
      <CardHeader className="pb-2"><CardTitle className="text-base">Fat Mass Index</CardTitle><CardDescription>kg/m²</CardDescription></CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{fmi != null ? fmi.toFixed(1) : '—'}</div>
        <div className="mt-2 h-2 rounded bg-muted">
          <div className="h-2 rounded bg-primary" style={{width: `${fmi != null ? Math.round(clamp(((fmi - 2) / 8) * 100, 0, 100)) : 0}%`}} />
        </div>
      </CardContent>
    </Card>
  </div>
</div>

{/* Energy & Macros */}
<div className="space-y-3">
  <h3 className="font-semibold">Energy & Macros</h3>
  <Card className="glow-card">
    <CardContent className="p-4 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className="text-sm text-muted-foreground">RMR (Daily)</p>
          <p className="text-xl font-semibold">{Math.round(bmr)} kcal</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">RMR (Weekly)</p>
          <p className="text-xl font-semibold">{weeklyRMR} kcal</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Est. Weight</p>
          <p className="text-xl font-semibold">{weightEstimateKg ? `${Math.round(weightEstimateKg * 2.2)} lbs` : '—'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">BMI</p>
          <p className="text-xl font-semibold">{bmi ? bmi.toFixed(1) : '—'}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant={plan==='maint' ? 'default' : 'outline'} onClick={() => setPlan('maint')}>Maintenance</Button>
        <Button size="sm" variant={plan==='cut' ? 'default' : 'outline'} onClick={() => setPlan('cut')}>Cutting</Button>
        <Button size="sm" variant={plan==='bulk' ? 'default' : 'outline'} onClick={() => setPlan('bulk')}>Bulking</Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Target Calories</p>
          <p className="text-xl font-semibold">{cals} kcal</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Protein</p>
          <p className="text-xl font-semibold">{proteinG != null ? `${proteinG} g` : '—'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Carbs</p>
          <p className="text-xl font-semibold">{carbsG != null ? `${carbsG} g` : '—'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Fat</p>
          <p className="text-xl font-semibold">{fatG != null ? `${fatG} g` : '—'}</p>
        </div>
      </div>
    </CardContent>
  </Card>
</div>

{/* Rank & Risk */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
  <Card className="glow-card">
    <CardHeader className="pb-2"><CardTitle className="text-base">Where Do You Rank?</CardTitle><CardDescription>Percentile vs peers</CardDescription></CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{percentile != null ? `${percentile}th` : '—'}</div>
      <div className="mt-2 h-2 rounded bg-muted">
        <div className="h-2 rounded bg-primary" style={{width: `${percentile ?? 0}%`}} />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Lower body fat typically ranks higher.</p>
    </CardContent>
  </Card>
  <Card className="glow-card">
    <CardHeader className="pb-2"><CardTitle className="text-base">Personal Health Risk</CardTitle><CardDescription>Relative risk profile</CardDescription></CardHeader>
    <CardContent>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={riskData} cx="50%" cy="50%" outerRadius="80%">
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" stroke={color("--muted-foreground")} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
            <Radar dataKey="A" stroke={color("--primary")} fill={color("--primary")} fillOpacity={0.3} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
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
