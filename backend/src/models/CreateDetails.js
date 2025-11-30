import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CreateDetails = sequelize.define('create_details', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  create_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'group_create',
      key: 'id'
    }
  },
  icon: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  logo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  name_image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  background_color: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  banner: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  custom_form: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'create_details'
});

export default CreateDetails;

