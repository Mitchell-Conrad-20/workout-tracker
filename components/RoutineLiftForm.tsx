'use client';

import React, { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import { useUserContext } from '@/context/UserContext';

interface Routine {
  id: string;
  name: string;
}

interface RoutineLift {
  name: string;
  sets: number;
}

interface SetEntry {
  liftName: string;
  setIdx: number;
  weight: string;
  reps: string;
}

interface Props {
  onSubmitSuccess?: () => void;
}

const RoutineLiftForm: React.FC<Props> = ({ onSubmitSuccess }) => {
  const { user } = useUserContext();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [routineLifts, setRoutineLifts] = useState<RoutineLift[]>([]);
  const [setEntries, setSetEntries] = useState<SetEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch all routines for dropdown
  useEffect(() => {
    if (!user) return;
    supabase
      .from('routines')
      .select('id, name')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        console.log('Fetched routines:', data, 'Error:', error);
        if (!error && data) setRoutines(data);
      });
  }, [user]);

  // Fetch lifts for selected routine
  useEffect(() => {
    if (!selectedRoutineId) {
      setRoutineLifts([]);
      setSetEntries([]);
      return;
    }
    setLoading(true);
    console.log('Fetching lifts for routine_id:', selectedRoutineId);
    supabase
      .from('routine_lifts')
      .select('name, sets')
      .eq('routine_id', selectedRoutineId)
      .then(({ data, error }) => {
        setLoading(false);
        console.log('Fetched routine_lifts:', data, 'Error:', error);
        if (error) {
          setErrorMsg('Error loading lifts for routine.');
          setRoutineLifts([]);
          setSetEntries([]);
          return;
        }
        if (!data || data.length === 0) {
          setErrorMsg('No lifts found for this routine.');
          setRoutineLifts([]);
          setSetEntries([]);
          return;
        }
        setErrorMsg(null);
        setRoutineLifts(data);
        // Build set entries grid
        const entries: SetEntry[] = [];
        data.forEach(lift => {
          console.log('Lift:', lift);
          for (let i = 0; i < lift.sets; i++) {
            entries.push({ liftName: lift.name, setIdx: i + 1, weight: '', reps: '' });
          }
        });
        console.log('Built setEntries:', entries);
        setSetEntries(entries);
      });
  }, [selectedRoutineId]);

  // Handle input change
  const handleSetChange = (idx: number, field: 'weight' | 'reps', value: string) => {
    setSetEntries(prev => prev.map((entry, i) =>
      i === idx ? { ...entry, [field]: value.replace(/[^0-9]/g, '') } : entry
    ));
  };

  // Submit all sets
  const handleSubmit = async () => {
    if (!user || !selectedRoutineId || setEntries.length === 0) return;
    // Validate
    const valid = setEntries.every(e => e.liftName && e.weight && e.reps);
    if (!valid) {
      setErrorMsg('Please fill in weight and reps for all sets.');
      return;
    }
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const liftsToInsert = setEntries.map(e => ({
      name: e.liftName,
      weight: Number(e.weight),
      reps: Number(e.reps),
      date: today,
      user_id: user.id,
    }));
    const { error } = await supabase.from('lifts').insert(liftsToInsert);
    setLoading(false);
    if (error) {
      setErrorMsg('Error submitting lifts.');
    } else {
      setErrorMsg(null);
      if (onSubmitSuccess) onSubmitSuccess();
      setSelectedRoutineId(null);
      setRoutineLifts([]);
      setSetEntries([]);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 p-4 rounded shadow mt-6">
      <h2 className="text-xl font-semibold mb-4">Log a Routine</h2>
      <select
        value={selectedRoutineId !== null ? selectedRoutineId : ''}
        onChange={e => {
          const val = e.target.value;
          console.log('Routine dropdown selected value:', val);
          if (val === '') {
            setSelectedRoutineId(null);
            setRoutineLifts([]);
            setSetEntries([]);
          } else {
            console.log('Setting selectedRoutineId:', val);
            setSelectedRoutineId(val);
          }
        }}
        className="border rounded px-3 py-2 w-full dark:bg-neutral-900 dark:border-neutral-700 mb-4"
      >
        <option value="">-- Choose a Routine --</option>
        {routines.map(r => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>
      {loading && <div className="text-blue-500 mb-2">Loading lifts...</div>}
      {errorMsg && <div className="text-red-500 mb-2">{errorMsg}</div>}
      {setEntries.length > 0 && (
        <div className="space-y-6">
          {/* Group sets by liftName */}
          {Array.from(new Set(setEntries.map(e => e.liftName))).map(liftName => {
            const liftSets = setEntries
              .map((entry, idx) => ({ ...entry, idx }))
              .filter(e => e.liftName === liftName);
            return (
              <div key={liftName} className="">
                <div className="flex items-center mb-2">
                  <span className="font-semibold w-40">{liftName}</span>
                  <button
                    type="button"
                    className="ml-2 text-blue-500 hover:text-blue-700 text-lg"
                    onClick={() => {
                      // Add a new set for this lift
                      setSetEntries(prev => [
                        ...prev,
                        {
                          liftName,
                          setIdx: liftSets.length + 1,
                          weight: '',
                          reps: ''
                        }
                      ]);
                    }}
                    aria-label="Add set"
                  >
                    ▼
                  </button>
                </div>
                <div className="space-y-2">
                  {liftSets.map(({ idx, weight, reps }, i) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="number"
                        placeholder="Weight"
                        value={weight}
                        onChange={e => handleSetChange(idx, 'weight', e.target.value)}
                        className="w-24 px-2 py-1 border rounded dark:bg-neutral-900 dark:border-neutral-700"
                      />
                      <input
                        type="number"
                        placeholder="Reps"
                        value={reps}
                        onChange={e => handleSetChange(idx, 'reps', e.target.value)}
                        className="w-24 px-2 py-1 border rounded dark:bg-neutral-900 dark:border-neutral-700"
                      />
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 text-lg ml-2"
                        onClick={() => {
                          setSetEntries(prev => prev.filter((_, j) => j !== idx));
                        }}
                        aria-label="Remove set"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4"
            disabled={loading}
          >
            Submit All Lifts
          </button>
        </div>
      )}
      {selectedRoutineId && !loading && setEntries.length === 0 && !errorMsg && (
        <div className="text-yellow-600 mb-2">No sets found for this routine. Please check the routine's lifts and set counts.</div>
      )}
      {/* Fallback: show raw data if nothing is working */}
      {/* Debug info removed */}
    </div>
  );
};

export default RoutineLiftForm;
