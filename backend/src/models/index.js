import User from './User.js';
import Group from './Group.js';
import UserGroup from './UserGroup.js';
import GroupCreate from './GroupCreate.js';
import CreateDetails from './CreateDetails.js';
import UserRegistration from './UserRegistration.js';
import Continent from './Continent.js';
import Country from './Country.js';
import State from './State.js';
import District from './District.js';
import Education from './Education.js';
import Profession from './Profession.js';
import Language from './Language.js';
import AppCategory from './AppCategory.js';
import FranchiseHolder from './FranchiseHolder.js';
import FooterPage from './FooterPage.js';
import GalleryList from './GalleryList.js';
import GalleryImagesMaster from './GalleryImagesMaster.js';
import HeaderAdsManagement from './HeaderAdsManagement.js';
import CompanyAdsManagement from './CompanyAdsManagement.js';
import ApplicationsManagement from './ApplicationsManagement.js';
import FranchiseTermsConditions from './FranchiseTermsConditions.js';
import TncDetails from './TncDetails.js';
import ClientRegisterOtp from './ClientRegisterOtp.js';
import ClientRegistration from './ClientRegistration.js';
import Testimonial from './Testimonial.js';
import MediaChannel from './MediaChannel.js';
import PartnerHeaderAds from './PartnerHeaderAds.js';
import MediaSchedule from './MediaSchedule.js';
import MediaScheduleSlot from './MediaScheduleSlot.js';
import MediaChannelDocument from './MediaChannelDocument.js';
import MediaSocialLinks from './MediaSocialLinks.js';
import MediaInteractions from './MediaInteractions.js';
import MediaLinks from './MediaLinks.js';
import MediaSwitcher from './MediaSwitcher.js';
import MediaOfflineMedia from './MediaOfflineMedia.js';
import MediaDocuments from './MediaDocuments.js';
import MediaAwards from './MediaAwards.js';
import MediaNewsletters from './MediaNewsletters.js';
import MediaGalleryAlbums from './MediaGalleryAlbums.js';
import MediaGalleryImages from './MediaGalleryImages.js';
import MediaTeam from './MediaTeam.js';
import MediaHeaderAds from './MediaHeaderAds.js';
import MediaComments from './MediaComments.js';
import HeaderAdsPricing from './HeaderAdsPricing.js';
import HeaderAdsPricingMaster from './HeaderAdsPricingMaster.js';
import HeaderAdsPricingSlave from './HeaderAdsPricingSlave.js';
import HeaderAdsSlot from './HeaderAdsSlot.js';
import HeaderAd from './HeaderAd.js';
import SupportConversation from './SupportConversation.js';
import SupportMessage from './SupportMessage.js';
import Wallet from './Wallet.js';
import WalletTransaction from './WalletTransaction.js';
import FooterLink from './FooterLink.js';

// ============================================
// USER ASSOCIATIONS
// ============================================

// User has one UserRegistration (extended profile)
User.hasOne(UserRegistration, {
  foreignKey: 'user_id',
  as: 'profile'
});
UserRegistration.belongsTo(User, {
  foreignKey: 'user_id'
});

// User belongs to many Groups through UserGroup (many-to-many)
User.belongsToMany(Group, {
  through: UserGroup,
  foreignKey: 'user_id',
  otherKey: 'group_id',
  as: 'groups'
});
Group.belongsToMany(User, {
  through: UserGroup,
  foreignKey: 'group_id',
  otherKey: 'user_id',
  as: 'users'
});

// UserGroup associations for direct access
UserGroup.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});
UserGroup.belongsTo(Group, {
  foreignKey: 'group_id',
  as: 'group'
});

// User belongs to GroupCreate (application group)
User.belongsTo(GroupCreate, {
  foreignKey: 'group_id',
  as: 'groupDetails'
});
GroupCreate.hasMany(User, {
  foreignKey: 'group_id',
  as: 'users'
});

// ============================================
// GEOGRAPHIC ASSOCIATIONS
// ============================================

