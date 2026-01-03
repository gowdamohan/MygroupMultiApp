import {
  MediaChannel,
  MediaSocialLinks,
  MediaInteractions,
  MediaLinks,
  MediaSwitcher,
  MediaOfflineMedia,
  MediaDocuments,
  MediaAwards,
  MediaNewsletters,
  MediaGalleryAlbums,
  MediaGalleryImages,
  MediaTeam,
  MediaHeaderAds,
  MediaComments,
  User,
  UserRegistration
} from '../models/index.js';
import { uploadFile, deleteFile, getSignedReadUrl } from '../services/wasabiService.js';

// ============================================
// SOCIAL LINKS
// ============================================

/**
 * Get all social links for a channel
 */
export const getSocialLinks = async (req, res) => {
  try {
    const { channelId } = req.params;
    const links = await MediaSocialLinks.findAll({
      where: { media_channel_id: channelId, is_active: 1 },
      order: [['platform', 'ASC']]
    });
    
    // Return as object with platform as key
    const linksObject = {};
    const platforms = ['website', 'youtube', 'facebook', 'instagram', 'twitter', 'linkedin', 'blog'];
    platforms.forEach(p => { linksObject[p] = ''; });
    links.forEach(link => { linksObject[link.platform] = link.url || ''; });
    
    res.json({ success: true, data: linksObject });
  } catch (error) {
    console.error('Error getting social links:', error);
    res.status(500).json({ success: false, message: 'Failed to get social links' });
  }
};

/**
 * Save a social link for a channel
 */
export const saveSocialLink = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { platform, url } = req.body;
    
    if (!platform) {
      return res.status(400).json({ success: false, message: 'Platform is required' });
    }
    
    const [link, created] = await MediaSocialLinks.findOrCreate({
      where: { media_channel_id: channelId, platform },
      defaults: { url, is_active: 1 }
    });
    
    if (!created) {
      await link.update({ url });
    }
    
    res.json({ success: true, message: 'Social link saved successfully', data: link });
  } catch (error) {
    console.error('Error saving social link:', error);
    res.status(500).json({ success: false, message: 'Failed to save social link' });
  }
};

// ============================================
// MEDIA INTERACTIONS
// ============================================

/**
 * Get interactions for a channel
 */
export const getInteractions = async (req, res) => {
  try {
    const { channelId } = req.params;
    let interactions = await MediaInteractions.findOne({
      where: { media_channel_id: channelId }
    });
    
    if (!interactions) {
      interactions = await MediaInteractions.create({ media_channel_id: channelId });
    }
    
    res.json({ success: true, data: interactions });
  } catch (error) {
    console.error('Error getting interactions:', error);
    res.status(500).json({ success: false, message: 'Failed to get interactions' });
  }
};

// ============================================
// MEDIA LINKS
// ============================================

/**
 * Get media links for a channel
 */
export const getMediaLinks = async (req, res) => {
  try {
    const { channelId } = req.params;
    const links = await MediaLinks.findAll({
      where: { media_channel_id: channelId, is_active: 1 }
    });
    
    const linksObject = { live: '', mymedia: '' };
    links.forEach(link => { linksObject[link.link_type] = link.url || ''; });
    
    res.json({ success: true, data: linksObject });
  } catch (error) {
    console.error('Error getting media links:', error);
    res.status(500).json({ success: false, message: 'Failed to get media links' });
  }
};

/**
 * Save a media link
 */
export const saveMediaLink = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { link_type, url } = req.body;
    
    if (!link_type) {
      return res.status(400).json({ success: false, message: 'Link type is required' });
    }
    
    const [link, created] = await MediaLinks.findOrCreate({
      where: { media_channel_id: channelId, link_type },
      defaults: { url, is_active: 1 }
    });
    
    if (!created) {
      await link.update({ url });
    }
    
    res.json({ success: true, message: 'Media link saved successfully', data: link });
  } catch (error) {
    console.error('Error saving media link:', error);
    res.status(500).json({ success: false, message: 'Failed to save media link' });
  }
};

