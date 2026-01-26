import FranchiseOfferAd from '../models/FranchiseOfferAd.js';
import { uploadFile } from '../services/wasabiService.js';

/**
 * Get franchise offer ads for carousel or management.
 * Query: group_id (optional), limit (default 4). No country/state filters.
 */
export const getOfferAds = async (req, res) => {
  try {
    const { group_id, limit = 4 } = req.query;
    const limitNum = Math.min(parseInt(limit, 10) || 4, 100);

    const where = {};
    const gid = parseInt(group_id, 10);
    if (!Number.isNaN(gid)) where.group_id = gid;

    const ads = await FranchiseOfferAd.findAll({
      where: Object.keys(where).length ? where : undefined,
      limit: limitNum,
      order: [['id', 'ASC']],
      attributes: ['id', 'image_path', 'image_url', 'group_id', 'state_id', 'district_id']
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
 * Upload multiple offer ad images to Wasabi and save to franchise_offer_ads.
 * Body (form): group_id (1=regional, 2=branch), state_id (for regional), district_id (for branch).
 * Files: images (multiple).
 */
export const createOfferAds = async (req, res) => {
  try {
    const groupId = parseInt(req.body.group_id, 10);
    const stateId = req.body.state_id ? parseInt(req.body.state_id, 10) : null;
    const districtId = req.body.district_id ? parseInt(req.body.district_id, 10) : null;

    if (![1, 2].includes(groupId)) {
      return res.status(400).json({ success: false, message: 'group_id must be 1 (regional) or 2 (branch)' });
    }
    if (groupId === 1 && !stateId) {
      return res.status(400).json({ success: false, message: 'state_id required for regional offer ads' });
    }
    if (groupId === 2 && !districtId) {
      return res.status(400).json({ success: false, message: 'district_id required for branch offer ads' });
    }

    const files = req.files?.images || (req.file ? [req.file] : []);
    if (!files.length) {
      return res.status(400).json({ success: false, message: 'At least one image is required' });
    }

    const folder = groupId === 1
      ? `franchise_offer_ads/regional/${stateId}`
      : `franchise_offer_ads/branch/${districtId}`;

    const created = [];
    for (const file of files) {
      const uploadResult = await uploadFile(file.buffer, file.originalname, file.mimetype, folder);
      if (!uploadResult.success) continue;
      const ad = await FranchiseOfferAd.create({
        image_path: uploadResult.fileName,
        image_url: uploadResult.publicUrl,
        group_id: groupId,
        state_id: groupId === 1 ? stateId : null,
        district_id: groupId === 2 ? districtId : null
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
