import path from 'node:path';

export function normalizeMimeType(mimeType: string | undefined): string {
  return (mimeType ?? '').split(';')[0]?.trim().toLowerCase() ?? '';
}

export function getFileExtension(fileName: string): string {
  return path.extname(fileName).toLowerCase();
}
