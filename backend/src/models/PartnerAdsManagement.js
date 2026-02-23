import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PartnerAdsManagement = sequelize.define('partner_ads_management', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  app_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  image_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  scrolling_text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'ads1 or ads2'
  },
  slot: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '1, 2, or 3'
  },
  is_active: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1
  }
}, {
  timestamps: false,
  tableName: 'partner_ads_management'
});

export default PartnerAdsManagement;

