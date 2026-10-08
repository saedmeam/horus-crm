"use client";

const PAGE_SIZES = [10, 15, 20, 100, 'todos'] as const;

export default function Pagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange
}: {
  total: number;
  page: number;
  pageSize: number | 'todos';
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number | 'todos') => void;
}) {
  const numericPageSize = pageSize === 'todos' ? total || 1 : pageSize;
  const totalPages = pageSize === 'todos' ? 1 : Math.max(1, Math.ceil(total / numericPageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (currentPage - 1) * numericPageSize + 1;
  const to = pageSize === 'todos' ? total : Math.min(currentPage * numericPageSize, total);

  // ventana de páginas (máx 5)
  let start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  start = Math.max(1, end - 4);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  const btn = 'px-2.5 py-1.5 rounded-lg text-sm border transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 border-t border-gray-100 dark:border-[#374248]">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <span>Mostrar</span>
        <select
          value={String(pageSize)}
          onChange={(e) => {
            const v = e.target.value;
            onPageSizeChange(v === 'todos' ? 'todos' : Number(v));
            onPageChange(1);
          }}
          className="border rounded-lg px-2 py-1.5 bg-white dark:bg-[#202c33] text-gray-800 dark:text-white text-sm"
        >
          {PAGE_SIZES.map((s) => (
            <option key={String(s)} value={String(s)}>
              {s === 'todos' ? 'Todos' : s}
            </option>
          ))}
        </select>
        <span>registros</span>
        <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">
          {from}-{to} de {total}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`${btn} border-gray-200 dark:border-[#374248] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#202c33]`}
        >
          ‹
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`${btn} ${
              p === currentPage
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-200 dark:border-[#374248] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#202c33]'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`${btn} border-gray-200 dark:border-[#374248] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#202c33]`}
        >
          ›
        </button>
      </div>
    </div>
  );
}
