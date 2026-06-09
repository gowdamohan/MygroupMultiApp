import sharp from 'sharp';

/**
 * Compress and square-crop a profile image for storage (~100KB JPEG).
 * @param {Buffer} input
 * @param {number} size - Output width/height in pixels
 */
export const compressProfileImageToBuffer = async (input, size = 400) => {
  let quality = 85;
  let buffer;

  while (quality > 20) {
    buffer = await sharp(input)
      .rotate()
      .resize(size, size, { fit: 'cover', position: 'centre' })
      .jpeg({ quality, progressive: true })
      .toBuffer();

    if (buffer.length <= 100 * 1024) break;
    quality -= 10;
  }

  return buffer;
};

/**
 * Compress image preserving aspect ratio (for logos etc.).
 * @param {Buffer|string} input
 */
export const compressImageToBuffer = async (input) => {
  let quality = 80;
  let buffer;

  while (quality > 10) {
    buffer = await sharp(input)
      .rotate()
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, progressive: true })
      .toBuffer();

    if (buffer.length <= 100 * 1024) break;
    quality -= 10;
  }

  return buffer;
};
