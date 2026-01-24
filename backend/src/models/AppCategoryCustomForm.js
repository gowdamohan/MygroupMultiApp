import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AppCategoryCustomForm = sequelize.define('app_category_custom_forms', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  app_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'group_create',
      key: 'id'
    }
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'app_categories',
      key: 'id'
    }
  },
  form_schema: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('form_schema');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('form_schema', value ? JSON.stringify(value) : null);
    }
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'app_category_custom_forms'
});

export default AppCategoryCustomForm;
