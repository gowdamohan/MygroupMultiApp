/**
 * In-memory progress for background PDF page splitting.
 * DB stores final state (pages_json + processing_status).
 */
import { MediaChannelDocument } from '../models/index.js';
import { deleteFile } from './wasabiService.js';
import {
  splitPdfToWasabiPages,
  imageBufferToWasabiPage,
  listPageKeys,
} from './pdfPagesService.js';

/** @type {Map<number, { status: string, progress: number, pageCount?: number, error?: string }>} */
const processingJobs = new Map();

export function getProcessingJob(documentId) {
  return processingJobs.get(Number(documentId)) ?? null;
}

export function setProcessingJob(documentId, patch) {
  const id = Number(documentId);
  const prev = processingJobs.get(id) || { status: 'processing', progress: 0 };
  processingJobs.set(id, { ...prev, ...patch });
}

export function clearProcessingJob(documentId) {
  processingJobs.delete(Number(documentId));
}

/**
 * Run PDF/image → WebP page split in the background (after HTTP response).
 */
export async function processDocumentPagesJob({
  documentId,
  fileBuffer,
  mimetype,
  folder,
  originalFileKey,
}) {
  const id = Number(documentId);
  setProcessingJob(id, { status: 'processing', progress: 5 });

  try {
    let pagesMap = {};
    const onProgress = ({ current, total }) => {
      const pct = total > 0 ? Math.min(99, Math.round(5 + (current / total) * 94)) : 5;
      setProcessingJob(id, { status: 'processing', progress: pct, pageCount: total });
    };

    if (mimetype === 'application/pdf') {
      const split = await splitPdfToWasabiPages(fileBuffer, `${folder}/doc_${Date.now()}`, {
        onProgress,
      });
      pagesMap = split.pages;
    } else {
      setProcessingJob(id, { progress: 50, pageCount: 1 });
      const split = await imageBufferToWasabiPage(fileBuffer, `${folder}/doc_${Date.now()}`);
      pagesMap = split.pages;
    }

    const pageCount = Object.keys(pagesMap).length;
    await MediaChannelDocument.update(
      {
        pages_json: JSON.stringify(pagesMap),
        processing_status: 'ready',
        processing_error: null,
      },
      { where: { id } }
    );

    setProcessingJob(id, { status: 'ready', progress: 100, pageCount });
    setTimeout(() => clearProcessingJob(id), 60_000);
  } catch (err) {
    console.error(`Document ${id} page processing failed:`, err);

    const doc = await MediaChannelDocument.findByPk(id);
    if (doc) {
      for (const key of listPageKeys(doc.pages_json)) {
        try { await deleteFile(key); } catch (_) { /* ignore */ }
      }
      await doc.update({
        pages_json: null,
        processing_status: 'failed',
        processing_error: err.message || 'Page processing failed',
      });
    }

    setProcessingJob(id, {
      status: 'failed',
      progress: 0,
      error: err.message || 'Page processing failed',
    });
    setTimeout(() => clearProcessingJob(id), 120_000);
  }
}
