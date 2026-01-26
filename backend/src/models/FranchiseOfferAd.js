import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const FranchiseOfferAd = sequelize.define('franchise_offer_ads', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  image_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  group_name: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  type: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'ads1 or ads2'
  },
  slot: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '1, 2, or 3'
  }
}, {
  timestamps: false,
  tableName: 'franchise_offer_ads'
});

export default FranchiseOfferAd;
