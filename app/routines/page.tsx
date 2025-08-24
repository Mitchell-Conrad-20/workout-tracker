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
  // Autofill state for lift name suggestions
  const [pastLiftNames, setPastLiftNames] = useState<string[]>([]);
  const [showSuggestionsIdx, setShowSuggestionsIdx] = useState<number | null>(null);
  const [highlightedIdx, setHighlightedIdx] = useState<number>(-1);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineName, setRoutineName] = useState('');
  const [liftInputs, setLiftInputs] = useState<Lift[]>([{ name: '', sets: 0 }]);
  const [openRoutineId, setOpenRoutineId] = useState<number | null>(null);

  // Fetch user's past lift names for autofill
  useEffect(() => {
    const fetchPastLiftNames = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('lifts')
        .select('name')
        .eq('user_id', user.id);
      if (!error && data) {
        const uniqueNames = Array.from(new Set(data.map((l: { name: string }) => l.name)));
        setPastLiftNames(uniqueNames);
      }
    };
    fetchPastLiftNames();
  }, [user]);

  // Get filtered suggestions for a lift input
  const getFilteredSuggestions = (input: string) => {
    if (!input) return [];
    return pastLiftNames
      .filter((name) => name.toLowerCase().startsWith(input.toLowerCase()))
      .slice(0, 5);
  };

  // Debounce and sanitize routineName
  useEffect(() => {
    const handler = setTimeout(() => {
      if (routineName !== capitalizeWords(routineName)) {
        setRoutineName(capitalizeWords(routineName));
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [routineName]);

  // Debounce and sanitize liftInputs
  useEffect(() => {
    const handler = setTimeout(() => {
      const sanitized = liftInputs.map(lift => ({
        ...lift,
        name: capitalizeWords(lift.name)
      }));
      if (JSON.stringify(liftInputs) !== JSON.stringify(sanitized)) {
        setLiftInputs(sanitized);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [liftInputs]);

  // Capitalize and sanitize words (same as LiftForm)
  const capitalizeWords = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9 ]/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  useEffect(() => {
    if (!loading && !user) {
      // You can redirect or show a message here if needed
    }
  }, [loading, user]);

  useEffect(() => {
    if (!user) return;

    const fetchRoutinesAndLifts = async () => {
      // Fetch all routines for the user
      const { data: routinesData, error: routinesError } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', user.id);

      if (!routinesError && routinesData) {
        // Fetch all lifts for all routines in one query
        const routineIds = routinesData.map(r => r.id);
        const liftsByRoutine: Record<number, Lift[]> = {};
        if (routineIds.length > 0) {
          const { data: liftsData } = await supabase
            .from('routine_lifts')
            .select('name, sets, routine_id')
            .in('routine_id', routineIds);
          if (Array.isArray(liftsData)) {
            liftsData.forEach(lift => {
              if (!liftsByRoutine[lift.routine_id]) liftsByRoutine[lift.routine_id] = [];
              liftsByRoutine[lift.routine_id].push({ name: lift.name, sets: lift.sets });
            });
          }
        }
        setRoutines(routinesData.map(r => ({ ...r, lifts: liftsByRoutine[r.id] || [], open: false })));
      }
    };

    fetchRoutinesAndLifts();
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
    if (field === 'name') {
      setShowSuggestionsIdx(idx);
      setHighlightedIdx(-1);
    }
    if (field === 'name' && value && idx === liftInputs.length - 1) {
      setLiftInputs([...updated, { name: '', sets: 0 }]);
    }
  };

  const handleSaveRoutine = async () => {
  if (!routineName.trim() || !user) return;

  // Data sanitization for lifts and routine name
  const sanitizedRoutineName = capitalizeWords(routineName);
  const lifts = liftInputs
    .map(lift => ({
      name: capitalizeWords(lift.name),
      sets: Math.max(1, Math.floor(Number(lift.sets)))
    }))
    .filter(lift => lift.name.length > 0 && lift.sets > 0);

  if (lifts.length === 0) return;

  let routineId: number | null = null;

  const existingRoutine = routines.find(r => r.id === openRoutineId && r.id !== -1);

  if (existingRoutine) {
    // UPDATE existing routine name
    const { error: updateError } = await supabase
      .from('routines')
      .update({ name: sanitizedRoutineName })
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
      .insert([{ name: sanitizedRoutineName, user_id: user.id }])
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
      const { data: liftsData } = await supabase
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
      setLiftInputs([...(routine.lifts || []), { name: '', sets: 0 }]);
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
            className={`bg-white dark:bg-neutral-900 rounded-xl p-4 mb-6 shadow-sm border border-gray-100 dark:border-neutral-800 transition-all ${routine.open ? 'shadow-lg' : 'cursor-pointer hover:border-blue-400'}`}
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
                    className="grid grid-cols-[1fr_80px_32px] gap-2 items-center mb-2 relative"
                  >
                    <div className="relative">
                      <Input
                        dark
                        placeholder="Lift Name"
                        value={lift.name}
                        onChange={e => handleLiftChange(idx, 'name', e.target.value)}
                        onFocus={() => { setShowSuggestionsIdx(idx); setHighlightedIdx(-1); }}
                        onBlur={() => setTimeout(() => setShowSuggestionsIdx(null), 150)}
                        onKeyDown={e => {
                          const suggestions = getFilteredSuggestions(lift.name);
                          if (!suggestions.length || showSuggestionsIdx !== idx) return;
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setHighlightedIdx(prev => prev < suggestions.length - 1 ? prev + 1 : 0);
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setHighlightedIdx(prev => prev > 0 ? prev - 1 : suggestions.length - 1);
                          } else if (e.key === 'Enter' && highlightedIdx >= 0) {
                            e.preventDefault();
                            const selected = suggestions[highlightedIdx];
                            handleLiftChange(idx, 'name', selected);
                            setShowSuggestionsIdx(null);
                          } else if (e.key === 'Escape') {
                            setShowSuggestionsIdx(null);
                          }
                        }}
                        className="w-full"
                      />
                      {showSuggestionsIdx === idx && getFilteredSuggestions(lift.name).length > 0 && (
                        <ul className="absolute z-10 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-md mt-1 w-full max-h-40 overflow-y-auto shadow-lg">
                          {getFilteredSuggestions(lift.name).map((suggestion, sIdx) => (
                            <li
                              key={suggestion}
                              className={`px-3 py-2 cursor-pointer ${highlightedIdx === sIdx ? 'bg-gray-200 dark:bg-neutral-700' : 'hover:bg-gray-100 dark:hover:bg-neutral-700'}`}
                              onMouseDown={() => {
                                handleLiftChange(idx, 'name', suggestion);
                                setShowSuggestionsIdx(null);
                              }}
                            >
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
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
              <div className="flex items-center justify-between relative">
                <span className="font-semibold text-lg">{routine.name}</span>
                <span className="absolute left-1/2 -translate-x-1/2 text-sm text-gray-500 pointer-events-none">{
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
