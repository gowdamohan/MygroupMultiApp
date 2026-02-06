import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HeaderAdsPricingMaster = sequelize.define('header_ads_pricing_master', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pricing_slot: {
    type: DataTypes.ENUM('A', 'B', 'C', 'D'),
    allowNull: false
  },
  my_coins: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  country_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'country_tbl',
      key: 'id'
    }
  },
  ads_type: {
    type: DataTypes.ENUM('header_ads', 'popup_ads', 'middle_ads', 'chat_ads'),
    allowNull: false,
    defaultValue: 'header_ads'
  }
}, {
  tableName: 'header_ads_pricing_master',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default HeaderAdsPricingMaster;
