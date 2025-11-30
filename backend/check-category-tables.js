import sequelize from './src/config/database.js';

async function checkCategoryTables() {
  try {
    // Check for category-related tables
    const [results] = await sequelize.query("SHOW TABLES LIKE '%category%'");
    
    console.log('\n=== Category Tables Found ===');
    console.log(results);
    
    // Check for main_category and sub_category tables
    const [mainCategoryCheck] = await sequelize.query("SHOW TABLES LIKE 'main_category'");
    const [subCategoryCheck] = await sequelize.query("SHOW TABLES LIKE 'sub_category'");
    
    console.log('\n=== Main Category Table ===');
    console.log(mainCategoryCheck);
    
    console.log('\n=== Sub Category Table ===');
    console.log(subCategoryCheck);
    
    // If main_category exists, describe it
    if (mainCategoryCheck.length > 0) {
      const [mainCategoryDesc] = await sequelize.query("DESCRIBE main_category");
      console.log('\n=== Main Category Table Structure ===');
      console.log(mainCategoryDesc);
    }
    
    // If sub_category exists, describe it
    if (subCategoryCheck.length > 0) {
      const [subCategoryDesc] = await sequelize.query("DESCRIBE sub_category");
      console.log('\n=== Sub Category Table Structure ===');
      console.log(subCategoryDesc);
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCategoryTables();

