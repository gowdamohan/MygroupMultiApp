import { FooterPage, User, GalleryList, GalleryImagesMaster, FooterLink, FooterFaq, FooterPageImage } from '../models/index.js';
import { Op } from 'sequelize';
import { uploadFile, getSignedReadUrl } from '../services/wasabiService.js';

const resolveImageUrl = async (imagePath) => {
  if (!imagePath) return null;
  if (
    imagePath.startsWith('data:') ||
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('/uploads')
  ) {
    return imagePath;
  }

  try {
    const { signedUrl } = await getSignedReadUrl(imagePath);
    return signedUrl;
  } catch (error) {
    console.error('Error signing image URL:', error);
    return imagePath;
  }
};

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

    const data = page ? page.toJSON() : null;
    if (data?.image) {
      data.image_url = await resolveImageUrl(data.image);
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching footer page:', error);
    res.status(500).json({ message: 'Error fetching footer page', error: error.message });
  }
};

// Create or update footer page
export const saveFooterPage = async (req, res) => {
  try {
    const {
      id,
      user_id,
      footer_page_type,
      title,
      tag_line,
      image,
      content,
      url,
      group_name,
      event_date,
      year
    } = req.body;

    const resolvedUserId = req.user?.id || user_id;
    const resolvedGroupName = group_name || req.user?.group_name;

    let imagePath = image || null;
    if (req.file) {
      const uploadResult = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        `footer/pages/${resolvedGroupName || 'corporate'}/${footer_page_type || 'page'}`
      );
      imagePath = uploadResult.fileName;
    }

    const parsedYear = year ? parseInt(year, 10) : null;

    if (id) {
      // Update existing page
      const page = await FooterPage.findByPk(id);
      if (!page) {
        return res.status(404).json({ message: 'Footer page not found' });
      }

      await page.update({
        user_id: resolvedUserId,
        footer_page_type,
        title,
        tag_line,
        image: imagePath,
        content,
        url,
        group_name: resolvedGroupName,
        event_date: event_date || null,
        year: Number.isNaN(parsedYear) ? null : parsedYear
      });

      res.json({
        success: true,
        message: 'Footer page updated successfully',
        data: page
      });
    } else {
      // Create new page
      const newPage = await FooterPage.create({
        user_id: resolvedUserId,
        footer_page_type,
        title,
        tag_line,
        image: imagePath,
        content,
        url,
        group_name: resolvedGroupName,
        event_date: event_date || null,
        year: Number.isNaN(parsedYear) ? null : parsedYear
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

// Get all footer pages by type (multi-entry)
export const getFooterPagesByType = async (req, res) => {
  try {
    const { pageType, group_name } = req.query;
    const where = {};
    if (pageType) where.footer_page_type = pageType;
    if (group_name) where.group_name = group_name;

    const pages = await FooterPage.findAll({
      where,
      order: [['id', 'DESC']]
    });

    const data = await Promise.all(
      pages.map(async (page) => {
        const item = page.toJSON();
        if (item.image) {
          item.image_url = await resolveImageUrl(item.image);
        }
        return item;
      })
    );

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching footer pages:', error);
    res.status(500).json({ message: 'Error fetching footer pages', error: error.message });
  }
};

// Create footer page entry (multi-entry)
export const createFooterPageEntry = async (req, res) => {
  try {
    const {
      user_id,
      footer_page_type,
      title,
      tag_line,
      image,
      content,
      url,
      group_name,
      event_date,
      year
    } = req.body;

    const resolvedUserId = req.user?.id || user_id;
    const resolvedGroupName = group_name || req.user?.group_name;

    let imagePath = image || null;
    if (req.file) {
      const uploadResult = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        `footer/pages/${resolvedGroupName || 'corporate'}/${footer_page_type || 'page'}`
      );
      imagePath = uploadResult.fileName;
    }

    const parsedYear = year ? parseInt(year, 10) : null;

    const newPage = await FooterPage.create({
      user_id: resolvedUserId,
      footer_page_type,
      title,
      tag_line,
      image: imagePath,
      content,
      url,
      group_name: resolvedGroupName,
      event_date: event_date || null,
      year: Number.isNaN(parsedYear) ? null : parsedYear
    });

    const data = newPage.toJSON();
    if (data.image) {
      data.image_url = await resolveImageUrl(data.image);
    }

    res.status(201).json({ success: true, message: 'Footer page created', data });
  } catch (error) {
    console.error('Error creating footer page:', error);
    res.status(500).json({ message: 'Error creating footer page', error: error.message });
  }
};

// Update footer page entry (multi-entry)
export const updateFooterPageEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      user_id,
      footer_page_type,
      title,
      tag_line,
      image,
      content,
      url,
      group_name,
      event_date,
      year
    } = req.body;

    const resolvedUserId = req.user?.id || user_id;
    const resolvedGroupName = group_name || req.user?.group_name;

    const page = await FooterPage.findByPk(id);
    if (!page) {
      return res.status(404).json({ message: 'Footer page not found' });
    }

    let imagePath = page.image;
    if (req.file) {
      const uploadResult = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        `footer/pages/${resolvedGroupName || 'corporate'}/${footer_page_type || page.footer_page_type || 'page'}`
      );
      imagePath = uploadResult.fileName;
    } else if (image) {
      imagePath = image;
    }

    const parsedYear = year ? parseInt(year, 10) : null;

    await page.update({
      user_id: resolvedUserId,
      footer_page_type: footer_page_type || page.footer_page_type,
      title,
      tag_line,
      image: imagePath,
      content,
      url,
      group_name: resolvedGroupName,
      event_date: event_date || null,
      year: Number.isNaN(parsedYear) ? null : parsedYear
    });

    const data = page.toJSON();
    if (data.image) {
      data.image_url = await resolveImageUrl(data.image);
    }

    res.json({ success: true, message: 'Footer page updated', data });
  } catch (error) {
    console.error('Error updating footer page:', error);
    res.status(500).json({ message: 'Error updating footer page', error: error.message });
  }
};

