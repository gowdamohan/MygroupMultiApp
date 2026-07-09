/**
 * Background PDF/image → per-page WebP split.
 * DB final state: pages_json + document_path (page 1 key) + processing_status.
 */
import { MediaChannelDocument } from '../models/index.js';
import { deleteFile, getObjectBuffer, WASABI_PUBLIC_BASE_URL } from './wasabiService.js';
import {
  splitPdfToWasabiPages,
  imageBufferToWasabiPage,
  listPageKeys,
} from './pdfPagesService.js';

/** Max time for a single split job (large e-papers). */
const JOB_TIMEOUT_MS = 15 * 60 * 1000;

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

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(ms / 60000)} minutes`)), ms);
    }),
  ]);
}

async function runProcessDocumentPagesJob({
  documentId,
  fileBuffer,
  mimetype,
  folder,
  originalFileKey,
}) {
  const id = Number(documentId);
  setProcessingJob(id, { status: 'processing', progress: 5 });

  let buffer = null;
  if (fileBuffer) {
    buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
  } else if (originalFileKey) {
    setProcessingJob(id, { status: 'processing', progress: 8 });
    buffer = await getObjectBuffer(originalFileKey);
  }
  if (!buffer?.length) {
    throw new Error('No file data available for page processing');
  }

  setProcessingJob(id, { status: 'processing', progress: 12 });

  let pagesMap = {};
  const onProgress = ({ current, total }) => {
    const pct = total > 0 ? Math.min(99, Math.round(12 + (current / total) * 87)) : 12;
    setProcessingJob(id, { status: 'processing', progress: pct, pageCount: total });
  };

  const splitFolder = `${folder}/doc_${Date.now()}`;

  if (mimetype === 'application/pdf') {
    const split = await splitPdfToWasabiPages(buffer, splitFolder, { onProgress });
    pagesMap = split.pages;
  } else {
    setProcessingJob(id, { progress: 50, pageCount: 1 });
    const split = await imageBufferToWasabiPage(buffer, splitFolder);
    pagesMap = split.pages;
  }

  const pageCount = Object.keys(pagesMap).length;
  if (pageCount === 0) {
    throw new Error('PDF produced no pages');
  }

  const page1Key = pagesMap['1'];
  const doc = await MediaChannelDocument.findByPk(id);
  const legacyPdfKey = doc?.document_path && /\.pdf$/i.test(doc.document_path)
    ? doc.document_path
    : null;

  await MediaChannelDocument.update(
    {
      pages_json: JSON.stringify(pagesMap),
      document_path: page1Key,
      document_url: page1Key ? `${WASABI_PUBLIC_BASE_URL}/${page1Key}` : doc?.document_url,
      processing_status: 'ready',
      processing_error: null,
    },
    { where: { id } }
  );

  if (legacyPdfKey && legacyPdfKey !== page1Key) {
    try { await deleteFile(legacyPdfKey); } catch (_) { /* ignore */ }
  }

  console.log(`Document ${id}: page split complete (${pageCount} pages)`);
  setProcessingJob(id, { status: 'ready', progress: 100, pageCount });
  setTimeout(() => clearProcessingJob(id), 60_000);
}

/**
 * Run PDF/image → WebP page split in the background (after HTTP response).
 */
export async function processDocumentPagesJob(params) {
  const id = Number(params.documentId);

  try {
    await withTimeout(
      runProcessDocumentPagesJob(params),
      JOB_TIMEOUT_MS,
      'Page processing'
    );
  } catch (err) {
    console.error(`Document ${id} page processing failed:`, err?.stack || err);

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
