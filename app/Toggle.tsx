'use client';

import React from 'react';

type ToggleProps<T extends string> = {
  options: T[];
  selected: T;
  onSelect: (value: T) => void;
};

function Toggle<T extends string>({ options, selected, onSelect }: ToggleProps<T>) {
  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className={`cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ease-in-out ${
            selected === option
              ? 'bg-blue-600 text-white'
              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export default Toggle;
