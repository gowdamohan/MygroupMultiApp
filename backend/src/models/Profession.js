import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Profession = sequelize.define('profession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  profession: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'profession'
});

export default Profession;

