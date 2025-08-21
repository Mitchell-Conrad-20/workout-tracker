
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Chart from '@/components/Chart';
import Toggle from '@/components/Toggle';
import AuthModal from '@/components/AuthModal';
import supabase from '@/lib/supabase';
import { useAuthModal } from '@/hooks/useAuthModal';
import { Session } from '@supabase/supabase-js';
import LiftForm from '@/components/LiftForm';
import { Lift } from '@/types/lift';
import DatePicker from '@/components/DatePicker';
import Link from 'next/link';

export default function Home() {
  // Autocomplete state for filter modal lift search
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Hide suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  // Keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      setHighlightedIndex((prev) => (prev + 1) % filteredSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      setHighlightedIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
        const selected = filteredSuggestions[highlightedIndex];
        setSelectedLifts([...selectedLifts, selected]);
        setLiftSearch('');
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    }
  };

  // Add suggestion on click
  const handleSuggestionClick = (suggestion: string) => {
    setSelectedLifts([...selectedLifts, suggestion]);
    setLiftSearch('');
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };
  // --- Filter modal lift search state ---
  const [liftSearch, setLiftSearch] = useState('');
  const { open, setOpen, isAuthenticated } = useAuthModal();
  const [session, setSession] = useState<Session | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [liftData, setLiftData] = useState<Lift[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLifts, setSelectedLifts] = useState<string[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<[string, string]>(['', '']);

  // Use display labels for metric state
  type MetricLabel = 'Weight' | 'Reps' | 'Tot Vol' | 'Avg Vol';
  const [metric, setMetric] = useState<MetricLabel>('Weight');

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
          date: formData.date || format(new Date(), 'yyyy-MM-dd'),
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

  // Filtered suggestions based on liftSearch
  const filteredSuggestions = liftTypes.filter(
    (name) =>
      name.toLowerCase().includes(liftSearch.toLowerCase()) &&
      !selectedLifts.includes(name)
  );

  // Filtered data for chart (by selected lifts and date range)
  const filteredData = React.useMemo(() => {
    return liftData.filter((lift) => {
      const isTypeSelected = selectedLifts.length === 0 || selectedLifts.includes(lift.name);
      const isInDateRange = (!dateRange[0] || lift.date >= dateRange[0]) && (!dateRange[1] || lift.date <= dateRange[1]);
      return isTypeSelected && isInDateRange;
    });
  }, [liftData, selectedLifts, dateRange]);

  // Chart data for avgVol
  const chartData = React.useMemo(() => {
    if (metric !== 'Avg Vol') return filteredData;
    // Group by date and lift name
    const grouped: Record<string, Lift[]> = {};
    filteredData.forEach((lift: Lift) => {
      const key = `${lift.date}__${lift.name}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(lift);
    });
    return Object.entries(grouped).map(([key, lifts]) => {
      const [date, name] = key.split('__');
      const totalVol = lifts.reduce((sum, l) => sum + l.weight * l.reps, 0);
      const avgVol = lifts.length > 0 ? Math.round(totalVol / lifts.length) : 0;
      return {
        ...lifts[0],
        date,
        name,
        value: avgVol,
        avgVol,
      };
    });
  }, [filteredData, metric]);

  // Clear filters handler
  const handleClearFilters = () => {
    setSelectedLifts([]);
    setDateRange(['', '']);
  };

  return (
    <div className="min-h-screen pt-4 pb-20 gap-16 sm:pb-20 font-[family-name:var(--font-geist-sans)] flex justify-center">
      <AuthModal open={open} onClose={() => setOpen(false)} />
      {isAuthenticated ? (
        <main className="w-full sm:w-5/6 md:w-2/3 flex flex-col gap-[32px] items-center sm:items-start">
          <div className="flex items-center justify-between w-full mb-2">
            <h1 className="px-4 text-3xl font-semibold font-[family-name:var(--font-geist-mono)]">Your Chart</h1>
            {session && (
              <div className="flex gap-2 items-center">
                <button
                  onClick={handleOpenModal}
                  className="p-1 cursor-pointer rounded-full w-10 h-10 text-3xl border border-solid border-black/[.08] dark:border-white/[.145] transition-colors duration-300 ease-in-out flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent"
                >
                  +
                </button>
                <Link
                  href="/log-routine"
                  className="p-1 mr-15 md:mr-0 sm:mr-2 cursor-pointer rounded-full w-10 h-10 text-2xl border border-solid border-black/[.08] dark:border-white/[.145] transition-colors duration-300 ease-in-out flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent"
                  title="Log a Routine"
                >
                  🏋️
                </Link>
              </div>
            )}
          </div>

          {session && (
            <>
              <div className="px-4 flex flex-col md:flex-row gap-2 w-full">
                <Button
                  dark
                  onClick={() => setIsFilterModalOpen(true)}
                  className="w-full md:w-auto"
                >
                  filter lifts
                </Button>

                {(selectedLifts.length > 0 || dateRange[0] || dateRange[1]) && (
                  <Button onClick={handleClearFilters} >
                    clear filters
                  </Button>
                )}
              </div>

              {loading ? (
                <p className="text-gray-500">Loading chart...</p>
              ) : (metric === 'Avg Vol' ? chartData.length > 0 : filteredData.length > 0) ? (
                <Chart
                  data={metric === 'Avg Vol' ? chartData : filteredData}
                  defaultMetric={
                    metric === 'Weight' ? 'weight' :
                    metric === 'Reps' ? 'reps' :
                    metric === 'Tot Vol' ? 'volume' :
                    metric === 'Avg Vol' ? 'volume' :
                    'weight'
                  }
                />
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
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex gap-2 mb-2">
                      <div className="relative w-full">
                        <Input
                          dark
                          ref={inputRef}
                          type="text"
                          placeholder="Search lifts..."
                          value={liftSearch}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setLiftSearch(e.target.value);
                            setShowSuggestions(true);
                            setHighlightedIndex(-1);
                          }}
                          onFocus={() => setShowSuggestions(true)}
                          onKeyDown={handleKeyDown}
                          className="w-full"
                        />
                        {showSuggestions && filteredSuggestions.length > 0 && (
                          <ul className="absolute z-10 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-md mt-1 w-full max-h-40 overflow-y-auto shadow-lg">
                            {filteredSuggestions.map((suggestion, index) => (
                              <li
                                key={suggestion}
                                className={`px-3 py-2 cursor-pointer ${
                                  index === highlightedIndex
                                    ? 'bg-gray-200 dark:bg-neutral-700'
                                    : 'hover:bg-gray-100 dark:hover:bg-neutral-700'
                                }`}
                                onMouseDown={() => handleSuggestionClick(suggestion)}
                              >
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          if (filteredSuggestions.length > 0) {
                            setSelectedLifts([...selectedLifts, filteredSuggestions[0]]);
                            setLiftSearch('');
                            setShowSuggestions(false);
                            setHighlightedIndex(-1);
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <Button
                        dark
                        type="button"
                        onClick={() => setSelectedLifts([...liftTypes])} 
                      >
                        Select All Lifts
                      </Button>
                      <Button
                        dark
                        type="button"
                        onClick={() => setSelectedLifts([])}
                      >
                        Remove All
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedLifts.map((lift) => (
                        <div key={lift} className="flex items-center gap-1 bg-gray-200 dark:bg-neutral-800 rounded px-2 py-1">
                          <span>{lift}</span>
                          <button
                            type="button"
                            className="text-red-500 hover:text-red-700 ml-1"
                            onClick={() => setSelectedLifts(selectedLifts.filter(l => l !== lift))}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* Metric toggle inside filter modal */}
                    <div className="mt-4">
                      <label className="text-sm font-medium mb-2 block">Metric</label>
                      <Toggle
                        options={['Weight', 'Reps', 'Tot Vol', 'Avg Vol']}
                        selected={metric}
                        onSelect={(val) => setMetric(val as MetricLabel)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mb-6">
                    <label className="text-sm font-medium">Start Date</label>
                    <DatePicker
                      value={dateRange[0]}
                      onChange={(val: string) => setDateRange([val, dateRange[1]])}
                    />
                    <label className="text-sm font-medium">End Date</label>
                    <DatePicker
                      value={dateRange[1]}
                      onChange={(val: string) => setDateRange([dateRange[0], val])}
                    />
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button dark onClick={() => setIsFilterModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsFilterModalOpen(false)}>
                      Apply
                    </Button>
                  </div>
                </Modal>
              )}
            </>
          )}
        </main>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
          <h2 className="text-xl font-semibold mb-2">No data available</h2>
          <p>Please log in to view your logbook.</p>
        </div>
      )}
    </div>
  );
}
