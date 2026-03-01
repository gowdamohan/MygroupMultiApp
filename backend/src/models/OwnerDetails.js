import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OwnerDetails = sequelize.define('owner_details', {
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
  registration_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'client_registration',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  father_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  mother_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  mobile_no: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dob: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  nationality: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
    allowNull: true
  },
  marital_status: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  education: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  other_details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  display_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  photo_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  photo_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  logo_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  logo_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  id_proof_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  id_proof_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  address_proof_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  address_proof_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  other_documents: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  company_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  company_registration: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  company_registration_docs: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  company_taxation: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  company_taxation_docs: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'verified', 'processed_for_approve'),
    defaultValue: 'draft'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'owner_details'
});

export default OwnerDetails;

