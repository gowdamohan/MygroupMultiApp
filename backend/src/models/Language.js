import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Language = sequelize.define('language', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  lang_1: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  lang_2: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'language'
});

export default Language;

