import { useRef } from 'react';
import { parseCsvFile } from '../utils/csvParser';

function CsvUpload({ onParsed, onError }) {
  const inputRef = useRef(null);

  async function handleChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const { headers, rows } = await parseCsvFile(file);
      onParsed({ headers, rows });
    } catch (error) {
      onError(error.message);
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="csv-upload">
      <input
        id="csv-upload"
        type="file"
        className="file-input"
        accept=".csv,text/csv"
        onChange={handleChange}
        ref={inputRef}
      />
      <span className="file-hint">
        CSV with headers, e.g. Name, Email, Company. Must include an Email column.
      </span>
    </div>
  );
}

export default CsvUpload;
