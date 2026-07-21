require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

const SHORTHANDS = [
  'Navy', 'ND', 'Jacksonville St', 'Hawaii', 'Ohio', 'Mass', 'UMass', 'New Mex St', 'Vandy', 'USC', 'FIU', 'LA Tech',
  'Texas Tech', 'Florida', 'Tulsa', 'Nebraska', 'Mich St', 'Mich St.', 'Mich State', 'Michigan State', 'Miami FL',
  'Iowa', 'Utah St', 'Utah St.', 'Ohio St', 'Ohio St.', 'Indiana', 'South Car', 'Coastal Car', 'Northwestern',
  'San Jose St', 'San Jose State', 'SJSU', 'FSU', 'Florida St', 'Florida St.', 'Duke', 'Indiana St', 'Illinois',
  'Kansas', 'Army', 'Wake Forest', 'SMU', 'Texas', 'North Car St', 'North Car St.', 'Tulane', 'Washington St',
  'Washington St.', 'Wash State', 'Standford', 'Stanford', 'Baylor', 'North Car', 'North Carolina', 'Maryland',
  'Temple', 'LSU', 'Tenn', 'Tennessee', 'Arkansas', 'Purdue', 'Colorado', 'Troy', 'Wisconsin', 'Wisco', 'Air Force',
  'Clemson', 'Mich', 'Michigan', 'Rutgers', 'Bama', 'Alabama', 'Alabam', 'Utah', 'Iowa St', 'Iowa St.', 'Iowa State',
  'Oregon St', 'Oregon St.', 'Louisville', 'UConn', 'BYU', 'Buffalo', 'Ole Miss', 'Oklahoma', 'Syracuse', 'Arizona',
  'Miss St', 'Miss St.', 'Elon', 'Arizona St', 'Arizona St.', 'Texas A&M', 'Georgia', 'Colorado St', 'Colorado St.',
  'UCLA', 'Kansas St', 'Kansas St.', 'Ok St', 'Ok St.', 'OK St', 'OSU', 'Houston', 'Washington', 'Wash', 'Memphis',
  'Cinci', 'Cincinnati', 'TCU', 'South Florida', 'Auburn', 'Georgia St', 'Georgia St.', 'Boise St', 'Boise',
  'Penn St', 'Penn St.', 'Penn State', 'Ball St', 'Ball St.', 'Miami(OH)', 'Miami (OH)', 'Miami Ohio', 'ASU',
  'Oregon', 'Western Mich', 'Weetern Mich', 'Western Michigan', 'JMU', 'Kentucky', 'Rice', 'Toledo', 'Boston College',
  'Boston Colleg', 'NW', 'Mizz', 'Missouri', 'Cincy', 'UNC', 'Wyoming', 'South Alabama', 'Northern Illinois', 'NIU',
  'Georgia Tech', 'California', 'Cal', 'Virginia Tech', 'Virginia Tech.', 'VaTech', 'Texas St', 'Texas St.', 'Montana',
  'San Diego St', 'San Diego St.', 'Liberty', 'Coastal Carolina', 'UTSA', 'Western Kentucky', 'Louisiana Lafay',
  'Louisiana Lafayette', 'New Mexico St', 'Minn', 'Minnesota', 'Bowling Green', 'UNLV', 'UTEP', 'Akron', 'Indiana State',
  'Illinois State', 'Missouri State', 'North Dakota State', 'South Dakota State', 'Sacramento State', 'Delaware State',
  'Hampton', 'Delaware', 'UC Davis', 'Northern Colorado', 'Eastern Washington', 'Weber State', 'Cal Poly', 'Idaho State',
  'Idaho', 'Southern Utah', 'Utah Tech', 'Kennesaw State', 'Tusculum', 'Nevada', 'Long Island University', 'Auburn',
  'Sam Houston', 'Gardner-Webb', 'Appalachian State', 'Charlotte', 'Eastern Kentucky', 'Howard', 'Eastern Michigan',
  'Monmouth', 'Georgia Southern', 'The Citadel', 'Rhode Island', 'UT Martin', 'Bethune-Cookman', 'Central Michigan',
  'SE Louisiana', 'South Dakota', 'Nicholls', 'Robert Morris', 'Middle Tennessee', 'Florida Atlantic', 'UAB',
  'Old Dominion', 'Villanova', 'Sacred Heart', 'Abilene Christian', 'Chattanooga', 'New Mexico', 'Fresno State',
  'San José State', 'Georgia State', 'Boise State', 'Western Kentucky', 'Appalachian State', 'Jacksonville State'
];

