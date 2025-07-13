'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import Button from './Button';
import supabase from '@/lib/supabase';
import { useAuthModal } from '@/hooks/useAuthModal';

export default function HamburgerMenu() {  
  const { setOpen } = useAuthModal();
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsOpen(false);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Hamburger Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-foreground text-background p-2 rounded-full transition duration-200 hover:scale-105"
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Menu Panel */}
      <div
        className={`absolute top-12 right-0 w-48 rounded-xl shadow-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/[.08] transform transition-all duration-300 ${
          isOpen ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-95 pointer-events-none translate-x-4'
        }`}
      >
        <div className="flex flex-col p-4 gap-3 text-sm font-medium">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="transition-colors duration-200 hover:text-blue-600 dark:hover:text-blue-400"
          >
            Home
          </Link>

          <Link
            href="/logbook"
            onClick={() => setIsOpen(false)}
            className="transition-colors duration-200 hover:text-blue-600 dark:hover:text-blue-400"
          >
            Logbook
          </Link>

          <div className="mt-2 border-t border-gray-300 dark:border-white/[.1] pt-3">
            {session ? (
              <Button dark onClick={handleLogout}>
                Log Out
              </Button>
            ) : (
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="text-blue-500 hover:underline transition duration-200"
              >
                Log In / Sign Up
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
