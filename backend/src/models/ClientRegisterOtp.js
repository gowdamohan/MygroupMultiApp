import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ClientRegisterOtp = sequelize.define('client_register_otp', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  otp: {
    type: DataTypes.STRING(45),
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'client_register_otp'
});

export default ClientRegisterOtp;

