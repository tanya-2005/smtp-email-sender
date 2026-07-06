import Papa from 'papaparse';

export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      transform: (value) => value.trim(),
      complete: (result) => {
        // FieldMismatch (ragged rows with missing/extra trailing columns) is non-fatal -
        // Papa still parses the row, padding missing fields as empty. Only reject on
        // genuinely fatal errors (e.g. malformed quotes/delimiters).
        const fatalErrors = result.errors.filter((err) => err.type !== 'FieldMismatch');
        if (fatalErrors.length > 0) {
          reject(new Error(fatalErrors[0].message));
          return;
        }

        const headers = result.meta.fields || [];
        if (!headers.includes('email')) {
          reject(new Error('CSV must include an "Email" column'));
          return;
        }

        const rows = result.data.map((row, index) => ({ ...row, _id: index }));
        resolve({ headers, rows });
      },
      error: (err) => reject(err),
    });
  });
}
