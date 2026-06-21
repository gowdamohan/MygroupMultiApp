import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MainAds = sequelize.define('main_ads', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  main_ad_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Wasabi storage key for the main ad image'
  },
  main_ad_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Click-through destination URL for the main ad'
  },
  side_ad_1_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Wasabi storage key for side ad slot 1'
  },
  side_ad_1_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Click-through destination URL for side ad slot 1'
  },
  side_ad_2_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Wasabi storage key for side ad slot 2'
  },
  side_ad_2_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Click-through destination URL for side ad slot 2'
  },
  side_ad_3_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Wasabi storage key for side ad slot 3'
  },
  side_ad_3_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Click-through destination URL for side ad slot 3'
  },
  scrooling_text: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Scrolling ticker text shown on the home page header strip'
  },
  is_active: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1
  }
}, {
  timestamps: false,
  tableName: 'main_ads'
});

export default MainAds;
