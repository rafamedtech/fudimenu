/**
 * Zero-dependency RFC4180-ish CSV tokenizer.
 *
 * Pure and isomorphic: runs in the browser (preview) and on the server (commit)
 * so the importer never diverges between what the user previews and what gets
 * written. Handles quoted fields, embedded commas/newlines, escaped `""`,
 * CRLF/LF line endings, and a leading UTF-8 BOM.
 */
export function parseCsv(text: string): string[][] {
  // Strip UTF-8 BOM if present (Excel exports add it).
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let fieldStarted = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++; // consume the escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      fieldStarted = true;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      fieldStarted = true;
      continue;
    }

    if (char === '\r') {
      // Swallow CR; the following LF (or its absence) ends the row.
      if (input[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      fieldStarted = false;
      continue;
    }

    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      fieldStarted = false;
      continue;
    }

    field += char;
    fieldStarted = true;
  }

  // Flush the trailing field/row when the file does not end with a newline.
  if (fieldStarted || field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop fully-empty rows (e.g. trailing blank lines or a single empty cell).
  return rows.filter((cells) => cells.some((cell) => cell.trim().length > 0));
}
