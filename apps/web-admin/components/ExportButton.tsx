'use client';

type CsvRow = Record<string, string | number | boolean | null | undefined>;

function csvEscape(value: string | number | boolean | null | undefined) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function ExportButton({
  fileName,
  rows,
  children,
  primary = false,
}: {
  fileName: string;
  rows: CsvRow[];
  children: string;
  primary?: boolean;
}) {
  function download() {
    const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
    const csv = [
      headers.map(csvEscape).join(','),
      ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button className={['button', primary ? 'primary' : ''].filter(Boolean).join(' ')} type="button" onClick={download}>
      {children}
    </button>
  );
}
