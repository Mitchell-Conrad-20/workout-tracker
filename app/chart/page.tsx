'use client';

import React, { useEffect, useState } from 'react';
import Button from '../Button';
import Input from '../Input';
import Modal from '../Modal';
import Chart from '../Chart';
import AuthModal from '../AuthModal';
import supabase from '@/lib/supabase';
import { useAuthModal } from '@/hooks/useAuthModal';
import { Session } from '@supabase/supabase-js';

type Lift = {
  name: string;
  weight: number;
  reps: number;
  date: string;
};

export default function Home() {
  const { open, setOpen } = useAuthModal();
  const [session, setSession] = useState<Session | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [liftName, setLiftName] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');

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

  useEffect(() => {
    const fetchLifts = async () => {
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
    };

    fetchLifts();
  }, [session]);

  const handleAddLift = async () => {
    if (!session) return;

    const userId = session.user.id;
    const { error } = await supabase.from('lifts').insert([
      {
        user_id: userId,
        name: liftName,
        weight: Number(weight),
        reps: Number(reps),
        // date: new Date().toISOString().split('T')[0],
        date: new Date().toLocaleDateString('en-US'),
      },
    ]);

    if (error) {
      console.error('Error adding lift:', error.message);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('lifts')
      .select('name, weight, reps, date')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (!fetchError && data) setLiftData(data as Lift[]);

    setLiftName('');
    setWeight('');
    setReps('');
    handleCloseModal();
  };

  const liftTypes = Array.from(new Set(liftData.map((lift) => lift.name)));

  const filteredData = liftData.filter((lift) => {
    const isTypeSelected = selectedLifts.length === 0 || selectedLifts.includes(lift.name);
    const isInDateRange =
      (!dateRange[0] || lift.date >= dateRange[0]) && (!dateRange[1] || lift.date <= dateRange[1]);
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
              <Button dark onClick={handleOpenModal} className="w-full md:w-auto">
                add a lift
              </Button>
              <Button dark onClick={() => setIsFilterModalOpen(true)} className="w-full md:w-auto">
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
                <h2 className="text-2xl font-semibold mb-4">Add a Lift</h2>
                <Input dark placeholder="Lift Name" value={liftName} onChange={(e) => setLiftName(e.target.value)} />
                <Input dark placeholder="Weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
                <Input dark placeholder="Reps" type="number" value={reps} onChange={(e) => setReps(e.target.value)} />
                <Button dark onClick={handleAddLift}>Done</Button>
              </Modal>
            )}

            {isFilterModalOpen && (
              <Modal open={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)}>
                <h2 className="text-xl font-semibold mb-4">Filter Lifts</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {liftTypes.map((type) => (
                    <Button
                      key={type}
                      onClick={() => setSelectedLifts((prev) =>
                        prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
                      )}
                      dark={selectedLifts.includes(type)}
                    >
                      {type}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-col gap-2 mb-6">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={dateRange[0]}
                    onChange={(e) => setDateRange([e.target.value, dateRange[1]])}
                  />
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={dateRange[1]}
                    onChange={(e) => setDateRange([dateRange[0], e.target.value])}
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Button onClick={() => setIsFilterModalOpen(false)}>Cancel</Button>
                  <Button dark onClick={() => setIsFilterModalOpen(false)}>Apply</Button>
                </div>
              </Modal>
            )}
          </>
        )}
      </main>

    </div>
  );
}
