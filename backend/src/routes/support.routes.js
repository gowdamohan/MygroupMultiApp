import express from 'express';
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  updateConversationStatus,
  markMessagesAsRead,
  getUnreadCount,
  getAdminConversations
} from '../controllers/supportController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * CONVERSATIONS
 */

// Get all conversations (with filters)
router.get('/conversations', getConversations);

// Create new conversation
router.post('/conversations', createConversation);

// Update conversation status
router.patch('/conversations/:id/status', updateConversationStatus);

// Mark messages as read
router.post('/conversations/:id/read', markMessagesAsRead);

/**
 * MESSAGES
 */

// Get messages for a conversation
router.get('/conversations/:id/messages', getMessages);

// Send a message
router.post('/conversations/:id/messages', sendMessage);

/**
 * UTILITIES
 */

// Get unread message count
router.get('/unread-count', getUnreadCount);

/**
 * ADMIN ROUTES
 */

// Get all conversations for admin/support staff
router.get('/admin/conversations', getAdminConversations);

export default router;

