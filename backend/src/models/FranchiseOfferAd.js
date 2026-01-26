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
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '1 = regional (state), 2 = branch (district)'
  },
  state_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'state_tbl', key: 'id' }
  },
  district_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'district_tbl', key: 'id' }
  }
}, {
  timestamps: false,
  tableName: 'franchise_offer_ads'
});

export default FranchiseOfferAd;
