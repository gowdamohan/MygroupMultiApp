import axios, { AxiosResponse } from 'axios';
import { API_BASE_URL } from '../config/api.config';

/** Upload bytes are reported up to this percent; remainder is server-side PDF splitting. */
export const MEDIA_UPLOAD_PROGRESS_CAP = 38;

/** Match nginx proxy_read_timeout (10 minutes). */
export const MEDIA_UPLOAD_TIMEOUT_MS = 600_000;

/** Poll interval while background page split runs. */
const PROCESSING_POLL_MS = 3000;

/** Max poll attempts (~10 min). */
const PROCESSING_MAX_POLLS = 200;

export type MediaUploadPhase = 'uploading' | 'processing';

export interface MediaUploadProgress {
  phase: MediaUploadPhase;
  percent: number;
  label: string;
}

export interface MediaDocumentUploadResponse {
  success: boolean;
  message?: string;
  data?: {
    id: number;
    page_count?: number;
    thumbnail_url?: string | null;
    document_url?: string;
    file_name?: string;
    processing?: boolean;
  };
}

interface ProcessingStatusResponse {
  success: boolean;
  data?: {
    status: 'processing' | 'ready' | 'failed';
    progress?: number;
    page_count?: number | null;
    error?: string | null;
  };
}

/**
 * Poll GET /processing-status/:documentId until ready or failed.
 */
export async function pollDocumentProcessing(
  documentId: number,
  onProgress?: (progress: MediaUploadProgress) => void
): Promise<{ page_count: number }> {
  const token = localStorage.getItem('accessToken');

  for (let attempt = 0; attempt < PROCESSING_MAX_POLLS; attempt++) {
    const res = await axios.get<ProcessingStatusResponse>(
      `${API_BASE_URL}/media-document/processing-status/${documentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { status, progress = 0, page_count, error } = res.data.data ?? {};

    // Map server 0–100 → UI 38–99 during processing phase
    const serverPct = Math.min(100, Math.max(0, progress));
    const displayPercent = status === 'ready'
      ? 100
      : Math.min(99, MEDIA_UPLOAD_PROGRESS_CAP + Math.round((serverPct / 100) * (100 - MEDIA_UPLOAD_PROGRESS_CAP)));

    onProgress?.({
      phase: 'processing',
      percent: displayPercent,
      label: status === 'failed' ? 'Processing failed' : 'Processing pages…',
    });

    if (status === 'ready') {
      return { page_count: page_count ?? 0 };
    }
    if (status === 'failed') {
      throw new Error(error || 'Page processing failed on the server');
    }

    await new Promise((r) => setTimeout(r, PROCESSING_POLL_MS));
  }

  throw new Error(
    'Page processing is taking longer than expected. The file was received — refresh in a minute.'
  );
}

/**
 * POST multipart upload — file upload is fast; page split runs on server in background.
 * Polls processing-status until pages_json is saved (avoids nginx 504 on large PDFs).
 */
export async function postMediaDocumentUpload(
  channelId: number,
  formData: FormData,
  onProgress?: (progress: MediaUploadProgress) => void
): Promise<AxiosResponse<MediaDocumentUploadResponse>> {
  const token = localStorage.getItem('accessToken');
  let processingTimer: ReturnType<typeof setInterval> | null = null;
  let processingPercent = MEDIA_UPLOAD_PROGRESS_CAP;
  let processingStarted = false;

  const clearProcessingTimer = () => {
    if (processingTimer) {
      clearInterval(processingTimer);
      processingTimer = null;
    }
  };

  const startProcessingAnimation = () => {
    if (processingStarted) return;
    processingStarted = true;
    onProgress?.({
      phase: 'processing',
      percent: processingPercent,
      label: 'Processing pages…',
    });
    processingTimer = setInterval(() => {
      if (processingPercent < 55) {
        processingPercent = Math.min(55, processingPercent + 1);
        onProgress?.({
          phase: 'processing',
          percent: processingPercent,
          label: 'Processing pages…',
        });
      }
    }, 2500);
  };

  try {
    const response = await axios.post<MediaDocumentUploadResponse>(
      `${API_BASE_URL}/media-document/upload/${channelId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: MEDIA_UPLOAD_TIMEOUT_MS,
        onUploadProgress: (event) => {
          if (!event.total) return;
          const percent = Math.min(
            MEDIA_UPLOAD_PROGRESS_CAP,
            Math.round((event.loaded / event.total) * MEDIA_UPLOAD_PROGRESS_CAP)
          );
          onProgress?.({
            phase: 'uploading',
            percent,
            label: 'Uploading file…',
          });
          if (event.loaded >= event.total) {
            startProcessingAnimation();
          }
        },
      }
    );

    clearProcessingTimer();

    const docId = response.data.data?.id;
    const needsProcessing =
      response.data.success &&
      docId &&
      (response.data.data?.processing || !response.data.data?.page_count);

    if (needsProcessing) {
      const { page_count } = await pollDocumentProcessing(docId, onProgress);
      if (response.data.data) {
        response.data.data.page_count = page_count;
        response.data.data.processing = false;
      }
    }

    onProgress?.({ phase: 'processing', percent: 100, label: 'Complete' });
    return response;
  } catch (error) {
    clearProcessingTimer();
    throw error;
  }
}

/**
 * DELETE /media-document/document/:id — treats 404 as already removed and refreshes UI.
 */
export async function deleteMediaDocument(documentId: number): Promise<{ alreadyGone: boolean }> {
  const token = localStorage.getItem('accessToken');
  try {
    await axios.delete(`${API_BASE_URL}/media-document/document/${documentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { alreadyGone: false };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number } };
    if (err.response?.status === 404) {
      return { alreadyGone: true };
    }
    throw error;
  }
}
