import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const FranchiseHolder = sequelize.define('franchise_holder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  country: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'country_tbl',
      key: 'id'
    }
  },
  state: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'state_tbl',
      key: 'id'
    }
  },
  district: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'district_tbl',
      key: 'id'
    }
  }
}, {
  timestamps: false,
  tableName: 'franchise_holder'
});

export default FranchiseHolder;

