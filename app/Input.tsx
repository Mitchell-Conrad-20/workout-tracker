import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  dark?: boolean;
};

const Input: React.FC<InputProps> = ({ children, dark = false, ...props }) => (
  dark ? (
    <input type='text'
      {...props}
      className='cursor-pointer rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors duration-200 ease-in-out flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto'
    >
      
    </input>
  ) : (
    <input type='text'
      {...props}
      className='cursor-pointer rounded-full border border-solid border-transparent transition-colors duration-200 ease-in-out flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto'
    >
      {children}
    </input>
  )
);

export default Input;