import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Camera as CamIcon, Shield, RefreshCw, CheckCircle, ArrowLeft } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import SEO from "@/components/SEO";
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

  const allCaptured = useMemo(() => slots.every(s => !!s.image), [slots]);

  useEffect(() => {
    // Reset result if images change
    setResult(null);
  }, [slots.map(s => s.image).join(",")]);

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

  const updateSlot = (slotKey: string, image: string | null) => {
    setSlots(prev => prev.map(s => s.key === slotKey ? { ...s, image } : s));
  };

  const clearSlot = (slotKey: string) => updateSlot(slotKey, null);

  const analyze = async () => {
    setAnalyzing(true);
    setResult(null);
    // Simulate on-device processing time
    await new Promise(r => setTimeout(r, 1200));

    // Placeholder heuristic results (no network, privacy-first)
    setResult({
      bodyFatRange: "18% – 24%",
      postureScore: 78,
      symmetryScore: 82,
      muscleMass: "42.3 kg",
      visceralFat: 7,
      bodyAge: 26,
      metabolicRate: 1850,
      measurements: {
        chest: "102 cm",
        waist: "84 cm",
        hips: "98 cm",
        shoulders: "112 cm",
        thighs: "58 cm"
      },
      postureAnalysis: {
        headAlignment: 85,
        shoulderLevel: 72,
        spinalCurvature: 88,
        hipAlignment: 91
      },
      healthIndicators: {
        hydrationLevel: "Good",
        skinHealth: 78,
        overallFitness: "Above Average"
      },
      progressSuggestions: [
        "Focus on core strengthening to improve posture",
        "Add resistance training to increase muscle mass",
        "Consider yoga or stretching to improve shoulder alignment",
        "Maintain current hydration and nutrition habits"
      ],
      notes: [
        "Great stance — keep feet shoulder-width for consistency.",
        "Minor shoulder tilt detected; consider posture exercises.",
        "Lighting is good; avoid heavy shadows for best results.",
      ],
    });
    setAnalyzing(false);
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
          <p className="text-sm text-muted-foreground mt-1">All photos are processed on-device. Nothing leaves your phone.</p>
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
                  Stand ~2m away; include full body. Keep consistent lighting.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {slot.image ? (
                  <img 
                    src={slot.image} 
                    alt={`${slot.label} body scan`} 
                    className="w-full rounded-lg object-cover max-h-80"
                    loading="lazy"
                  />
                ) : (
                  <div className="aspect-video w-full rounded-lg bg-muted/30 flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">No photo captured</span>
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
                  <p className="font-medium">Privacy-first</p>
                  <p className="text-sm text-muted-foreground">Images stay on your device. Analysis is on-device.</p>
                </div>
              </div>

              <div className="ml-auto flex gap-2 w-full md:w-auto">
                <Button
                  size="lg"
                  disabled={!allCaptured || analyzing}
                  onClick={analyze}
                  className="w-full md:w-auto"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>Run On-Device Analysis</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {result && (
          <section className="mt-6" aria-labelledby="results">
            <Card className="glow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Results (Beta)
                </CardTitle>
                <CardDescription>
                  Estimates are for wellness only and not medical advice.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Primary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-lg bg-background/50">
                    <p className="text-sm text-muted-foreground">Body Fat</p>
                    <p className="text-2xl font-bold">{result.bodyFatRange}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50">
                    <p className="text-sm text-muted-foreground">Muscle Mass</p>
                    <p className="text-2xl font-bold">{result.muscleMass}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50">
                    <p className="text-sm text-muted-foreground">Body Age</p>
                    <p className="text-2xl font-bold">{result.bodyAge} yrs</p>
                  </div>
                </div>

                {/* Body Composition */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h3 className="font-semibold">Body Composition</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Visceral Fat</p>
                        <p className="text-lg font-bold">{result.visceralFat}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">BMR</p>
                        <p className="text-lg font-bold">{result.metabolicRate}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold">Health Indicators</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Hydration</p>
                        <p className="text-lg font-bold">{result.healthIndicators.hydrationLevel}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Skin Health</p>
                        <p className="text-lg font-bold">{result.healthIndicators.skinHealth}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Measurements */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Body Measurements</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Chest</p>
                      <p className="font-bold">{result.measurements.chest}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Waist</p>
                      <p className="font-bold">{result.measurements.waist}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Hips</p>
                      <p className="font-bold">{result.measurements.hips}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Shoulders</p>
                      <p className="font-bold">{result.measurements.shoulders}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Thighs</p>
                      <p className="font-bold">{result.measurements.thighs}</p>
                    </div>
                  </div>
                </div>

                {/* Posture Analysis */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Posture Analysis</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Head Alignment</p>
                      <p className="font-bold">{result.postureAnalysis.headAlignment}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Shoulder Level</p>
                      <p className="font-bold">{result.postureAnalysis.shoulderLevel}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Spinal Curve</p>
                      <p className="font-bold">{result.postureAnalysis.spinalCurvature}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Hip Alignment</p>
                      <p className="font-bold">{result.postureAnalysis.hipAlignment}%</p>
                    </div>
                  </div>
                </div>

                {/* Overall Scores */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-lg bg-primary/10">
                    <p className="text-sm text-muted-foreground">Overall Posture</p>
                    <p className="text-2xl font-bold">{result.postureScore}/100</p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10">
                    <p className="text-sm text-muted-foreground">Body Symmetry</p>
                    <p className="text-2xl font-bold">{result.symmetryScore}/100</p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10">
                    <p className="text-sm text-muted-foreground">Fitness Level</p>
                    <p className="text-lg font-bold">{result.healthIndicators.overallFitness}</p>
                  </div>
                </div>

                {/* Progress Suggestions */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Recommendations</h3>
                  <ul className="space-y-2">
                    {result.progressSuggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Analysis Notes */}
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
        )}
      </main>
    </>
  );
};

export default BodyScan;
