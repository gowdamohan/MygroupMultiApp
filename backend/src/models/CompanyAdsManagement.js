import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CompanyAdsManagement = sequelize.define('company_ads_management', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  app_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'group_create',
      key: 'id'
    }
  },
  app_category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'app_categories',
      key: 'id'
    }
  },
  file_path: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'company_ads_management'
});

export default CompanyAdsManagement;