// ============================================
// SWITCHER
// ============================================

/**
 * Get switcher settings for a channel
 */
export const getSwitcher = async (req, res) => {
  try {
    const { channelId } = req.params;
    let switcher = await MediaSwitcher.findOne({
      where: { media_channel_id: channelId },
      include: [{ model: MediaOfflineMedia, as: 'offlineMedia' }]
    });

    if (!switcher) {
      switcher = await MediaSwitcher.create({ media_channel_id: channelId });
    }

    res.json({ success: true, data: switcher });
  } catch (error) {
    console.error('Error getting switcher:', error);
    res.status(500).json({ success: false, message: 'Failed to get switcher' });
  }
};

/**
 * Update switcher settings
 */
export const updateSwitcher = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { active_source, live_url, mymedia_url, offline_media_id } = req.body;

    let switcher = await MediaSwitcher.findOne({ where: { media_channel_id: channelId } });

    if (!switcher) {
      switcher = await MediaSwitcher.create({
        media_channel_id: channelId,
        active_source: active_source || 'offline',
        live_url,
        mymedia_url,
        offline_media_id
      });
    } else {
      await switcher.update({ active_source, live_url, mymedia_url, offline_media_id });
    }

    res.json({ success: true, message: 'Switcher updated successfully', data: switcher });
  } catch (error) {
    console.error('Error updating switcher:', error);
    res.status(500).json({ success: false, message: 'Failed to update switcher' });
  }
};

// ============================================
// OFFLINE MEDIA
// ============================================

/**
 * Get all offline media for a channel
 */
export const getOfflineMedia = async (req, res) => {
  try {
    const { channelId } = req.params;
    const media = await MediaOfflineMedia.findAll({
      where: { media_channel_id: channelId, is_active: 1 },
      order: [['is_default', 'DESC'], ['created_at', 'DESC']]
    });
    res.json({ success: true, data: media });
  } catch (error) {
    console.error('Error getting offline media:', error);
    res.status(500).json({ success: false, message: 'Failed to get offline media' });
  }
};

/**
 * Upload offline media
 */
export const uploadOfflineMedia = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { media_type, title, is_default } = req.body;

    if (!req.files || !req.files.media_file) {
      return res.status(400).json({ success: false, message: 'Media file is required' });
    }

    const mediaFile = req.files.media_file[0];
    const folder = `media_offline/channel_${channelId}`;

    // Upload media file
    const mediaResult = await uploadFile(mediaFile.buffer, mediaFile.originalname, mediaFile.mimetype, folder);
    if (!mediaResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to upload media file' });
    }

    // Upload thumbnail if audio type and thumbnail provided
    let thumbnailPath = null, thumbnailUrl = null;
    if (media_type === 'audio' && req.files.thumbnail && req.files.thumbnail[0]) {
      const thumbFile = req.files.thumbnail[0];
      const thumbResult = await uploadFile(thumbFile.buffer, thumbFile.originalname, thumbFile.mimetype, `${folder}/thumbnails`);
      if (thumbResult.success) {
        thumbnailPath = thumbResult.fileName;
        thumbnailUrl = thumbResult.publicUrl;
      }
    }

    // If setting as default, unset other defaults
    if (is_default === '1' || is_default === true) {
      await MediaOfflineMedia.update({ is_default: 0 }, { where: { media_channel_id: channelId } });
    }

    const offlineMedia = await MediaOfflineMedia.create({
      media_channel_id: channelId,
      media_type,
      title,
      media_file_path: mediaResult.fileName,
      media_file_url: mediaResult.publicUrl,
      thumbnail_path: thumbnailPath,
      thumbnail_url: thumbnailUrl,
      is_default: is_default === '1' || is_default === true ? 1 : 0,
      file_size: mediaFile.size
    });

    res.json({ success: true, message: 'Offline media uploaded successfully', data: offlineMedia });
  } catch (error) {
    console.error('Error uploading offline media:', error);
    res.status(500).json({ success: false, message: 'Failed to upload offline media' });
  }
};

/**
 * Delete offline media
 */