// Delete footer page entry (multi-entry)
export const deleteFooterPageEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const page = await FooterPage.findByPk(id);
    if (!page) {
      return res.status(404).json({ message: 'Footer page not found' });
    }

    await FooterPageImage.destroy({ where: { footer_page_id: id } });
    await page.destroy();

    res.json({ success: true, message: 'Footer page deleted' });
  } catch (error) {
    console.error('Error deleting footer page:', error);
    res.status(500).json({ message: 'Error deleting footer page', error: error.message });
  }
};

/**
 * ============================================
 * FOOTER PAGE IMAGES
 * ============================================
 */

export const getFooterPageImages = async (req, res) => {
  try {
    const { footer_page_id, pageType, group_name } = req.query;
    let pageId = footer_page_id;

    if (!pageId && pageType) {
      const page = await FooterPage.findOne({
        where: {
          footer_page_type: pageType,
          ...(group_name ? { group_name } : {})
        }
      });
      pageId = page?.id || null;
    }

    if (!pageId) {
      return res.json({ success: true, data: [] });
    }

    const images = await FooterPageImage.findAll({
      where: { footer_page_id: pageId },
      order: [['id', 'DESC']]
    });

    const data = await Promise.all(
      images.map(async (image) => {
        const item = image.toJSON();
        item.image_url = await resolveImageUrl(item.image_path);
        return item;
      })
    );

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching footer page images:', error);
    res.status(500).json({ message: 'Error fetching footer page images', error: error.message });
  }
};

export const addFooterPageImage = async (req, res) => {
  try {
    const { footer_page_id, group_name, user_id } = req.body;
    const resolvedUserId = req.user?.id || user_id;
    const resolvedGroupName = group_name || req.user?.group_name;

    if (!footer_page_id) {
      return res.status(400).json({ message: 'footer_page_id is required' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    const uploadResult = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      `footer/page-images/${resolvedGroupName || 'corporate'}/${footer_page_id}`
    );

    const newImage = await FooterPageImage.create({
      footer_page_id,
      image_path: uploadResult.fileName,
      group_name: resolvedGroupName,
      user_id: resolvedUserId
    });

    const data = newImage.toJSON();
    data.image_url = await resolveImageUrl(data.image_path);

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data
    });
  } catch (error) {
    console.error('Error adding footer page image:', error);
    res.status(500).json({ message: 'Error adding footer page image', error: error.message });
  }
};

export const deleteFooterPageImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await FooterPageImage.findByPk(id);
    if (!image) {
      return res.status(404).json({ message: 'Footer page image not found' });
    }

    await image.destroy();

    res.json({
      success: true,
      message: 'Footer page image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting footer page image:', error);
    res.status(500).json({ message: 'Error deleting footer page image', error: error.message });
  }
};

/**
 * ============================================
 * FAQ MANAGEMENT
 * ============================================
 */

