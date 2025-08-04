'use client';

import React, { useEffect, useState } from 'react';
import Input from '@/components/Input';
import Button from '@/components/Button';
import supabase from '@/lib/supabase';
import { useUserContext } from '@/context/UserContext';

interface Lift {
  name: string;
  sets: number;
}

interface Routine {
  id: number;
  name: string;
  lifts: Lift[];
  user_id: string;
  open?: boolean;
}

export default function RoutinesPage() {
  const { user, loading } = useUserContext();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineName, setRoutineName] = useState('');
  const [liftInputs, setLiftInputs] = useState<Lift[]>([{ name: '', sets: 0 }]);
  const [openRoutineId, setOpenRoutineId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      // You can redirect or show a message here if needed
    }
  }, [loading, user]);

  useEffect(() => {
    if (!user) return;

    const fetchRoutines = async () => {
      const { data, error } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', user.id);

      if (!error && data) {
        // For each routine, fetch its lifts
        const routinesWithLifts = await Promise.all(data.map(async r => {
          const { data: liftsData, error: liftsError } = await supabase
            .from('routine_lifts')
            .select('name, sets')
            .eq('routine_id', r.id);
          // Preserve open state if this routine is currently open
          const isOpen = openRoutineId !== null && r.id === openRoutineId;
          return { ...r, lifts: Array.isArray(liftsData) ? liftsData : [], open: isOpen };
        }));
        setRoutines(routinesWithLifts);
      }
    };

    fetchRoutines();
  }, [user]);

  const handleAddRoutine = () => {
    if (openRoutineId !== null) return;
    setRoutines([
      ...routines,
      {
        id: -1, // dummy number just to track UI; will be ignored later
        name: '',
        lifts: [{ name: '', sets: 0 }],
        user_id: user?.id || '',
        open: true,
      },
    ]);
    setRoutineName('');
    setLiftInputs([{ name: '', sets: 0 }]);
    setOpenRoutineId(-1); // just marks "new"
};


  const handleDeleteRoutine = async (id: number) => {
    const routineToDelete = routines.find(r => r.id === id);
    if (routineToDelete && routineToDelete.id !== -1) {
      // only need to delete the routine, the delete will cascade to lifts
      await supabase.from('routines').delete().eq('id', routineToDelete.id);
    }
    setRoutines(routines.filter(r => r.id !== id));
    if (openRoutineId !== null && openRoutineId === id) {
      setRoutineName('');
      setLiftInputs([{ name: '', sets: 0 }]);
      setOpenRoutineId(null);
    }
  };

  const handleDeleteLift = (idx: number) => {
    setLiftInputs(liftInputs.filter((_, i) => i !== idx));
  };

  const handleLiftChange = (idx: number, field: keyof Lift, value: string | number) => {
    const updated = liftInputs.map((lift, i) =>
      i === idx ? { ...lift, [field]: field === 'sets' ? Number(value) : value } : lift
    );
    setLiftInputs(updated);
    if (field === 'name' && value && idx === liftInputs.length - 1) {
      setLiftInputs([...updated, { name: '', sets: 0 }]);
    }
  };

  const handleSaveRoutine = async () => {
  if (!routineName.trim() || !user) return;

  const lifts = liftInputs.filter(lift => lift.name.trim());
  if (lifts.length === 0) return;

  let routineId: number | null = null;

  const existingRoutine = routines.find(r => r.id === openRoutineId && r.id !== -1);

  if (existingRoutine) {
    // UPDATE existing routine name
    const { error: updateError } = await supabase
      .from('routines')
      .update({ name: routineName })
      .eq('id', existingRoutine.id);

    if (updateError) {
      console.error('Error updating routine:', updateError);
      return;
    }

    routineId = existingRoutine.id;

    // DELETE all lifts for this routine before re-inserting
    await supabase
      .from('routine_lifts')
      .delete()
      .eq('routine_id', routineId);
  } else {
    // INSERT new routine
    const { data: routineData, error: insertError } = await supabase
      .from('routines')
      .insert([{ name: routineName, user_id: user.id }])
      .select()
      .single();

    if (insertError || !routineData) {
      console.error('Error inserting routine:', insertError);
      return;
    }

    routineId = routineData.id;
  }

  if (routineId) {
    const liftRows = lifts.map(lift => ({
      name: lift.name,
      sets: lift.sets,
      routine_id: routineId,
      user_id: user.id,  // add user_id if required by your RLS
    }));

    if (liftRows.length > 0) {
      const { error: liftError } = await supabase
        .from('routine_lifts')
        .insert(liftRows);

      if (liftError) {
        console.error('Error inserting lifts:', liftError);
      }
    }
  }

  // Refresh UI and update lifts for each routine
  const { data: updated, error: loadError } = await supabase
    .from('routines')
    .select('*')
    .eq('user_id', user.id);

  if (!loadError && updated) {
    // For each routine, fetch its lifts
    const routinesWithLifts = await Promise.all(updated.map(async r => {
      const { data: liftsData, error: liftsError } = await supabase
        .from('routine_lifts')
        .select('name, sets')
        .eq('routine_id', r.id);
      return { ...r, lifts: Array.isArray(liftsData) ? liftsData : [], open: false };
    }));
    setRoutines(routinesWithLifts);
  }

  setRoutineName('');
  setLiftInputs([{ name: '', sets: 0 }]);
  setOpenRoutineId(null);
};

  const handleOpenRoutine = (id: number) => {
    setRoutines(routines.map(r => ({ ...r, open: r.id === id })));
    const routine = routines.find(r => r.id === id);
    if (routine) {
      setRoutineName(routine.name);
      // Fetch lifts from DB for this routine
      supabase
        .from('routine_lifts')
        .select('name, sets')
        .eq('routine_id', routine.id)
        .then(({ data, error }) => {
          if (!error && Array.isArray(data)) {
            setLiftInputs([...data, { name: '', sets: 0 }]);
            // Update lifts in routines state for correct lift count
            setRoutines(prev => prev.map(r => r.id === id ? { ...r, lifts: Array.isArray(data) ? data : [], open: true } : r));
          } else {
            setLiftInputs([{ name: '', sets: 0 }]);
          }
        });
      setOpenRoutineId(id);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Routines</h1>
        <button
          onClick={handleAddRoutine}
          className={`mr-15 md:mr-0 p-1 cursor-pointer rounded-full w-10 h-10 text-3xl border border-solid border-black/[.08] dark:border-white/[.145] transition-colors duration-300 ease-in-out flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent ${openRoutineId !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={openRoutineId !== null}
        >
          +
        </button>
      </div>
      {routines.length === 0 && (
        <div className="text-center text-gray-500 py-8">No routines found, add one!</div>
      )}
      <div className="space-y-4">
        {routines.map(routine => (
          <div
            key={routine.id}
            className={`border rounded-lg p-4 bg-gray-50 dark:bg-neutral-900 transition-all ${routine.open ? 'shadow-lg' : 'cursor-pointer hover:border-blue-400'}`}
            onClick={() => !routine.open && handleOpenRoutine(routine.id)}
          >
            {routine.open ? (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Input
                    dark
                    placeholder="Routine Name"
                    value={routineName}
                    onChange={e => setRoutineName(e.target.value)}
                    className="mb-2"
                  />
                  <button
                    onClick={() => handleDeleteRoutine(routine.id)}
                    className="ml-2 text-red-500 hover:text-red-700 text-sm border border-red-300 rounded px-2 py-1"
                  >Delete</button>
                </div>

                <div className="mt-3 border-t border-gray-300 dark:border-white/[.1] pt-3"></div>

                {liftInputs.map((lift, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[1fr_80px_32px] gap-2 items-center mb-2"
                  >
                    <Input
                      dark
                      placeholder="Lift Name"
                      value={lift.name}
                      onChange={e => handleLiftChange(idx, 'name', e.target.value)}
                      className="w-full"
                    />
                    <Input
                      dark
                      type="number"
                      min={0}
                      placeholder="Sets"
                      value={lift.sets || ''}
                      onChange={e => handleLiftChange(idx, 'sets', e.target.value)}
                      className="w-full"
                    />
                    {lift.name.trim() && (
                      <button
                        onClick={() => handleDeleteLift(idx)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >✕</button>
                    )}
                  </div>
                ))}
                <div className='pt-2'>
                  <Button onClick={handleSaveRoutine} disabled={!routineName.trim()}>Save Routine</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">{routine.name}</span>
                <span className="text-sm text-gray-500">{
                  routine.lifts?.length != null ? routine.lifts.length : 0                  
                } lifts</span>
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteRoutine(routine.id); }}
                  className="ml-2 text-red-400 hover:text-red-600 text-xs border border-red-200 rounded px-2 py-1"
                >Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
