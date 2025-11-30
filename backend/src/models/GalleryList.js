import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const GalleryList = sequelize.define('gallery_list', {
  gallery_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  gallery_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  gallery_description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  gallery_date: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'gallery_list'
});

export default GalleryList;

