'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import Toggle from './Toggle';

// type Lift = {
//   name: string;
//   weight: number;
//   reps: number;
//   date: string;
// };

type ChartProps = {
  data: {
    name: string;
    weight: number;
    reps: number;
    date: string;
  }[];
};

const Chart: React.FC<ChartProps> = ({ data }) => {
  const [mounted, setMounted] = useState(false);
  const [metric, setMetric] = useState<'weight' | 'reps' | 'volume'>('weight');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;


  // 1. Get all unique dates, sorted
  const allDates = Array.from(new Set(data.map(lift => lift.date))).sort();
  // 2. Get all unique lift names
  const liftNames = Array.from(new Set(data.map(lift => lift.name)));

  // 3. Build a unified data array: each entry is a date, with each lift's metric as a key
  const unifiedData = allDates.map(date => {
    const entry: Record<string, any> = { date };
    liftNames.forEach(name => {
      const lift = data.find(l => l.name === name && l.date === date);
      if (lift) {
        entry[`${name}_weight`] = lift.weight;
        entry[`${name}_reps`] = lift.reps;
        entry[`${name}_volume`] = lift.weight * lift.reps;
      } else {
        entry[`${name}_weight`] = null;
        entry[`${name}_reps`] = null;
        entry[`${name}_volume`] = null;
      }
    });
    return entry;
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <Toggle
        options={['weight', 'reps', 'volume']}
        selected={metric}
        onSelect={(val) => setMetric(val as typeof metric)}
      />
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="99%" height="100%">
          <LineChart data={unifiedData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                borderRadius: '8px',
                border: 'none',
                color: '#fff',
              }}
              labelStyle={{ color: '#ccc' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend />
            {liftNames.map((name, idx) => (
              <Line
                key={name}
                type="monotone"
                dataKey={`${name}_${metric}`}
                name={name}
                stroke={`hsl(${(idx * 137.5) % 360}, 70%, 50%)`}
                dot={{ r: 4 }}
                activeDot={{ r: 6, stroke: '#000', strokeWidth: 2 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Chart;
