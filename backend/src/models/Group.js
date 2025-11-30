import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Group = sequelize.define('groups', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'groups'
});

export default Group;

