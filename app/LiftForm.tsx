'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Input from './Input';
import Button from './Button';
import DatePicker from './DatePicker';
import { Lift } from './types/lift';
import supabase from '@/lib/supabase';

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

  const [pastLifts, setPastLifts] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Hide suggestions when clicking outside the input box
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  /** --- Fetch past lifts --- */
  useEffect(() => {
    const fetchPastLifts = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) return;

      const { data, error } = await supabase
        .from('lifts')
        .select('name')
        .eq('user_id', user.id);

      if (!error && data) {
        const uniqueNames = Array.from(new Set(data.map((l) => l.name)));
        setPastLifts(uniqueNames);
      }
    };

    fetchPastLifts();
  }, []);

  /** --- Prefill form if editing --- */
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
      .replace(/[^a-z0-9 ]/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const sanitizeNumber = (rawValue: string) => {
    return rawValue.replace(/[^0-9]/g, '');
  };

  /** --- Autocomplete suggestions --- */
  const filteredSuggestions = useMemo(() => {
    if (!name) return [];
    return pastLifts
      .filter((liftName) =>
        liftName.toLowerCase().startsWith(name.toLowerCase())
      )
      .slice(0, 5); // show top 5
  }, [name, pastLifts]);

  /** --- Handlers --- */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setName(rawValue);
    setShowSuggestions(true);
    setHighlightedIndex(-1);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setName((prev) => capitalizeWords(prev));
    }, 500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setName(capitalizeWords(suggestion));
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
      );
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(filteredSuggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
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
      name: capitalizeWords(name),
      weight: Number(weight),
      reps: Number(reps),
      date,
    };

    onSubmit(payload);
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <div className="relative">
        <Input
          dark
          placeholder="Lift Name"
          value={name}
          onChange={handleNameChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          ref={inputRef}
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <ul className="absolute z-10 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-md mt-1 w-full max-h-40 overflow-y-auto shadow-lg">
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                className={`px-3 py-2 cursor-pointer ${
                  index === highlightedIndex
                    ? 'bg-gray-200 dark:bg-neutral-700'
                    : 'hover:bg-gray-100 dark:hover:bg-neutral-700'
                }`}
                onMouseDown={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>

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
        <Button dark type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save
        </Button>
      </div>
    </form>
  );
};

export default LiftForm;
