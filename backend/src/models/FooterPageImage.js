import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const FooterPageImage = sequelize.define('footer_page_images', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  footer_page_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'footer_page',
      key: 'id'
    }
  },
  image_path: {
    type: DataTypes.TEXT,
    allowNull: false
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
  tableName: 'footer_page_images',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default FooterPageImage;
