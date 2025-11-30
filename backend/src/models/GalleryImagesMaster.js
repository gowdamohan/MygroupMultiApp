import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const GalleryImagesMaster = sequelize.define('gallery_images_master', {
  image_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  gallery_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'gallery_list',
      key: 'gallery_id'
    }
  },
  image_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  image_description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'groups',
      key: 'id'
    }
  }
}, {
  timestamps: false,
  tableName: 'gallery_images_master'
});

export default GalleryImagesMaster;

