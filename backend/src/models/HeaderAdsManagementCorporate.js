import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HeaderAdsManagementCorporate = sequelize.define('header_ads_management', {
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
  app_category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'app_categories',
      key: 'id'
    }
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'header_ads_management'
});

export default HeaderAdsManagementCorporate;
