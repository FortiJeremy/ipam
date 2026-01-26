export function DataTable({ columns, data, loading, onRowClick }) {
  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 transition-colors duration-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700">
              {columns.map((column) => (
                <th
                  key={column.header}
                  className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-gray-400 dark:text-gray-500 italic">
                  No records found
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors' : ''}
                >
                  {columns.map((column) => (
                    <td key={column.header} className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {column.cell ? column.cell(row) : row[column.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
