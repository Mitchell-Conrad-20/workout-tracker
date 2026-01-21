'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import supabase from '@/lib/supabase';
import AuthModal from '@/components/AuthModal';
import { useAuthModal } from '@/hooks/useAuthModal';
import DatePicker from '@/components/DatePicker';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type HealthRow = {
  id: number;
  user_id: string;
  date: string;            // YYYY-MM-DD
  bodyweight_kg: number | null;
  notes: string | null;
  created_at: string;
};

const KG_PER_LB = 0.45359237;

export default function HealthPage() {
  const { open, setOpen, isAuthenticated } = useAuthModal();

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  });
  const [unit] = useState<'lb' | 'kg'>('lb');
  const [weightInput, setWeightInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [history, setHistory] = useState<HealthRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>('');
  const [err, setErr] = useState<string>('');

  const weightAsKg = useMemo(() => {
    const n = Number(weightInput);
    if (!Number.isFinite(n) || n <= 0) return null;
    return unit === 'lb' ? n * KG_PER_LB : n;
  }, [weightInput, unit]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr('');
      setMsg('');

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        setHistory([]);
        setLoading(false);
        return;
      }

      const { data: recent, error: recentErr } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(30);

      if (recentErr) {
        setErr(recentErr.message);
        setHistory([]);
        setLoading(false);
        return;
      }

      setHistory(recent ?? []);

      const found = (recent ?? []).find(r => (r.date || '').slice(0, 10) === selectedDate);
      if (found) {
        const kg = found.bodyweight_kg;
        if (kg != null) {
          const uiVal = unit === 'lb' ? kg / KG_PER_LB : kg;
          setWeightInput(String(Math.round(uiVal * 100) / 100));
        } else {
          setWeightInput('');
        }
        setNotes(found.notes ?? '');
      } else {
        setWeightInput('');
        setNotes('');
      }

      setLoading(false);
    })();
  }, [selectedDate, unit]);

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    setErr('');

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      setErr('You must be signed in to save.');
      setSaving(false);
      return;
    }

    const payload = {
      user_id: user.id,
      date: selectedDate,
      bodyweight_kg: weightAsKg,
      notes: notes?.trim() || null,
    };

    const { error } = await supabase
      .from('health_metrics')
      .upsert(payload, { onConflict: 'user_id,date' });

    if (error) setErr(error.message);
    else {
      setMsg('Saved');
      const { data: refreshed } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30);
      setHistory(refreshed ?? []);
    }

    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    setMsg('');
    setErr('');
    const { error } = await supabase.from('health_metrics').delete().eq('id', id);
    if (error) setErr(error.message);
    else setHistory(prev => prev.filter(r => r.id !== id));
  };

  const displayWeight = (kg: number | null) => {
    if (kg == null) return '—';
    const val = unit === 'lb' ? kg / KG_PER_LB : kg;
    return `${Math.round(val * 10) / 10} ${unit}`;
  };

  // Format data for Recharts line chart
  const chartData = useMemo(() => {
    return [...history]
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .map(r => ({
        date: r.date.slice(0, 10),
        weight: r.bodyweight_kg != null
          ? unit === 'lb'
            ? Math.round((r.bodyweight_kg / KG_PER_LB) * 10) / 10
            : Math.round(r.bodyweight_kg * 10) / 10
          : null,
      }));
  }, [history, unit]);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <AuthModal open={open} onClose={() => setOpen(false)} />
      {isAuthenticated ? (
        <>
          <h1 className="text-2xl font-bold mb-4">Health</h1>

          {msg && <p className="mb-2 text-sm text-blue-600 dark:text-blue-400">{msg}</p>}
          {err && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{err}</p>}

          {/* Health Overview Section */}
          <div className="w-full rounded-xl bg-white dark:bg-neutral-900 mb-6 p-6 flex flex-col gap-4 shadow-sm border border-gray-100 dark:border-neutral-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
              <h2 className="text-lg font-semibold mb-3">Health Overview</h2>
              <Button dark onClick={() => setSaving(true)} className="w-full sm:w-auto text-base font-semibold py-2 px-6 rounded-full">
                Log Bodyweight
              </Button>
            </div>
            {/* Reminder */}
            {(() => {
              const today = format(new Date(), 'yyyy-MM-dd');
              const todayEntry = history.find(bw => (bw.date || '').slice(0, 10) === today);
              if (todayEntry && todayEntry.bodyweight_kg != null) {
                const weight = unit === 'lb' ? (todayEntry.bodyweight_kg / KG_PER_LB).toFixed(1) : todayEntry.bodyweight_kg.toFixed(1);
                return (
                  <div className="rounded bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium px-4 py-2 mb-1">
                    You logged your weight at {weight} {unit} today.
                  </div>
                );
              } else {
                return (
                  <div className="rounded bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-medium px-4 py-2 mb-1">
                    You haven&apos;t logged your weight today.
                  </div>
                );
              }
            })()}

            {/* Current Weight */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-base text-gray-500 dark:text-gray-400">Current Weight</span>
              <span className="text-2xl font-semibold tracking-tight">
                {history.length > 0 && history[0].bodyweight_kg != null ? (unit === 'lb' ? (history[0].bodyweight_kg / KG_PER_LB).toFixed(1) + ' lb' : history[0].bodyweight_kg.toFixed(1) + ' kg') : 'N/A'}
              </span>
            </div>

            {/* Weight Change Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
              {(() => {
                if (history.length === 0) return null;
                const today = format(new Date(), 'yyyy-MM-dd');
                const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
                const current = sorted[sorted.length - 1];
                // Find YTD (since Jan 1 this year)
                const jan1 = today.slice(0, 4) + '-01-01';
                const ytd = sorted.find(bw => bw.date >= jan1) || sorted[0];
                // 1 year ago
                const yearAgo = format(new Date(new Date(today).setFullYear(new Date(today).getFullYear() - 1)), 'yyyy-MM-dd');
                const oneYear = [...sorted].reverse().find(bw => bw.date <= yearAgo) || sorted[0];
                // 6 months ago
                const sixMoAgo = format(new Date(new Date(today).setMonth(new Date(today).getMonth() - 6)), 'yyyy-MM-dd');
                const sixMo = [...sorted].reverse().find(bw => bw.date <= sixMoAgo) || sorted[0];
                const getWeight = (bw: HealthRow) => bw.bodyweight_kg != null ? (unit === 'lb' ? bw.bodyweight_kg / KG_PER_LB : bw.bodyweight_kg) : null;
                const currentW = getWeight(current);
                const ytdW = getWeight(ytd);
                const oneYearW = getWeight(oneYear);
                const sixMoW = getWeight(sixMo);
                return (
                  <>
                    <div className="rounded bg-gray-50 dark:bg-neutral-800/60 p-3 flex flex-col items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">YTD Change</span>
                      <span className="text-lg font-semibold">
                        {currentW != null && ytdW != null ? (currentW - ytdW > 0 ? '+' : (currentW - ytdW < 0 ? '-' : '')) + Math.abs(currentW - ytdW).toFixed(1) + ' ' + unit : 'N/A'}
                      </span>
                    </div>
                    <div className="rounded bg-gray-50 dark:bg-neutral-800/60 p-3 flex flex-col items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">1 Year Change</span>
                      <span className="text-lg font-semibold">
                        {currentW != null && oneYearW != null ? (currentW - oneYearW > 0 ? '+' : (currentW - oneYearW < 0 ? '-' : '')) + Math.abs(currentW - oneYearW).toFixed(1) + ' ' + unit : 'N/A'}
                      </span>
                    </div>
                    <div className="rounded bg-gray-50 dark:bg-neutral-800/60 p-3 flex flex-col items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">6 Month Change</span>
                      <span className="text-lg font-semibold">
                        {currentW != null && sixMoW != null ? (currentW - sixMoW > 0 ? '+' : (currentW - sixMoW < 0 ? '-' : '')) + Math.abs(currentW - sixMoW).toFixed(1) + ' ' + unit : 'N/A'}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Modal for logging bodyweight */}
          {saving && (
            <Modal open={saving} onClose={() => setSaving(false)}>
              <h2 className="text-lg font-semibold mb-4">Log Bodyweight</h2>
              <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <Input dark type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" placeholder="Weight" value={weightInput} onChange={e => setWeightInput(e.target.value)} />
                <DatePicker value={selectedDate} onChange={setSelectedDate} />
                <Input
                  dark
                  type="text"
                  placeholder="Note (optional)"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  maxLength={100}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button dark type="button" onClick={() => setSaving(false)}>Cancel</Button>
                  <Button type="submit">Log</Button>
                </div>
              </form>
            </Modal>
          )}

          {/* Chart */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 mb-6 shadow-sm border border-gray-100 dark:border-neutral-800">
            <h2 className="text-lg font-semibold mb-3">Weight Chart</h2>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="99%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(30,41,59,0.95)',
                      border: 'none',
                      borderRadius: 12,
                      color: '#fff',
                      boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                      padding: '12px 16px',
                      fontSize: 15,
                    }}
                    labelStyle={{ color: '#cbd5e1', fontWeight: 500, fontSize: 13, marginBottom: 4 }}
                    itemStyle={{ color: '#fff', fontWeight: 600, fontSize: 15 }}
                    formatter={(value, name) => [`${value}`, name === 'weight' ? 'Bodyweight' : name]}
                    labelFormatter={label => `Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    name="Bodyweight"
                    stroke="hsl(200, 70%, 50%)"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6, stroke: '#000', strokeWidth: 2 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent entries */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-neutral-800">
            <h2 className="text-lg font-semibold mb-3">Recent Entries</h2>
            {loading ? (
              <p className="text-sm text-neutral-500">Loading…</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-neutral-500">No entries yet.</p>
            ) : (
              <ul className="divide-y divide-black/[.06] dark:divide-white/[.1]">
                {history.map((row) => (
                  <li key={row.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">{(row.date || '').slice(0, 10)}</div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">
                        {displayWeight(row.bodyweight_kg)}
                        {row.notes ? ` · ${row.notes}` : ''}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setWeightInput(row.bodyweight_kg ? (unit === 'lb' ? (row.bodyweight_kg / KG_PER_LB).toFixed(2) : row.bodyweight_kg.toString()) : '');
                          setNotes(row.notes || '');
                          setSelectedDate((row.date || '').slice(0, 10));
                          setSaving(true);
                        }}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
          <h2 className="text-xl font-semibold mb-2">No data available</h2>
          <p>Please log in to view and log your health metrics.</p>
        </div>
      )}
    </div>
  );
}
