import { X } from 'lucide-react';
import { formatFileSize } from '../utils/formatFileSize';
import { getFileIcon } from '../utils/fileIcon';

function AttachmentList({ files, onRemove }) {
  if (files.length === 0) return null;

  return (
    <ul className="attachment-list">
      {files.map((file, index) => {
        const Icon = getFileIcon(file.type);
        return (
          <li key={`${file.name}-${file.size}`} className="attachment-list__item">
            <Icon size={16} className="attachment-list__icon" />
            <span className="attachment-list__name">{file.name}</span>
            <span className="attachment-list__size">{formatFileSize(file.size)}</span>
            <button
              type="button"
              className="attachment-list__remove"
              onClick={() => onRemove(index)}
              aria-label={`Remove ${file.name}`}
            >
              <X size={14} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default AttachmentList;
