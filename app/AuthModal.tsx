'use client';

import React, { useState } from 'react';
import supabase from '../lib/supabase';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
};

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
  setLoading(true);
  setError(null);
  try {
    let result;

    if (mode === 'login') {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      result = await supabase.auth.signUp({
        email,
        password,
      });
    }

    const { error } = result;

    if (error) throw error;

    onClose(); // Close modal on success
  } catch (err: any) {
    setError(err.message || 'Something went wrong');
  } finally {
    setLoading(false);
  }
};

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-xl font-semibold mb-4 capitalize">
        {mode === 'login' ? 'Log In' : 'Sign Up'}
      </h2>

      <div className="flex flex-col gap-3">
        <Input
          dark
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          dark
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <div className="text-sm text-red-500">{error}</div>}

        <Button dark disabled={loading} onClick={handleSubmit}>
          {loading ? 'Loading...' : mode === 'login' ? 'Log In' : 'Sign Up'}
        </Button>

        <button
          className="text-sm text-blue-500 hover:underline"
          onClick={() =>
            setMode((prev) => (prev === 'login' ? 'signup' : 'login'))
          }
        >
          {mode === 'login'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Log in'}
        </button>
      </div>
    </Modal>
  );
};

export default AuthModal;
