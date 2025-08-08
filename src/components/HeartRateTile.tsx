import React, { useState } from 'react';
import { useHeartRate } from '@/hooks/useHeartRate';
import TapfitHealthDiagnostics from '@/components/TapfitHealthDiagnostics';

export default function HeartRateTile() {
  const { bpm, loading, error, connected, start } = useHeartRate();
  const [showDiag, setShowDiag] = useState(false);

  return (
    <div className="rounded-2xl shadow p-4 flex flex-col gap-2">
      <div className="text-sm text-muted-foreground">Avg Heart Rate</div>
      <div className="text-4xl font-bold min-h-12">{bpm ?? (loading ? '…' : '--')}</div>
      {!connected && (
        <div className="text-xs text-amber-600">Pair your Apple Watch and install the TapFit watch app.</div>
      )}
      {error && <div className="text-xs text-red-600">{error}</div>}
      <div className="mt-2 flex gap-2">
        <button className="rounded-xl border px-3 py-2" onClick={() => start()} disabled={loading}>
          {loading ? 'Connecting…' : 'Get Live HR'}
        </button>
        <button className="rounded-xl border px-3 py-2" onClick={() => setShowDiag(true)}>
          Diagnostics
        </button>
      </div>
      <TapfitHealthDiagnostics open={showDiag} onOpenChange={setShowDiag} />
    </div>
  );
}
