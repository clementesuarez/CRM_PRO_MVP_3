/**
 * Shared CSV helper utility for AutoCRM / CRM Agencia.
 * - Solves Mojibake (FernÃ¡ndez, CÃ³rdoba) by prepending UTF-8 BOM (\uFEFF).
 * - Solves Excel scientific notation truncation (5,49117E+12) by formatting identifiers as =""VALOR"".
 * - Uses semicolon (;) delimiter for native Microsoft Excel (Windows/Spanish) opening.
 * - Provides cleanCSVCell for clean re-importation into SQLite crm_local.db.
 */

export const BOM = '\uFEFF';

/**
 * Format a single CSV cell value for Excel output.
 * If isIdentifier is true (or string matches phone/DNI pattern), wraps as `="VALOR"`
 * so Microsoft Excel renders it as plain text without scientific notation.
 */
export const formatCSVCell = (val: any, isIdentifier = false): string => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""').trim();

  // If flagged as identifier or matches long digit string (phone/DNI/CUIT)
  if ((isIdentifier || /^\+?\d{7,15}$/.test(str)) && !str.includes(';')) {
    return `="${str}"`;
  }
  return `"${str}"`;
};

/**
 * Clean a single CSV cell value coming from an imported CSV file.
 * Strips BOM (\uFEFF), Excel formula wrapper `="VALOR"`, outer quotes, and extra whitespace.
 */
export const cleanCSVCell = (cell: any): string => {
  if (cell === null || cell === undefined) return '';
  let str = String(cell).replace(/^\uFEFF/, '').trim();

  // Strip Excel text formula wrapper `="VALUE"`
  if (str.startsWith('="') && str.endsWith('"')) {
    str = str.substring(2, str.length - 1);
  }
  // Strip outer quotes
  if (str.startsWith('"') && str.endsWith('"')) {
    str = str.substring(1, str.length - 1);
  }
  return str.replace(/""/g, '"').trim();
};

/**
 * Generate UTF-8 BOM CSV text using semicolon (;) delimiter.
 */
export const generateCSV = (headers: string[], rows: any[][]): string => {
  const headerLine = headers.map(h => formatCSVCell(h)).join(';');
  const rowLines = rows.map(row => row.join(';'));
  return BOM + headerLine + '\n' + rowLines.join('\n');
};

/**
 * Trigger browser download of CSV file.
 */
export const downloadCSVBlob = (filename: string, csvContent: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `${filename}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Parse a CSV text file reliably supporting both `;` and `,` delimiters,
 * stripping BOM and cleaning Excel formula wrappers (`="VALOR"`).
 */
export const parseCSVText = (csvText: string): Record<string, string>[] => {
  const cleanText = csvText.replace(/^\uFEFF/, '');
  const lines = cleanText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  // Detect delimiter (semicolon vs comma)
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  const headers = firstLine.split(delimiter).map(h => cleanCSVCell(h));
  const result: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => cleanCSVCell(v));
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] || '';
    });
    result.push(obj);
  }

  return result;
};
