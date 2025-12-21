import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PartnerHeaderAds = sequelize.define('PartnerHeaderAds', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  app_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  header_ads_file_path: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  header_ads_url: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  headers_type: {
    type: DataTypes.STRING(45),
    allowNull: true,
    defaultValue: 'header1, headers2'
  },
  file_type: {
    type: DataTypes.STRING(45),
    allowNull: true,
    defaultValue: 'image, video, gif'
  }
}, {
  tableName: 'partner_header_ads',
  timestamps: false
});

export default PartnerHeaderAds;

