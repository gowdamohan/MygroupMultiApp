import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MemberRegisterOtp = sequelize.define(
  'member_register_otp',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    mobile: {
      type: DataTypes.STRING(15),
      allowNull: false
    },
    otp: {
      type: DataTypes.STRING(6),
      allowNull: false
    },
    expires_at: {
      type: DataTypes.BIGINT,
      allowNull: false
    }
  },
  {
    timestamps: false,
    tableName: 'member_register_otp'
  }
);

export default MemberRegisterOtp;