export const deleteOfflineMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await MediaOfflineMedia.findByPk(id);

    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    // Delete files from Wasabi
    try {
      await deleteFile(media.media_file_path);
      if (media.thumbnail_path) await deleteFile(media.thumbnail_path);
    } catch (e) { console.error('Error deleting files:', e); }

    await media.destroy();
    res.json({ success: true, message: 'Offline media deleted successfully' });
  } catch (error) {
    console.error('Error deleting offline media:', error);
    res.status(500).json({ success: false, message: 'Failed to delete offline media' });
  }
};

/**
 * Set default offline media
 */
export const setDefaultOfflineMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await MediaOfflineMedia.findByPk(id);

    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    // Unset all defaults for this channel
    await MediaOfflineMedia.update({ is_default: 0 }, { where: { media_channel_id: media.media_channel_id } });

    // Set this as default
    await media.update({ is_default: 1 });

    res.json({ success: true, message: 'Default media set successfully' });
  } catch (error) {
    console.error('Error setting default media:', error);
    res.status(500).json({ success: false, message: 'Failed to set default media' });
  }
};

// ============================================
// DOCUMENTS (Dashboard Documents - Title, Image/PDF)
// ============================================

export const getDocuments = async (req, res) => {
  try {
    const { channelId } = req.params;
    const docs = await MediaDocuments.findAll({
      where: { media_channel_id: channelId, is_active: 1 },
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });
    res.json({ success: true, data: docs });
  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json({ success: false, message: 'Failed to get documents' });
  }
};

export const uploadDocument = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { title } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File is required' });
    }
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const isPdf = req.file.mimetype === 'application/pdf';
    const document_type = isPdf ? 'pdf' : 'image';
    const folder = `media_documents_new/channel_${channelId}`;

    const result = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, folder);
    if (!result.success) {
      return res.status(500).json({ success: false, message: 'Failed to upload file' });
    }

    const doc = await MediaDocuments.create({
      media_channel_id: channelId,
      title,
      document_type,
      file_path: result.fileName,
      file_url: result.publicUrl,
      file_size: req.file.size
    });

    res.json({ success: true, message: 'Document uploaded successfully', data: doc });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await MediaDocuments.findByPk(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    try { await deleteFile(doc.file_path); } catch (e) { console.error('Error deleting file:', e); }
    await doc.destroy();
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
};

// ============================================
// AWARDS
// ============================================

export const getAwards = async (req, res) => {
  try {
    const { channelId } = req.params;
    const awards = await MediaAwards.findAll({
      where: { media_channel_id: channelId, is_active: 1 },
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });
    res.json({ success: true, data: awards });
  } catch (error) {
    console.error('Error getting awards:', error);
    res.status(500).json({ success: false, message: 'Failed to get awards' });
  }
};

export const uploadAward = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { title } = req.body;

    if (!req.file) return res.status(400).json({ success: false, message: 'Image is required' });
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const folder = `media_awards/channel_${channelId}`;
    const result = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, folder);
    if (!result.success) return res.status(500).json({ success: false, message: 'Failed to upload image' });

    const award = await MediaAwards.create({
      media_channel_id: channelId,
      title,
      image_path: result.fileName,
      image_url: result.publicUrl
    });

    res.json({ success: true, message: 'Award uploaded successfully', data: award });
  } catch (error) {
    console.error('Error uploading award:', error);
    res.status(500).json({ success: false, message: 'Failed to upload award' });
  }
};

export const deleteAward = async (req, res) => {
  try {
    const { id } = req.params;
    const award = await MediaAwards.findByPk(id);
    if (!award) return res.status(404).json({ success: false, message: 'Award not found' });

    try { await deleteFile(award.image_path); } catch (e) { console.error('Error deleting file:', e); }
    await award.destroy();
    res.json({ success: true, message: 'Award deleted successfully' });
  } catch (error) {
    console.error('Error deleting award:', error);
    res.status(500).json({ success: false, message: 'Failed to delete award' });
  }
};

// ============================================
// NEWSLETTERS
// ============================================

