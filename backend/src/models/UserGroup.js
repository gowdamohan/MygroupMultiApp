import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserGroup = sequelize.define('users_groups', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'groups',
      key: 'id'
    }
  }
}, {
  timestamps: false,
  tableName: 'users_groups'
});

export default UserGroup;

