import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'my_group',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  }
);

// Test database connection
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    return false;
  }
};

// Get all tables in database
export const getTables = async () => {
  try {
    const [results] = await sequelize.query('SHOW TABLES');
    return results.map(row => Object.values(row)[0]);
  } catch (error) {
    console.error('Error fetching tables:', error.message);
    return [];
  }
};

// Get table structure
export const getTableStructure = async (tableName) => {
  try {
    const [results] = await sequelize.query(`DESCRIBE ${tableName}`);
    return results;
  } catch (error) {
    console.error(`Error fetching structure for ${tableName}:`, error.message);
    return [];
  }
};

// Check if table exists
export const tableExists = async (tableName) => {
  try {
    const tables = await getTables();
    return tables.includes(tableName);
  } catch (error) {
    return false;
  }
};

// Analyze database schema
export const analyzeSchema = async () => {
  try {
    console.log('\n🔍 Database Schema Analysis:');
    console.log('================================');
    console.log(`📊 Database: ${process.env.DB_NAME || 'my_group'}`);
    
    const tables = await getTables();
    console.log(`📋 Total Tables: ${tables.length}`);
    
    for (const table of tables) {
      const structure = await getTableStructure(table);
      console.log(`\n📄 Table: ${table}`);
      console.log(`   Columns: ${structure.length}`);
      structure.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? col.Key : ''}`);
      });
    }
    
    return { tables, totalTables: tables.length };
  } catch (error) {
    console.error('Schema analysis error:', error.message);
    return { tables: [], totalTables: 0 };
  }
};

export default sequelize;

