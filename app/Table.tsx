import React from 'react';

type TableProps = {
  data: Record<string, any>[];
};

const Table: React.FC<TableProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-neutral-500">No data available.</div>;
  }

  const headers = Object.keys(data[0]);
  const columnCount = headers.length;

  return (
    <div className="w-full overflow-x-auto">
      <div
        className="grid text-sm"
        style={{
          gridTemplateColumns: `repeat(${columnCount}, minmax(100px, 1fr))`,
        }}
      >
        {/* Header Row */}
        {headers.map((header) => (
          <div
            key={header}
            className="px-4 py-2 font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-b border-neutral-300 dark:border-neutral-700"
          >
            {header}
          </div>
        ))}

        {/* Data Rows */}
        {data.map((row, rowIndex) =>
          headers.map((key) => (
            <div
              key={`${rowIndex}-${key}`}
              className={`px-4 py-2 border-b border-neutral-200 dark:border-neutral-700 ${
                rowIndex % 2 === 0
                  ? 'bg-white dark:bg-neutral-900'
                  : 'bg-neutral-50 dark:bg-neutral-800'
              }`}
            >
              {String(row[key])}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Table;
