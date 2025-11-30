import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const State = sequelize.define('state_tbl', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  country_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'country_tbl',
      key: 'id'
    }
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  code: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  order: {
    type: DataTypes.TINYINT,
    allowNull: true
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'state_tbl'
});

export default State;

