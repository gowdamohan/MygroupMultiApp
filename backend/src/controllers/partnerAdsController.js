import PartnerAdsManagement from '../models/PartnerAdsManagement.js';
import { uploadFile, getSignedReadUrl } from '../services/wasabiService.js';

/**
 * Get partner ads. Query: app_id (required), type ("ads1"|"ads2") optional, limit (default 100).
 * Returns signed URLs for display when image_path is set.
 */
export const getPartnerAds = async (req, res) => {
  try {
    const { app_id, type, limit = 100 } = req.query;
    const limitNum = Math.min(parseInt(limit, 10) || 100, 100);

    const where = {};
    if (app_id) where.app_id = parseInt(app_id, 10);
    if (type === 'ads1' || type === 'ads2') where.type = type;

    const rows = await PartnerAdsManagement.findAll({
      where: Object.keys(where).length ? where : undefined,
      limit: limitNum,
      order: [['type', 'ASC'], ['slot', 'ASC'], ['id', 'ASC']],
      attributes: ['id', 'app_id', 'image_path', 'image_url', 'scrolling_text', 'type', 'slot', 'is_active']
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

    res.json({ success: true, data: ads });
  } catch (error) {
    console.error('Error fetching partner ads:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch partner ads' });
  }
};

/**
 * Save one row (upsert by app_id, type, slot).
 * Multipart: app_id, type, slot, image (file), scrolling_text.
 */
export const savePartnerAdRow = async (req, res) => {
  try {
    const appId = parseInt(req.body.app_id, 10);
    const adType = (req.body.type || '').toString().trim().toLowerCase();
    const slotNum = parseInt(req.body.slot, 10);
    const scrollingText = (req.body.scrolling_text || '').toString().trim();

    if (!appId || isNaN(appId)) {
      return res.status(400).json({ success: false, message: 'app_id is required' });
    }
    if (adType !== 'ads1' && adType !== 'ads2') {
      return res.status(400).json({ success: false, message: 'type must be "ads1" or "ads2"' });
    }
    if (![1, 2, 3].includes(slotNum)) {
      return res.status(400).json({ success: false, message: 'slot must be 1, 2, or 3' });
    }

    const file = req.file || (req.files && req.files.image && req.files.image[0]);

    let imagePath = null;
    let imageUrl = null;

    if (file) {
      const folder = `partner_ads/${appId}/${adType}`;
      const uploadResult = await uploadFile(file.buffer, file.originalname, file.mimetype, folder);
      if (!uploadResult.success) {
        return res.status(500).json({ success: false, message: 'File upload failed' });
      }
      imagePath = uploadResult.fileName;
      imageUrl = uploadResult.publicUrl;
    }

    const existing = await PartnerAdsManagement.findOne({
      where: { app_id: appId, type: adType, slot: slotNum }
    });

    const updateData = { scrolling_text: scrollingText };
    if (imagePath) {
      updateData.image_path = imagePath;
      updateData.image_url = imageUrl;
    }

    let result;
    if (existing) {
      await existing.update(updateData);
      result = await PartnerAdsManagement.findByPk(existing.id, { raw: true });
    } else {
      const ad = await PartnerAdsManagement.create({
        app_id: appId,
        image_path: imagePath,
        image_url: imageUrl,
        scrolling_text: scrollingText,
        type: adType,
        slot: slotNum,
        is_active: 1
      });
      result = ad.get ? ad.get({ plain: true }) : ad;
    }

    // Add signed URL
    let signed_url = result.image_url;
    if (result.image_path) {
      try {
        const signed = await getSignedReadUrl(result.image_path, 3600);
        signed_url = signed.signedUrl;
      } catch (_) {}
    }

    res.json({
      success: true,
      message: existing ? 'Partner ad updated' : 'Partner ad saved',
      data: { ...result, signed_url }
    });
  } catch (error) {
    console.error('Error saving partner ad row:', error);
    res.status(500).json({ success: false, message: 'Failed to save partner ad' });
  }
};

/**
 * Delete a single partner ad by id.
 */
export const deletePartnerAd = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const ad = await PartnerAdsManagement.findByPk(id);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Partner ad not found' });
    }
    await ad.destroy();
    res.json({ success: true, message: 'Partner ad deleted' });
  } catch (error) {
    console.error('Error deleting partner ad:', error);
    res.status(500).json({ success: false, message: 'Failed to delete partner ad' });
  }
};

