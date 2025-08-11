import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Camera as CamIcon, Shield, RefreshCw, CheckCircle, ArrowLeft } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import SEO from "@/components/SEO";
import BodyScanResults from "@/components/body-scan/BodyScanResults";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { detectPose, type Keypoint } from "@/features/bodyScan/ml/pose";
import { segmentBody } from "@/features/bodyScan/ml/mask";
import { startScan, pollScanUntilDone } from "@/features/bodyScan/api";
import { useToast } from "@/components/ui/use-toast";
import { computeFitnessAge } from "@/features/bodyScan/fitnessAge";

import { Link } from "react-router-dom";

interface ScanSlot {
  key: string;
  label: string;
  image?: string | null;
}

const SLOTS: ScanSlot[] = [
  { key: "front", label: "Front" },
  { key: "left", label: "Left" },
  { key: "right", label: "Right" },
  { key: "back", label: "Back" },
];

const BodyScan = () => {
  const { toast } = useToast();
  const [slots, setSlots] = useState<ScanSlot[]>(SLOTS);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<null | {
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
  }>(null);

  // Allow processing with at least one photo captured
  const canProcess = useMemo(() => slots.some(s => !!s.image), [slots]);

  const [sex, setSex] = useState<'male' | 'female'>("male");
  const [heightCm, setHeightCm] = useState<number | "">("");
  const [age, setAge] = useState<number | undefined>(undefined);
  const [features, setFeatures] = useState<Record<string, { landmarks: Keypoint[]; widthProfile: number[]; dims?: { width: number; height: number }; ok: boolean }>>({});
  const [analysisMeta, setAnalysisMeta] = useState<{ model?: string; at?: string; used_hints?: boolean } | null>(null);
  const [lastScanId, setLastScanId] = useState<string | null>(null);
  const [notesText, setNotesText] = useState<string>("");
  useEffect(() => {
    // Reset result if images change
    setResult(null);
  }, [slots.map(s => s.image).join(",")]);

  useEffect(() => {
    const initProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          const { data } = await supabase
            .from('profiles')
            .select('gender, height_cm, age')
            .eq('id', user.id)
            .maybeSingle();
          if (data) {
            const g = (data.gender || '').toString().toLowerCase();
            if (g.startsWith('f')) setSex('female');
            else if (g.startsWith('m')) setSex('male');
            if (data.height_cm) setHeightCm(Number(data.height_cm));
            if (data.age) setAge(Number(data.age));
          }
        }
        // Fallback to any previous local choice if profile missing
        const savedSex = localStorage.getItem('bodyScan.sex');
        const savedHeight = localStorage.getItem('bodyScan.heightCm');
        if (savedSex && (savedSex === 'male' || savedSex === 'female')) setSex(savedSex as 'male' | 'female');
        if (savedHeight && !heightCm) setHeightCm(parseInt(savedHeight, 10));
      } catch {
        // ignore
      }
    };
    initProfile();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('bodyScan.sex', sex);
      if (heightCm) localStorage.setItem('bodyScan.heightCm', String(heightCm));
    } catch {
      // ignore
    }
  }, [sex, heightCm]);

  const handleCapture = async (slotKey: string) => {
    try {
      if (Capacitor.isNativePlatform()) {
        const photo = await CapCamera.getPhoto({
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          quality: 80,
          correctOrientation: true,
          allowEditing: false,
        });
        updateSlot(slotKey, photo.dataUrl || null);
      } else {
        // Trigger hidden file input for web
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => updateSlot(slotKey, reader.result as string);
          reader.readAsDataURL(file);
        };
        input.click();
      }
    } catch (e) {
      console.warn('Capture failed', e);
    }
  };

  const updateSlot = async (slotKey: string, image: string | null) => {
    setSlots(prev => prev.map(s => s.key === slotKey ? { ...s, image } : s));
    if (image) {
      try {
        const [pose, seg] = await Promise.all([
          detectPose(image),
          segmentBody(image),
        ]);
        setFeatures((prev) => ({
          ...prev,
          [slotKey]: {
            landmarks: pose.landmarks,
            widthProfile: seg?.widthProfile ?? [],
            dims: seg?.dims,
            ok: pose.ok && !!seg,
          },
        }));
      } catch (e) {
        console.warn('on-device ML failed', e);
        setFeatures((prev) => ({ ...prev, [slotKey]: { landmarks: [], widthProfile: [], ok: false } }));
      }
    } else {
      setFeatures((prev) => ({ ...prev, [slotKey]: { landmarks: [], widthProfile: [], ok: false } }));
    }
  };

  const clearSlot = (slotKey: string) => updateSlot(slotKey, null);

  const processScan = async () => {
    if (!heightCm || typeof heightCm !== "number") {
      alert("Please enter your height (cm) for accurate measurements.");
      return;
    }
    setAnalyzing(true);
    setResult(null);
    setAnalysisMeta(null);
    try {
      // Proceed even if on-device features are missing; backend will use available photos


      // Build features payload from on-device ML (if available)
      const photos = slots.filter(s => !!s.image).map(s => s.key);
      const landmarks: Record<string, any[]> = {};
      const widthProfiles: Record<string, number[]> = {};
      const dims: Record<string, { width: number; height: number }> = {} as any;
      photos.forEach(k => {
        const f = features[k];
        if (f) {
          landmarks[k] = f.landmarks.map(p => ({ x: p.x, y: p.y, v: p.v ?? 1 }));
          widthProfiles[k] = f.widthProfile || [];
          if (f.dims?.width && f.dims?.height) dims[k] = { width: f.dims.width, height: f.dims.height };
        }
      });
      console.log("[BodyScan] StartScan with views", { photos, sex, age, heightCm, lm: Object.keys(landmarks), wp: Object.keys(widthProfiles), dims: Object.keys(dims) });

      // Prepare files map for available slots
      const files: any = {};
      slots.forEach(s => { if (s.image) files[s.key] = s.image; });

      const created = await startScan({
        files,
        heightCm: Number(heightCm),
        sex,
        age,
        features: { landmarks, widthProfiles, dims, photos }
      });
      setLastScanId(created.id);

      const finalRow = await pollScanUntilDone(created.id, (row) => {
        console.log("[BodyScan] Poll status:", row.status);
      });

      // Map server metrics/summary (supports both local and Vision schemas)
      const m = finalRow.metrics || {};
      const s = finalRow.summary || {};
      setAnalysisMeta({ model: s.model, at: s.at, used_hints: s.used_hints });

      // Body fat range from either schema
      let bfLow: number | null = null;
      let bfHigh: number | null = null;
      if (Array.isArray(m.body_fat_pct_range) && m.body_fat_pct_range.length === 2) {
        bfLow = Number(m.body_fat_pct_range[0]);
        bfHigh = Number(m.body_fat_pct_range[1]);
      } else if (m.body_fat_percent?.low != null && m.body_fat_percent?.high != null) {
        bfLow = Number(m.body_fat_percent.low);
        bfHigh = Number(m.body_fat_percent.high);
      }
      const bodyFatRange = Number.isFinite(bfLow) && Number.isFinite(bfHigh)
        ? `${bfLow}% – ${bfHigh}%`
        : "—";

      const postureScore = Number(m.posture_score?.score ?? m.posture?.score_pct ?? 0);
      const symmetryScore = Number(m.symmetry_score?.score ?? m.symmetry?.score_pct ?? 0);

      const muscleMassVal = m.muscle_mass_kg?.estimate ?? m.muscle_mass_kg_est;
      const muscleMass = Number.isFinite(Number(muscleMassVal)) ? `${Number(muscleMassVal).toFixed(1)} kg` : "—";

      // Visceral fat fallback from BF range if needed
      let visceralLevel: 'low'|'medium'|'high'|undefined = m.visceral_fat_index?.level as any;
      if (!visceralLevel && Number.isFinite(bfHigh)) {
        const hi = bfHigh as number;
        visceralLevel = hi <= 15 ? 'low' : hi >= 25 ? 'high' : 'medium';
      }
      const visceralFat = visceralLevel === 'low' ? 5 : visceralLevel === 'high' ? 15 : visceralLevel === 'medium' ? 10 : 7;

      const bmrKcal = Number(m.bmr?.kcal_per_day ?? 0);

      const fmt = (n: any) => (Number.isFinite(Number(n)) ? `${Number(n).toFixed(1)} cm` : "—");
      const measSrc = m.measurements_cm || m.circumferences_cm || {};
      const bfpAvg = Number.isFinite(Number(bfLow)) && Number.isFinite(Number(bfHigh))
        ? (Number(bfLow) + Number(bfHigh)) / 2
        : undefined;
      const fa = computeFitnessAge({
        sex,
        heightCm: Number(heightCm),
        bodyFatPct: bfpAvg,
        waistCm: typeof measSrc.waist === "number" ? measSrc.waist : undefined,
        postureScore: postureScore || undefined,
      });
      setResult({
        bodyFatRange,
        postureScore,
        symmetryScore,
        muscleMass,
        visceralFat,
        bodyAge: fa.fitnessAge,
        metabolicRate: bmrKcal || 1800,
        measurements: {
          chest: fmt(measSrc.chest),
          waist: fmt(measSrc.waist),
          hips: fmt(measSrc.hips),
          shoulders: fmt(measSrc.shoulders),
          thighs: fmt(measSrc.thighs),
        },
        postureAnalysis: {
          headAlignment: Math.max(60, Math.min(100, postureScore)),
          shoulderLevel: Math.max(60, Math.min(100, postureScore)),
          spinalCurvature: Math.round(Math.max(60, Math.min(100, postureScore * 0.9))),
          hipAlignment: Math.max(60, Math.min(100, symmetryScore)),
        },
        healthIndicators: {
          hydrationLevel: "Good",
          skinHealth: Number(m.skin_scan_quality?.score ?? m.skin_health_pct ?? 78),
          overallFitness: symmetryScore > 80 ? "Above Average" : "Average",
        },
        progressSuggestions: Array.isArray(m.recommendations) ? m.recommendations : Array.isArray(s.recommendations) ? s.recommendations : [],
        notes: [
          m.body_fat_percent?.reason,
          m.muscle_mass_kg?.reason,
          m.posture_score?.notes,
          m.symmetry_score?.notes,
          m.visceral_fat_index?.notes,
          m.skin_scan_quality?.notes,
          ...(Array.isArray(m.posture?.notes) ? m.posture.notes : []),
          ...(Array.isArray(m.symmetry?.notes) ? m.symmetry.notes : []),
          ...(Array.isArray(s.analysis_notes) ? s.analysis_notes : [])
        ].filter(Boolean),
      });
    } catch (e: any) {
      console.error("Body scan processing failed", e);
      const errMessage = e?.value?.message || e?.message || "Analysis failed";
      toast({ title: "Analysis failed", description: String(errMessage), variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const rerunAnalysis = async () => {
    if (!lastScanId) return;
    setAnalyzing(true);
    try {
      const photos = slots.filter(s => !!s.image).map(s => s.key);
      const landmarks: Record<string, any[]> = {};
      const widthProfiles: Record<string, number[]> = {};
      const dims: Record<string, { width: number; height: number }> = {} as any;
      photos.forEach(k => {
        const f = features[k];
        if (f) {
          landmarks[k] = f.landmarks.map(p => ({ x: p.x, y: p.y, v: p.v ?? 1 }));
          widthProfiles[k] = f.widthProfile || [];
          if (f.dims?.width && f.dims?.height) dims[k] = { width: f.dims.width, height: f.dims.height };
        }
      });
      await supabase.functions.invoke("analyze-body-scan", {
        body: { scan_id: lastScanId, height_cm: Number(heightCm), sex, age, features: { landmarks, widthProfiles, dims, photos } },
      });
      const finalRow = await pollScanUntilDone(lastScanId, (row) => { console.log("[BodyScan] Re-Poll status:", row.status); });

      const m = finalRow.metrics || {};
      const s = finalRow.summary || {};
      setAnalysisMeta({ model: s.model, at: s.at, used_hints: s.used_hints });

      let bfLow: number | null = null;
      let bfHigh: number | null = null;
      if (Array.isArray(m.body_fat_pct_range) && m.body_fat_pct_range.length === 2) {
        bfLow = Number(m.body_fat_pct_range[0]);
        bfHigh = Number(m.body_fat_pct_range[1]);
      } else if (m.body_fat_percent?.low != null && m.body_fat_percent?.high != null) {
        bfLow = Number(m.body_fat_percent.low);
        bfHigh = Number(m.body_fat_percent.high);
      }
      const bodyFatRange = Number.isFinite(bfLow) && Number.isFinite(bfHigh) ? `${bfLow}% – ${bfHigh}%` : "—";

      const postureScore = Number(m.posture_score?.score ?? m.posture?.score_pct ?? 0);
      const symmetryScore = Number(m.symmetry_score?.score ?? m.symmetry?.score_pct ?? 0);
      const muscleMassVal = m.muscle_mass_kg?.estimate ?? m.muscle_mass_kg_est;
      const muscleMass = Number.isFinite(Number(muscleMassVal)) ? `${Number(muscleMassVal).toFixed(1)} kg` : "—";

      let visceralLevel: 'low'|'medium'|'high'|undefined = m.visceral_fat_index?.level as any;
      if (!visceralLevel && Number.isFinite(bfHigh)) {
        const hi = bfHigh as number;
        visceralLevel = hi <= 15 ? 'low' : hi >= 25 ? 'high' : 'medium';
      }
      const visceralFat = visceralLevel === 'low' ? 5 : visceralLevel === 'high' ? 15 : visceralLevel === 'medium' ? 10 : 7;

      const bmrKcal = Number(m.bmr?.kcal_per_day ?? 0);
      const fmt = (n: any) => (Number.isFinite(Number(n)) ? `${Number(n).toFixed(1)} cm` : "—");
      const measSrc = m.measurements_cm || m.circumferences_cm || {};
      const bfpAvg = Number.isFinite(Number(bfLow)) && Number.isFinite(Number(bfHigh)) ? (Number(bfLow) + Number(bfHigh)) / 2 : undefined;
      const fa = computeFitnessAge({
        sex,
        heightCm: Number(heightCm),
        bodyFatPct: bfpAvg,
        waistCm: typeof measSrc.waist === "number" ? measSrc.waist : undefined,
        postureScore: postureScore || undefined,
      });
      setResult({
        bodyFatRange,
        postureScore,
        symmetryScore,
        muscleMass,
        visceralFat,
        bodyAge: fa.fitnessAge,
        metabolicRate: bmrKcal || 1800,
        measurements: {
          chest: fmt(measSrc.chest),
          waist: fmt(measSrc.waist),
          hips: fmt(measSrc.hips),
          shoulders: fmt(measSrc.shoulders),
          thighs: fmt(measSrc.thighs),
        },
        postureAnalysis: {
          headAlignment: Math.max(60, Math.min(100, postureScore)),
          shoulderLevel: Math.max(60, Math.min(100, postureScore)),
          spinalCurvature: Math.round(Math.max(60, Math.min(100, postureScore * 0.9))),
          hipAlignment: Math.max(60, Math.min(100, symmetryScore)),
        },
        healthIndicators: {
          hydrationLevel: "Good",
          skinHealth: Number(m.skin_scan_quality?.score ?? m.skin_health_pct ?? 78),
          overallFitness: symmetryScore > 80 ? "Above Average" : "Average",
        },
        progressSuggestions: Array.isArray(m.recommendations) ? m.recommendations : Array.isArray(s.recommendations) ? s.recommendations : [],
        notes: [
          m.body_fat_percent?.reason,
          m.muscle_mass_kg?.reason,
          m.posture_score?.notes,
          m.symmetry_score?.notes,
          m.visceral_fat_index?.notes,
          m.skin_scan_quality?.notes,
          ...(Array.isArray(m.posture?.notes) ? m.posture.notes : []),
          ...(Array.isArray(m.symmetry?.notes) ? m.symmetry.notes : []),
          ...(Array.isArray(s.analysis_notes) ? s.analysis_notes : [])
        ].filter(Boolean),
      });
    } catch (e: any) {
      console.error("Re-run analysis failed", e);
      const errMessage = e?.value?.message || e?.message || "Re-run failed";
      toast({ title: "Re-run failed", description: String(errMessage), variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };
  
  const handleSaveLog = async () => {
    if (!lastScanId) {
      toast({ title: "No scan to save", description: "Run an analysis first.", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase
        .from('body_scans')
        .update({ notes: notesText })
        .eq('id', lastScanId);
      if (error) throw error;
      toast({ title: "Saved to library", description: "Your scan and notes have been saved." });
    } catch (e: any) {
      toast({ title: "Save failed", description: String(e?.message || e), variant: "destructive" });
    }
  };

  return (

    <>
      <SEO
        title="TapFit Body Scan – AI Body Analyzer"
        description="Privacy-first body scan from 4 photos. On-device analysis for composition, posture, and symmetry."
        canonicalPath="/body-scan"
      />

      <main className="min-h-screen bg-background p-4 md:p-8">
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Link to="/" aria-label="Back to Dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Body Scan – AI Body Analyzer</h1>
          <p className="text-sm text-muted-foreground mt-1">Images are private; analysis uses OpenAI Vision via short‑lived signed URLs.</p>
        </header>

        <section aria-labelledby="capture" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {slots.map((slot) => (
            <Card key={slot.key} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CamIcon className="h-5 w-5 text-primary" />
                  {slot.label} Photo
                </CardTitle>
                <CardDescription>
                  Use any clear photo; we'll analyze what we can. More visible body = better results.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {slot.image ? (
                  <div className="w-full h-80 md:h-96 bg-muted/20 rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={slot.image}
                      alt={`${slot.label} body scan`}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="w-full h-80 md:h-96 rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden">
                    {slot.key === 'front' ? (
                      <img
                        src="/lovable-uploads/38d95bb2-864a-409d-923d-e5dae4595dcd.png"
                        alt="Body scan front placeholder silhouette"
                        className="max-h-full max-w-full object-contain opacity-90"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">No photo captured</span>
                    )}
                  </div>
                )}


                {slot.image && (
                  <div className="text-sm text-muted-foreground">
                    {features[slot.key]?.ok ? (
                      <span className="text-primary">Landmarks detected ✅</span>
                    ) : (
                      <span>Detecting landmarks…</span>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="glow" className="flex-1" onClick={() => handleCapture(slot.key)}>
                    <CamIcon className="h-4 w-4 mr-2" /> Capture / Upload
                  </Button>
                  {slot.image && (
                    <Button variant="outline" onClick={() => clearSlot(slot.key)}>Retake</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-6">
          <Card>
            <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Images stay private; analysis may use OpenAI Vision with short‑lived links.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="sex" className="text-sm text-muted-foreground">Sex for analysis</label>
                <Select value={sex} onValueChange={(v) => setSex(v as 'male' | 'female')}>
                  <SelectTrigger id="sex" className="w-[160px]">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="height" className="text-sm text-muted-foreground">Height (cm)</label>
                <Input id="height" type="number" inputMode="numeric" className="w-28" value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : '')}
                  placeholder="e.g. 175" />
              </div>

              <div className="ml-auto flex gap-2 w-full md:w-auto">
                <Button
                  size="lg"
                  disabled={!canProcess || analyzing}
                  onClick={processScan}
                  className="w-full md:w-auto"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>Process Scan</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {result && (
          <>
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {analysisMeta?.model && (<span className="mr-3">Model: {analysisMeta.model}</span>)}
                {analysisMeta?.at && (<span className="mr-3">Analyzed: {new Date(analysisMeta.at).toLocaleString()}</span>)}
                {analysisMeta?.used_hints !== undefined && (<span>Hints: {analysisMeta.used_hints ? 'Yes' : 'No'}</span>)}
              </div>
              <Button size="sm" variant="outline" onClick={rerunAnalysis} disabled={analyzing}>
                <RefreshCw className="h-4 w-4 mr-2" /> Re-run
              </Button>
            </div>
            <BodyScanResults result={result} user={{ heightCm: typeof heightCm === 'number' ? heightCm : undefined, age, sex }} />

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Log this scan</CardTitle>
                <CardDescription>Save notes and access later in your library</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Add notes (optional): e.g., conditions, time of day, recent workouts"
                  aria-label="Scan notes"
                />
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={handleSaveLog} disabled={!lastScanId}>Save to Library</Button>
                  <Link to={`/body-scans/${lastScanId || ''}`}>
                    <Button variant="outline" disabled={!lastScanId}>Open Details</Button>
                  </Link>
                  <Link to="/body-scans">
                    <Button variant="ghost">View Library</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}


      </main>
    </>
  );
};

export default BodyScan;
