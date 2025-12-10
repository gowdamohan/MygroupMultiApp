import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const FranchiseTermsConditions = sequelize.define('franchise_terms_conditions', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  type: {
    type: DataTypes.STRING(45),
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'franchise_terms_conditions'
});

export default FranchiseTermsConditions;

