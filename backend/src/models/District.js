import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const District = sequelize.define('district_tbl', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  state_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'state_tbl',
      key: 'id'
    }
  },
  district: {
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
  tableName: 'district_tbl'
});

export default District;