export const getNewsletters = async (req, res) => {
  try {
    const { channelId } = req.params;
    const newsletters = await MediaNewsletters.findAll({
      where: { media_channel_id: channelId, is_active: 1 },
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });
    res.json({ success: true, data: newsletters });
  } catch (error) {
    console.error('Error getting newsletters:', error);
    res.status(500).json({ success: false, message: 'Failed to get newsletters' });
  }
};

export const uploadNewsletter = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { title } = req.body;

    if (!req.file) return res.status(400).json({ success: false, message: 'File is required' });
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const isPdf = req.file.mimetype === 'application/pdf';
    const document_type = isPdf ? 'pdf' : 'image';
    const folder = `media_newsletters/channel_${channelId}`;

    const result = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, folder);
    if (!result.success) return res.status(500).json({ success: false, message: 'Failed to upload file' });

    const newsletter = await MediaNewsletters.create({
      media_channel_id: channelId,
      title,
      document_type,
      file_path: result.fileName,
      file_url: result.publicUrl,
      file_size: req.file.size
    });

    res.json({ success: true, message: 'Newsletter uploaded successfully', data: newsletter });
  } catch (error) {
    console.error('Error uploading newsletter:', error);
    res.status(500).json({ success: false, message: 'Failed to upload newsletter' });
  }
};

export const deleteNewsletter = async (req, res) => {
  try {
    const { id } = req.params;
    const newsletter = await MediaNewsletters.findByPk(id);
    if (!newsletter) return res.status(404).json({ success: false, message: 'Newsletter not found' });

    try { await deleteFile(newsletter.file_path); } catch (e) { console.error('Error deleting file:', e); }
    await newsletter.destroy();
    res.json({ success: true, message: 'Newsletter deleted successfully' });
  } catch (error) {
    console.error('Error deleting newsletter:', error);
    res.status(500).json({ success: false, message: 'Failed to delete newsletter' });
  }
};

// ============================================
// GALLERY
// ============================================

export const getAlbums = async (req, res) => {
  try {
    const { channelId } = req.params;
    const albums = await MediaGalleryAlbums.findAll({
      where: { media_channel_id: channelId, is_active: 1 },
      include: [{ model: MediaGalleryImages, as: 'images', where: { is_active: 1 }, required: false }],
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });
    res.json({ success: true, data: albums });
  } catch (error) {
    console.error('Error getting albums:', error);
    res.status(500).json({ success: false, message: 'Failed to get albums' });
  }
};

export const createAlbum = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { album_name, description } = req.body;

    if (!album_name) return res.status(400).json({ success: false, message: 'Album name is required' });

    let cover_image_path = null, cover_image_url = null;
    if (req.file) {
      const folder = `media_gallery/channel_${channelId}/covers`;
      const result = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, folder);
      if (result.success) {
        cover_image_path = result.fileName;
        cover_image_url = result.publicUrl;
      }
    }

    const album = await MediaGalleryAlbums.create({
      media_channel_id: channelId,
      album_name,
      description,
      cover_image_path,
      cover_image_url
    });

    res.json({ success: true, message: 'Album created successfully', data: album });
  } catch (error) {
    console.error('Error creating album:', error);
    res.status(500).json({ success: false, message: 'Failed to create album' });
  }
};

export const deleteAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const album = await MediaGalleryAlbums.findByPk(id, {
      include: [{ model: MediaGalleryImages, as: 'images' }]
    });
    if (!album) return res.status(404).json({ success: false, message: 'Album not found' });

    // Delete all images
    for (const img of album.images || []) {
      try {
        await deleteFile(img.image_path);
        if (img.thumbnail_path) await deleteFile(img.thumbnail_path);
      } catch (e) { console.error('Error deleting image:', e); }
    }

    // Delete cover
    if (album.cover_image_path) {
      try { await deleteFile(album.cover_image_path); } catch (e) { console.error('Error deleting cover:', e); }
    }

    await album.destroy();
    res.json({ success: true, message: 'Album deleted successfully' });
  } catch (error) {
    console.error('Error deleting album:', error);
    res.status(500).json({ success: false, message: 'Failed to delete album' });
  }
};

