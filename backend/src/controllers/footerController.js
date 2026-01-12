import { FooterPage, User, GalleryList, GalleryImagesMaster, FooterLink } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * ============================================
 * FOOTER PAGE MANAGEMENT
 * ============================================
 */

// Get footer page by type
export const getFooterPageByType = async (req, res) => {
  try {
    const { pageType } = req.params;
    const { group_name } = req.query;

    const where = { footer_page_type: pageType };
    if (group_name) {
      where.group_name = group_name;
    }

    const page = await FooterPage.findOne({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'email'] }]
    });

    res.json({
      success: true,
      data: page
    });
  } catch (error) {
    console.error('Error fetching footer page:', error);
    res.status(500).json({ message: 'Error fetching footer page', error: error.message });
  }
};

// Create or update footer page
export const saveFooterPage = async (req, res) => {
  try {
    const { id, user_id, footer_page_type, title, tag_line, image, content, url, group_name } = req.body;

    if (id) {
      // Update existing page
      const page = await FooterPage.findByPk(id);
      if (!page) {
        return res.status(404).json({ message: 'Footer page not found' });
      }

      await page.update({
        user_id,
        footer_page_type,
        title,
        tag_line,
        image,
        content,
        url,
        group_name
      });

      res.json({
        success: true,
        message: 'Footer page updated successfully',
        data: page
      });
    } else {
      // Create new page
      const newPage = await FooterPage.create({
        user_id,
        footer_page_type,
        title,
        tag_line,
        image,
        content,
        url,
        group_name
      });

      res.status(201).json({
        success: true,
        message: 'Footer page created successfully',
        data: newPage
      });
    }
  } catch (error) {
    console.error('Error saving footer page:', error);
    res.status(500).json({ message: 'Error saving footer page', error: error.message });
  }
};

// Get social media links
export const getSocialMediaLinks = async (req, res) => {
  try {
    const { group_name } = req.query;

    const where = { footer_page_type: 'social_media' };
    if (group_name) {
      where.group_name = group_name;
    }

    const links = await FooterPage.findAll({
      where,
      attributes: ['id', 'title', 'url', 'group_name']
    });

    res.json({
      success: true,
      data: links
    });
  } catch (error) {
    console.error('Error fetching social media links:', error);
    res.status(500).json({ message: 'Error fetching social media links', error: error.message });
  }
};

// Save social media link
export const saveSocialMediaLink = async (req, res) => {
  try {
    const { id, title, url, group_name, user_id } = req.body;

    if (id) {
      // Update existing link
      const link = await FooterPage.findByPk(id);
      if (!link) {
        return res.status(404).json({ message: 'Social media link not found' });
      }

      await link.update({ title, url, group_name, user_id });

      res.json({
        success: true,
        message: 'Social media link updated successfully',
        data: link
      });
    } else {
      // Create new link
      const newLink = await FooterPage.create({
        user_id,
        footer_page_type: 'social_media',
        title,
        url,
        group_name
      });

      res.status(201).json({
        success: true,
        message: 'Social media link created successfully',
        data: newLink
      });
    }
  } catch (error) {
    console.error('Error saving social media link:', error);
    res.status(500).json({ message: 'Error saving social media link', error: error.message });
  }
};

// Delete social media link
export const deleteSocialMediaLink = async (req, res) => {
  try {
    const { id } = req.params;

    const link = await FooterPage.findByPk(id);
    if (!link) {
      return res.status(404).json({ message: 'Social media link not found' });
    }

    await link.destroy();

    res.json({
      success: true,
      message: 'Social media link deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting social media link:', error);
    res.status(500).json({ message: 'Error deleting social media link', error: error.message });
  }
};

/**
 * ============================================
 * GALLERY MANAGEMENT
 * ============================================
 */

// Get all galleries
export const getGalleries = async (req, res) => {
  try {
    const { group_id } = req.query;

    const where = group_id ? { group_id } : {};

    const galleries = await GalleryList.findAll({
      where,
      include: [{ model: GalleryImagesMaster, as: 'images' }],
      order: [['gallery_date', 'DESC']]
    });

    res.json({
      success: true,
      data: galleries
    });
  } catch (error) {
    console.error('Error fetching galleries:', error);
    res.status(500).json({ message: 'Error fetching galleries', error: error.message });
  }
};

// Get gallery by ID
export const getGalleryById = async (req, res) => {
  try {
    const { id } = req.params;

    const gallery = await GalleryList.findByPk(id, {
      include: [{ model: GalleryImagesMaster, as: 'images' }]
    });

    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    res.json({
      success: true,
      data: gallery
    });
  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).json({ message: 'Error fetching gallery', error: error.message });
  }
};

// Create gallery
export const createGallery = async (req, res) => {
  try {
    const { gallery_name, gallery_description, gallery_date, group_id } = req.body;

    const newGallery = await GalleryList.create({
      gallery_name,
      gallery_description,
      gallery_date: gallery_date || new Date(),
      group_id
    });

    res.status(201).json({
      success: true,
      message: 'Gallery created successfully',
      data: newGallery
    });
  } catch (error) {
    console.error('Error creating gallery:', error);
    res.status(500).json({ message: 'Error creating gallery', error: error.message });
  }
};

