import React from 'react';


interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    small?: boolean; // Optional prop to control size
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, small=false }) => {
  return (
    <div className="relative w-full">
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={small ? 'customDatePicker w-full py-2 pl-4 border rounded-full dark:border-neutral-700 bg-white dark:bg-neutral-900 text-black dark:text-white h-10' 
            : "customDatePicker w-full py-2 pl-4 border rounded-full dark:border-neutral-700 bg-white dark:bg-neutral-900 text-black dark:text-white h-10 sm:h-12"}
      />
      {/* Custom icon */}
      <svg
        className="mr-2 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-black dark:text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  );
};

export default DatePicker;
