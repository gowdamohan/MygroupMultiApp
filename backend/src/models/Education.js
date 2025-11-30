import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Education = sequelize.define('education', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  education: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'education'
});

export default Education;

