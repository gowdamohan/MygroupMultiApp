/**
 * Maps partner support channel types to app_id values for routing conversations
 * to the correct admin dashboard context.
 */
export const ADMIN_SUPPORT_APP_ID = parseInt(process.env.ADMIN_SUPPORT_APP_ID || '6', 10);

export const SUPPORT_CHANNEL_APP_IDS = {
  admin: ADMIN_SUPPORT_APP_ID,
  accounts: parseInt(process.env.ACCOUNTS_SUPPORT_APP_ID || '6', 10),
  technical: parseInt(process.env.TECHNICAL_SUPPORT_APP_ID || '6', 10)
};

export const VALID_CHANNEL_TYPES = ['admin', 'accounts', 'technical'];

export const getAppIdForChannel = (channelType) => {
  return SUPPORT_CHANNEL_APP_IDS[channelType] ?? ADMIN_SUPPORT_APP_ID;
};

export const getChannelLabel = (channelType) => {
  switch (channelType) {
    case 'accounts':
      return 'Accounts Support';
    case 'technical':
      return 'Technical Support';
    case 'admin':
    default:
      return 'Admin Support';
  }
};
