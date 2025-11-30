import sequelize from './src/config/database.js';

async function testDatabase() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check country_tbl structure
    const [results] = await sequelize.query('DESCRIBE country_tbl');
    console.log('\n📋 country_tbl structure:');
    console.table(results);

    // Check if there are any records
    const [countries] = await sequelize.query('SELECT * FROM country_tbl LIMIT 5');
    console.log('\n📊 Sample country records:');
    console.table(countries);

    // Check state_tbl structure
    const [stateResults] = await sequelize.query('DESCRIBE state_tbl');
    console.log('\n📋 state_tbl structure:');
    console.table(stateResults);

    // Check district_tbl structure
    const [districtResults] = await sequelize.query('DESCRIBE district_tbl');
    console.log('\n📋 district_tbl structure:');
    console.table(districtResults);

    // Check education structure
    const [educationResults] = await sequelize.query('DESCRIBE education');
    console.log('\n📋 education structure:');
    console.table(educationResults);

    // Check profession structure
    const [professionResults] = await sequelize.query('DESCRIBE profession');
    console.log('\n📋 profession structure:');
    console.table(professionResults);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testDatabase();

