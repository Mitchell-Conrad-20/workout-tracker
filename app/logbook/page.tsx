
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import supabase from '@/lib/supabase';
import Modal from '@/components/Modal';
import LiftForm from '@/components/LiftForm';
import DatePicker from '@/components/DatePicker';
import AuthModal from '@/components/AuthModal';
import { useAuthModal } from '@/hooks/useAuthModal';
import { format, parseISO } from 'date-fns';
import { format as formatDateFns } from 'date-fns';
import { ArrowRight, ArrowLeft} from 'lucide-react';

interface Lift {
  id: number;
  user_id: string;
  name: string;
  weight: number;
  reps: number;
  date: string;
}

const Logbook: React.FC = () => {
  // Auth modal state
  const { open, setOpen, isAuthenticated } = useAuthModal();
  const [lifts, setLifts] = useState<Lift[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingLift, setEditingLift] = useState<Lift | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchLifts = async () => {
      const { data, error } = await supabase
        .from('lifts')
        .select('*')
        .order('date', { ascending: false });

      if (!error && data) {
        setLifts(data);

        // Default to latest date
        const latest = data[0]?.date?.split('T')[0];
        if (latest) setSelectedDate(latest);
      } else {
        console.error(error);
      }
    };

    fetchLifts();
  }, []);

  const groupedLifts = useMemo(
    () =>
      lifts.reduce<Record<string, Lift[]>>((acc, lift) => {
        const dateKey = lift.date.split('T')[0];
        acc[dateKey] = acc[dateKey] || [];
        acc[dateKey].push(lift);
        return acc;
      }, {}),
    [lifts]
  );

  const dates = useMemo(() => Object.keys(groupedLifts).sort((a, b) => b.localeCompare(a)), [groupedLifts]);

  const handleEdit = (lift: Lift) => {
    setEditingLift(lift);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    await supabase.from('lifts').delete().eq('id', id);
    setLifts((prev) => {
      const updated = prev.filter((lift) => lift.id !== id);
      // After updating lifts, check if selectedDate is now empty
      const grouped = updated.reduce<Record<string, Lift[]>>((acc, lift) => {
        const dateKey = lift.date.split('T')[0];
        acc[dateKey] = acc[dateKey] || [];
        acc[dateKey].push(lift);
        return acc;
      }, {});
      if (selectedDate && (!grouped[selectedDate] || grouped[selectedDate].length === 0)) {
        // Find next available date
        const availableDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
        if (availableDates.length > 0) {
          // Prefer previous date, then next date, then first available
          const currentIndex = availableDates.indexOf(selectedDate);
          let newDate = null;
          if (currentIndex > 0) {
            newDate = availableDates[currentIndex - 1];
          } else if (currentIndex < availableDates.length - 1 && currentIndex !== -1) {
            newDate = availableDates[currentIndex + 1];
          } else {
            newDate = availableDates[0];
          }
          setSelectedDate(newDate);
        } else {
          setSelectedDate(null);
        }
      }
      return updated;
    });
  };

  const handleFormSubmit = async (updatedLift: Partial<Lift>) => {
    try {
      if (updatedLift.id) {
        // Editing existing lift
        const { data, error } = await supabase
          .from('lifts')
          .update({
            name: updatedLift.name,
            weight: updatedLift.weight,
            reps: updatedLift.reps,
            date: updatedLift.date,
          })
          .eq('id', updatedLift.id)
          .select();

        if (error) {
          console.error('Error updating lift:', error.message);
          return;
        }

        if (data) {
          setLifts((prev) =>
            prev.map((lift) => (lift.id === updatedLift.id ? data[0] : lift))
          );
        }
      } else {
        // Creating new lift (must include user_id)
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error('Error fetching user:', userError?.message);
          return;
        }

        const { data, error } = await supabase
          .from('lifts')
          .insert([{
            name: updatedLift.name,
            weight: updatedLift.weight,
            reps: updatedLift.reps,
            date: updatedLift.date,
            user_id: user.id,
          }])
          .select();

        if (error) {
          console.error('Error adding new lift:', error.message);
          return;
        }

        if (data) {
          setLifts((prev) => [...prev, ...data]);
        }
      }

      setShowModal(false);
      setEditingLift(null);
    } catch (err) {
      console.error('Unexpected error in handleFormSubmit:', err);
    }
  };

  const openNewLiftForm = () => {
    setEditingLift(null);
    setShowModal(true);
  };

  const currentIndex = selectedDate ? dates.indexOf(selectedDate) : -1;
  const prevDate = currentIndex > 0 ? dates[currentIndex - 1] : null;
  const nextDate = currentIndex >= 0 && currentIndex < dates.length - 1 ? dates[currentIndex + 1] : null;

  const currentLifts = React.useMemo(() => (
    selectedDate ? groupedLifts[selectedDate] || [] : []
  ), [selectedDate, groupedLifts]);

  // Group current lifts by exercise name
  const groupedByExercise = useMemo(() => {
    const grouped: Record<string, Lift[]> = {};
    currentLifts.forEach((lift) => {
      if (!grouped[lift.name]) grouped[lift.name] = [];
      grouped[lift.name].push(lift);
    });
    return grouped;
  }, [currentLifts]);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <AuthModal open={open} onClose={() => setOpen(false)} />
      {isAuthenticated ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Your Logbook</h1>
            <button
              onClick={openNewLiftForm}
              className="mr-15 md:mr-0 p-1 cursor-pointer rounded-full w-10 h-10 text-3xl border border-solid border-black/[.08] dark:border-white/[.145] transition-colors duration-300 ease-in-out flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent"
            >
              +
            </button>
          </div>

          {/* Calendar-style date picker with arrows */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <button
              onClick={() => nextDate && setSelectedDate(nextDate)}
              disabled={!nextDate}
              className={`w-12 h-10 flex items-center justify-center rounded-full text-lg transition-colors ${
                nextDate
                  ? 'cursor-pointer bg-gray-200 hover:bg-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 hover:border-blue-400 dark:hover:border-blue-500'
                  : 'bg-gray-100 text-gray-400 dark:bg-neutral-800 dark:text-neutral-600 cursor-not-allowed'
              }`}
            >
              <ArrowLeft />
            </button>
            <DatePicker
              value={selectedDate || ''}
              onChange={(newDate) => setSelectedDate(newDate)}
              small
            />
            <button
              onClick={() => prevDate && setSelectedDate(prevDate)}
              disabled={!prevDate}
              className={`w-12 h-10 flex items-center justify-center rounded-full transition-colors ${
                prevDate
                  ? 'cursor-pointer bg-gray-200 hover:bg-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-700'
                  : 'bg-gray-100 text-gray-400 dark:bg-neutral-800 dark:text-neutral-600 cursor-not-allowed'
              }`}
            >
              <ArrowRight />
            </button>
          </div>

          {/* Display "page" */}
          {selectedDate && currentLifts.length > 0 ? (
            <div className="bg-white dark:bg-neutral-900 p-4 rounded shadow">
              <h2 className="text-xl font-semibold mb-4">
                {format(parseISO(selectedDate), 'MMMM d, yyyy')}
              </h2>
              {/* Display lifts in sorted groups of sorted data */}
              {Object.entries(groupedByExercise)
                .sort(([a], [b]) => a.localeCompare(b)) // Alphabetize exercises
                .map(([exerciseName, sets]) => (
                  <div
                    key={exerciseName}
                    className="mb-4 p-3 border rounded dark:border-neutral-700"
                  >
                    <p className="font-medium mb-2">{exerciseName}</p>
                    <div className="space-y-1">
                      {sets
                        .slice() // Copy to avoid mutating state
                        .sort((a, b) => b.weight - a.weight) // Heaviest first
                        .map((set) => (
                          <div
                            key={set.id}
                            className="flex justify-between items-center"
                          >
                            <p>
                              {set.weight} lbs × {set.reps} reps
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(set)}
                                className="cursor-pointer text-blue-600 hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(set.id)}
                                className="cursor-pointer text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-neutral-500">
              {selectedDate
                ? 'No lifts recorded on this date.'
                : 'Select a date to view your lifts.'}
            </div>
          )}

          {/* Add/Edit Modal */}
          <Modal open={showModal} onClose={() => setShowModal(false)}>
            <h2 className="text-lg font-semibold mb-4">
              {editingLift ? 'Edit Lift' : 'Add Lift'}
            </h2>
            <LiftForm
              initialData={editingLift}
              onSubmit={handleFormSubmit}
              onCancel={() => setShowModal(false)}
            />
          </Modal>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
          <h2 className="text-xl font-semibold mb-2">No data available</h2>
          <p>Please log in to view your logbook.</p>
        </div>
      )}
    </div>
  );
};

export default Logbook;
