import FranchiseOfferAd from '../models/FranchiseOfferAd.js';
import { uploadFile } from '../services/wasabiService.js';

/**
 * Get franchise offer ads. Query: group_name (optional, "regional" | "branch"), limit (default 4).
 */
export const getOfferAds = async (req, res) => {
  try {
    const { group_name, limit = 4 } = req.query;
    const limitNum = Math.min(parseInt(limit, 10) || 4, 100);

    const where = {};
    if (group_name === 'regional' || group_name === 'branch') {
      where.group_name = group_name;
    }

    const ads = await FranchiseOfferAd.findAll({
      where: Object.keys(where).length ? where : undefined,
      limit: limitNum,
      order: [['id', 'ASC']],
      attributes: ['id', 'image_path', 'image_url', 'group_name']
    });

    res.json({
      success: true,
      data: ads
    });
  } catch (error) {
    console.error('Error fetching franchise offer ads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch offer ads'
    });
  }
};

/**
 * Create offer ads via file upload (multipart). group_name + images.
 */
export const createOfferAds = async (req, res) => {
  try {
    const groupName = (req.body.group_name || '').toString().trim().toLowerCase();
    if (groupName !== 'regional' && groupName !== 'branch') {
      return res.status(400).json({ success: false, message: 'group_name must be "regional" or "branch"' });
    }

    const files = req.files?.images || (req.file ? [req.file] : []);
    if (!files.length) {
      return res.status(400).json({ success: false, message: 'At least one image file is required' });
    }

    const folder = `franchise_offer_ads/${groupName}`;
    const created = [];
    for (const file of files) {
      const uploadResult = await uploadFile(file.buffer, file.originalname, file.mimetype, folder);
      if (!uploadResult.success) continue;
      const ad = await FranchiseOfferAd.create({
        image_path: uploadResult.fileName,
        image_url: uploadResult.publicUrl,
        group_name: groupName
      });
      created.push(ad);
    }

    res.status(201).json({
      success: true,
      message: `${created.length} image(s) uploaded`,
      data: created
    });
  } catch (error) {
    console.error('Error creating franchise offer ads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload offer ads'
    });
  }
};

/**
 * Create offer ads via URL input (JSON). group_name + image_urls[].
 */
export const createOfferAdsByUrl = async (req, res) => {
  try {
    const groupName = (req.body.group_name || '').toString().trim().toLowerCase();
    if (groupName !== 'regional' && groupName !== 'branch') {
      return res.status(400).json({ success: false, message: 'group_name must be "regional" or "branch"' });
    }

    const imageUrls = Array.isArray(req.body.image_urls)
      ? req.body.image_urls.map(u => String(u).trim()).filter(Boolean)
      : [];

    if (!imageUrls.length) {
      return res.status(400).json({ success: false, message: 'At least one image URL is required' });
    }

    const created = [];
    for (const url of imageUrls) {
      const ad = await FranchiseOfferAd.create({
        image_path: null,
        image_url: url,
        group_name: groupName
      });
      created.push(ad);
    }

    res.status(201).json({
      success: true,
      message: `${created.length} image URL(s) added`,
      data: created
    });
  } catch (error) {
    console.error('Error creating franchise offer ads by URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add offer ads by URL'
    });
  }
};

/**
 * Delete a single offer ad by id.
 */
export const deleteOfferAd = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const ad = await FranchiseOfferAd.findByPk(id);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Offer ad not found' });
    }
    await ad.destroy();
    res.json({ success: true, message: 'Offer ad deleted' });
  } catch (error) {
    console.error('Error deleting franchise offer ad:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete offer ad'
    });
  }
};
