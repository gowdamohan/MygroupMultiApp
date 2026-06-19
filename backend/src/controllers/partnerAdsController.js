import PartnerAdsManagement from '../models/PartnerAdsManagement.js';
import PartnerAdsSettings from '../models/PartnerAdsSettings.js';
import { uploadFile, getSignedReadUrl } from '../services/wasabiService.js';

const attachSignedUrls = async (rows) => {
  return Promise.all(rows.map(async (ad) => {
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
};

const getHeaderScrollingText = async (appId) => {
  if (!appId) return '';
  const settings = await PartnerAdsSettings.findOne({ where: { app_id: appId } });
  return settings?.header_scrolling_text?.trim() || '';
};

/**
 * Get partner ads. Query: app_id (required), type ("ads1"|"ads2") optional, limit (default 100).
 * Returns signed URLs for display when image_path is set.
 * Also returns header_scrolling_text for the app when app_id is provided.
 */
export const getPartnerAds = async (req, res) => {
  try {
    const { app_id, type, limit = 100 } = req.query;
    const limitNum = Math.min(parseInt(limit, 10) || 100, 100);
    const appId = app_id ? parseInt(app_id, 10) : null;

    const where = {};
    if (appId) where.app_id = appId;
    if (type === 'ads1' || type === 'ads2') where.type = type;

    const rows = await PartnerAdsManagement.findAll({
      where: Object.keys(where).length ? where : undefined,
      limit: limitNum,
      order: [['type', 'ASC'], ['slot', 'ASC'], ['id', 'ASC']],
      attributes: ['id', 'app_id', 'image_path', 'image_url', 'url', 'type', 'slot', 'is_active']
    });

    const ads = await attachSignedUrls(rows);
    const headerScrollingText = appId ? await getHeaderScrollingText(appId) : '';

    res.json({ success: true, data: ads, header_scrolling_text: headerScrollingText });
  } catch (error) {
    console.error('Error fetching partner ads:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch partner ads' });
  }
};

/**
 * Save one row (upsert by app_id, type, slot).
 * Multipart: app_id, type, slot, image (file), url.
 */
export const savePartnerAdRow = async (req, res) => {
  try {
    const appId = parseInt(req.body.app_id, 10);
    const adType = (req.body.type || '').toString().trim().toLowerCase();
    const slotNum = parseInt(req.body.slot, 10);
    const url = (req.body.url || '').toString().trim();

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

    if (!file && !url && !existing) {
      return res.status(400).json({ success: false, message: 'Provide an image or destination URL to save.' });
    }

    const updateData = { url: url || null };
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
        url: url || null,
        type: adType,
        slot: slotNum,
        is_active: 1
      });
      result = ad.get ? ad.get({ plain: true }) : ad;
    }

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
 * Get global header scrolling text for an app.
 */
export const getPartnerAdsSettings = async (req, res) => {
  try {
    const appId = parseInt(req.query.app_id, 10);
    if (!appId || isNaN(appId)) {
      return res.status(400).json({ success: false, message: 'app_id is required' });
    }

    const headerScrollingText = await getHeaderScrollingText(appId);
    res.json({ success: true, data: { app_id: appId, header_scrolling_text: headerScrollingText } });
  } catch (error) {
    console.error('Error fetching partner ads settings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch partner ads settings' });
  }
};

/**
 * Save global header scrolling text for an app.
 * Body: app_id, header_scrolling_text.
 */
export const savePartnerAdsSettings = async (req, res) => {
  try {
    const appId = parseInt(req.body.app_id, 10);
    const headerScrollingText = (req.body.header_scrolling_text ?? '').toString().trim();

    if (!appId || isNaN(appId)) {
      return res.status(400).json({ success: false, message: 'app_id is required' });
    }

    const [settings] = await PartnerAdsSettings.findOrCreate({
      where: { app_id: appId },
      defaults: { app_id: appId, header_scrolling_text: headerScrollingText }
    });

    if (!settings.isNewRecord) {
      await settings.update({ header_scrolling_text: headerScrollingText });
    }

    res.json({
      success: true,
      message: 'Header scrolling text saved',
      data: { app_id: appId, header_scrolling_text: headerScrollingText }
    });
  } catch (error) {
    console.error('Error saving partner ads settings:', error);
    res.status(500).json({ success: false, message: 'Failed to save header scrolling text' });
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
