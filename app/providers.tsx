'use client';

import { AuthModalProvider } from '@/hooks/useAuthModal';
import { UserProvider } from '@/context/UserContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <AuthModalProvider>
        {children}
      </AuthModalProvider>
    </UserProvider>
  );
}