// Continent has many Countries
Continent.hasMany(Country, {
  foreignKey: 'continent_id',
  as: 'countries'
});
Country.belongsTo(Continent, {
  foreignKey: 'continent_id',
  as: 'continent'
});

// Country has many States
Country.hasMany(State, {
  foreignKey: 'country_id',
  as: 'states'
});
State.belongsTo(Country, {
  foreignKey: 'country_id',
  as: 'country'
});

// State has many Districts
State.hasMany(District, {
  foreignKey: 'state_id',
  as: 'districts'
});
District.belongsTo(State, {
  foreignKey: 'state_id',
  as: 'state'
});

// Country has many Languages
Country.hasMany(Language, {
  foreignKey: 'country_id',
  as: 'languages'
});
Language.belongsTo(Country, {
  foreignKey: 'country_id',
  as: 'country'
});

// ============================================
// USER PROFILE ASSOCIATIONS
// ============================================

// UserRegistration belongs to Country
UserRegistration.belongsTo(Country, {
  foreignKey: 'country',
  as: 'countryData'
});

// UserRegistration belongs to State
UserRegistration.belongsTo(State, {
  foreignKey: 'state',
  as: 'stateData'
});

// UserRegistration belongs to District
UserRegistration.belongsTo(District, {
  foreignKey: 'district',
  as: 'districtData'
});

// UserRegistration belongs to Education
UserRegistration.belongsTo(Education, {
  foreignKey: 'education',
  as: 'educationData'
});

// UserRegistration belongs to Profession
UserRegistration.belongsTo(Profession, {
  foreignKey: 'profession',
  as: 'professionData'
});

// UserRegistration location associations
UserRegistration.belongsTo(Country, {
  foreignKey: 'set_country',
  as: 'setCountryData'
});

UserRegistration.belongsTo(State, {
  foreignKey: 'set_state',
  as: 'setStateData'
});

UserRegistration.belongsTo(District, {
  foreignKey: 'set_district',
  as: 'setDistrictData'
});

// ============================================
// GROUP ASSOCIATIONS
// ============================================

// GroupCreate has one CreateDetails (branding)
GroupCreate.hasOne(CreateDetails, {
  foreignKey: 'create_id',
  as: 'details'
});
CreateDetails.belongsTo(GroupCreate, {
  foreignKey: 'create_id',
  as: 'group'
});

// GroupCreate has many AppCategories
GroupCreate.hasMany(AppCategory, {
  foreignKey: 'app_id',
  as: 'categories'
});
AppCategory.belongsTo(GroupCreate, {
  foreignKey: 'app_id',
  as: 'app'
});

// AppCategory self-referencing (parent-child)
AppCategory.hasMany(AppCategory, {
  foreignKey: 'parent_id',
  as: 'children'
});
AppCategory.belongsTo(AppCategory, {
  foreignKey: 'parent_id',
  as: 'parent'
});

// ============================================
// FRANCHISE HOLDER ASSOCIATIONS
// ============================================

// FranchiseHolder belongs to User
FranchiseHolder.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});
User.hasOne(FranchiseHolder, {
  foreignKey: 'user_id',
  as: 'franchiseHolder'
});

// FranchiseHolder belongs to Country
FranchiseHolder.belongsTo(Country, {
  foreignKey: 'country',
  as: 'countryData'
});

// FranchiseHolder belongs to State
FranchiseHolder.belongsTo(State, {
  foreignKey: 'state',
  as: 'stateData'
});

// FranchiseHolder belongs to District
FranchiseHolder.belongsTo(District, {
  foreignKey: 'district',
  as: 'districtData'
});

// ============================================
// FOOTER PAGE ASSOCIATIONS
// ============================================

// FooterPage belongs to User
FooterPage.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// ============================================
// GALLERY ASSOCIATIONS
// ============================================

// GalleryList has many GalleryImagesMaster
GalleryList.hasMany(GalleryImagesMaster, {
  foreignKey: 'gallery_id',
  as: 'images'
});

