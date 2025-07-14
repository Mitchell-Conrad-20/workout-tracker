'use client';
import { useEffect, useState } from 'react';
import { useAuthModal } from '@/hooks/useAuthModal';
import AuthModal from '@/app/AuthModal'; 
import Button from '@/app/Button';
import supabase from '@/lib/supabase';

export default function LogbookPage() {

  const { open, setOpen } = useAuthModal();
  const [session, setSession] = useState<any>(null);

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

  return (
    <>
      <AuthModal open={open} onClose={() => setOpen(false)} />

      {!session ? (

        <div className="min-h-screen p-10 flex flex-col items-center justify-center gap-4">
          <h1 className="text-3xl font-bold mb-4">Please log in to view your logbook</h1>
          <p>This is your workout logbook page.</p>
          <Button onClick={() => setOpen(true)} dark>
            Log In / Sign Up
          </Button>
        </div>

      ) : (
        <div className="min-h-screen p-10 flex flex-col items-center justify-center gap-4">
          <h1 className="text-3xl font-bold mb-4">Logbook</h1>
          <p>This is your workout logbook page.</p>
        </div>
      )}

    </>
  );
}
