import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface ScanDetail {
  id: string;
  created_at: string;
  metrics: any | null;
  summary: any | null;
  height_cm?: number | null;
  sex?: string | null;
  front_path?: string | null;
  left_path?: string | null;
  right_path?: string | null;
  back_path?: string | null;
}

const BodyScanDetail = () => {
  const { scanId } = useParams();
  const [row, setRow] = useState<ScanDetail | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [reRunning, setReRunning] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!scanId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('body_scans')
          .select('*')
          .eq('id', scanId)
          .maybeSingle();
        if (error) throw error;
        setRow(data as ScanDetail);

        const paths: Array<[string, string | null | undefined]> = [
          ['front', data?.front_path],
          ['left', data?.left_path],
          ['right', data?.right_path],
          ['back', data?.back_path],
        ];
        const entries = await Promise.all(paths.map(async ([key, path]) => {
          if (!path) return [key, ""] as const;
          const { data: signed } = await supabase.storage.from('body-scans').createSignedUrl(path, 60);
          return [key, signed?.signedUrl || ""] as const;
        }));
        setImages(Object.fromEntries(entries));
      } catch (e) {
        console.warn('Failed to load scan detail', e);
        setRow(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [scanId]);

  const bodyFatRange = useMemo(() => {
    const m: any = row?.metrics || {};
    let bfLow: number | null = null;
    let bfHigh: number | null = null;
    if (Array.isArray(m.body_fat_pct_range) && m.body_fat_pct_range.length === 2) {
      bfLow = Number(m.body_fat_pct_range[0]);
      bfHigh = Number(m.body_fat_pct_range[1]);
    } else if (m.body_fat_percent?.low != null && m.body_fat_percent?.high != null) {
      bfLow = Number(m.body_fat_percent.low);
      bfHigh = Number(m.body_fat_percent.high);
    }
    return Number.isFinite(bfLow) && Number.isFinite(bfHigh) ? `${bfLow}% – ${bfHigh}%` : '—';
  }, [row?.metrics]);

  const postureScore = useMemo(() => {
    const m: any = row?.metrics || {};
    return Number(m.posture_score?.score ?? m.posture?.score_pct ?? 0) || '—';
  }, [row?.metrics]);

  const onRerun = async () => {
    if (!row) return;
    setReRunning(true);
    try {
      await supabase.functions.invoke('analyze-body-scan', {
        body: { scan_id: row.id, height_cm: row.height_cm, sex: row.sex }
      });
      // refresh
      const { data } = await supabase.from('body_scans').select('*').eq('id', row.id).maybeSingle();
      if (data) setRow(data as ScanDetail);
    } catch (e) {
      console.warn('Re-run failed', e);
    } finally {
      setReRunning(false);
    }
  };

  return (
    <>
      <SEO 
        title="Body Scan Details – TapFit"
        description="View your saved body scan images and AI metrics."
        canonicalPath={`/body-scans/${scanId}`}
      />
      <main className="min-h-screen bg-background p-4 md:p-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Body Scan Details</h1>
            {row && (
              <p className="text-sm text-muted-foreground mt-1">Scanned on {new Date(row.created_at).toLocaleString()}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link to="/body-scans"><Button variant="outline">Back to Library</Button></Link>
            <Button onClick={onRerun} disabled={reRunning}>{reRunning ? 'Re-running…' : 'Re-run Analysis'}</Button>
          </div>
        </header>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !row ? (
          <Card><CardContent className="p-6">Scan not found.</CardContent></Card>
        ) : (
          <div className="space-y-6">
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['front','left','right','back'].map((k) => (
                <Card key={k} className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-base capitalize">{k} view</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {images[k] ? (
                      <img src={images[k]} alt={`Body scan ${k} view`} loading="lazy" className="w-full h-80 object-contain bg-muted/20" />
                    ) : (
                      <div className="w-full h-80 bg-muted/30 flex items-center justify-center text-sm text-muted-foreground">No image</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </section>

            <section>
              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics</CardTitle>
                  <CardDescription>Summary from AI analysis</CardDescription>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Body fat range</div>
                    <div className="text-xl font-semibold">{bodyFatRange}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Posture score</div>
                    <div className="text-xl font-semibold">{postureScore}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Model</div>
                    <div className="text-xl font-semibold">{row.summary?.model || '—'}</div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <Card>
                <CardHeader>
                  <CardTitle>Raw Metrics</CardTitle>
                  <CardDescription>Full metrics JSON for reference</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(row.metrics, null, 2)}</pre>
                </CardContent>
              </Card>
            </section>
          </div>
        )}
      </main>
    </>
  );
};

export default BodyScanDetail;