function levenshteinDistance(a, b) {
  const an = a.length;
  const bn = b.length;
  const matrix = Array(bn + 1).fill(null).map(() => Array(an + 1).fill(0));
  for (let i = 0; i <= an; i++) matrix[0][i] = i;
  for (let j = 0; j <= bn; j++) matrix[j][0] = j;
  for (let j = 1; j <= bn; j++) {
    for (let i = 1; i <= an; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  return matrix[bn][an];
}

async function main() {
  const { rows: dbTeams } = await pool.query("SELECT DISTINCT team FROM (SELECT home_team AS team FROM games UNION SELECT away_team AS team FROM games) AS t");
  const teamNames = dbTeams.map(r => r.team);

  const mappings = {};

  for (const shorthand of SHORTHANDS) {
    let bestMatch = teamNames.find(t => t.toLowerCase() === shorthand.toLowerCase());
    if (bestMatch) {
      mappings[shorthand] = bestMatch;
      continue;
    }

    const matches = teamNames.filter(t => t.toLowerCase().includes(shorthand.toLowerCase()));
    if (matches.length === 1) {
      mappings[shorthand] = matches[0];
      continue;
    }

    const parts = shorthand.split(/[\s\.]+/).filter(Boolean);
    if (parts.length > 0) {
      const partMatches = teamNames.filter(t => t.toLowerCase().includes(parts[0].toLowerCase()));
      if (partMatches.length === 1) {
        mappings[shorthand] = partMatches[0];
        continue;
      }
    }

    let minDistance = Infinity;
    let closestTeam = null;
    for (const team of teamNames) {
      const dist = levenshteinDistance(shorthand.toLowerCase(), team.toLowerCase());
      if (dist < minDistance) {
        minDistance = dist;
        closestTeam = team;
      }
    }

    if (minDistance < 10) {
      mappings[shorthand] = closestTeam;
    }
  }

  // Manual overrides
  mappings['ND'] = 'Notre Dame Fighting Irish';
  mappings['Vandy'] = 'Vanderbilt Commodores';
  mappings['USC'] = 'USC Trojans';
  mappings['FIU'] = 'Florida International Panthers';
  mappings['LA Tech'] = 'Louisiana Tech Bulldogs';
  mappings['Mich St'] = 'Michigan State Spartans';
  mappings['Mich St.'] = 'Michigan State Spartans';
  mappings['Mich State'] = 'Michigan State Spartans';
  mappings['Miami FL'] = 'Miami Hurricanes';
  mappings['Utah St'] = 'Utah State Aggies';
  mappings['Utah St.'] = 'Utah State Aggies';
  mappings['Ohio St'] = 'Ohio State Buckeyes';
  mappings['Ohio St.'] = 'Ohio State Buckeyes';
  mappings['South Car'] = 'South Carolina Gamecocks';
  mappings['Coastal Car'] = 'Coastal Carolina Chanticleers';
  mappings['San Jose St'] = 'San José State Spartans';
  mappings['San Jose State'] = 'San José State Spartans';
  mappings['SJSU'] = 'San José State Spartans';
  mappings['FSU'] = 'Florida State Seminoles';
  mappings['Florida St'] = 'Florida State Seminoles';
  mappings['Florida St.'] = 'Florida State Seminoles';
  mappings['North Car St'] = 'NC State Wolfpack';
  mappings['North Car St.'] = 'NC State Wolfpack';
  mappings['Washington St'] = 'Washington State Cougars';
  mappings['Washington St.'] = 'Washington State Cougars';
  mappings['Wash State'] = 'Washington State Cougars';
  mappings['Standford'] = 'Stanford Cardinal';
  mappings['North Car'] = 'North Carolina Tar Heels';
  mappings['Tenn'] = 'Tennessee Volunteers';
  mappings['Wisco'] = 'Wisconsin Badgers';
  mappings['Mich'] = 'Michigan Wolverines';
  mappings['Bama'] = 'Alabama Crimson Tide';
  mappings['Alabam'] = 'Alabama Crimson Tide';
  mappings['Iowa St'] = 'Iowa State Cyclones';
  mappings['Iowa St.'] = 'Iowa State Cyclones';
  mappings['Oregon St'] = 'Oregon State Beavers';
  mappings['Oregon St.'] = 'Oregon State Beavers';
  mappings['UConn'] = 'UConn Huskies';
  mappings['Ole Miss'] = 'Ole Miss Rebels';
  mappings['Miss St'] = 'Mississippi State Bulldogs';
  mappings['Miss St.'] = 'Mississippi State Bulldogs';
  mappings['Arizona St'] = 'Arizona State Sun Devils';
  mappings['Arizona St.'] = 'Arizona State Sun Devils';
  mappings['Colorado St'] = 'Colorado State Rams';
  mappings['Colorado St.'] = 'Colorado State Rams';
  mappings['Kansas St'] = 'Kansas State Wildcats';
  mappings['Kansas St.'] = 'Kansas State Wildcats';
  mappings['Ok St'] = 'Oklahoma State Cowboys';
  mappings['Ok St.'] = 'Oklahoma State Cowboys';
  mappings['OK St'] = 'Oklahoma State Cowboys';
  mappings['OSU'] = 'Ohio State Buckeyes';
  mappings['Wash'] = 'Washington Huskies';
  mappings['Cinci'] = 'Cincinnati Bearcats';
  mappings['Boise St'] = 'Boise State Broncos';
  mappings['Boise'] = 'Boise State Broncos';
  mappings['Penn St'] = 'Penn State Nittany Lions';
  mappings['Penn St.'] = 'Penn State Nittany Lions';
  mappings['Ball St'] = 'Ball State Cardinals';
  mappings['Ball St.'] = 'Ball State Cardinals';
  mappings['Miami(OH)'] = 'Miami (OH) RedHawks';
  mappings['Miami (OH)'] = 'Miami (OH) RedHawks';
  mappings['Miami Ohio'] = 'Miami (OH) RedHawks';
  mappings['ASU'] = 'Arizona State Sun Devils';
  mappings['Western Mich'] = 'Western Michigan Broncos';
  mappings['Weetern Mich'] = 'Western Michigan Broncos';
  mappings['Boston Colleg'] = 'Boston College Eagles';
  mappings['NW'] = 'Northwestern Wildcats';
  mappings['Mizz'] = 'Missouri Tigers';
  mappings['Cincy'] = 'Cincinnati Bearcats';
  mappings['UNC'] = 'North Carolina Tar Heels';
  mappings['NIU'] = 'Northern Illinois Huskies';
  mappings['VaTech'] = 'Virginia Tech Hokies';
  mappings['San Diego St'] = 'San Diego State Aztecs';
  mappings['San Diego St.'] = 'San Diego State Aztecs';
  mappings['Louisiana Lafay'] = "Louisiana Ragin' Cajuns";
  mappings['Louisiana Lafayette'] = "Louisiana Ragin' Cajuns";
  mappings['Minn'] = 'Minnesota Golden Gophers';
  mappings['UMass'] = 'Massachusetts Minutemen';
  mappings['Mass'] = 'Massachusetts Minutemen';
  mappings['New Mex St'] = 'New Mexico State Aggies';

  const content = `module.exports = ${JSON.stringify(mappings, null, 2)};`;
  fs.writeFileSync(path.join(__dirname, 'team_mappings.js'), content);
  console.log('Successfully generated team_mappings.js');
  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
