import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TncDetails = sequelize.define('tnc_details', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tnc_content: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'group_create',
      key: 'id'
    }
  }
}, {
  timestamps: false,
  tableName: 'tnc_details'
});

export default TncDetails;

