import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserRegistration = sequelize.define('user_registration_form', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  country_flag: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  country_code: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
    allowNull: true
  },
  nationality: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  marital_status: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  dob: {
    type: DataTypes.DATEONLY,
    allowNull: true
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
  },
  education: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'education',
      key: 'id'
    }
  },
  profession: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'profession',
      key: 'id'
    }
  },
  education_others: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  work_others: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  dob_date: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  dob_month: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  dob_year: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'user_registration_form'
});

export default UserRegistration;