// Update gallery
export const updateGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const { gallery_name, gallery_description, gallery_date, group_id } = req.body;

    const gallery = await GalleryList.findByPk(id);
    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    await gallery.update({
      gallery_name,
      gallery_description,
      gallery_date,
      group_id
    });

    res.json({
      success: true,
      message: 'Gallery updated successfully',
      data: gallery
    });
  } catch (error) {
    console.error('Error updating gallery:', error);
    res.status(500).json({ message: 'Error updating gallery', error: error.message });
  }
};

// Delete gallery
export const deleteGallery = async (req, res) => {
  try {
    const { id } = req.params;

    const gallery = await GalleryList.findByPk(id);
    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    // Delete all images in the gallery first
    await GalleryImagesMaster.destroy({ where: { gallery_id: id } });

    // Delete the gallery
    await gallery.destroy();

    res.json({
      success: true,
      message: 'Gallery deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting gallery:', error);
    res.status(500).json({ message: 'Error deleting gallery', error: error.message });
  }
};

/**
 * ============================================
 * GALLERY IMAGES MANAGEMENT
 * ============================================
 */

// Get images for a gallery
export const getGalleryImages = async (req, res) => {
  try {
    const { galleryId } = req.params;

    const images = await GalleryImagesMaster.findAll({
      where: { gallery_id: galleryId },
      include: [{ model: GalleryList, as: 'gallery' }]
    });

    res.json({
      success: true,
      data: images
    });
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    res.status(500).json({ message: 'Error fetching gallery images', error: error.message });
  }
};

// Add image to gallery
export const addGalleryImage = async (req, res) => {
  try {
    const { gallery_id, image_name, image_description, group_id } = req.body;

    const newImage = await GalleryImagesMaster.create({
      gallery_id,
      image_name,
      image_description,
      group_id
    });

    res.status(201).json({
      success: true,
      message: 'Image added to gallery successfully',
      data: newImage
    });
  } catch (error) {
    console.error('Error adding gallery image:', error);
    res.status(500).json({ message: 'Error adding gallery image', error: error.message });
  }
};

// Update gallery image
export const updateGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { image_name, image_description } = req.body;

    const image = await GalleryImagesMaster.findByPk(id);
    if (!image) {
      return res.status(404).json({ message: 'Gallery image not found' });
    }

    await image.update({
      image_name,
      image_description
    });

    res.json({
      success: true,
      message: 'Gallery image updated successfully',
      data: image
    });
  } catch (error) {
    console.error('Error updating gallery image:', error);
    res.status(500).json({ message: 'Error updating gallery image', error: error.message });
  }
};

// Delete gallery image
export const deleteGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await GalleryImagesMaster.findByPk(id);
    if (!image) {
      return res.status(404).json({ message: 'Gallery image not found' });
    }

    await image.destroy();

    res.json({
      success: true,
      message: 'Gallery image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    res.status(500).json({ message: 'Error deleting gallery image', error: error.message });
  }
};

/**
 * ============================================
 * FOOTER LINKS MANAGEMENT
 * ============================================
 */

// Get footer links by app_id
export const getFooterLinks = async (req, res) => {
  try {
    const { app_id } = req.query;
    const where = {};
    if (app_id) where.app_id = app_id;

    const links = await FooterLink.findAll({
      where,
      order: [['order_index', 'ASC']]
    });

    res.json({ success: true, data: links });
  } catch (error) {
    console.error('Error fetching footer links:', error);
    res.status(500).json({ success: false, message: 'Error fetching footer links', error: error.message });
  }
};

// Create footer link
export const createFooterLink = async (req, res) => {
  try {
    const { app_id, title, url, order_index } = req.body;
    if (!app_id || !title || !url) {
      return res.status(400).json({ success: false, message: 'app_id, title, and url are required' });
    }

    const link = await FooterLink.create({ app_id, title, url, order_index: order_index || 0 });
    res.status(201).json({ success: true, message: 'Footer link created', data: link });
  } catch (error) {
    console.error('Error creating footer link:', error);
    res.status(500).json({ success: false, message: 'Error creating footer link', error: error.message });
  }
};

// Update footer link
export const updateFooterLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, order_index } = req.body;

    const link = await FooterLink.findByPk(id);
    if (!link) {
      return res.status(404).json({ success: false, message: 'Footer link not found' });
    }

    await link.update({ title, url, order_index });
    res.json({ success: true, message: 'Footer link updated', data: link });
  } catch (error) {
    console.error('Error updating footer link:', error);
    res.status(500).json({ success: false, message: 'Error updating footer link', error: error.message });
  }
};

// Delete footer link
export const deleteFooterLink = async (req, res) => {
  try {
    const { id } = req.params;
    const link = await FooterLink.findByPk(id);
    if (!link) {
      return res.status(404).json({ success: false, message: 'Footer link not found' });
    }

    await link.destroy();
    res.json({ success: true, message: 'Footer link deleted' });
  } catch (error) {
    console.error('Error deleting footer link:', error);
    res.status(500).json({ success: false, message: 'Error deleting footer link', error: error.message });
  }
};

// Toggle footer link status
export const toggleFooterLinkStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const link = await FooterLink.findByPk(id);
    if (!link) {
      return res.status(404).json({ success: false, message: 'Footer link not found' });
    }

    await link.update({ is_active });
    res.json({ success: true, message: 'Footer link status updated', data: link });
  } catch (error) {
    console.error('Error toggling footer link status:', error);
    res.status(500).json({ success: false, message: 'Error toggling status', error: error.message });
  }
};
