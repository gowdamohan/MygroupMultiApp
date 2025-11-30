import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcrypt';

const User = sequelize.define('users', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ip_address: {
    type: DataTypes.STRING(15),
    allowNull: false,
    defaultValue: '127.0.0.1'
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 100],
      isAlphanumeric: true
    }
  },
  email: {
    type: DataTypes.STRING(254),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  company: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  profile_img: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  display_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  alter_number: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  created_on: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: () => Math.floor(Date.now() / 1000)
  },
  last_login: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  active: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  },
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'group_create',
      key: 'id'
    }
  }
}, {
  timestamps: false,
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

export default User;

