'use client';

import React, { useState } from 'react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Chart from '@/components/Chart';
import Input from '@/components/Input';
import { format } from 'date-fns';

// Mock bodyweight entry type
interface BodyweightEntry {
  id: number;
  weight: number;
  date: string;
}

export default function Health() {
  // Mock state for bodyweight entries
  const [bodyweights, setBodyweights] = useState<BodyweightEntry[]>([
    { id: 1, weight: 180, date: '2025-08-01' },
    { id: 2, weight: 181, date: '2025-08-05' },
    { id: 3, weight: 179, date: '2025-08-10' },
    { id: 4, weight: 182, date: '2025-08-15' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState(format(new Date(), 'yyyy-MM-dd'));
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editDate, setEditDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Add new bodyweight entry
  const handleAddWeight = () => {
    if (!weightInput) return;
    setBodyweights([
      ...bodyweights,
      {
        id: bodyweights.length > 0 ? Math.max(...bodyweights.map(b => b.id)) + 1 : 1,
        weight: parseFloat(weightInput),
        date: dateInput,
      },
    ]);
    setWeightInput('');
    setDateInput(format(new Date(), 'yyyy-MM-dd'));
    setIsModalOpen(false);
  };

  // Remove a bodyweight entry
  const handleDelete = (id: number) => {
    setBodyweights(bodyweights.filter(entry => entry.id !== id));
  };

  // Open edit modal for a record
  const handleEditOpen = (entry: BodyweightEntry) => {
    setEditId(entry.id);
    setEditWeight(entry.weight.toString());
    setEditDate(entry.date);
    setEditModalOpen(true);
  };

  // Save edit
  const handleEditSave = () => {
    if (!editId || !editWeight) return;
    setBodyweights(bodyweights.map(entry =>
      entry.id === editId ? { ...entry, weight: parseFloat(editWeight), date: editDate } : entry
    ));
    setEditModalOpen(false);
    setEditId(null);
    setEditWeight('');
    setEditDate(format(new Date(), 'yyyy-MM-dd'));
  };

  // Prepare chart data (add name and reps fields for Chart compatibility)
  const chartData = bodyweights
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({
      ...entry,
      name: 'Bodyweight',
      reps: 1,
      value: entry.weight,
    }));

  return (
    <div className="min-h-screen pt-4 pb-20 gap-16 sm:pb-20 font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-3xl mx-auto p-4 flex flex-col gap-[32px]">
        <div className="w-full">
          <div className="flex items-center justify-between w-full mb-2">
            <h1 className="text-3xl font-semibold font-[family-name:var(--font-geist-mono)]">Your Health</h1>
            <Button dark onClick={() => setIsModalOpen(true)}>
              Log Bodyweight
            </Button>
          </div>

          <h2 className="text-xl font-semibold mb-4">Bodyweight Chart</h2>

          {/* Chart */}
          <div className="w-full">
            <Chart
              data={chartData}
              defaultMetric="weight"
            />
          </div>

          {/* Logbook/history */}
          <div className="w-full mt-8">
            <h2 className="text-xl font-semibold mb-4">Bodyweight Log</h2>
            <div className="rounded border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
              {/* Header row */}
              <div className="flex px-4 py-2 bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <div className="w-1/3">Date</div>
                <div className="w-1/3 flex justify-center text-center">Weight (lbs)</div>
                <div className="w-1/3"></div>
              </div>
              {/* Data rows */}
              {chartData.map((entry) => (
                <div key={entry.id} className="flex px-4 py-2 items-center border-b border-gray-100 dark:border-neutral-800 last:border-b-0">
                  <div className="w-1/3 whitespace-nowrap">{entry.date}</div>
                  <div className="w-1/3 whitespace-nowrap flex justify-center text-center">{entry.weight}</div>
                  <div className="w-1/3 flex gap-4 items-center ml-auto justify-end">
                    <span
                      className="text-blue-600 hover:underline cursor-pointer"
                      onClick={() => handleEditOpen(entry)}
                    >
                      Edit
                    </span>
                    <span
                      className="text-red-600 hover:underline cursor-pointer"
                      onClick={() => handleDelete(entry.id)}
                    >
                      Delete
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal for editing bodyweight */}
          {editModalOpen && (
            <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)}>
              <h2 className="text-lg font-semibold mb-4">Edit Bodyweight</h2>
              <div className="flex flex-col gap-4">
                <Input
                  type="number"
                  placeholder="Weight (lbs)"
                  value={editWeight}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditWeight(e.target.value)}
                  className="w-full"
                  min="0"
                />
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditDate(e.target.value)}
                  className="w-full"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button dark onClick={() => setEditModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditSave}>
                    Save
                  </Button>
                </div>
              </div>
            </Modal>
          )}

          {/* Modal for logging bodyweight */}
          {isModalOpen && (
            <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
              <h2 className="text-lg font-semibold mb-4">Log Bodyweight</h2>
              <div className="flex flex-col gap-4">
                <Input
                  type="number"
                  placeholder="Weight (lbs)"
                  value={weightInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWeightInput(e.target.value)}
                  className="w-full"
                  min="0"
                />
                <Input
                  type="date"
                  value={dateInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateInput(e.target.value)}
                  className="w-full"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button dark onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddWeight}>
                    Log
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      </main>
    </div>
  );
}
