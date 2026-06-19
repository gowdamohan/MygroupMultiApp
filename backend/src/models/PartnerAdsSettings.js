import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PartnerAdsSettings = sequelize.define('partner_ads_settings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  app_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  header_scrolling_text: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'partner_ads_settings'
});

export default PartnerAdsSettings;
