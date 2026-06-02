import { Op } from 'sequelize';
import {
  SupportConversation,
  SupportMessage,
  User,
  ClientRegistration
} from '../models/index.js';
import {
  ADMIN_SUPPORT_APP_ID,
  VALID_CHANNEL_TYPES,
  getAppIdForChannel,
  getChannelLabel
} from '../utils/supportChannelConfig.js';

const PENDING_STATUSES = ['pending', 'submitted', 'verified', 'processed_for_approve', 'inactive'];

/**
 * Returns true when partner registration is approved (active).
 */
const isPartnerApproved = async (userId, groupId) => {
  if (!groupId) return false;
  const clientReg = await ClientRegistration.findOne({
    where: { user_id: userId, group_id: groupId },
    attributes: ['status']
  });
  return clientReg?.status === 'active';
};

/**
 * Resolves channel + app_id based on approval status and request input.
 */
const resolveChannelContext = async (req) => {
  const userId = req.user?.id;
  const groupId = req.user?.group_id;
  const approved = await isPartnerApproved(userId, groupId);

  let channelType = (req.query?.channel_type || req.body?.channel_type || 'admin').toLowerCase();
  if (!VALID_CHANNEL_TYPES.includes(channelType)) {
    channelType = 'admin';
  }

  if (!approved) {
    channelType = 'admin';
  }

  const appId = approved ? getAppIdForChannel(channelType) : ADMIN_SUPPORT_APP_ID;

  return { channelType, appId, approved };
};

/**
 * Find or create a single ongoing conversation per partner + channel + app.
 */
const findOrCreateConversation = async (partnerId, channelType, appId) => {
  let conversation = await SupportConversation.findOne({
    where: {
      partner_id: partnerId,
      channel_type: channelType,
      app_id: appId,
      status: { [Op.in]: ['open', 'pending'] }
    },
    order: [['last_message_at', 'DESC'], ['created_at', 'DESC']]
  });

  if (!conversation) {
    conversation = await SupportConversation.create({
      channel_type: channelType,
      app_id: appId,
      partner_id: partnerId,
      subject: `${getChannelLabel(channelType)} Chat`,
      status: 'open',
      last_message_at: new Date()
    });
  }

  return conversation;
};

const formatMessage = (msg) => {
  const json = msg.toJSON ? msg.toJSON() : msg;
  const isPartner = json.sender_type === 'partner';
  return {
    id: json.id,
    message: json.message,
    sender_type: json.sender_type,
    sender_id: json.sender_id,
    created_at: json.created_at,
    is_own: isPartner,
    direction: isPartner ? 'out' : 'in',
    sender: json.sender || null
  };
};

/**
 * GET /api/v1/admin/chat-messages
 * Query: channel_type, app_id (optional)
 */
export const getPartnerChatMessages = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { channelType, appId, approved } = await resolveChannelContext(req);

    const conversation = await findOrCreateConversation(userId, channelType, appId);

    const messages = await SupportMessage.findAll({
      where: { conversation_id: conversation.id, is_deleted: 0 },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'first_name', 'last_name', 'email'] }
      ],
      order: [['created_at', 'ASC']]
    });

    // Mark inbound messages as read
    await SupportMessage.update(
      { is_read: 1, read_at: new Date() },
      {
        where: {
          conversation_id: conversation.id,
          sender_id: { [Op.ne]: userId },
          is_read: 0
        }
      }
    );

    res.json({
      success: true,
      data: {
        conversation_id: conversation.id,
        channel_type: channelType,
        app_id: appId,
        status: conversation.status,
        channel_label: getChannelLabel(channelType),
        is_approved: approved,
        messages: messages.map(formatMessage)
      }
    });
  } catch (error) {
    console.error('Get partner chat messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading chat messages',
      error: error.message
    });
  }
};

/**
 * POST /api/v1/admin/chat-messages
 * Body: message, channel_type, app_id (optional)
 */
export const sendPartnerChatMessage = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { message } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const { channelType, appId } = await resolveChannelContext(req);
    const conversation = await findOrCreateConversation(userId, channelType, appId);

    const newMessage = await SupportMessage.create({
      conversation_id: conversation.id,
      sender_id: userId,
      sender_type: 'partner',
      message: String(message).trim()
    });

    await conversation.update({
      last_message_at: new Date(),
      status: conversation.status === 'resolved' ? 'open' : conversation.status
    });

    const messageWithSender = await SupportMessage.findByPk(newMessage.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'first_name', 'last_name', 'email'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Message sent',
      data: {
        conversation_id: conversation.id,
        channel_type: channelType,
        app_id: appId,
        message: formatMessage(messageWithSender)
      }
    });
  } catch (error) {
    console.error('Send partner chat message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};
