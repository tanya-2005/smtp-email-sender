import { useRef } from 'react';
import { parseCsvFile } from '../utils/csvParser';
import Dropzone from './ui/Dropzone';

function CsvUpload({ onParsed, onError }) {
  const inputRef = useRef(null);

  async function handleFiles(fileList) {
    const file = fileList[0];
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
    <Dropzone
      id="csv-upload"
      accept=".csv,text/csv"
      onFiles={handleFiles}
      inputRef={inputRef}
      title="Drop your CSV here, or click to browse"
      subtitle="Must include an Email column (e.g. Name, Email, Company)"
    />
  );
}

export default CsvUpload;
