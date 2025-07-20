'use client';

import React, { useState, useEffect } from 'react';
import Input from './Input';
import Button from './Button';
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

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setWeight(initialData.weight.toString());
      setReps(initialData.reps.toString());
      setDate(initialData.date);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
    }
  }, [initialData]);

  const handleSubmit = () => {
    if (!name || !weight || !reps || !date) return;

    const payload: Partial<Lift> = {
      id: initialData?.id,
      name,
      weight: Number(weight),
      reps: Number(reps),
      date,
    };

    onSubmit(payload);
  };

  return (
    <div className="flex flex-col gap-3">
      <Input
        dark
        placeholder="Lift Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        dark
        placeholder="Weight"
        type="number"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
      />
      <Input
        dark
        placeholder="Reps"
        type="number"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
      />
      <Input
        dark
        placeholder="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <div className="flex justify-end gap-2 mt-2">
        <Button onClick={onCancel}>Cancel</Button>
        <Button dark onClick={handleSubmit}>
          Save
        </Button>
      </div>
    </div>
  );
};

export default LiftForm;
