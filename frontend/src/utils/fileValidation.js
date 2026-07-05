export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function isAllowedType(file) {
  return file.type.startsWith('image/') || ALLOWED_MIME_TYPES.has(file.type);
}

export function partitionFiles(files) {
  const accepted = [];
  const rejected = [];

  for (const file of files) {
    if (!isAllowedType(file)) {
      rejected.push(`${file.name} (unsupported file type)`);
    } else if (file.size > MAX_FILE_SIZE_BYTES) {
      rejected.push(`${file.name} (exceeds 10 MB)`);
    } else {
      accepted.push(file);
    }
  }

  return { accepted, rejected };
}
