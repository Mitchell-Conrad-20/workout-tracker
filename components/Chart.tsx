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
  // Helper to get all sets for a lift on a given date
  const getSetsForLiftOnDate = (liftName: string, date: string) => {
    return data
      .filter((l) => l.name === liftName && l.date === date)
      .map((set) => `${set.weight}x${set.reps}`)
      .join(', ');
  };
  const [mounted, setMounted] = useState(false);

  // Run all hooks regardless of mounted state
  const allDates = useMemo(
  () => Array.from(new Set(data.map((lift) => lift.date))).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
    [data]
  );

  const liftNames = useMemo(
    () => Array.from(new Set(data.map((lift) => lift.name))),
    [data]
  );

  type UnifiedData = {
    date: string;
    ts?: number;
    [key: string]: string | number | null | undefined;
  };

  const unifiedData: UnifiedData[] = useMemo(() => {
    return allDates.map((date) => {
      const ts = new Date(date).getTime();
      const entry: UnifiedData = { date, ts };

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
    <div className="w-full max-w-4xl mx-auto space-y-4 pr-5">
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="99%" height="100%">
          <LineChart data={unifiedData}>
            <XAxis
              dataKey="ts"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(val) => new Date(Number(val)).toISOString().split('T')[0]}
            />
            <YAxis />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload) return null;
                // label is numeric timestamp when XAxis uses ts
                const labelDate = typeof label === 'number' ? new Date(Number(label)).toISOString().split('T')[0] : String(label);
                // Find which lift is hovered
                const hoveredLiftNames = payload
                  .filter((p) => p.dataKey && p.value !== null)
                  .map((p) => {
                    const [liftName] = String(p.dataKey).split('_');
                    return liftName;
                  });
                return (
                  <div className="p-3 bg-gray-900 rounded shadow text-white min-w-[180px]">
                    <div className="text-xs text-gray-300 mb-2">{labelDate}</div>
                    {hoveredLiftNames.map((liftName) => {
                      const sets = getSetsForLiftOnDate(liftName, labelDate);
                      return (
                        <div key={liftName} className="mb-1">
                          <span className="font-semibold">{liftName}:</span> {sets || 'No sets'}
                        </div>
                      );
                    })}
                  </div>
                );
              }}
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