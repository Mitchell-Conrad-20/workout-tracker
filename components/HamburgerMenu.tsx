'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import Button from './Button';
import supabase from '@/lib/supabase';
import { useAuthModal } from '@/hooks/useAuthModal';

export default function HamburgerMenu() {
  const { setOpen, isAuthenticated } = useAuthModal();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
  };

  return (
    <div className="fixed top-4 right-4 z-50" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer bg-foreground text-background p-2 rounded-full transition duration-200 hover:scale-105"
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <div
        className={`absolute top-12 right-0 w-48 rounded-xl shadow-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/[.08] transform transition-all duration-300 ${
          isOpen
            ? 'opacity-100 scale-100 translate-x-0'
            : 'opacity-0 scale-95 pointer-events-none translate-x-4'
        }`}
      >
        <div className="flex flex-col p-4 gap-3 text-sm font-medium">
          {isAuthenticated ? (
            <>
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

              <Link
                href="/routines"
                onClick={() => setIsOpen(false)}
                className="transition-colors duration-200 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Routines
              </Link>

              <Link
                href="/chart"
                onClick={() => setIsOpen(false)}
                className="transition-colors duration-200 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Chart
              </Link>

              <Link
                href="/health"
                onClick={() => setIsOpen(false)}
                className="transition-colors duration-200 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Health
              </Link>

              <div className="mt-2 border-t border-gray-300 dark:border-white/[.1] pt-3">
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="transition-colors duration-200 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Settings
                </Link>
              </div>

              <div className="border-t border-gray-300 dark:border-white/[.1] pt-3">
                  <Button dark onClick={handleLogout}>Log Out</Button>
              </div>

            </>
          ) : (

            <button
              onClick={() => {
                setIsOpen(false);
                setOpen(true);
              }}
              className="cursor-pointer text-blue-500 hover:underline transition duration-200"
            >
              Log In / Sign Up
            </button>

          )}

        </div>
      </div>
    </div>
  );
}
