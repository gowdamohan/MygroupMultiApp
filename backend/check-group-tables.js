import sequelize from './src/config/database.js';

async function checkGroupTables() {
  try {
    console.log('\n=== Checking group_create table ===');
    const [groupCreateDesc] = await sequelize.query("DESCRIBE group_create");
    console.log(groupCreateDesc);
    
    console.log('\n=== Checking create_details table ===');
    const [createDetailsDesc] = await sequelize.query("DESCRIBE create_details");
    console.log(createDetailsDesc);
    
    console.log('\n=== Sample data from group_create ===');
    const [groupCreateData] = await sequelize.query("SELECT * FROM group_create LIMIT 3");
    console.log(groupCreateData);
    
    console.log('\n=== Sample data from create_details ===');
    const [createDetailsData] = await sequelize.query("SELECT * FROM create_details LIMIT 3");
    console.log(createDetailsData);
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkGroupTables();

