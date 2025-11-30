import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Continent = sequelize.define('continent_tbl', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  continent: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '1=Active, 0=Inactive'
  },
  code: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
}, {
  timestamps: false,
  tableName: 'continent_tbl'
});

export default Continent;

