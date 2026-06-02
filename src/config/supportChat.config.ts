export type SupportChannelType = 'admin' | 'accounts' | 'technical';

export const ADMIN_SUPPORT_APP_ID = 6;

export const SUPPORT_CHANNEL_APP_IDS: Record<SupportChannelType, number> = {
  admin: ADMIN_SUPPORT_APP_ID,
  accounts: ADMIN_SUPPORT_APP_ID,
  technical: ADMIN_SUPPORT_APP_ID,
};

export const SUPPORT_CHANNEL_OPTIONS: {
  value: SupportChannelType;
  label: string;
  appId: number;
}[] = [
  { value: 'accounts', label: 'Accounts Support', appId: SUPPORT_CHANNEL_APP_IDS.accounts },
  { value: 'technical', label: 'Technical Support', appId: SUPPORT_CHANNEL_APP_IDS.technical },
  { value: 'admin', label: 'Admin Support', appId: SUPPORT_CHANNEL_APP_IDS.admin },
];

export const isPartnerApproved = (registrationStatus: string): boolean =>
  registrationStatus === 'active';