// GalleryImagesMaster belongs to GalleryList
GalleryImagesMaster.belongsTo(GalleryList, {
  foreignKey: 'gallery_id',
  as: 'gallery'
});

// ============================================
// HEADER ADS ASSOCIATIONS
// ============================================

// HeaderAdsManagement belongs to GroupCreate (app)
HeaderAdsManagement.belongsTo(GroupCreate, {
  foreignKey: 'app_id',
  as: 'app'
});
GroupCreate.hasMany(HeaderAdsManagement, {
  foreignKey: 'app_id',
  as: 'headerAds'
});

// HeaderAdsManagement belongs to AppCategory
HeaderAdsManagement.belongsTo(AppCategory, {
  foreignKey: 'category_id',
  as: 'category'
});
AppCategory.hasMany(HeaderAdsManagement, {
  foreignKey: 'category_id',
  as: 'headerAds'
});

// HeaderAdsManagement has many HeaderAdsSlot
HeaderAdsManagement.hasMany(HeaderAdsSlot, {
  foreignKey: 'header_ads_id',
  as: 'slots'
});
HeaderAdsSlot.belongsTo(HeaderAdsManagement, {
  foreignKey: 'header_ads_id',
  as: 'headerAd'
});

// ============================================
// COMPANY ADS ASSOCIATIONS
// ============================================

// CompanyAdsManagement belongs to GroupCreate (app)
CompanyAdsManagement.belongsTo(GroupCreate, {
  foreignKey: 'app_id',
  as: 'app'
});
GroupCreate.hasMany(CompanyAdsManagement, {
  foreignKey: 'app_id',
  as: 'companyAds'
});

// CompanyAdsManagement belongs to AppCategory
CompanyAdsManagement.belongsTo(AppCategory, {
  foreignKey: 'app_category_id',
  as: 'category'
});
AppCategory.hasMany(CompanyAdsManagement, {
  foreignKey: 'app_category_id',
  as: 'companyAds'
});

// ============================================
// APPLICATIONS MANAGEMENT ASSOCIATIONS
// ============================================

// ApplicationsManagement belongs to GroupCreate (app)
ApplicationsManagement.belongsTo(GroupCreate, {
  foreignKey: 'app_id',
  as: 'app'
});
GroupCreate.hasMany(ApplicationsManagement, {
  foreignKey: 'app_id',
  as: 'applications'
});

// TncDetails belongs to GroupCreate (group)
TncDetails.belongsTo(GroupCreate, {
  foreignKey: 'group_id',
  as: 'group'
});
GroupCreate.hasMany(TncDetails, {
  foreignKey: 'group_id',
  as: 'tncDetails'
});

// ============================================
// CLIENT REGISTRATION ASSOCIATIONS
// ============================================

// ClientRegistration belongs to User
ClientRegistration.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});
User.hasOne(ClientRegistration, {
  foreignKey: 'user_id',
  as: 'clientRegistration'
});

// ClientRegistration belongs to GroupCreate (app)
ClientRegistration.belongsTo(GroupCreate, {
  foreignKey: 'group_id',
  as: 'app'
});
GroupCreate.hasMany(ClientRegistration, {
  foreignKey: 'group_id',
  as: 'clientRegistrations'
});

// ============================================
// MEDIA CHANNEL ASSOCIATIONS
// ============================================

// MediaChannel belongs to User
MediaChannel.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});
User.hasMany(MediaChannel, {
  foreignKey: 'user_id',
  as: 'mediaChannels'
});

// MediaChannel belongs to GroupCreate (app)
MediaChannel.belongsTo(GroupCreate, {
  foreignKey: 'app_id',
  as: 'app'
});
GroupCreate.hasMany(MediaChannel, {
  foreignKey: 'app_id',
  as: 'mediaChannels'
});

