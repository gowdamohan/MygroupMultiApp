import MainAds from '../models/MainAds.js';
import { uploadFile, getSignedReadUrl } from '../services/wasabiService.js';

const FOLDER = 'main_page_ads';

/**
 * Attach signed read URLs to a plain main_ads record.
 * Adds signed_* fields for each slot that has a stored path.
 */
const attachSignedUrls = async (record) => {
  const result = { ...record };
  const slots = [
    { path: 'main_ad_path', signed: 'main_ad_signed_url' },
    { path: 'side_ad_1_path', signed: 'side_ad_1_signed_url' },
    { path: 'side_ad_2_path', signed: 'side_ad_2_signed_url' },
    { path: 'side_ad_3_path', signed: 'side_ad_3_signed_url' }
  ];

  await Promise.all(slots.map(async ({ path, signed }) => {
    if (result[path]) {
      try {
        const { signedUrl } = await getSignedReadUrl(result[path], 3600);
        result[signed] = signedUrl;
      } catch {
        result[signed] = null;
      }
    } else {
      result[signed] = null;
    }
  }));

  return result;
};

/**
 * GET /main-ads
 * Returns the single main_ads record (or null) with signed URLs.
 */
export const getMainAds = async (req, res) => {
  try {
    const row = await MainAds.findOne({ where: { is_active: 1 }, raw: true });
    if (!row) {
      return res.json({ success: true, data: null });
    }
    const data = await attachSignedUrls(row);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching main ads:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch main ads' });
  }
};

/**
 * POST /main-ads/save-main
 * Upsert the main ad image/URL (slot: main_ad).
 * Multipart: image (file, optional), url (string, optional).
 */
export const saveMainAd = async (req, res) => {
  try {
    const url = (req.body.url || '').toString().trim() || null;
    const file = req.file;

    let imagePath = undefined;

    if (file) {
      const uploadResult = await uploadFile(file.buffer, file.originalname, file.mimetype, FOLDER);
      if (!uploadResult.success) {
        return res.status(500).json({ success: false, message: 'File upload failed' });
      }
      imagePath = uploadResult.fileName;
    }

    if (!file && url === null) {
      return res.status(400).json({ success: false, message: 'Provide an image or a destination URL.' });
    }

    const existing = await MainAds.findOne({ where: { is_active: 1 } });
    const updateData = {};
    if (imagePath !== undefined) updateData.main_ad_path = imagePath;
    if (url !== undefined) updateData.main_ad_url = url;

    let row;
    if (existing) {
      await existing.update(updateData);
      row = await MainAds.findByPk(existing.id, { raw: true });
    } else {
      row = await MainAds.create({
        main_ad_path: imagePath || null,
        main_ad_url: url,
        is_active: 1
      });
      row = row.get ? row.get({ plain: true }) : row;
    }

    const data = await attachSignedUrls(row);
    res.json({ success: true, message: existing ? 'Main ad updated' : 'Main ad saved', data });
  } catch (error) {
    console.error('Error saving main ad:', error);
    res.status(500).json({ success: false, message: 'Failed to save main ad' });
  }
};

/**
 * POST /main-ads/save-side/:slot   (slot = 1 | 2 | 3)
 * Upsert one side ad slot (image/URL).
 * Multipart: image (file, optional), url (string, optional).
 */
export const saveSideAd = async (req, res) => {
  try {
    const slot = parseInt(req.params.slot, 10);
    if (![1, 2, 3].includes(slot)) {
      return res.status(400).json({ success: false, message: 'slot must be 1, 2, or 3' });
    }

    const url = (req.body.url || '').toString().trim() || null;
    const file = req.file;

    let imagePath = undefined;

    if (file) {
      const uploadResult = await uploadFile(file.buffer, file.originalname, file.mimetype, FOLDER);
      if (!uploadResult.success) {
        return res.status(500).json({ success: false, message: 'File upload failed' });
      }
      imagePath = uploadResult.fileName;
    }

    if (!file && url === null) {
      return res.status(400).json({ success: false, message: 'Provide an image or a destination URL.' });
    }

    const pathCol = `side_ad_${slot}_path`;
    const urlCol = `side_ad_${slot}_url`;

    const existing = await MainAds.findOne({ where: { is_active: 1 } });
    const updateData = {};
    if (imagePath !== undefined) updateData[pathCol] = imagePath;
    if (url !== undefined) updateData[urlCol] = url;

    let row;
    if (existing) {
      await existing.update(updateData);
      row = await MainAds.findByPk(existing.id, { raw: true });
    } else {
      const createData = { is_active: 1, [pathCol]: imagePath || null, [urlCol]: url };
      row = await MainAds.create(createData);
      row = row.get ? row.get({ plain: true }) : row;
    }

    const data = await attachSignedUrls(row);
    res.json({ success: true, message: `Side ad ${slot} ${existing ? 'updated' : 'saved'}`, data });
  } catch (error) {
    console.error('Error saving side ad:', error);
    res.status(500).json({ success: false, message: 'Failed to save side ad' });
  }
};
