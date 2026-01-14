import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HeaderAdsPricingSlave = sequelize.define('header_ads_pricing_slave', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  header_ads_pricing_master_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'header_ads_pricing_master',
      key: 'id'
    }
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
  selected_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  my_coins: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  }
}, {
  tableName: 'header_ads_pricing_slave',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default HeaderAdsPricingSlave;
