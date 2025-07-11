import Image from "next/image";
import icon from '../public/icon.png';
import Button from "./Button";
import Input from "./Input";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-3xl font-semibold font-[family-name:var(--font-geist-mono)]">
          Workout Tracker
        </h1>

        <div className="font-[family-name:var(--font-geist-mono)]">
          a better way to track your progress
        </div>        

        <Button dark>Test</Button>
        <Input dark placeholder="Enter your workout here..." />


        {/* Use for Login/Logout Buttons */}
        {/* <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div> */}


      </main>


      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">

          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://mconrad.tech/"
            target="_blank"
            rel="noopener noreferrer">

            <Image
              aria-hidden
              src={icon}
              alt="MC icon"
              width={32}
              height={32}
              className="rounded-md hover:scale-125 transition ease-in-out"/>
        </a>

      </footer>


    </div>
  );
}
