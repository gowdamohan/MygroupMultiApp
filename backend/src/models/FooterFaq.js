import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const FooterFaq = sequelize.define('footer_faq', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  answer: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  order_index: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  },
  group_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'footer_faq',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default FooterFaq;
