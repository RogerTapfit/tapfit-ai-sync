import React from 'react';
import { useHeartRate } from '@/hooks/useHeartRate';

export default function HeartRateTile() {
  const { bpm, loading, error, connected, start } = useHeartRate();

  return (
    <div className="rounded-2xl shadow p-4 flex flex-col gap-2">
      <div className="text-sm text-muted-foreground">Avg Heart Rate</div>
      <div className="text-4xl font-bold min-h-12">{bpm ?? (loading ? '…' : '--')}</div>
      {!connected && (
        <div className="text-xs text-amber-600">Pair your Apple Watch and install the TapFit watch app.</div>
      )}
      {error && <div className="text-xs text-red-600">{error}</div>}
      <button className="mt-2 rounded-xl border px-3 py-2" onClick={() => start() } disabled={loading}>
        {loading ? 'Connecting…' : 'Get Live HR'}
      </button>
    </div>
  );
}
