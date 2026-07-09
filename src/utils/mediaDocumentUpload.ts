import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';

const UPLOAD_PROGRESS_WEIGHT = 35;
const PROCESSING_PROGRESS_WEIGHT = 100 - UPLOAD_PROGRESS_WEIGHT;
const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 400;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface MediaDocumentUploadResult {
  documentId: number;
  pageCount: number;
  processing: boolean;
}

export interface MediaDocumentUploadOptions {
  channelId: number;
  categoryId: number;
  year: number;
  month: number;
  date: number;
  file: File;
  token: string;
  onProgress: (percent: number) => void;
  signal?: AbortSignal;
}

/**
 * Upload e-paper/magazine file with % progress (upload + background page processing).
 */
export async function uploadMediaDocument(
  options: MediaDocumentUploadOptions
): Promise<MediaDocumentUploadResult> {
  const { channelId, categoryId, year, month, date, file, token, onProgress, signal } = options;

  const formData = new FormData();
  formData.append('document', file);
  formData.append('categoryId', categoryId.toString());
  formData.append('year', year.toString());
  formData.append('month', month.toString());
  formData.append('date', date.toString());

  onProgress(0);

  const response = await axios.post(
    `${API_BASE_URL}/media-document/upload/${channelId}`,
    formData,
    {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      timeout: 0,
      signal,
      onUploadProgress: (event) => {
        if (event.total) {
          const uploadPct = Math.round((event.loaded / event.total) * UPLOAD_PROGRESS_WEIGHT);
          onProgress(Math.min(uploadPct, UPLOAD_PROGRESS_WEIGHT));
        }
      },
    }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'Upload failed');
  }

  const doc = response.data.data;
  const documentId = doc.id as number;

  if (!doc.processing) {
    onProgress(100);
    return {
      documentId,
      pageCount: doc.page_count ?? 0,
      processing: false,
    };
  }

  onProgress(UPLOAD_PROGRESS_WEIGHT);

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    if (signal?.aborted) {
      throw new Error('Upload cancelled');
    }

    await sleep(POLL_INTERVAL_MS);

    const statusRes = await axios.get(
      `${API_BASE_URL}/media-document/processing-status/${documentId}`,
      { headers: { Authorization: `Bearer ${token}` }, signal }
    );

    if (!statusRes.data.success) {
      throw new Error(statusRes.data.message || 'Failed to check processing status');
    }

    const { status, progress, page_count, error } = statusRes.data.data;
    const processingPct = Math.round(
      UPLOAD_PROGRESS_WEIGHT + ((progress ?? 0) / 100) * PROCESSING_PROGRESS_WEIGHT
    );
    onProgress(Math.min(processingPct, 99));

    if (status === 'ready') {
      onProgress(100);
      return {
        documentId,
        pageCount: page_count ?? 0,
        processing: true,
      };
    }

    if (status === 'failed') {
      throw new Error(error || 'Failed to process PDF pages');
    }
  }

  throw new Error('Processing timed out. Please refresh and check if the upload completed.');
}

export function getUploadErrorMessage(error: unknown): string {
  const err = error as {
    response?: { status?: number; data?: { message?: string } };
    message?: string;
  };
  if (err.response?.status === 413) {
    return 'File size exceeds 200MB limit. If this persists, ask your server admin to set nginx client_max_body_size to 200m.';
  }
  if (err.response?.status === 504) {
    return 'Server timed out. Please try again — large PDFs are now processed in the background.';
  }
  return err.response?.data?.message || err.message || 'Upload failed';
}
