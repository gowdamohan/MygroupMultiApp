/**
 * Split a multi-page PDF into per-page WebP images on Wasabi.
 * Uses poppler pdftoppm (reliable in Docker/Alpine) + sharp for WebP.
 *
 * Returns: { "1": "wasabi/key.webp", "2": "..." }
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { uploadFile } from './wasabiService.js';

const execFileAsync = promisify(execFile);
const PAGE_MAX_WIDTH = 1200;
const WEBP_QUALITY = 78;
const PDF_DPI = 150;

let popplerChecked = false;
let popplerAvailable = false;

/** Verify pdftoppm exists (call once at startup). */
export async function checkPdfSplitterAvailable() {
  if (popplerChecked) return popplerAvailable;
  popplerChecked = true;
  try {
    await execFileAsync('pdftoppm', ['-h']);
    popplerAvailable = true;
  } catch {
    try {
      await execFileAsync('which', ['pdftoppm']);
      popplerAvailable = true;
    } catch {
      popplerAvailable = false;
      console.error(
        'PDF splitter unavailable: install poppler-utils (apk add poppler-utils on Alpine)'
      );
    }
  }
  return popplerAvailable;
}

/**
 * @param {Buffer} pdfBuffer
 * @param {string} folder Wasabi folder prefix
 * @param {{ onProgress?: (info: { current: number, total: number }) => void }} [options]
 */
export async function splitPdfToWasabiPages(pdfBuffer, folder, options = {}) {
  const { onProgress } = options;

  if (!(await checkPdfSplitterAvailable())) {
    throw new Error(
      'PDF page splitter is not installed on the server (poppler-utils / pdftoppm). Contact support.'
    );
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'epaper-'));
  const pdfPath = path.join(tmpDir, 'input.pdf');

  try {
    await fs.writeFile(pdfPath, pdfBuffer);
    onProgress?.({ current: 0, total: 1 });

    const outPrefix = path.join(tmpDir, 'page');
    await execFileAsync(
      'pdftoppm',
      ['-jpeg', '-r', String(PDF_DPI), pdfPath, outPrefix],
      { maxBuffer: 64 * 1024 * 1024, timeout: 600_000 }
    );

    const jpgFiles = (await fs.readdir(tmpDir))
      .filter((f) => /^page-\d+\.jpg$/i.test(f))
      .sort((a, b) => {
        const na = Number(a.match(/(\d+)\.jpg$/i)?.[1] || 0);
        const nb = Number(b.match(/(\d+)\.jpg$/i)?.[1] || 0);
        return na - nb;
      });

    const pageCount = jpgFiles.length;
    if (pageCount === 0) {
      throw new Error('PDF produced no pages — the file may be empty or corrupted');
    }

    const pages = {};
    let completed = 0;

    for (const file of jpgFiles) {
      const pageNum = Number(file.match(/(\d+)\.jpg$/i)?.[1] || completed + 1);
      const jpgPath = path.join(tmpDir, file);

      const webpBuffer = await sharp(jpgPath)
        .resize({ width: PAGE_MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

      const uploaded = await uploadFile(
        webpBuffer,
        `page-${pageNum}.webp`,
        'image/webp',
        `${folder}/pages`
      );

      if (!uploaded?.success || !uploaded.fileName) {
        throw new Error(`Failed to upload page ${pageNum} to Wasabi`);
      }

      pages[String(pageNum)] = uploaded.fileName;
      completed += 1;
      onProgress?.({ current: completed, total: pageCount });
    }

    return { pageCount, pages };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
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

export function listPageKeys(raw) {
  return Object.values(parsePagesJson(raw)).filter(Boolean);
}
