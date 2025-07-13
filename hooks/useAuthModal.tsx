'use client';

import { createContext, useContext, useState } from 'react';

const AuthModalContext = createContext({
  open: false,
  setOpen: (val: boolean) => {},
});

export const AuthModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <AuthModalContext.Provider value={{ open, setOpen }}>
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => useContext(AuthModalContext);
