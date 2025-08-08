import React, { useState } from 'react';
import { useHeartRate } from '@/hooks/useHeartRate';

export default function StartWorkoutButton({ activity = 'functionalStrengthTraining' }: { activity?: string }) {
  const { start } = useHeartRate();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    try { await start(activity); /* navigate('/workout/active') if you have a route */ }
    finally { setLoading(false); }
  };

  return (
    <button className="rounded-xl bg-black text-white px-4 py-2" onClick={onClick} disabled={loading}>
      {loading ? 'Starting…' : 'Start Workout'}
    </button>
  );
}
