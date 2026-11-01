export function downloadCsv(filename: string, header: string[], rows: string[][]): void {
  const lines = [header, ...rows].map((row) => row.map(toCsvCell).join(','));
  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function toCsvFilename(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'event'}-participants.csv`;
}

const SPREADSHEET_FORMULA_PREFIX = /^[=+\-@\t\r]/;

function toCsvCell(value: string): string {
  const guarded = SPREADSHEET_FORMULA_PREFIX.test(value) ? `'${value}` : value;
  return `"${guarded.replace(/"/g, '""')}"`;
}
