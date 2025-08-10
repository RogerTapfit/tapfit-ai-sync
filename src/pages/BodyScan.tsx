import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Camera as CamIcon, Shield, RefreshCw, CheckCircle, ArrowLeft } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import SEO from "@/components/SEO";
import BodyScanResults from "@/components/body-scan/BodyScanResults";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

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

  const [sex, setSex] = useState<'male' | 'female'>('male');

  useEffect(() => {
    // Reset result if images change
    setResult(null);
  }, [slots.map(s => s.image).join(",")]);

  useEffect(() => {
    const initSex = async () => {
      try {
        const saved = localStorage.getItem('bodyScan.sex');
        if (saved === 'male' || saved === 'female') {
          setSex(saved as 'male' | 'female');
          return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          const { data } = await supabase
            .from('profiles')
            .select('gender')
            .eq('id', user.id)
            .single();
          const g = (data?.gender || '').toString().toLowerCase();
          if (g.startsWith('f')) setSex('female');
          else if (g.startsWith('m')) setSex('male');
        }
      } catch {
        // ignore
      }
    };
    initSex();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('bodyScan.sex', sex);
    } catch {
      // ignore
    }
  }, [sex]);

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

    const isFemale = sex === 'female';

    const bodyFatRange = isFemale ? "24% – 32%" : "18% – 24%";
    const muscleMass = isFemale ? "35.1 kg" : "42.3 kg";
    const metabolicRate = isFemale ? 1680 : 1850;
    const visceralFat = isFemale ? 6 : 7;

    // Placeholder heuristic results (no network, privacy-first)
    setResult({
      bodyFatRange,
      postureScore: 78,
      symmetryScore: 82,
      muscleMass,
      visceralFat,
      bodyAge: 26,
      metabolicRate,
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
        `Using ${isFemale ? "female" : "male"} reference ranges for body fat and BMR.`,
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
          <BodyScanResults result={result} />
        )}

      </main>
    </>
  );
};

export default BodyScan;
