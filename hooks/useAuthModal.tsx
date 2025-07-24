'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface AuthModalContextType {
  open: boolean;
  setOpen: (value: boolean) => void;
  isAuthenticated: boolean;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Listen for auth changes
  // Import supabase
  // @ts-ignore
  const supabase = require('../lib/supabase').default;

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      setIsAuthenticated(!!data?.user);
    };
    checkUser();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user?: unknown } | null) => {
        setIsAuthenticated(!!session?.user);
      }
    );
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthModalContext.Provider value={{ open, setOpen, isAuthenticated }}>
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) throw new Error('useAuthModal must be used within AuthModalProvider');
  return context;
};
