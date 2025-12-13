"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

const IconHome = ({ active }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
  <path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V11.5z" stroke={active ? '#2563eb' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconLogbook = ({ active }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
  <path d="M3 5h14v14H3z" stroke={active ? '#2563eb' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M7 9h6" stroke={active ? '#2563eb' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M7 13h6" stroke={active ? '#2563eb' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconChart = ({ active }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
  <path d="M3 3v18h18" stroke={active ? '#2563eb' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M7 13v5" stroke={active ? '#2563eb' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M12 9v9" stroke={active ? '#2563eb' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M17 5v13" stroke={active ? '#2563eb' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconHealth = ({ active }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
  {/* Heart outline */}
  <path d="M12 21s-7.5-4.8-9.6-8.1C-0.6 7.9 4.1 3 7.6 5.1 9.2 6.2 12 8.2 12 8.2s2.8-2 4.4-3.1C19.9 3 24.6 7.9 21.6 12.9 19.5 16.2 12 21 12 21z" stroke={active ? '#2563eb' : 'currentColor'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const items = [
    { href: '/', label: 'Home', Icon: IconHome },
    { href: '/logbook', label: 'Logbook', Icon: IconLogbook },
    { href: '/chart', label: 'Chart', Icon: IconChart },
    { href: '/health', label: 'Health', Icon: IconHealth },
  ];

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-3xl mx-auto px-4 pointer-events-auto">
        <nav className="w-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur rounded-xl shadow-lg border border-gray-100 dark:border-neutral-800 px-3 py-2 flex justify-between items-center">
          {items.map((it) => {
        const active = pathname === it.href;
          return (
            <Link key={it.href} href={it.href} className={`flex-1 text-center py-2 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`} aria-label={it.label}>
              <div className="flex flex-col items-center justify-center gap-1">
                <it.Icon active={active} />
                <span className={`text-xs ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`}>{it.label}</span>
              </div>
            </Link>
        );
          })}
        </nav>
      </div>
    </div>
  );
};

export default BottomNav;
