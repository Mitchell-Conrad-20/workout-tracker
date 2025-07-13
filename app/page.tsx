'use client';
import React, { useState } from 'react';
import Image from "next/image";
import icon from '../public/icon.png';
import Button from "./Button";
import Input from "./Input";
import Modal from "./Modal";
import Table from "./Table";
import Chart from "./Chart";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
 
  // const sampleData = [
  //   { name: 'Bench Press', weight: 225, reps: 5, date: '2023-10-01' },
  //   { name: 'Squat', weight: 315, reps: 3, date: '2023-10-01' },
  //   { name: 'Deadlift', weight: 405, reps: 2, date: '2023-10-01' },
  // ];

  const sampleData = [
  { name: 'Bench Press', weight: 225, reps: 5, date: '2023-10-01' },
  { name: 'Squat', weight: 315, reps: 3, date: '2023-10-01' },
  { name: 'Deadlift', weight: 405, reps: 1, date: '2023-10-01' },
  { name: 'Bench Press', weight: 230, reps: 5, date: '2023-10-05' },
  { name: 'Squat', weight: 325, reps: 3, date: '2023-10-05' },
  { name: 'Deadlift', weight: 405, reps: 2, date: '2023-10-05' },
];


  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-3xl font-semibold font-[family-name:var(--font-geist-mono)]">
          Workout Tracker
        </h1>

        <div className="font-[family-name:var(--font-geist-mono)]">
          a better way to track your progress
        </div>        

        {/* Button that opens the modal */}
        <Button dark onClick={handleOpenModal}>add a lift</Button>

        <Table data={sampleData} />
        <Chart data={sampleData} />

        {/* Modal */}
        {isModalOpen && (
          <Modal open={isModalOpen} onClose={handleCloseModal}>
            <h2 className="text-2xl font-semibold mb-4">add a lift</h2>
            <Input dark placeholder="lift name" />
            <Input dark placeholder="weight" />
            <Input dark placeholder="reps" />
            <Button dark onClick={handleCloseModal}>done</Button>
          </Modal>
        )}

      </main>

      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://mconrad.tech/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src={icon}
            alt="MC icon"
            width={32}
            height={32}
            className="rounded-md hover:scale-125 transition ease-in-out"
          />
        </a>
      </footer>
    </div>
  );
}