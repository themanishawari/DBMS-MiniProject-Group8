import { pool, testConnection } from '../config/db.js';

console.log('--- Testing CCMS MySQL 8.0 Connection Pool ---');

async function run() {
  const isConnected = await testConnection();
  if (isConnected) {
    try {
      const [tables] = await pool.query('SHOW TABLES');
      console.log(`[Database] Found ${tables.length} tables in current database:`);
      tables.forEach((t) => {
        const tableName = Object.values(t)[0];
        console.log(`  - ${tableName}`);
      });

      const [users] = await pool.query('SELECT COUNT(*) AS total FROM users');
      const [depts] = await pool.query('SELECT COUNT(*) AS total FROM departments');
      const [cats] = await pool.query('SELECT COUNT(*) AS total FROM complaint_categories');
      const [comps] = await pool.query('SELECT COUNT(*) AS total FROM complaints');

      console.log('\n[Database] Master Table Counts:');
      console.log(`  - Users: ${users[0].total}`);
      console.log(`  - Departments: ${depts[0].total}`);
      console.log(`  - Categories: ${cats[0].total}`);
      console.log(`  - Complaints: ${comps[0].total}`);

      console.log('\nSUCCESS: Database connection and schema verified successfully!');
    } catch (err) {
      console.error('[Database] Query Error:', err.message);
    }
  } else {
    console.error('\nFAILURE: Could not connect to MySQL server. Check backend/.env credentials.');
  }

  await pool.end();
  process.exit(0);
}

run();
