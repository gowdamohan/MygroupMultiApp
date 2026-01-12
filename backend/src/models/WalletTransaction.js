import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const WalletTransaction = sequelize.define('wallet_transactions', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  wallet_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'wallets', key: 'id' }
  },
  transaction_type: {
    type: DataTypes.ENUM('credit', 'debit', 'refund', 'withdrawal', 'deposit'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  balance_before: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  balance_after: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  reference_type: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  reference_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'reversed'),
    defaultValue: 'completed'
  }
}, {
  tableName: 'wallet_transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

export default WalletTransaction;

