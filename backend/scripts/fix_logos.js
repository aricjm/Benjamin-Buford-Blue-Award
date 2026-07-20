'use strict';
const path = require('path');
const fs = require('fs');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } });

const LOGOS_DIR = path.join(__dirname, '..', '..', 'frontend', 'public', 'logos');

// Teams to fix: school name -> ESPN team ID
// IDs verified from ESPN site API
const TEAMS_TO_FIX = {
  'Florida State Seminoles':       52,
  'Eastern Michigan Eagles':       2199,
};

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\(fl\)/g, 'fl')
    .replace(/\(oh\)/g, 'oh')
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  const client = await pool.connect();
  try {
    for (const [school, espnId] of Object.entries(TEAMS_TO_FIX)) {
      const slug = slugify(school);
      const filename = `${slug}.png`;
      const dest = path.join(LOGOS_DIR, filename);
      const logoUrl = `https://a.espncdn.com/i/teamlogos/ncaa/500/${espnId}.png`;
      const logoPath = `/logos/${filename}`;

      console.log(`\nFixing: ${school} (ESPN ID: ${espnId})`);
      console.log(`  Downloading ${logoUrl}`);

      try {
        await downloadFile(logoUrl, dest);
        console.log(`  Saved to ${filename}`);
      } catch (e) {
        console.error(`  Download failed: ${e.message}`);
        continue;
      }

      await client.query(
        'UPDATE teams SET logo = $1 WHERE school = $2',
        [logoPath, school]
      );
      console.log(`  DB updated: logo = ${logoPath}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
  console.log('\n--- Done ---');
}

main().catch(err => { console.error(err); process.exit(1); });
