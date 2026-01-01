require('dotenv').config();
const { sequelize } = require('../config/database');
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '../migrations');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    const queryInterface = sequelize.getQueryInterface();
    const Sequelize = sequelize.constructor;

    for (const file of migrationFiles) {
      try {
        const migration = require(path.join(migrationsDir, file));
        console.log(`Running migration: ${file}`);
        await migration.up(queryInterface, Sequelize);
        console.log(`✅ Migration ${file} completed`);
      } catch (error) {
        // Check if it's a duplicate key/index error (might already exist)
        if (error.original?.code === 'ER_DUP_KEYNAME' || error.original?.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  Migration ${file} skipped (index/constraint already exists)`);
          continue;
        }
        // Check if table already exists
        if (error.original?.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`⚠️  Migration ${file} skipped (table already exists)`);
          continue;
        }
        throw error;
      }
    }

    console.log(`✅ All ${migrationFiles.length} migrations executed successfully`);
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    await sequelize.close();
    process.exit(1);
  }
})();

