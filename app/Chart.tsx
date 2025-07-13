'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import Toggle from './Toggle';

type Lift = {
  name: string;
  weight: number;
  reps: number;
  date: string;
};

type ChartProps = {
  data: Lift[];
};

const Chart: React.FC<ChartProps> = ({ data }) => {
  const [mounted, setMounted] = useState(false);
  const [metric, setMetric] = useState<'weight' | 'reps' | 'volume'>('weight');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const grouped = data.reduce<Record<string, Lift[]>>((acc, lift) => {
    if (!acc[lift.name]) acc[lift.name] = [];
    acc[lift.name].push(lift);
    return acc;
  }, {});

  const liftNames = Object.keys(grouped);
  const getProcessedData = (lifts: Lift[]) =>
    lifts.map((lift) => ({ ...lift, volume: lift.weight * lift.reps }));

  return (
    <div className="w-full space-y-4">
      <Toggle
        options={['weight', 'reps', 'volume']}
        selected={metric}
        onSelect={(val) => setMetric(val as typeof metric)}
      />
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart>
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
                data={getProcessedData(grouped[name])}
                dataKey={metric}
                name={name}
                stroke={`hsl(${(idx * 137.5) % 360}, 70%, 50%)`}
                dot={{ r: 4 }}
                activeDot={{ r: 6, stroke: '#000', strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Chart;
