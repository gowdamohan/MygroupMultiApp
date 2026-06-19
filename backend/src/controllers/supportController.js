import { Op } from 'sequelize';
import {
  SupportConversation,
  SupportMessage,
  User,
  GroupCreate,
  ClientRegistration
} from '../models/index.js';
import SupportChatGroup from '../models/SupportChatGroup.js';
import { getAppIdForChannel } from '../utils/supportChannelConfig.js';

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

    const resolvedAppId = app_id || getAppIdForChannel(channel_type);

    // Create conversation
    const conversation = await SupportConversation.create({
      channel_type,
      app_id: resolvedAppId,
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

    // Normalise sender_type to a valid ENUM value.
    // The DB ENUM is: 'partner' | 'admin' | 'accounts' | 'technical' | 'system'
    // Old frontends sent 'support' which MySQL stores as '' — map everything
    // non-partner to 'admin' to ensure a clean stored value.
    const VALID_SENDER_TYPES = ['partner', 'admin', 'accounts', 'technical', 'system'];
    const resolvedSenderType = VALID_SENDER_TYPES.includes(sender_type)
      ? sender_type
      : sender_type === 'partner' ? 'partner' : 'admin';

    // Create message
    const newMessage = await SupportMessage.create({
      conversation_id: id,
      sender_id: userId,
      sender_type: resolvedSenderType,
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
    const { channel, status, app_id, filter } = req.query;

    const where = {};
    if (channel) where.channel_type = channel;
    if (status) where.status = status;
    if (app_id) where.app_id = app_id;
    if (filter === 'shortlisted') where.is_shortlisted = 1;
    else if (filter && String(filter).startsWith('group_')) where.chat_group = filter;

    const conversations = await SupportConversation.findAll({
      where,
      include: [
        { model: User, as: 'partner', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: GroupCreate, as: 'app', attributes: ['id', 'name'] }
      ],
      order: [['last_message_at', 'DESC'], ['created_at', 'DESC']]
    });

    const conversationIds = conversations.map(c => c.id);
    const unreadRows = conversationIds.length
      ? await SupportMessage.findAll({
          attributes: [
            'conversation_id',
            [SupportMessage.sequelize.fn('COUNT', SupportMessage.sequelize.col('id')), 'unread_count']
          ],
          where: {
            conversation_id: { [Op.in]: conversationIds },
            sender_type: 'partner',
            is_read: 0,
            is_deleted: 0
          },
          group: ['conversation_id'],
          raw: true
        })
      : [];

    const unreadMap = Object.fromEntries(
      unreadRows.map(r => [r.conversation_id, parseInt(r.unread_count, 10) || 0])
    );

    let mappedConversations = conversations.map(c => ({
      ...c.toJSON(),
      channel: c.channel_type,
      user: c.partner,
      unread_count: unreadMap[c.id] || 0
    }));

    if (filter === 'unread') {
      mappedConversations = mappedConversations.filter(c => c.unread_count > 0);
    }

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

/**
 * Get partners registered to an app (for chat group assignment).
 * GET /api/v1/support/admin/partners?app_id=
 */
export const getAppChatPartners = async (req, res) => {
  try {
    const appId = parseInt(req.query.app_id, 10);
    if (!appId || isNaN(appId)) {
      return res.status(400).json({ success: false, message: 'app_id is required' });
    }

    const registrations = await ClientRegistration.findAll({
      where: { group_id: appId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const partners = registrations
      .filter(reg => reg.user)
      .map(reg => ({
        id: reg.user.id,
        first_name: reg.user.first_name,
        last_name: reg.user.last_name,
        email: reg.user.email,
        registration_status: reg.status
      }));

    res.json({ success: true, data: partners });
  } catch (error) {
    console.error('Get app chat partners error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching partners',
      error: error.message
    });
  }
};

/**
 * Get chat groups for an app.
 * GET /api/v1/support/admin/chat-groups?app_id=
 */
export const getChatGroups = async (req, res) => {
  try {
    const appId = parseInt(req.query.app_id, 10);
    if (!appId || isNaN(appId)) {
      return res.status(400).json({ success: false, message: 'app_id is required' });
    }

    const groups = await SupportChatGroup.findAll({
      where: { app_id: appId },
      order: [['created_at', 'ASC'], ['id', 'ASC']]
    });

    res.json({
      success: true,
      data: groups.map(g => {
        const plain = g.get ? g.get({ plain: true }) : g;
        return {
          id: plain.id,
          app_id: plain.app_id,
          name: plain.name,
          key: `group_${plain.id}`,
          created_at: plain.created_at
        };
      })
    });
  } catch (error) {
    console.error('Get chat groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat groups',
      error: error.message
    });
  }
};

const findOrCreateAdminConversation = async (partnerId, appId) => {
  let conversation = await SupportConversation.findOne({
    where: {
      partner_id: partnerId,
      channel_type: 'admin',
      app_id: appId
    },
    order: [['last_message_at', 'DESC'], ['created_at', 'DESC']]
  });

  if (!conversation) {
    conversation = await SupportConversation.create({
      channel_type: 'admin',
      app_id: appId,
      partner_id: partnerId,
      subject: 'Admin Chat',
      status: 'open',
      last_message_at: new Date()
    });
  }

  return conversation;
};

/**
 * Create a chat group and assign partners' admin conversations to it.
 * POST /api/v1/support/admin/chat-groups
 * Body: app_id, name, partner_ids[]
 */
export const createChatGroup = async (req, res) => {
  try {
    const appId = parseInt(req.body.app_id, 10);
    const name = (req.body.name || '').toString().trim();
    const partnerIds = Array.isArray(req.body.partner_ids)
      ? [...new Set(req.body.partner_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id)))]
      : [];

    if (!appId || isNaN(appId)) {
      return res.status(400).json({ success: false, message: 'app_id is required' });
    }
    if (!name) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }
    if (partnerIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one partner' });
    }

    const group = await SupportChatGroup.create({ app_id: appId, name });
    const groupKey = `group_${group.id}`;

    let assignedCount = 0;
    for (const partnerId of partnerIds) {
      const registration = await ClientRegistration.findOne({
        where: { user_id: partnerId, group_id: appId }
      });
      if (!registration) continue;

      const conversation = await findOrCreateAdminConversation(partnerId, appId);
      await conversation.update({ chat_group: groupKey });
      assignedCount += 1;
    }

    if (assignedCount === 0) {
      await group.destroy();
      return res.status(400).json({
        success: false,
        message: 'No valid partners found for this app'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Chat group created',
      data: {
        id: group.id,
        app_id: group.app_id,
        name: group.name,
        key: groupKey,
        assigned_count: assignedCount,
        created_at: group.created_at
      }
    });
  } catch (error) {
    console.error('Create chat group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating chat group',
      error: error.message
    });
  }
};

/**
 * Assign partners to an existing chat group.
 * PUT /api/v1/support/admin/chat-groups/:id/assign
 * Body: app_id, partner_ids[]
 */
export const assignChatGroup = async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    const appId = parseInt(req.body.app_id, 10);
    const partnerIds = Array.isArray(req.body.partner_ids)
      ? [...new Set(req.body.partner_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id)))]
      : [];

    if (!groupId || isNaN(groupId)) {
      return res.status(400).json({ success: false, message: 'Invalid group id' });
    }
    if (!appId || isNaN(appId)) {
      return res.status(400).json({ success: false, message: 'app_id is required' });
    }
    if (partnerIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one partner' });
    }

    const group = await SupportChatGroup.findOne({ where: { id: groupId, app_id: appId } });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Chat group not found' });
    }

    const groupKey = `group_${group.id}`;
    let assignedCount = 0;

    for (const partnerId of partnerIds) {
      const registration = await ClientRegistration.findOne({
        where: { user_id: partnerId, group_id: appId }
      });
      if (!registration) continue;

      const conversation = await findOrCreateAdminConversation(partnerId, appId);
      await conversation.update({ chat_group: groupKey });
      assignedCount += 1;
    }

    res.json({
      success: true,
      message: 'Partners assigned to group',
      data: { key: groupKey, assigned_count: assignedCount }
    });
  } catch (error) {
    console.error('Assign chat group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning chat group',
      error: error.message
    });
  }
};

