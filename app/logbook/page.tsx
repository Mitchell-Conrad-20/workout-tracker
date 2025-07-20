'use client';

import React, { useEffect, useState } from 'react';
import supabase from '../../lib/supabase';
import Button from '../Button';
import Modal from '../Modal';
import LiftForm from '../LiftForm';
import { format, parseISO } from 'date-fns';

interface Lift {
  id: number;
  user_id: string;
  name: string;
  weight: number;
  reps: number;
  date: string;
}

const Logbook: React.FC = () => {
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

  const groupedLifts = lifts.reduce<Record<string, Lift[]>>((acc, lift) => {
    const dateKey = lift.date.split('T')[0];
    acc[dateKey] = acc[dateKey] || [];
    acc[dateKey].push(lift);
    return acc;
  }, {});

  const handleEdit = (lift: Lift) => {
    setEditingLift(lift);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    await supabase.from('lifts').delete().eq('id', id);
    setLifts((prev) => prev.filter((lift) => lift.id !== id));
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
          .insert([
            {
              name: updatedLift.name,
              weight: updatedLift.weight,
              reps: updatedLift.reps,
              date: updatedLift.date,
              user_id: user.id,
            },
          ])
          .select();

        if (error) {
          console.error('Error adding new lift:', error.message);
          return;
        }

        if (data) {
          setLifts((prev) => [...prev, ...data]);
        }
      }

      // Reset modal and editing state
      setShowModal(false);
      setEditingLift(null);
    } catch (err) {
      console.error('Unexpected error in handleFormSubmit:', err);
    }
  };

  const handleDateSelect = (date: Date | null) => {
    if (!date) return;
    const isoDate = date.toISOString().split('T')[0];
    setSelectedDate(isoDate);
  };

  const openNewLiftForm = () => {
    setEditingLift(null);
    setShowModal(true);
  };

  const currentLifts = selectedDate ? groupedLifts[selectedDate] || [] : [];

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Your Logbook</h1>
        <Button dark onClick={openNewLiftForm}>
          + Add Lift
        </Button>
      </div>

      {/* Calendar-style date picker */}
      <div className="mb-6 border rounded-md dark:border-neutral-700 p-4 bg-white dark:bg-neutral-900">
        <input
          type="date"
          value={selectedDate || ''}
          onChange={(e) => handleDateSelect(new Date(e.target.value))}
          className="w-full p-2 border rounded-md dark:border-neutral-700 bg-white dark:bg-neutral-900"
        />
      </div>

      {/* Display "page" */}
      {selectedDate && currentLifts.length > 0 ? (
        <div className="bg-white dark:bg-neutral-900 p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">
            {format(parseISO(selectedDate), 'MMMM d, yyyy')}
          </h2>
          {currentLifts.map((lift) => (
            <div
              key={lift.id}
              className="mb-4 p-3 border rounded dark:border-neutral-700"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{lift.name}</p>
                  <p>
                    {lift.weight} lbs × {lift.reps} reps
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(lift)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(lift.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
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
    </div>
  );
};

export default Logbook;