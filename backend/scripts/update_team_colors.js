const path = require('path');
const fs = require('fs');
const db = require('../db');
const { getLogoPrimaryColor } = require('../utils/color-extractor.cjs');

async function migrateTeamColors() {
  console.log('Starting team color migration...');
  
  // 1. Get all teams from database
  const teams = db.getTeams();
  
  // 2. Define path to logo files
  // Note: Based on your input, files are in frontend/logos
  const logoRootDir = path.join(__dirname, '../../frontend');

  let updatedCount = 0;

  for (const team of teams) {
    if (!team.logo) continue;

    // team.logo is stored as "/logos/school-name.png"
    // We join with the root to get the full absolute path
    const filePath = path.join(logoRootDir, team.logo);

    if (fs.existsSync(filePath)) {
      console.log(`Processing: ${team.school}...`);
      const primaryColor = await getLogoPrimaryColor(filePath);
      console.log(`Result: ${team.school} -> ${primaryColor}`);
      db.updateTeamColor(team.id, primaryColor); 
      updatedCount++;
    } else {
      console.warn(`Warning: Logo not found for ${team.school} at ${filePath}`);
    }
  }

  console.log(`Migration complete. Updated ${updatedCount} teams.`);
}

migrateTeamColors().catch(err => console.error(err));