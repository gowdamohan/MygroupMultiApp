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
  foreignKey: 'app_category_id',
  as: 'category'
});
AppCategory.hasMany(HeaderAdsManagement, {
  foreignKey: 'app_category_id',
  as: 'headerAds'
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
  ClientRegistration
};

