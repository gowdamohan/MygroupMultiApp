import { DataTypes } from 'sequelize';
import sequelize, { tableExists, getTableStructure } from '../config/database.js';

// Check existing testimonials table structure
const checkExistingTable = async () => {
  const exists = await tableExists('testimonials');
  if (exists) {
    console.log('✅ Found existing testimonials table');
    const structure = await getTableStructure('testimonials');
    console.log('Existing columns:', structure.map(col => `${col.Field} (${col.Type})`).join(', '));
    return structure;
  } else {
    console.log('❌ Testimonials table not found');
    return [];
  }
};

// Check table structure on import
checkExistingTable();

const Testimonial = sequelize.define('testimonials', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  designation: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  rating: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  timestamps: false,
  tableName: 'testimonials',
  // Don't sync - use existing table
  sync: false
});

export default Testimonial;