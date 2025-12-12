import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

interface BodyScanRow {
  id: string;
  created_at: string;
  summary: any | null;
  metrics: any | null;
  front_path?: string | null;
  left_path?: string | null;
  right_path?: string | null;
  back_path?: string | null;
  sex?: string | null;
  height_cm?: number | null;
}

const pickFirstPath = (row: BodyScanRow) => row.front_path || row.left_path || row.right_path || row.back_path || null;

const BodyScanLibrary = () => {
  const navigate = useNavigate();
  const [scans, setScans] = useState<BodyScanRow[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return;
        const { data, error } = await supabase
          .from('body_scans')
          .select('id, created_at, summary, metrics, front_path, left_path, right_path, back_path, sex, height_cm')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setScans(data || []);

        // build signed URLs
        const entries = await Promise.all((data || []).map(async (row) => {
          const path = pickFirstPath(row);
          if (!path) return [row.id, ""] as const;
          const { data: signed } = await supabase.storage.from('body-scans').createSignedUrl(path, 60);
          return [row.id, signed?.signedUrl || ""] as const;
        }));
        setThumbs(Object.fromEntries(entries));
      } catch (e) {
        console.warn('Failed to load scans', e);
        setScans([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const title = useMemo(() => `Saved Body Scans (${scans.length})`, [scans.length]);

  return (
    <>
      <SEO 
        title="Saved Body Scans – TapFit"
        description="Browse your saved AI body scans with images and metrics."
        canonicalPath="/body-scans"
      />
      <main className="min-h-screen bg-background p-4 md:p-8 pt-safe">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">Images are private and displayed via signed URLs.</p>
          </div>
          <Link to="/body-scan">
            <Button>New Scan</Button>
          </Link>
        </header>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : scans.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">No scans yet. Run your first body scan to see it here.</p>
              <div className="mt-3">
                <Link to="/body-scan"><Button>Start Body Scan</Button></Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <section aria-labelledby="library" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scans.map((row) => {
              const thumb = thumbs[row.id];

              // derive simple values for quick glance
              const m: any = row.metrics || {};
              let bfLow: number | null = null;
              let bfHigh: number | null = null;
              if (Array.isArray(m.body_fat_pct_range) && m.body_fat_pct_range.length === 2) {
                bfLow = Number(m.body_fat_pct_range[0]);
                bfHigh = Number(m.body_fat_pct_range[1]);
              } else if (m.body_fat_percent?.low != null && m.body_fat_percent?.high != null) {
                bfLow = Number(m.body_fat_percent.low);
                bfHigh = Number(m.body_fat_percent.high);
              }
              const bodyFatRange = Number.isFinite(bfLow) && Number.isFinite(bfHigh) ? `${bfLow}% – ${bfHigh}%` : '—';
              const postureScore = Number(m.posture_score?.score ?? m.posture?.score_pct ?? 0);

              return (
                <Card key={row.id} className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-base">Scan on {new Date(row.created_at).toLocaleString()}</CardTitle>
                    <CardDescription>
                      Body fat: {bodyFatRange} · Posture: {postureScore || '—'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {thumb ? (
                      <img src={thumb} alt={`Body scan thumbnail ${new Date(row.created_at).toLocaleDateString()}`} loading="lazy" className="w-full h-56 object-cover" />
                    ) : (
                      <div className="w-full h-56 bg-muted/30 flex items-center justify-center text-sm text-muted-foreground">No image</div>
                    )}
                    <div className="p-4 flex items-center justify-between">
                      <Link to={`/body-scans/${row.id}`} className="text-primary text-sm">Open details</Link>
                      <Link to={`/body-scans/${row.id}`}>
                        <Button size="sm" variant="outline">View</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        )}
      </main>
    </>
  );
};

export default BodyScanLibrary;
