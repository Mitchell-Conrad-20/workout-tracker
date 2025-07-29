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

  return (
    <div className="w-full">
      {/* Grid table on medium and larger screens */}
      <div className="hidden md:grid text-sm w-full overflow-x-auto" style={{
        gridTemplateColumns: `repeat(${headers.length + (onEdit || onDelete ? 1 : 0)}, minmax(100px, 1fr))`,
      }}>
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

        {data.map((row, rowIndex) => (
          <React.Fragment key={row.id}>
            {headers.map((key) => (
              <div
                key={`${row.id}-${key}`}
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

      {/* Mobile card view */}
      <div className="md:hidden flex flex-col gap-4">
        {data.map((row) => (
          <div
            key={row.id}
            className="rounded-lg border border-neutral-300 dark:border-neutral-700 p-4 bg-white dark:bg-neutral-900 shadow-sm"
          >
            <div className="flex flex-col gap-1 text-sm text-neutral-700 dark:text-neutral-200">
              {headers.map((key) => (
                <div key={key}>
                  <span className="font-medium capitalize">{key}: </span>
                  <span>{String(row[key])}</span>
                </div>
              ))}
            </div>
            {(onEdit || onDelete) && (
              <div className="flex gap-4 mt-4">
                {onEdit && (
                  <button
                    onClick={() => onEdit(row)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(row.id)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Table;
