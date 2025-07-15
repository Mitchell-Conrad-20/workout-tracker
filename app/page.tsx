'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import icon from '../public/icon.png';
// import iconWhite from '../public/icon-white.png';
import Button from './Button';
import Input from './Input';
import Modal from './Modal';
import AuthModal from './AuthModal';
import supabase from '@/lib/supabase';
import { useAuthModal } from '@/hooks/useAuthModal';
import { Session } from '@supabase/supabase-js';

export default function Home() {
  const { open, setOpen } = useAuthModal();
  const [session, setSession] = useState<Session | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [liftName, setLiftName] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');

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

    setLiftName('');
    setWeight('');
    setReps('');
    handleCloseModal();
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
              <Button dark onClick={handleOpenModal} className="w-full md:w-auto">
                add a lift
              </Button>
            </div>

            {isModalOpen && (
              <Modal open={isModalOpen} onClose={handleCloseModal}>
                <h2 className="text-2xl font-semibold mb-4">Add a Lift</h2>
                <Input dark placeholder="Lift Name" value={liftName} onChange={(e) => setLiftName(e.target.value)} />
                <Input dark placeholder="Weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
                <Input dark placeholder="Reps" type="number" value={reps} onChange={(e) => setReps(e.target.value)} />
                <Button dark onClick={handleAddLift}>Done</Button>
              </Modal>
            )}
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
