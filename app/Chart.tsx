'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type ChartProps = {
  data: {
    name: string;
    weight: number;
    reps: number;
    date: string;
  }[];
  defaultMetric: 'weight' | 'reps' | 'volume';
};

const Chart: React.FC<ChartProps> = ({ data, defaultMetric }) => {
  const [mounted, setMounted] = useState(false);

  // Run all hooks regardless of mounted state
  const allDates = useMemo(
    () => Array.from(new Set(data.map((lift) => lift.date))).sort(),
    [data]
  );

  const liftNames = useMemo(
    () => Array.from(new Set(data.map((lift) => lift.name))),
    [data]
  );

  type UnifiedData = {
    date: string;
    [key: string]: string | number | null;
  };

  const unifiedData: UnifiedData[] = useMemo(() => {
    return allDates.map((date) => {
      const entry: UnifiedData = { date };

      liftNames.forEach((name) => {
        const liftsForNameAndDate = data.filter(
          (l) => l.name === name && l.date === date
        );

        if (liftsForNameAndDate.length > 0) {
          const maxWeightSet = liftsForNameAndDate.reduce((prev, curr) =>
            curr.weight > prev.weight ? curr : prev
          );

          const maxWeight = maxWeightSet.weight;
          const repsAtMaxWeight = maxWeightSet.reps;
          const totalVolume = liftsForNameAndDate.reduce(
            (sum, l) => sum + l.weight * l.reps,
            0
          );

          entry[`${name}_weight`] = maxWeight;
          entry[`${name}_reps`] = repsAtMaxWeight;
          entry[`${name}_volume`] = totalVolume;
        } else {
          entry[`${name}_weight`] = null;
          entry[`${name}_reps`] = null;
          entry[`${name}_volume`] = null;
        }
      });

      return entry;
    });
  }, [data, allDates, liftNames]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
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
                dataKey={`${name}_${defaultMetric}`}
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