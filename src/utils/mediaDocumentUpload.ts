import axios, { AxiosResponse } from 'axios';
import { API_BASE_URL } from '../config/api.config';

/** Upload bytes are reported up to this percent; remainder is server-side PDF splitting. */
export const MEDIA_UPLOAD_PROGRESS_CAP = 38;

/** Match nginx proxy_read_timeout (10 minutes). */
export const MEDIA_UPLOAD_TIMEOUT_MS = 600_000;

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
  };
}

/**
 * POST multipart upload to /media-document/upload/:channelId.
 * Server splits PDF into pages synchronously — the HTTP request stays open until pages_json is saved.
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
      if (processingPercent < 95) {
        processingPercent = Math.min(95, processingPercent + 1);
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
