/**
 * Split a multi-page PDF into per-page WebP images, upload each to Wasabi,
 * return a number-index map: { "1": "wasabi/key.webp", "2": "..." }.
 *
 * Used at E-paper upload so mobile only loads KB-sized pages.
 */
import {
  createCanvas,
  Path2D as NapiPath2D,
  DOMMatrix as NapiDOMMatrix,
  ImageData as NapiImageData,
} from '@napi-rs/canvas';
import sharp from 'sharp';
import path from 'path';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import { uploadFile } from './wasabiService.js';

const require = createRequire(import.meta.url);
const PAGE_MAX_WIDTH = 1200;
const WEBP_QUALITY = 78;
/** Render/upload this many PDF pages at once — speeds up large e-papers. */
const PAGE_CONCURRENCY = 3;

// pdf.js CanvasGraphics expects browser globals; provide Node equivalents.
if (typeof globalThis.Path2D === 'undefined') globalThis.Path2D = NapiPath2D;
if (typeof globalThis.DOMMatrix === 'undefined') globalThis.DOMMatrix = NapiDOMMatrix;
if (typeof globalThis.ImageData === 'undefined') globalThis.ImageData = NapiImageData;

const pdfjsPkgRoot = path.dirname(require.resolve('pdfjs-dist/package.json'));
/** pdf.js Node font loader needs OS filesystem paths ending with separator — not file:// URLs. */
const STANDARD_FONT_DATA_URL = path.join(pdfjsPkgRoot, 'standard_fonts') + path.sep;
const CMAP_URL = path.join(pdfjsPkgRoot, 'cmaps') + path.sep;

/** Required by pdf.js when rendering outside the browser. */
class NodeCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(Math.max(1, Math.ceil(width)), Math.max(1, Math.ceil(height)));
    return {
      canvas,
      context: canvas.getContext('2d'),
    };
  }

  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = Math.max(1, Math.ceil(width));
    canvasAndContext.canvas.height = Math.max(1, Math.ceil(height));
  }

  destroy(canvasAndContext) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
  }
}

let pdfjsLibPromise = null;

async function loadPdfJs() {
  if (pdfjsLibPromise) return pdfjsLibPromise;
  pdfjsLibPromise = (async () => {
    const legacyPdf = pathToFileURL(path.join(pdfjsPkgRoot, 'legacy', 'build', 'pdf.mjs')).href;
    const workerSrc = pathToFileURL(path.join(pdfjsPkgRoot, 'legacy', 'build', 'pdf.worker.mjs')).href;
    const pdfjs = await import(legacyPdf);
    if (pdfjs.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    }
    return pdfjs;
  })();
  return pdfjsLibPromise;
}

async function renderPdfPageToWasabi(pdf, pageNum, folder, canvasFactory) {
  const page = await pdf.getPage(pageNum);
  try {
    const viewport1 = page.getViewport({ scale: 1 });
    const scale = Math.min(2, PAGE_MAX_WIDTH / Math.max(viewport1.width, 1));
    const viewport = page.getViewport({ scale });

    const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);
    const { canvas, context: ctx } = canvasAndContext;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      canvasFactory,
    }).promise;

    const webpBuffer = await sharp(canvas.toBuffer('image/png'))
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    canvasFactory.destroy(canvasAndContext);

    const uploaded = await uploadFile(
      webpBuffer,
      `page-${pageNum}.webp`,
      'image/webp',
      `${folder}/pages`
    );

    if (!uploaded?.success || !uploaded.fileName) {
      throw new Error(`Failed to upload page ${pageNum} to Wasabi`);
    }

    return { pageNum, fileName: uploaded.fileName };
  } finally {
    page.cleanup();
  }
}

/**
 * @param {Buffer} pdfBuffer
 * @param {string} folder Wasabi folder prefix
 * @param {{ onProgress?: (info: { current: number, total: number }) => void }} [options]
 * @returns {Promise<{ pageCount: number, pages: Record<string, string> }>}
 */
export async function splitPdfToWasabiPages(pdfBuffer, folder, options = {}) {
  const { onProgress } = options;
  const pdfjsLib = await loadPdfJs();
  const data = new Uint8Array(
    pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength),
  );
  const canvasFactory = new NodeCanvasFactory();

  const loadingTask = pdfjsLib.getDocument({
    data,
    canvasFactory,
    disableFontFace: true,
    isEvalSupported: false,
    useSystemFonts: false,
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
    cMapUrl: CMAP_URL,
    cMapPacked: true,
    verbosity: 0,
  });

  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  const pages = {};
  let completed = 0;

  try {
    for (let start = 1; start <= pageCount; start += PAGE_CONCURRENCY) {
      const end = Math.min(start + PAGE_CONCURRENCY - 1, pageCount);
      const batch = [];
      for (let pageNum = start; pageNum <= end; pageNum++) {
        batch.push(renderPdfPageToWasabi(pdf, pageNum, folder, canvasFactory));
      }
      const results = await Promise.all(batch);
      for (const { pageNum, fileName } of results) {
        pages[String(pageNum)] = fileName;
      }
      completed = end;
      onProgress?.({ current: completed, total: pageCount });
    }
  } finally {
    await pdf.destroy();
  }

  return { pageCount, pages };
}

/**
 * Convert a single uploaded image into one "page" WebP on Wasabi.
 */
export async function imageBufferToWasabiPage(imageBuffer, folder) {
  const webpBuffer = await sharp(imageBuffer)
    .rotate()
    .resize({ width: PAGE_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const uploaded = await uploadFile(
    webpBuffer,
    'page-1.webp',
    'image/webp',
    `${folder}/pages`
  );

  if (!uploaded?.success || !uploaded.fileName) {
    throw new Error('Failed to upload image page to Wasabi');
  }

  return { pageCount: 1, pages: { '1': uploaded.fileName } };
}

/**
 * Parse pages_json from DB (string or object) → plain map.
 * @param {string|object|null} raw
 * @returns {Record<string, string>}
 */
export function parsePagesJson(raw) {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * All Wasabi keys stored in pages_json (for delete cleanup).
 */
export function listPageKeys(raw) {
  return Object.values(parsePagesJson(raw)).filter(Boolean);
}
