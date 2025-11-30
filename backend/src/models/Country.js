import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Country = sequelize.define('country_tbl', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  continent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'continent_tbl',
      key: 'id'
    }
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  code: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  country_flag: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  currency: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  phone_code: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  nationality: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  order: {
    type: DataTypes.TINYINT,
    allowNull: true
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'country_tbl'
});

export default Country;

