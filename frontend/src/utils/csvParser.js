import Papa from 'papaparse';

export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      transform: (value) => value.trim(),
      complete: (result) => {
        if (result.errors.length > 0) {
          reject(new Error(result.errors[0].message));
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
