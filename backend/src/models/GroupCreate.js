import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const GroupCreate = sequelize.define('group_create', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  apps_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  order_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  code: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  locking_json: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('locking_json');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('locking_json', value ? JSON.stringify(value) : null);
    }
  }
}, {
  timestamps: false,
  tableName: 'group_create'
});

export default GroupCreate;

