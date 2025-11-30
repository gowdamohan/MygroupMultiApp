import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const FooterPage = sequelize.define('footer_page', {
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
  footer_page_type: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tag_line: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  image: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  group_name: {
    type: DataTypes.STRING(45),
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'footer_page'
});

export default FooterPage;

