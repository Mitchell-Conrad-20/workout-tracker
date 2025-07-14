import React from 'react';

interface LiftData {
  id: number;
  user_id?: string;
  name: string;
  weight: number;
  reps: number;
  date: string;
  [key: string]: string | number | undefined;
}

interface TableProps {
  data: LiftData[];
  onEdit?: (lift: LiftData) => void;
  onDelete?: (id: number) => void;
}

const Table: React.FC<TableProps> = ({ data, onEdit, onDelete }) => {
  if (!data || data.length === 0) {
    return <div className="text-neutral-500">No data available.</div>;
  }

  const headers = Object.keys(data[0]).filter(
    (key) => key !== 'id' && key !== 'user_id'
  );
  const columnCount = headers.length + (onEdit || onDelete ? 1 : 0);

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
        {(onEdit || onDelete) && (
          <div className="px-4 py-2 font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-b border-neutral-300 dark:border-neutral-700">
            actions
          </div>
        )}

        {/* Data Rows */}
        {data.map((row, rowIndex) => (
          <React.Fragment key={row.id || rowIndex}>
            {headers.map((key) => (
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
            ))}
            {(onEdit || onDelete) && (
              <div
                className={`flex gap-2 items-center px-4 py-2 border-b border-neutral-200 dark:border-neutral-700 ${
                  rowIndex % 2 === 0
                    ? 'bg-white dark:bg-neutral-900'
                    : 'bg-neutral-50 dark:bg-neutral-800'
                }`}
              >
                {onEdit && (
                  <button
                    onClick={() => onEdit(row)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(row.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Table;
