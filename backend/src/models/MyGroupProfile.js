import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MyGroupProfile = sequelize.define('my_group_profile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'File path for icon image'
  },
  logo: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'File path for logo image'
  },
  name_image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'File path for name/banner image'
  },
  color_code: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Hex color code for brand'
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'my_group_profile'
});

export default MyGroupProfile;
