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
  const { open, setOpen } = useAuthModal();
  const [session, setSession] = useState<Session | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingLift, setEditingLift] = useState<Lift | null>(null);

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
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-3xl font-semibold font-[family-name:var(--font-geist-mono)]">
          workout tracker
        </h1>

        <div className="font-[family-name:var(--font-geist-mono)]">
          a better way to track your progress
        </div>

        <AuthModal open={open} onClose={() => setOpen(false)} />

        {!session ? (
          <Button onClick={() => setOpen(true)} dark>
            Log In / Sign Up
          </Button>
        ) : (
          <>
            <div className="flex flex-col md:flex-row gap-2 w-full">
              <button
                onClick={() => setIsModalOpen(true)}
                className="mr-15 md:mr-0 p-1 cursor-pointer rounded-full w-10 h-10 text-3xl border border-solid border-black/[.08] dark:border-white/[.145] transition-colors duration-300 ease-in-out flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent"
              >
                +
              </button>
            </div>

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

      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
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
