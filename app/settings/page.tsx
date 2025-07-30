'use client';

import React, { useEffect, useState } from 'react';
import AuthModal from '@/components/AuthModal';
import { useAuthModal } from '@/hooks/useAuthModal';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';
import Button from '@/components/Button';
import Input from '@/components/Input';
import DatePicker from '@/components/DatePicker';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [userEmail, setUserEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [username, setUsername] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { open, setOpen, isAuthenticated } = useAuthModal();

  // --- Debounce Helpers ---
  // Generic debounce function
  function debounce<T extends unknown[]>(fn: (...args: T) => void, delay: number) {
    let timer: NodeJS.Timeout;
    return (...args: T) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  // Debounced username availability checker
  const checkUsernameAvailability = React.useCallback(
    debounce(async (val: string) => {
      if (!val.trim()) {
        setUsernameAvailable(null);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', val.trim().toLowerCase())
        .neq('id', user.id)
        .maybeSingle();

      if (error) {
        setUsernameAvailable(null);
      } else {
        setUsernameAvailable(!data); // available if no matching user found
      }
    }, 500),
    []
  );

  // Debounced password match checker
  const checkPasswordsMatch = React.useCallback(
    debounce((p: string, c: string) => {
      if (!p && !c) {
        setPasswordsMatch(null);
        return;
      }
      setPasswordsMatch(p === c);
    }, 500),
    []
  );
  // --- End Debounce Helpers ---

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/');
        return;
      }

      setUserEmail(user.email || '');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, date_of_birth')
        .eq('id', user.id)
        .single();

      if (!profileError && profile) {
        setUsername(profile.username);
        setDob(profile.date_of_birth || '');
      }

      setLoading(false);
    };

    fetchUserProfile();
  }, [router]);

  // Live username check
  useEffect(() => {
    if (usernameInput) {
      checkUsernameAvailability(usernameInput);
    } else {
      setUsernameAvailable(null);
    }
  }, [usernameInput, checkUsernameAvailability]);

  // Live password match check
  useEffect(() => {
    checkPasswordsMatch(password, confirmPassword);
  }, [password, confirmPassword, checkPasswordsMatch]);

  const handleSaveProfile = async () => {
    setLoading(true);
    setMessage('');
    setErrorMessage('');

    if (dob && new Date(dob) > new Date()) {
      setErrorMessage('Date of birth cannot be in the future.');
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setErrorMessage('User not found.');
      setLoading(false);
      return;
    }

    const usernameValue = username ?? usernameInput.trim().toLowerCase();

    // Final check for duplicate username
    if (usernameValue) {
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', usernameValue)
        .neq('id', user.id)
        .single();

      if (existingUser && !checkError) {
        setErrorMessage('This username is already taken. Please choose another.');
        setLoading(false);
        return;
      }
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: usernameValue || null,
        date_of_birth: dob || null,
        email: user.email
      });

    if (profileError) {
      setErrorMessage(`Error saving profile: ${profileError.message}`);
      setLoading(false);
      return;
    }

    setUsername(usernameValue || null);
    setUsernameInput('');
    setMessage('Profile updated successfully!');
    setLoading(false);
  };

  const handleEmailChange = async () => {
    setMessage('');
    setErrorMessage('');

    if (!emailInput) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email: emailInput });
    if (error) setErrorMessage(`Error changing email: ${error.message}`);
    else {
      setMessage('Email update requested. Check your inbox to confirm.');
      setUserEmail(emailInput);
    }
    setLoading(false);
  };

  const handlePasswordReset = async () => {
    setMessage('');
    setErrorMessage('');

    if (!password) return;
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      setPassword('');
      setConfirmPassword('');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setErrorMessage(`Error updating password: ${error.message}`);
    } else {
      setMessage('Password updated successfully!');
    }
    setPassword('');
    setConfirmPassword('');
    setLoading(false);
  };

  if (loading) return <p className="p-4 text-center">Loading...</p>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <AuthModal open={open} onClose={() => setOpen(false)} />
      <h1 className="text-2xl font-bold">Account Settings</h1>

      {isAuthenticated ? (
        <>
          {message && (
            <p className="text-sm text-center text-blue-600 dark:text-blue-400">
              {message}
            </p>
          )}

          {errorMessage && (
            <p className="text-sm text-center text-red-600 dark:text-red-400">
              {errorMessage}
            </p>
          )}

          {/* Display or Change Email */}
          <div className="space-y-2">
            <p className="font-medium">Email</p>
            <p className="text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
              {userEmail}
            </p>
            <Input
              dark
              type="email"
              placeholder="Enter new email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <Button dark onClick={handleEmailChange}>Change Email</Button>
          </div>

          {/* Password Reset */}
          <div className="space-y-2">
            <p className="font-medium">New Password</p>
            <Input
              dark
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              dark
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {passwordsMatch === false && (
              <p className="text-sm text-red-600 dark:text-red-400">Passwords do not match</p>
            )}
            {passwordsMatch === true && password && confirmPassword && (
              <p className="text-sm text-green-600 dark:text-green-400">Passwords match</p>
            )}
            <Button dark onClick={handlePasswordReset}>Reset Password</Button>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <p className="font-medium">Username</p>
            {username ? (
              <p className="text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
                {username}
              </p>
            ) : (
              <>
                <Input
                  dark
                  placeholder="Set a username"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                />
                {usernameAvailable === false && (
                  <p className="text-sm text-red-600 dark:text-red-400">Username is taken</p>
                )}
                {usernameAvailable === true && usernameInput && (
                  <p className="text-sm text-green-600 dark:text-green-400">Username is available</p>
                )}
              </>
            )}
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <p className="font-medium">Date of Birth</p>
            <DatePicker value={dob} onChange={setDob} />
          </div>

          <Button dark onClick={handleSaveProfile}>Save Profile</Button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
          <h2 className="text-xl font-semibold mb-2">No data available</h2>
          <p>Please log in to view your settings.</p>
        </div>
      )}
    </div>
  );
}
