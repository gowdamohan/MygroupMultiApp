import FranchiseOfferAd from '../models/FranchiseOfferAd.js';
import { uploadFile, getSignedReadUrl } from '../services/wasabiService.js';

/**
 * Get franchise offer ads. Query: group_name ("regional" | "branch"), type ("ads1" | "ads2") optional, limit (default 100).
 * Returns signed URLs for display when image_path is set (expires in 1 hour).
 */
export const getOfferAds = async (req, res) => {
  try {
    const { group_name, type, limit = 100 } = req.query;
    const limitNum = Math.min(parseInt(limit, 10) || 100, 100);

    const where = {};
    if (group_name === 'regional' || group_name === 'branch') {
      where.group_name = group_name;
    }
    if (type === 'ads1' || type === 'ads2') {
      where.type = type;
    }

    const rows = await FranchiseOfferAd.findAll({
      where: Object.keys(where).length ? where : undefined,
      limit: limitNum,
      order: [
        ['type', 'ASC'],
        ['slot', 'ASC'],
        ['id', 'ASC']
      ],
      attributes: ['id', 'image_path', 'image_url', 'group_name', 'type', 'slot']
    });

    const ads = await Promise.all(rows.map(async (ad) => {
      const plain = ad.get ? ad.get({ plain: true }) : ad;
      if (plain.image_path) {
        try {
          const { signedUrl } = await getSignedReadUrl(plain.image_path, 3600);
          plain.signed_url = signedUrl;
        } catch (e) {
          plain.signed_url = plain.image_url || null;
        }
      } else {
        plain.signed_url = plain.image_url || null;
      }
      return plain;
    }));

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
 * Save one row (upsert by group_name, type, slot). Multipart only: group_name, type, slot, image (file).
 */
export const saveOfferAdRow = async (req, res) => {
  try {
    const groupName = (req.body.group_name || '').toString().trim().toLowerCase();
    const adType = (req.body.type || '').toString().trim().toLowerCase();
    const slotNum = parseInt(req.body.slot, 10);

    if (groupName !== 'regional' && groupName !== 'branch') {
      return res.status(400).json({ success: false, message: 'group_name must be "regional" or "branch"' });
    }
    if (adType !== 'ads1' && adType !== 'ads2') {
      return res.status(400).json({ success: false, message: 'type must be "ads1" or "ads2"' });
    }
    if (![1, 2, 3].includes(slotNum)) {
      return res.status(400).json({ success: false, message: 'slot must be 1, 2, or 3' });
    }

    const file = req.file || (req.files && req.files.image && req.files.image[0]) || (req.files && req.files.images && req.files.images[0]);
    if (!file) {
      return res.status(400).json({ success: false, message: 'Image file is required' });
    }

    const folder = `franchise_offer_ads/${groupName}/${adType}`;
    const uploadResult = await uploadFile(file.buffer, file.originalname, file.mimetype, folder);
    if (!uploadResult.success) {
      return res.status(500).json({ success: false, message: 'File upload failed' });
    }
    const imagePath = uploadResult.fileName;
    const imageUrl = uploadResult.publicUrl;

    const existing = await FranchiseOfferAd.findOne({
      where: { group_name: groupName, type: adType, slot: slotNum }
    });

    if (existing) {
      await existing.update({ image_path: imagePath, image_url: imageUrl });
      const updated = await FranchiseOfferAd.findByPk(existing.id, { raw: true });
      let signed_url = imageUrl;
      if (imagePath) {
        try {
          const signed = await getSignedReadUrl(imagePath, 3600);
          signed_url = signed.signedUrl;
        } catch (_) {}
      }
      return res.json({ success: true, message: 'Offer ad updated', data: { ...updated, signed_url } });
    }

    const ad = await FranchiseOfferAd.create({
      image_path: imagePath,
      image_url: imageUrl,
      group_name: groupName,
      type: adType,
      slot: slotNum
    });
    const created = ad.get ? ad.get({ plain: true }) : ad;
    let signed_url = imageUrl;
    try {
      const signed = await getSignedReadUrl(imagePath, 3600);
      signed_url = signed.signedUrl;
    } catch (_) {}
    res.status(201).json({ success: true, message: 'Offer ad saved', data: { ...created, signed_url } });
  } catch (error) {
    console.error('Error saving franchise offer ad row:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save offer ad'
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
