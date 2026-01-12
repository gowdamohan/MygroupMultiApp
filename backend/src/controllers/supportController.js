import { Op } from 'sequelize';
import {
  SupportConversation,
  SupportMessage,
  User,
  GroupCreate
} from '../models/index.js';

/**
 * ============================================
 * SUPPORT CONVERSATIONS
 * ============================================
 */

/**
 * Get all conversations for a user
 * GET /api/v1/support/conversations
 */
export const getConversations = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { channel_type, status, role } = req.query;

    const where = {};
    
    // If user is a partner, show only their conversations
    // If user is admin/accounts/technical, show assigned or all conversations
    if (role === 'partner') {
      where.partner_id = userId;
    } else if (role === 'admin' || role === 'accounts' || role === 'technical') {
      if (channel_type) {
        where.channel_type = channel_type;
      }
      // Optionally filter by assigned_to
      // where[Op.or] = [{ assigned_to: userId }, { assigned_to: null }];
    }

    if (status) where.status = status;
    if (channel_type && role === 'partner') where.channel_type = channel_type;

    const conversations = await SupportConversation.findAll({
      where,
      include: [
        { model: User, as: 'partner', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: GroupCreate, as: 'app', attributes: ['id', 'name'] }
      ],
      order: [['last_message_at', 'DESC'], ['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations',
      error: error.message
    });
  }
};

/**
 * Create a new conversation
 * POST /api/v1/support/conversations
 */
export const createConversation = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { channel_type, app_id, subject, initial_message } = req.body;

    if (!channel_type) {
      return res.status(400).json({
        success: false,
        message: 'channel_type is required (admin, accounts, or technical)'
      });
    }

    // Create conversation
    const conversation = await SupportConversation.create({
      channel_type,
      app_id: app_id || null,
      partner_id: userId,
      subject,
      status: 'open',
      last_message_at: new Date()
    });

    // Create initial message if provided
    if (initial_message) {
      await SupportMessage.create({
        conversation_id: conversation.id,
        sender_id: userId,
        sender_type: 'partner',
        message: initial_message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Conversation created',
      data: conversation
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating conversation',
      error: error.message
    });
  }
};

/**
 * Get messages for a conversation
 * GET /api/v1/support/conversations/:id/messages
 */
export const getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await SupportMessage.findAndCountAll({
      where: { 
        conversation_id: id,
        is_deleted: 0
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'first_name', 'last_name', 'email'] }
      ],
      order: [['created_at', 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        messages: messages.rows,
        total: messages.count,
        page: parseInt(page),
        totalPages: Math.ceil(messages.count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
};

/**
 * Send a message
 * POST /api/v1/support/conversations/:id/messages
 */
export const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { message, sender_type } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Verify conversation exists
    const conversation = await SupportConversation.findByPk(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Create message
    const newMessage = await SupportMessage.create({
      conversation_id: id,
      sender_id: userId,
      sender_type: sender_type || 'partner',
      message
    });

    // Update conversation last_message_at
    await conversation.update({
      last_message_at: new Date(),
      status: conversation.status === 'resolved' ? 'open' : conversation.status
    });

    // Include sender info in response
    const messageWithSender = await SupportMessage.findByPk(newMessage.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'first_name', 'last_name', 'email'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Message sent',
      data: messageWithSender
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

/**
 * Update conversation status
 * PATCH /api/v1/support/conversations/:id/status
 */
export const updateConversationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assigned_to } = req.body;

    const conversation = await SupportConversation.findByPk(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === 'resolved') {
        updateData.resolved_at = new Date();
      }
    }
    if (assigned_to !== undefined) {
      updateData.assigned_to = assigned_to;
    }

    await conversation.update(updateData);

    res.json({
      success: true,
      message: 'Conversation updated',
      data: conversation
    });
  } catch (error) {
    console.error('Update conversation status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating conversation',
      error: error.message
    });
  }
};

/**
 * Mark messages as read
 * POST /api/v1/support/conversations/:id/read
 */
export const markMessagesAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Mark all messages not sent by this user as read
    await SupportMessage.update(
      { is_read: 1, read_at: new Date() },
      {
        where: {
          conversation_id: id,
          sender_id: { [Op.ne]: userId },
          is_read: 0
        }
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read',
      error: error.message
    });
  }
};

/**
 * Get all conversations for admin (support staff)
 * GET /api/v1/support/admin/conversations
 */
export const getAdminConversations = async (req, res) => {
  try {
    const { channel, status, app_id } = req.query;

    const where = {};
    if (channel) where.channel_type = channel;
    if (status) where.status = status;
    if (app_id) where.app_id = app_id;

    const conversations = await SupportConversation.findAll({
      where,
      include: [
        { model: User, as: 'partner', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: GroupCreate, as: 'app', attributes: ['id', 'name'] }
      ],
      order: [['last_message_at', 'DESC'], ['created_at', 'DESC']]
    });

    // Map for frontend compatibility
    const mappedConversations = conversations.map(c => ({
      ...c.toJSON(),
      channel: c.channel_type,
      user: c.partner
    }));

    res.json({
      success: true,
      data: mappedConversations
    });
  } catch (error) {
    console.error('Get admin conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations',
      error: error.message
    });
  }
};

/**
 * Get unread message count
 * GET /api/v1/support/unread-count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { role } = req.query;

    let conversationWhere = {};

    if (role === 'partner') {
      conversationWhere.partner_id = userId;
    }

    const conversations = await SupportConversation.findAll({
      where: conversationWhere,
      attributes: ['id']
    });

    const conversationIds = conversations.map(c => c.id);

    const unreadCount = await SupportMessage.count({
      where: {
        conversation_id: { [Op.in]: conversationIds },
        sender_id: { [Op.ne]: userId },
        is_read: 0
      }
    });

    res.json({
      success: true,
      data: { unread_count: unreadCount }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting unread count',
      error: error.message
    });
  }
};

