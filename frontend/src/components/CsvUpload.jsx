import { useRef } from 'react';
import Dropzone from './ui/Dropzone';

function CsvUpload({ onFiles }) {
  const inputRef = useRef(null);

  async function handleFiles(fileList) {
    await onFiles(fileList);
    if (inputRef.current) inputRef.current.value = '';
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