// MediaChannel belongs to AppCategory
MediaChannel.belongsTo(AppCategory, {
  foreignKey: 'category_id',
  as: 'category'
});
AppCategory.hasMany(MediaChannel, {
  foreignKey: 'category_id',
  as: 'mediaChannels'
});

// MediaChannel belongs to parent AppCategory
MediaChannel.belongsTo(AppCategory, {
  foreignKey: 'parent_category_id',
  as: 'parentCategory'
});

// MediaChannel belongs to Country
MediaChannel.belongsTo(Country, {
  foreignKey: 'country_id',
  as: 'country'
});

// MediaChannel belongs to State
MediaChannel.belongsTo(State, {
  foreignKey: 'state_id',
  as: 'state'
});

// MediaChannel belongs to District
MediaChannel.belongsTo(District, {
  foreignKey: 'district_id',
  as: 'district'
});

// MediaChannel belongs to Language
MediaChannel.belongsTo(Language, {
  foreignKey: 'language_id',
  as: 'language'
});

// ============================================
// MEDIA SCHEDULE ASSOCIATIONS
// ============================================

// MediaSchedule belongs to MediaChannel
MediaSchedule.belongsTo(MediaChannel, {
  foreignKey: 'media_channel_id',
  as: 'channel'
});
MediaChannel.hasMany(MediaSchedule, {
  foreignKey: 'media_channel_id',
  as: 'schedules'
});

// MediaSchedule has many MediaScheduleSlot
MediaSchedule.hasMany(MediaScheduleSlot, {
  foreignKey: 'media_schedules_id',
  as: 'slots'
});
MediaScheduleSlot.belongsTo(MediaSchedule, {
  foreignKey: 'media_schedules_id',
  as: 'schedule'
});

// ============================================
// MEDIA CHANNEL DOCUMENT ASSOCIATIONS
// ============================================

// MediaChannelDocument belongs to MediaChannel
MediaChannelDocument.belongsTo(MediaChannel, {
  foreignKey: 'media_channel_id',
  as: 'channel'
});
MediaChannel.hasMany(MediaChannelDocument, {
  foreignKey: 'media_channel_id',
  as: 'documents'
});

// MediaChannelDocument belongs to AppCategory
MediaChannelDocument.belongsTo(AppCategory, {
  foreignKey: 'category_id',
  as: 'category'
});
AppCategory.hasMany(MediaChannelDocument, {
  foreignKey: 'category_id',
  as: 'documents'
});

// MediaChannelDocument belongs to User (uploader)
MediaChannelDocument.belongsTo(User, {
  foreignKey: 'uploaded_by',
  as: 'uploader'
});

// ============================================
// MEDIA DASHBOARD ASSOCIATIONS
// ============================================

// MediaSocialLinks belongs to MediaChannel
MediaSocialLinks.belongsTo(MediaChannel, { foreignKey: 'media_channel_id', as: 'channel' });
MediaChannel.hasMany(MediaSocialLinks, { foreignKey: 'media_channel_id', as: 'socialLinks' });

// MediaInteractions belongs to MediaChannel
MediaInteractions.belongsTo(MediaChannel, { foreignKey: 'media_channel_id', as: 'channel' });
MediaChannel.hasOne(MediaInteractions, { foreignKey: 'media_channel_id', as: 'interactions' });

// MediaLinks belongs to MediaChannel
MediaLinks.belongsTo(MediaChannel, { foreignKey: 'media_channel_id', as: 'channel' });
MediaChannel.hasMany(MediaLinks, { foreignKey: 'media_channel_id', as: 'mediaLinks' });

// MediaSwitcher belongs to MediaChannel
MediaSwitcher.belongsTo(MediaChannel, { foreignKey: 'media_channel_id', as: 'channel' });
MediaChannel.hasOne(MediaSwitcher, { foreignKey: 'media_channel_id', as: 'switcher' });

// MediaSwitcher belongs to MediaOfflineMedia
MediaSwitcher.belongsTo(MediaOfflineMedia, { foreignKey: 'offline_media_id', as: 'offlineMedia' });

