import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Country = sequelize.define('country_tbl', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  continent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'continent_tbl',
      key: 'id'
    }
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  code: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  country_flag: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  currency_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  currency_icon: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  currency: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  phone_code: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  nationality: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  locking_json: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('locking_json');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('locking_json', value ? JSON.stringify(value) : null);
    }
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
  tableName: 'country_tbl'
});

export default Country;

