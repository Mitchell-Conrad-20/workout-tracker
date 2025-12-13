import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  dark?: boolean;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ dark = false, ...props }, ref) => {
    return dark ? (
      <input
        ref={ref}
        {...props}
  className="cursor-pointer rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors duration-200 ease-in-out flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] font-medium text-base sm:text-sm h-10 sm:h-12 px-4 sm:px-5 w-full hover:border-blue-400 dark:hover:border-blue-500"
      />
    ) : (
      <input
        ref={ref}
        {...props}
  className="cursor-pointer rounded-full border border-solid border-transparent transition-colors duration-200 ease-in-out flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-base sm:text-sm h-10 sm:h-12 px-4 sm:px-5 w-full hover:border-blue-400 dark:hover:border-blue-500"
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;