// MediaOfflineMedia belongs to MediaChannel
MediaOfflineMedia.belongsTo(MediaChannel, { foreignKey: 'media_channel_id', as: 'channel' });
MediaChannel.hasMany(MediaOfflineMedia, { foreignKey: 'media_channel_id', as: 'offlineMediaList' });

// MediaDocuments belongs to MediaChannel
MediaDocuments.belongsTo(MediaChannel, { foreignKey: 'media_channel_id', as: 'channel' });
MediaChannel.hasMany(MediaDocuments, { foreignKey: 'media_channel_id', as: 'mediaDocuments' });

// MediaAwards belongs to MediaChannel
MediaAwards.belongsTo(MediaChannel, { foreignKey: 'media_channel_id', as: 'channel' });
MediaChannel.hasMany(MediaAwards, { foreignKey: 'media_channel_id', as: 'awards' });

// MediaNewsletters belongs to MediaChannel
MediaNewsletters.belongsTo(MediaChannel, { foreignKey: 'media_channel_id', as: 'channel' });
MediaChannel.hasMany(MediaNewsletters, { foreignKey: 'media_channel_id', as: 'newsletters' });

// MediaGalleryAlbums belongs to MediaChannel
MediaGalleryAlbums.belongsTo(MediaChannel, { foreignKey: 'media_channel_id', as: 'channel' });
MediaChannel.hasMany(MediaGalleryAlbums, { foreignKey: 'media_channel_id', as: 'galleryAlbums' });

// MediaGalleryImages belongs to MediaGalleryAlbums
MediaGalleryImages.belongsTo(MediaGalleryAlbums, { foreignKey: 'album_id', as: 'album' });
MediaGalleryAlbums.hasMany(MediaGalleryImages, { foreignKey: 'album_id', as: 'images' });

// MediaTeam belongs to MediaChannel
MediaTeam.belongsTo(MediaChannel, { foreignKey: 'media_channel_id', as: 'channel' });
MediaChannel.hasMany(MediaTeam, { foreignKey: 'media_channel_id', as: 'teamMembers' });

// MediaHeaderAds belongs to MediaChannel
MediaHeaderAds.belongsTo(MediaChannel, { foreignKey: 'media_channel_id', as: 'channel' });
MediaChannel.hasMany(MediaHeaderAds, { foreignKey: 'media_channel_id', as: 'headerAds' });

// MediaComments belongs to MediaChannel and User
MediaComments.belongsTo(MediaChannel, { foreignKey: 'media_channel_id', as: 'channel' });
MediaChannel.hasMany(MediaComments, { foreignKey: 'media_channel_id', as: 'comments' });
MediaComments.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(MediaComments, { foreignKey: 'user_id', as: 'mediaComments' });
// Self-referencing for replies
MediaComments.belongsTo(MediaComments, { foreignKey: 'parent_id', as: 'parent' });
MediaComments.hasMany(MediaComments, { foreignKey: 'parent_id', as: 'replies' });

// ============================================
// HEADER ADS PRICING ASSOCIATIONS
// ============================================

// HeaderAdsPricing belongs to GroupCreate (app)
HeaderAdsPricing.belongsTo(GroupCreate, { foreignKey: 'app_id', as: 'app' });
GroupCreate.hasMany(HeaderAdsPricing, { foreignKey: 'app_id', as: 'adsPricing' });

// HeaderAdsPricing belongs to AppCategory
HeaderAdsPricing.belongsTo(AppCategory, { foreignKey: 'category_id', as: 'category' });
AppCategory.hasMany(HeaderAdsPricing, { foreignKey: 'category_id', as: 'adsPricing' });

// HeaderAdsPricing belongs to User (created_by)
HeaderAdsPricing.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// HeaderAdsPricingMaster associations
HeaderAdsPricingMaster.belongsTo(Country, { foreignKey: 'country_id', as: 'country' });
Country.hasMany(HeaderAdsPricingMaster, { foreignKey: 'country_id', as: 'headerAdsPricingMasters' });

