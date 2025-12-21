import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MediaChannel = sequelize.define('media_channel', {
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
  parent_category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'app_categories',
      key: 'id'
    }
  },
  media_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  select_type: {
    type: DataTypes.ENUM('International', 'National', 'Regional', 'Local'),
    allowNull: false
  },
  country_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'country_tbl',
      key: 'id'
    }
  },
  state_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'state_tbl',
      key: 'id'
    }
  },
  district_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'district_tbl',
      key: 'id'
    }
  },
  language_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'language',
      key: 'id'
    }
  },
  media_name_english: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  media_name_regional: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  media_logo: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  periodical_type: {
    type: DataTypes.ENUM('Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Half-yearly', 'Yearly'),
    allowNull: true
  },
  periodical_schedule: {
    type: DataTypes.JSON,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'inactive', 'rejected'),
    defaultValue: 'pending'
  },
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  passcode: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  passcode_status: {
    type: DataTypes.TINYINT,
    defaultValue: 0
  }
}, {
  timestamps: false,
  tableName: 'media_channel'
});

export default MediaChannel;