export const getAlbumImages = async (req, res) => {
  try {
    const { albumId } = req.params;
    const images = await MediaGalleryImages.findAll({
      where: { album_id: albumId, is_active: 1 },
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });
    res.json({ success: true, data: images });
  } catch (error) {
    console.error('Error getting album images:', error);
    res.status(500).json({ success: false, message: 'Failed to get images' });
  }
};

export const uploadAlbumImages = async (req, res) => {
  try {
    const { albumId } = req.params;
    const album = await MediaGalleryAlbums.findByPk(albumId);
    if (!album) return res.status(404).json({ success: false, message: 'Album not found' });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Images are required' });
    }

    const folder = `media_gallery/channel_${album.media_channel_id}/album_${albumId}`;
    const uploadedImages = [];

    for (const file of req.files) {
      const result = await uploadFile(file.buffer, file.originalname, file.mimetype, folder);
      if (result.success) {
        const image = await MediaGalleryImages.create({
          album_id: albumId,
          image_name: file.originalname,
          image_path: result.fileName,
          image_url: result.publicUrl,
          file_size: file.size
        });
        uploadedImages.push(image);
      }
    }

    // Update album images count
    const count = await MediaGalleryImages.count({ where: { album_id: albumId, is_active: 1 } });
    await album.update({ images_count: count });

    // Set first image as cover if no cover
    if (!album.cover_image_url && uploadedImages.length > 0) {
      await album.update({
        cover_image_path: uploadedImages[0].image_path,
        cover_image_url: uploadedImages[0].image_url
      });
    }

    res.json({ success: true, message: `${uploadedImages.length} images uploaded`, data: uploadedImages });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ success: false, message: 'Failed to upload images' });
  }
};

export const deleteAlbumImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await MediaGalleryImages.findByPk(id);
    if (!image) return res.status(404).json({ success: false, message: 'Image not found' });

    const albumId = image.album_id;
    try {
      await deleteFile(image.image_path);
      if (image.thumbnail_path) await deleteFile(image.thumbnail_path);
    } catch (e) { console.error('Error deleting files:', e); }

    await image.destroy();

    // Update album count
    const count = await MediaGalleryImages.count({ where: { album_id: albumId, is_active: 1 } });
    await MediaGalleryAlbums.update({ images_count: count }, { where: { id: albumId } });

    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ success: false, message: 'Failed to delete image' });
  }
};

// ============================================
// TEAM
// ============================================

export const getTeam = async (req, res) => {
  try {
    const { channelId } = req.params;
    const members = await MediaTeam.findAll({
      where: { media_channel_id: channelId, is_active: 1 },
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });
    res.json({ success: true, data: members });
  } catch (error) {
    console.error('Error getting team:', error);
    res.status(500).json({ success: false, message: 'Failed to get team' });
  }
};

export const addTeamMember = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { name, designation, id_number, email } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    let photo_path = null, photo_url = null;
    if (req.file) {
      const folder = `media_team/channel_${channelId}`;
      const result = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, folder);
      if (result.success) {
        photo_path = result.fileName;
        photo_url = result.publicUrl;
      }
    }

    const member = await MediaTeam.create({
      media_channel_id: channelId,
      name,
      designation,
      id_number,
      email,
      photo_path,
      photo_url
    });

    res.json({ success: true, message: 'Team member added successfully', data: member });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ success: false, message: 'Failed to add team member' });
  }
};

export const updateTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, designation, id_number, email } = req.body;

    const member = await MediaTeam.findByPk(id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    const updates = { name, designation, id_number, email };

    if (req.file) {
      // Delete old photo
      if (member.photo_path) {
        try { await deleteFile(member.photo_path); } catch (e) { console.error('Error deleting old photo:', e); }
      }

      const folder = `media_team/channel_${member.media_channel_id}`;
      const result = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, folder);
      if (result.success) {
        updates.photo_path = result.fileName;
        updates.photo_url = result.publicUrl;
      }
    }

    await member.update(updates);
    res.json({ success: true, message: 'Team member updated successfully', data: member });
  } catch (error) {
    console.error('Error updating team member:', error);
    res.status(500).json({ success: false, message: 'Failed to update team member' });
  }
};

