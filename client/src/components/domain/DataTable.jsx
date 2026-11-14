// Simple responsive table. columns: [{ key, header, render?(row), className? }]
export default function DataTable({ columns, rows, rowKey = (r) => r.id, caption, rowClass }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px]">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-crust/30 dark:bg-white/5">
          <tr>{columns.map((c) => <th key={c.key} scope="col" className={`th ${c.className ?? ''}`}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className={`border-t border-line dark:border-white/10 ${rowClass?.(r) ?? ''}`}>
              {columns.map((c) => <td key={c.key} className={`td ${c.className ?? ''}`}>{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