// HeaderAdsPricingSlave associations
HeaderAdsPricingSlave.belongsTo(HeaderAdsPricingMaster, { foreignKey: 'header_ads_pricing_master_id', as: 'master' });
HeaderAdsPricingMaster.hasMany(HeaderAdsPricingSlave, { foreignKey: 'header_ads_pricing_master_id', as: 'slaves' });

HeaderAdsPricingSlave.belongsTo(GroupCreate, { foreignKey: 'app_id', as: 'app' });
HeaderAdsPricingSlave.belongsTo(AppCategory, { foreignKey: 'category_id', as: 'category' });

// ============================================
// HEADER AD ASSOCIATIONS
// ============================================

// HeaderAd belongs to GroupCreate (app)
HeaderAd.belongsTo(GroupCreate, { foreignKey: 'app_id', as: 'app' });
GroupCreate.hasMany(HeaderAd, { foreignKey: 'app_id', as: 'ads' });

// HeaderAd belongs to AppCategory
HeaderAd.belongsTo(AppCategory, { foreignKey: 'category_id', as: 'category' });
AppCategory.hasMany(HeaderAd, { foreignKey: 'category_id', as: 'ads' });

// HeaderAd belongs to Country, State, District (location targeting)
HeaderAd.belongsTo(Country, { foreignKey: 'country_id', as: 'country' });
HeaderAd.belongsTo(State, { foreignKey: 'state_id', as: 'state' });
HeaderAd.belongsTo(District, { foreignKey: 'district_id', as: 'district' });

// HeaderAd belongs to User (created_by, approved_by)
HeaderAd.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
HeaderAd.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// ============================================
// SUPPORT CONVERSATION ASSOCIATIONS
// ============================================

// SupportConversation belongs to GroupCreate (app)
SupportConversation.belongsTo(GroupCreate, { foreignKey: 'app_id', as: 'app' });
GroupCreate.hasMany(SupportConversation, { foreignKey: 'app_id', as: 'supportConversations' });

// SupportConversation belongs to User (partner and assigned_to)
SupportConversation.belongsTo(User, { foreignKey: 'partner_id', as: 'partner' });
SupportConversation.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });

// SupportConversation has many SupportMessages
SupportConversation.hasMany(SupportMessage, { foreignKey: 'conversation_id', as: 'messages' });
SupportMessage.belongsTo(SupportConversation, { foreignKey: 'conversation_id', as: 'conversation' });

// SupportMessage belongs to User (sender)
SupportMessage.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// ============================================
// WALLET ASSOCIATIONS
// ============================================

// Wallet belongs to User
Wallet.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Wallet, { foreignKey: 'user_id', as: 'wallets' });

// Wallet has many WalletTransactions
Wallet.hasMany(WalletTransaction, { foreignKey: 'wallet_id', as: 'transactions' });
WalletTransaction.belongsTo(Wallet, { foreignKey: 'wallet_id', as: 'wallet' });

// Export all models
export {
  User,
  Group,
  UserGroup,
  GroupCreate,
  CreateDetails,
  UserRegistration,
  Continent,
  Country,
  State,
  District,
  Education,
  Profession,
  Language,
  AppCategory,
  FranchiseHolder,
  FooterPage,
  GalleryList,
  GalleryImagesMaster,
  HeaderAdsManagement,
  CompanyAdsManagement,
  ApplicationsManagement,
  FranchiseTermsConditions,
  TncDetails,
  ClientRegisterOtp,
  ClientRegistration,
  Testimonial,
  MediaChannel,
  PartnerHeaderAds,
  MediaSchedule,
  MediaScheduleSlot,
  MediaChannelDocument,
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
  HeaderAdsPricing,
  HeaderAdsPricingMaster,
  HeaderAdsPricingSlave,
  HeaderAdsSlot,
  HeaderAd,
  SupportConversation,
  SupportMessage,
  Wallet,
  WalletTransaction,
  FooterLink
};

