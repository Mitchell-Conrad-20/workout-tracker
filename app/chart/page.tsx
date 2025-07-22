'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Button from '../Button';
import Modal from '../Modal';
import Chart from '../Chart';
import AuthModal from '../AuthModal';
import supabase from '@/lib/supabase';
import { useAuthModal } from '@/hooks/useAuthModal';
import { Session } from '@supabase/supabase-js';
import LiftForm from '../LiftForm';
import { Lift } from '../types/lift';

export default function Home() {
  const { open, setOpen } = useAuthModal();
  const [session, setSession] = useState<Session | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [liftData, setLiftData] = useState<Lift[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLifts, setSelectedLifts] = useState<string[]>([]);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<[string, string]>(["", ""]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const fetchLifts = useCallback(async () => {
    if (!session?.user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('lifts')
      .select('name, weight, reps, date')
      .eq('user_id', session.user.id)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching lifts:', error.message);
    } else if (data) {
      setLiftData(data as Lift[]);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    fetchLifts();
  }, [fetchLifts]);

  const handleFormSubmit = async (formData: Partial<Lift>) => {
    if (!session) return;

    try {
      const userId = session.user.id;
      const { error } = await supabase.from('lifts').insert([
        {
          user_id: userId,
          name: formData.name,
          weight: Number(formData.weight),
          reps: Number(formData.reps),
          date: formData.date || new Date().toISOString().split('T')[0],
        },
      ]);

      if (error) throw error;

      await fetchLifts();
      handleCloseModal();
    } catch (err) {
      console.error('Error adding lift:', err);
    }
  };

  const liftTypes = Array.from(new Set(liftData.map((lift) => lift.name)));

  const filteredData = liftData.filter((lift) => {
    const isTypeSelected =
      selectedLifts.length === 0 || selectedLifts.includes(lift.name);
    const isInDateRange =
      (!dateRange[0] || lift.date >= dateRange[0]) &&
      (!dateRange[1] || lift.date <= dateRange[1]);
    return isTypeSelected && isInDateRange;
  });

  const handleClearFilters = () => {
    setSelectedLifts([]);
    setDateRange(["", ""]);
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="w-full sm:w-5/6 md:w-2/3 flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-3xl font-semibold font-[family-name:var(--font-geist-mono)]">
          chart
        </h1>

        <AuthModal open={open} onClose={() => setOpen(false)} />

        {session && (
          <>
            <div className="flex flex-col md:flex-row gap-2 w-full">
              <button
                onClick={handleOpenModal}
                className="p-1 cursor-pointer rounded-full w-10 h-10 text-3xl border border-solid border-black/[.08] dark:border-white/[.145] transition-colors duration-300 ease-in-out flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent"
              >
                +
              </button>
              <Button
                dark
                onClick={() => setIsFilterModalOpen(true)}
                className="w-full md:w-auto"
              >
                filter lifts
              </Button>
            </div>

            {(selectedLifts.length > 0 || dateRange[0] || dateRange[1]) && (
              <Button onClick={handleClearFilters} className="text-sm">
                clear filters
              </Button>
            )}

            {loading ? (
              <p className="text-gray-500">Loading chart...</p>
            ) : filteredData.length > 0 ? (
              <Chart data={filteredData} />
            ) : (
              <p className="text-gray-400 mt-4">no data for selected filters</p>
            )}

            {isModalOpen && (
              <Modal open={isModalOpen} onClose={handleCloseModal}>
                <h2 className="text-lg font-semibold mb-4">Add Lift</h2>
                <LiftForm
                  initialData={null}
                  onSubmit={handleFormSubmit}
                  onCancel={handleCloseModal}
                />
              </Modal>
            )}

            {isFilterModalOpen && (
              <Modal
                open={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
              >
                <h2 className="text-xl font-semibold mb-4">Filter Lifts</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {liftTypes.map((type) => (
                    <Button
                      key={type}
                      onClick={() =>
                        setSelectedLifts((prev) =>
                          prev.includes(type)
                            ? prev.filter((t) => t !== type)
                            : [...prev, type]
                        )
                      }
                      dark={selectedLifts.includes(type)}
                    >
                      {type}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-col gap-2 mb-6">
                  <label className="text-sm font-medium">Start Date</label>
                  <input
                    type="date"
                    value={dateRange[0]}
                    onChange={(e) =>
                      setDateRange([e.target.value, dateRange[1]])
                    }
                    className="border p-2 rounded"
                  />
                  <label className="text-sm font-medium">End Date</label>
                  <input
                    type="date"
                    value={dateRange[1]}
                    onChange={(e) =>
                      setDateRange([dateRange[0], e.target.value])
                    }
                    className="border p-2 rounded"
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Button onClick={() => setIsFilterModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    dark
                    onClick={() => setIsFilterModalOpen(false)}
                  >
                    Apply
                  </Button>
                </div>
              </Modal>
            )}
          </>
        )}
      </main>
    </div>
  );
}
