import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Wallet = sequelize.define('wallets', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  wallet_type: {
    type: DataTypes.ENUM('partner', 'franchise', 'admin'),
    allowNull: false,
    defaultValue: 'partner'
  },
  balance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'INR'
  },
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  },
  is_locked: {
    type: DataTypes.TINYINT,
    defaultValue: 0
  }
}, {
  tableName: 'wallets',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Wallet;

