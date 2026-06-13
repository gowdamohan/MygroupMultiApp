import { API_BASE_URL } from '../config/api.config';

export const isPdfFile = (url?: string | null, documentType?: string | null): boolean => {
  const docType = (documentType || '').toLowerCase();
  const u = (url || '').toLowerCase();
  return (
    docType === 'pdf' ||
    docType.includes('pdf') ||
    u.endsWith('.pdf') ||
    u.includes('.pdf?') ||
    u.includes('.pdf#') ||
    u.includes('application/pdf')
  );
};

/** Same-origin PDF stream (avoids cross-origin iframe/CORS issues on mobile). */
export const getDocumentStreamUrl = (documentId: number): string =>
  `${API_BASE_URL}/mymedia/document/${documentId}/stream`;
