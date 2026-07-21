require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function main() {
  const r = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'games' ORDER BY ordinal_position`);
  console.log(r.rows.map(x => x.column_name).join(', '));
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
