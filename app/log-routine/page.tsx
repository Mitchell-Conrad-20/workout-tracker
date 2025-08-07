"use client";

import RoutineLiftForm from '@/components/RoutineLiftForm';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import DatePicker from '@/components/DatePicker';
import { useState } from 'react';
import { format as formatDateFns } from 'date-fns';

export default function LogRoutinePage() {
  const router = useRouter();
  const today = formatDateFns(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState<string>(today);
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Your Logbook</h1>
        <button
          className="text-gray-400 hover:text-gray-700 text-2xl p-1 flex items-center"
          onClick={() => router.back()}
          aria-label="Back"
        >
          <ArrowLeft size={28} />
        </button>
      </div>
      <div className="mb-6 flex justify-center">
        <DatePicker
          value={selectedDate}
          onChange={date => setSelectedDate(date) }
        />
      </div>
      <RoutineLiftForm onSubmitSuccess={() => router.push('/logbook')} selectedDate={selectedDate} />
    </div>
  );
}
