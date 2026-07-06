import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

function Dropzone({ id, accept, multiple, onFiles, title, subtitle, inputRef }) {
  const internalRef = useRef(null);
  const ref = inputRef || internalRef;
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length > 0) {
      onFiles(event.dataTransfer.files);
    }
  }

  return (
    <div
      className={`dropzone${isDragging ? ' dropzone--active' : ''}`}
      onClick={() => ref.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') ref.current?.click();
      }}
    >
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(event) => onFiles(event.target.files)}
        ref={ref}
        hidden
      />
      <UploadCloud size={22} className="dropzone__icon" />
      <span className="dropzone__title">{title}</span>
      {subtitle && <span className="dropzone__subtitle">{subtitle}</span>}
    </div>
  );
}

export default Dropzone;
