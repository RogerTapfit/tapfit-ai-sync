import React, { useState } from 'react';
import { useHeartRate } from '@/hooks/useHeartRate';
import { Capacitor } from '@capacitor/core';
import TapfitHealthDiagnostics from '@/components/TapfitHealthDiagnostics';

export default function HeartRateTile() {
  const { bpm, loading, error, connected, start } = useHeartRate();
  const [showDiag, setShowDiag] = useState(false);
  const isIOSNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

  return (
    <div className="rounded-2xl shadow p-4 flex flex-col gap-2">
      <div
        className="cursor-pointer select-none"
        role="button"
        aria-label="Start live heart rate"
        tabIndex={0}
        onClick={() => { if (isIOSNative) start(); }}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && isIOSNative) { e.preventDefault(); start(); } }}
      >
        <div className="text-sm text-muted-foreground">Avg Heart Rate</div>
        <div className="text-4xl font-bold min-h-12">{bpm ?? (loading ? '…' : '--')}</div>
      </div>
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