export const deleteTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await MediaTeam.findByPk(id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    if (member.photo_path) {
      try { await deleteFile(member.photo_path); } catch (e) { console.error('Error deleting photo:', e); }
    }

    await member.destroy();
    res.json({ success: true, message: 'Team member deleted successfully' });
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).json({ success: false, message: 'Failed to delete team member' });
  }
};

// ============================================
// HEADER ADS
// ============================================

/**
 * Get header ads for a channel
 */
export const getHeaderAds = async (req, res) => {
  try {
    const { channelId } = req.params;

    // Fetch all active header ads for the channel
    const ads = await MediaHeaderAds.findAll({
      where: { media_channel_id: channelId, is_active: 1 },
      order: [['id', 'ASC']]
    });

    // Get signed URLs for each ad
    const header1Ads = [];
    const header2Ads = [];

    for (const ad of ads) {
      let signedUrl = null;
      if (ad.file_path) {
        try {
          const result = await getSignedReadUrl(ad.file_path);
          signedUrl = result.signedUrl;
        } catch (e) {
          console.error('Error getting signed URL:', e);
          signedUrl = null;
        }
      }

      const adData = {
        id: ad.id,
        file_path: ad.file_path,
        signed_url: signedUrl,
        url: ad.url,
        file_type: ad.file_type
      };

      if (ad.type === 'header1') {
        header1Ads.push(adData);
      } else if (ad.type === 'header2') {
        header2Ads.push(adData);
      }
    }

    res.json({
      success: true,
      data: {
        header1: header1Ads,
        header2: header2Ads
      }
    });
  } catch (error) {
    console.error('Error getting header ads:', error);
    res.status(500).json({ success: false, message: 'Failed to get header ads' });
  }
};

// ============================================
// MEDIA COMMENTS
// ============================================

/**
 * Get all comments for a channel with replies
 */
export const getComments = async (req, res) => {
  try {
    const { channelId } = req.params;

    // Get top-level comments (no parent_id)
    const comments = await MediaComments.findAll({
      where: {
        media_channel_id: channelId,
        parent_id: null,
        is_active: 1
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'email'],
          include: [{
            model: UserRegistration,
            as: 'profile',
            attributes: ['profile_photo']
          }]
        },
        {
          model: MediaComments,
          as: 'replies',
          where: { is_active: 1 },
          required: false,
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'full_name', 'email'],
            include: [{
              model: UserRegistration,
              as: 'profile',
              attributes: ['profile_photo']
            }]
          }]
        }
      ],
      order: [['created_at', 'DESC'], [{ model: MediaComments, as: 'replies' }, 'created_at', 'ASC']]
    });

    res.json({ success: true, data: comments });
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({ success: false, message: 'Failed to get comments' });
  }
};

/**
 * Add a new comment
 */
export const addComment = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { comment_text, parent_id } = req.body;
    const userId = req.user.id;

    const comment = await MediaComments.create({
      media_channel_id: channelId,
      user_id: userId,
      parent_id: parent_id || null,
      comment_text
    });

    // Increment comments count in interactions
    await MediaInteractions.increment('comments_count', {
      where: { media_channel_id: channelId }
    });

    // Fetch the created comment with user info
    const createdComment = await MediaComments.findByPk(comment.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'full_name', 'email'],
        include: [{
          model: UserRegistration,
          as: 'profile',
          attributes: ['profile_photo']
        }]
      }]
    });

    res.json({ success: true, data: createdComment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};

/**
 * Delete a comment
 */
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await MediaComments.findOne({
      where: { id: commentId, user_id: userId }
    });

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    await comment.update({ is_active: 0 });

    // Decrement comments count
    await MediaInteractions.decrement('comments_count', {
      where: { media_channel_id: comment.media_channel_id }
    });

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
};
