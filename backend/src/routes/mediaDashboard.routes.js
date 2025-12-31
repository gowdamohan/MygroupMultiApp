import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import * as controller from '../controllers/mediaDashboardController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ============================================
// SOCIAL LINKS
// ============================================
router.get('/social-links/:channelId', authenticate, controller.getSocialLinks);
router.post('/social-links/:channelId', authenticate, controller.saveSocialLink);

// ============================================
// INTERACTIONS
// ============================================
router.get('/interactions/:channelId', authenticate, controller.getInteractions);

// ============================================
// MEDIA LINKS
// ============================================
router.get('/media-links/:channelId', authenticate, controller.getMediaLinks);
router.post('/media-links/:channelId', authenticate, controller.saveMediaLink);

// ============================================
// SWITCHER
// ============================================
router.get('/switcher/:channelId', authenticate, controller.getSwitcher);
router.put('/switcher/:channelId', authenticate, controller.updateSwitcher);

// ============================================
// OFFLINE MEDIA
// ============================================
router.get('/offline-media/:channelId', authenticate, controller.getOfflineMedia);
router.post('/offline-media/:channelId', authenticate, upload.fields([
  { name: 'media_file', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), controller.uploadOfflineMedia);
router.delete('/offline-media/:id', authenticate, controller.deleteOfflineMedia);
router.put('/offline-media/:id/default', authenticate, controller.setDefaultOfflineMedia);

// ============================================
// DOCUMENTS
// ============================================
router.get('/documents/:channelId', authenticate, controller.getDocuments);
router.post('/documents/:channelId', authenticate, upload.single('file'), controller.uploadDocument);
router.delete('/documents/:id', authenticate, controller.deleteDocument);

// ============================================
// AWARDS
// ============================================
router.get('/awards/:channelId', authenticate, controller.getAwards);
router.post('/awards/:channelId', authenticate, upload.single('image'), controller.uploadAward);
router.delete('/awards/:id', authenticate, controller.deleteAward);

// ============================================
// NEWSLETTERS
// ============================================
router.get('/newsletters/:channelId', authenticate, controller.getNewsletters);
router.post('/newsletters/:channelId', authenticate, upload.single('file'), controller.uploadNewsletter);
router.delete('/newsletters/:id', authenticate, controller.deleteNewsletter);

// ============================================
// GALLERY
// ============================================
router.get('/gallery/albums/:channelId', authenticate, controller.getAlbums);
router.post('/gallery/albums/:channelId', authenticate, upload.single('cover'), controller.createAlbum);
router.delete('/gallery/albums/:id', authenticate, controller.deleteAlbum);
router.get('/gallery/images/:albumId', authenticate, controller.getAlbumImages);
router.post('/gallery/images/:albumId', authenticate, upload.array('images', 20), controller.uploadAlbumImages);
router.delete('/gallery/images/:id', authenticate, controller.deleteAlbumImage);

// ============================================
// TEAM
// ============================================
router.get('/team/:channelId', authenticate, controller.getTeam);
router.post('/team/:channelId', authenticate, upload.single('photo'), controller.addTeamMember);
router.put('/team/:id', authenticate, upload.single('photo'), controller.updateTeamMember);
router.delete('/team/:id', authenticate, controller.deleteTeamMember);

export default router;