export const getFaqs = async (req, res) => {
  try {
    const { group_name } = req.query;
    const where = group_name ? { group_name } : {};

    const faqs = await FooterFaq.findAll({
      where,
      order: [['order_index', 'ASC'], ['id', 'ASC']]
    });

    res.json({ success: true, data: faqs });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ message: 'Error fetching FAQs', error: error.message });
  }
};

export const createFaq = async (req, res) => {
  try {
    const { question, answer, order_index, is_active, group_name, user_id } = req.body;
    const resolvedUserId = req.user?.id || user_id;
    const resolvedGroupName = group_name || req.user?.group_name;

    if (!question || !answer) {
      return res.status(400).json({ message: 'Question and answer are required' });
    }

    const faq = await FooterFaq.create({
      question,
      answer,
      order_index: order_index || 0,
      is_active: is_active ?? 1,
      group_name: resolvedGroupName,
      user_id: resolvedUserId
    });

    res.status(201).json({ success: true, message: 'FAQ created successfully', data: faq });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ message: 'Error creating FAQ', error: error.message });
  }
};

export const updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, order_index, is_active } = req.body;

    const faq = await FooterFaq.findByPk(id);
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }

    await faq.update({
      question,
      answer,
      order_index: order_index ?? faq.order_index,
      is_active: is_active ?? faq.is_active
    });

    res.json({ success: true, message: 'FAQ updated successfully', data: faq });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ message: 'Error updating FAQ', error: error.message });
  }
};

export const deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await FooterFaq.findByPk(id);
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }

    await faq.destroy();

    res.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ message: 'Error deleting FAQ', error: error.message });
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
    const resolvedUserId = req.user?.id || user_id;
    const resolvedGroupName = group_name || req.user?.group_name;

    if (id) {
      // Update existing link
      const link = await FooterPage.findByPk(id);
      if (!link) {
        return res.status(404).json({ message: 'Social media link not found' });
      }

      await link.update({ title, url, group_name: resolvedGroupName, user_id: resolvedUserId });

      res.json({
        success: true,
        message: 'Social media link updated successfully',
        data: link
      });
    } else {
      // Create new link
      const newLink = await FooterPage.create({
        user_id: resolvedUserId,
        footer_page_type: 'social_media',
        title,
        url,
        group_name: resolvedGroupName
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

    const data = await Promise.all(
      galleries.map(async (gallery) => {
        const item = gallery.toJSON();
        if (item.images?.length) {
          item.images = await Promise.all(
            item.images.map(async (image) => ({
              ...image,
              image_url: await resolveImageUrl(image.image_name)
            }))
          );
        }
        return item;
      })
    );

    res.json({ success: true, data });
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

    const data = gallery.toJSON();
    if (data.images?.length) {
      data.images = await Promise.all(
        data.images.map(async (image) => ({
          ...image,
          image_url: await resolveImageUrl(image.image_name)
        }))
      );
    }

    res.json({ success: true, data });
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

    const data = await Promise.all(
      images.map(async (image) => {
        const item = image.toJSON();
        item.image_url = await resolveImageUrl(item.image_name);
        return item;
      })
    );

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    res.status(500).json({ message: 'Error fetching gallery images', error: error.message });
  }
};

// Add image to gallery
export const addGalleryImage = async (req, res) => {
  try {
    const { gallery_id, image_name, image_description, group_id } = req.body;
    const files = req.files || (req.file ? [req.file] : []);

    if (!gallery_id) {
      return res.status(400).json({ message: 'gallery_id is required' });
    }

    if (files.length === 0 && !image_name) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    let createdImages = [];

    if (files.length > 0) {
      const uploads = await Promise.all(
        files.map((file) =>
          uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype,
            `footer/galleries/${group_id || 'corporate'}/${gallery_id}`
          )
        )
      );

      createdImages = await Promise.all(
        uploads.map((upload) =>
          GalleryImagesMaster.create({
            gallery_id,
            image_name: upload.fileName,
            image_description: image_description || '',
            group_id
          })
        )
      );
    } else {
      const newImage = await GalleryImagesMaster.create({
        gallery_id,
        image_name,
        image_description,
        group_id
      });
      createdImages = [newImage];
    }

    const data = await Promise.all(
      createdImages.map(async (image) => {
        const item = image.toJSON();
        item.image_url = await resolveImageUrl(item.image_name);
        return item;
      })
    );

    res.status(201).json({
      success: true,
      message: 'Image added to gallery successfully',
      data
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
