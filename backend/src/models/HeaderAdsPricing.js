import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HeaderAdsPricing = sequelize.define('header_ads_pricing', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  app_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'group_create',
      key: 'id'
    }
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'app_categories',
      key: 'id'
    }
  },
  ad_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  price_slot: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'INR'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'header_ads_pricing',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default HeaderAdsPricing;

