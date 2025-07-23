'use client';

import React, { useState, useEffect, useRef } from 'react';
import Input from './Input';
import Button from './Button';
import DatePicker from './DatePicker';
import { Lift } from './types/lift';

type LiftFormProps = {
  initialData?: Lift | null;
  onSubmit: (lift: Partial<Lift>) => void;
  onCancel: () => void;
};

const LiftForm: React.FC<LiftFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [date, setDate] = useState('');

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setWeight(initialData.weight.toString());
      setReps(initialData.reps.toString());
      setDate(initialData.date);
    } else {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
    }
  }, [initialData]);

  /** --- Sanitization Helpers --- */
  const capitalizeWords = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9 ]/gi, '') // remove special chars
      .replace(/\s+/g, ' ') // collapse multiple spaces
      .trim() // remove leading/trailing spaces
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const sanitizeNumber = (rawValue: string) => {
    return rawValue.replace(/[^0-9]/g, '');
  };

  /** --- Handlers --- */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setName(rawValue);

    // Debounce capitalization
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setName(prev => capitalizeWords(prev));
    }, 500);
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWeight(sanitizeNumber(e.target.value));
  };

  const handleRepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReps(sanitizeNumber(e.target.value));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name || !weight || !reps || !date) return;

    const payload: Partial<Lift> = {
      id: initialData?.id,
      name: capitalizeWords(name), // Final clean-up before submit
      weight: Number(weight),
      reps: Number(reps),
      date,
    };

    onSubmit(payload);
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <Input
        dark
        placeholder="Lift Name"
        value={name}
        onChange={handleNameChange}
      />
      <Input
        dark
        placeholder="Weight"
        type="text"
        value={weight}
        onChange={handleWeightChange}
      />
      <Input
        dark
        placeholder="Reps"
        type="text"
        value={reps}
        onChange={handleRepsChange}
      />
      <DatePicker value={date} onChange={(newDate) => setDate(newDate)} />

      <div className="flex justify-end gap-2 mt-2">
        <Button type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button dark type="submit">
          Save
        </Button>
      </div>
    </form>
  );
};

export default LiftForm;