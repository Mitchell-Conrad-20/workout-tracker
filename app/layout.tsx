import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import HamburgerMenu from '@/components/HamburgerMenu';
import BottomNav from '@/components/BottomNav';
import { Providers } from './providers';

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Auralift",
  description: "a better way to track your progress",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <HamburgerMenu />
          {children}
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}