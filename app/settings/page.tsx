'use client';

import { useEffect, useState } from 'react';
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
  const [dob, setDob] = useState(''); // date of birth
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/');
        return;
      }

      setUserEmail(user.email || '');
      //setEmailInput(user.email || '');

      // Fetch profile data
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

  const handleSaveProfile = async () => {
    setLoading(true);
    setMessage('');

    if (dob && new Date(dob) > new Date()) {
      setMessage('Date of birth cannot be in the future.');
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage('User not found.');
      setLoading(false);
      return;
    }

    const usernameValue = username ?? usernameInput.trim().toLowerCase();

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: usernameValue || null,
        date_of_birth: dob || null,
        email: user.email
      });

    if (profileError) {
      setMessage(`Error saving profile: ${profileError.message}`);
      setLoading(false);
      return;
    }

    setUsername(usernameValue || null);
    setUsernameInput('');
    setMessage('Profile updated successfully!');
    setLoading(false);
  };

  const handleEmailChange = async () => {
    if (!emailInput) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email: emailInput });
    if (error) setMessage(`Error changing email: ${error.message}`);
    else {
      setMessage('Email update requested. Check your inbox to confirm.');
      setUserEmail(emailInput);
    }
    setLoading(false);
  };

  const handlePasswordReset = async () => {
    if (!password) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setMessage(`Error updating password: ${error.message}`);
    else setMessage('Password updated successfully!');
    setPassword('');
    setLoading(false);
  };

  if (loading) return <p className="p-4 text-center">Loading...</p>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Account Settings</h1>

      {message && (
        <p className="text-sm text-center text-blue-600 dark:text-blue-400">
          {message}
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
          <Input
            dark
            placeholder="Set a username"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
          />
        )}
      </div>

      {/* Date of Birth */}
      <div className="space-y-2">
        <p className="font-medium">Date of Birth</p>
        <DatePicker value={dob} onChange={setDob} />
      </div>

      <Button dark onClick={handleSaveProfile}>Save Profile</Button>
    </div>
  );
}
