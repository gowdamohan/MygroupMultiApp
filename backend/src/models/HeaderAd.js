import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HeaderAd = sequelize.define('header_ads', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  app_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'group_create', key: 'id' }
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'app_categories', key: 'id' }
  },
  group_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'e.g., branch_ads1, regional_ads1, branch_ads2, head_office_ads1'
  },
  ad_type: {
    type: DataTypes.ENUM('file', 'url'),
    allowNull: false,
    defaultValue: 'file'
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  file_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  link_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  file_type: {
    type: DataTypes.ENUM('image', 'gif'),
    allowNull: false,
    defaultValue: 'image'
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  country_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'country_tbl', key: 'id' }
  },
  state_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'state_tbl', key: 'id' }
  },
  district_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'district_tbl', key: 'id' }
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'inactive', 'expired', 'rejected'),
    defaultValue: 'pending'
  },
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  },
  impressions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  clicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'header_ads',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default HeaderAd;

