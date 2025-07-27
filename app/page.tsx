'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import icon from '../public/icon.png';
import Button from './Button';
import Modal from './Modal';
import AuthModal from './AuthModal';
import LiftForm from './LiftForm';
import supabase from '@/lib/supabase';
import { useAuthModal } from '@/hooks/useAuthModal';
import { Session } from '@supabase/supabase-js';
import { Lift } from './types/lift';

export default function Home() {
  const [lifts, setLifts] = useState<Lift[]>([]);
  const [stats, setStats] = useState<{
    didWorkoutToday: boolean;
    totalWorkouts: number;
    mostImproved?: { name: string; diff: number };
    leastImproved?: { name: string; diff: number };
  }>({ didWorkoutToday: false, totalWorkouts: 0 });
  const { open, setOpen } = useAuthModal();
  const [session, setSession] = useState<Session | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingLift, setEditingLift] = useState<Lift | null>(null);

  useEffect(() => {
    if (!session) {
      setLifts([]);
      setStats({ didWorkoutToday: false, totalWorkouts: 0 });
      return;
    }
    // Fetch all lifts for stats
    supabase
      .from('lifts')
      .select('*')
      .eq('user_id', session.user.id)
      .then(({ data, error }) => {
        if (error || !data) return;
        setLifts(data);
        // Calculate stats
        const today = new Date().toISOString().split('T')[0];
        const didWorkoutToday = data.some(l => l.date && l.date.startsWith(today));
        // Group by date (workout session)
        const workoutDates = Array.from(new Set(data.map(l => l.date.split('T')[0])));
        const totalWorkouts = workoutDates.length;

        // Group lifts by name
        const liftsByName: Record<string, Lift[]> = {};
        data.forEach(l => {
          if (!liftsByName[l.name]) liftsByName[l.name] = [];
          liftsByName[l.name].push(l);
        });

        // Calculate improvement for each lift (max weight diff from first to last session)
        const improvements: { name: string; diff: number }[] = [];
        Object.entries(liftsByName).forEach(([name, arr]) => {
          // Sort by date
          const sorted = arr.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          if (sorted.length < 2) return;
          const first = sorted[0].weight;
          const last = sorted[sorted.length - 1].weight;
          improvements.push({ name, diff: last - first });
        });
        let mostImproved, leastImproved;
        if (improvements.length > 0) {
          mostImproved = improvements.reduce((a, b) => (b.diff > a.diff ? b : a));
          leastImproved = improvements.reduce((a, b) => (b.diff < a.diff ? b : a));
        }
        setStats({
          didWorkoutToday,
          totalWorkouts,
          mostImproved,
          leastImproved,
        });
      });
  }, [session]);

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

  const handleFormSubmit = async (liftData: Partial<Lift>) => {
    if (!session) return;
    try {
      const { data, error } = await supabase
        .from('lifts')
        .insert([{
          user_id: session.user.id,
          name: liftData.name,
          weight: liftData.weight,
          reps: liftData.reps,
          date: liftData.date || new Date().toISOString().split('T')[0], // default to today
        }])
        .select();

      if (error) {
        console.error('Error adding lift:', error.message);
        return;
      }

      console.log('Lift added:', data);
      setIsModalOpen(false);
      setEditingLift(null);
    } catch (err) {
      console.error('Unexpected error in handleFormSubmit:', err);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto min-h-screen flex flex-col">
      <main className="flex flex-col gap-[32px] flex-1">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-semibold font-[family-name:var(--font-geist-mono)]">
            Auralift
          </h1>
          {session && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1 mr-15 md:mr-0 sm:mr-2 cursor-pointer rounded-full w-10 h-10 text-3xl border border-solid border-black/[.08] dark:border-white/[.145] transition-colors duration-300 ease-in-out flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent"
            >
              +
            </button>
          )}
        </div>

        {session && (
          <div className="mb-6 text-center text-lg sm:text-xl font-[family-name:var(--font-geist-mono)]">
            {stats.didWorkoutToday ? (
              <div className="mb-2 text-green-600 dark:text-green-400 font-semibold">🎉 Congrats on getting your workout in today!</div>
            ) : (
              <div className="mb-2 text-blue-600 dark:text-blue-400 font-semibold">You haven't worked out yet today. Let's get after it!</div>
            )}
            <div>
              {stats.totalWorkouts > 0 && (
                <>You've logged <span className="font-bold">{stats.totalWorkouts}</span> workout{stats.totalWorkouts === 1 ? '' : 's'} this year.</>
              )}
            </div>
            {stats.mostImproved && stats.leastImproved && stats.mostImproved.name !== stats.leastImproved.name && (
              <div className="mt-2">
                <span>Your most improved lift is <span className="font-bold">{stats.mostImproved.name}</span> (+{stats.mostImproved.diff} lbs)</span>
                <br />
                <span>Your least improved lift is <span className="font-bold">{stats.leastImproved.name}</span> ({stats.leastImproved.diff >= 0 ? '+' : ''}{stats.leastImproved.diff} lbs)</span>
              </div>
            )}
          </div>
        )}

        {!session && (
          <div className="font-[family-name:var(--font-geist-mono)] text-center text-xl sm:text-2xl font-medium mb-2">
            a better way to track your progress
          </div>
        )}

        <AuthModal open={open} onClose={() => setOpen(false)} />

        {!session ? (
          <Button onClick={() => setOpen(true)} dark>
            Log In / Sign Up
          </Button>
        ) : (
          <>
            {/* Add Lift Modal */}
            <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
              <h2 className="text-lg font-semibold mb-4">Add Lift</h2>
              <LiftForm
                initialData={editingLift}
                onSubmit={handleFormSubmit}
                onCancel={() => setIsModalOpen(false)}
              />
            </Modal>
          </>
        )}
      </main>

      <footer className="flex gap-[24px] flex-wrap items-center justify-center mt-8">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://mconrad.tech/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src={icon}
            alt="MC icon"
            width={32}
            height={32}
            className="rounded-md hover:scale-125 transition ease-in-out"
          />
        </a>
      </footer>
    </div>
  );
}
