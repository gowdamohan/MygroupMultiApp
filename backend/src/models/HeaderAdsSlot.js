import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HeaderAdsSlot = sequelize.define('header_ads_slot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  header_ads_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'header_ads',
      key: 'id'
    }
  },
  selected_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  impressions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  clicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  }
}, {
  tableName: 'header_ads_slot',
  timestamps: false
});

export default HeaderAdsSlot;
