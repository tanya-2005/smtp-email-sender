import { FileText, Image as ImageIcon, File as FileIcon } from 'lucide-react';

export function getFileIcon(mimeType) {
  if (mimeType?.startsWith('image/')) return ImageIcon;
  if (mimeType === 'application/pdf' || mimeType?.includes('word')) return FileText;
  return FileIcon;
}
