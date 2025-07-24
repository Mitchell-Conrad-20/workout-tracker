import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  dark?: boolean;
};

const Button: React.FC<ButtonProps> = ({ children, dark = false, ...props }) => (
  dark ? (
    <button
      {...props}
      className='cursor-pointer rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors duration-300 ease-in-out flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto hover:border-blue-400 dark:hover:border-blue-500'
    >
      {children}
    </button>
  ) : (
    <button
      {...props}
      className='cursor-pointer rounded-full border border-solid border-transparent transition-colors duration-300 ease-in-out flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto hover:border-blue-400 dark:hover:border-blue-500'
    >
      {children}
    </button>
  )
);

export default Button;