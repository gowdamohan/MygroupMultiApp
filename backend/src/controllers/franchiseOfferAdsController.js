import FranchiseOfferAd from '../models/FranchiseOfferAd.js';

/**
 * Get franchise offer ads for carousel (e.g. corporate dashboard).
 * Query: group_id (optional), limit (default 4).
 * Uses table franchise_offer_ads columns: image_path, image_url, group_id.
 */
export const getOfferAds = async (req, res) => {
  try {
    const { group_id, limit = 4 } = req.query;
    const limitNum = Math.min(parseInt(limit, 10) || 4, 20);

    const where = {};
    if (group_id) {
      const gid = parseInt(group_id, 10);
      if (!Number.isNaN(gid)) where.group_id = gid;
    }

    const ads = await FranchiseOfferAd.findAll({
      where: Object.keys(where).length ? where : undefined,
      limit: limitNum,
      order: [['id', 'ASC']],
      attributes: ['id', 'image_path', 'image_url', 'group_id']
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
