require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

const SHORTHANDS = [
  'Navy', 'ND', 'Jacksonville St', 'Hawaii', 'Ohio', 'Mass', 'UMass', 'New Mex St', 'Vandy', 'USC', 'FIU', 'LA Tech',
  'Texas Tech', 'Florida', 'Tulsa', 'Nebraska', 'Mich St', 'Mich St.', 'Mich State', 'Michigan State', 'Miami FL',
  'Iowa', 'Utah St', 'Utah St.', 'Utah State', 'Ohio St', 'Ohio St.', 'Ohio State', 'Indiana', 'South Car', 'Coastal Car', 'Northwestern',
  'San Jose St', 'San Jose State', 'SJSU', 'FSU', 'Florida St', 'Florida St.', 'Florida State', 'Duke', 'Indiana St', 'Illinois',
  'Kansas', 'Army', 'Wake Forest', 'SMU', 'Texas', 'North Car St', 'North Car St.', 'Tulane', 'Washington St',
  'Washington St.', 'Washington State', 'Wash State', 'Standford', 'Stanford', 'Baylor', 'North Car', 'North Carolina', 'Maryland',
  'Temple', 'LSU', 'Tenn', 'Tennessee', 'Arkansas', 'Purdue', 'Colorado', 'Troy', 'Wisconsin', 'Wisco', 'Air Force',
  'Clemson', 'Mich', 'Michigan', 'Rutgers', 'Bama', 'Alabama', 'Alabam', 'Utah', 'Iowa St', 'Iowa St.', 'Iowa State',
  'Oregon St', 'Oregon St.', 'Oregon State', 'Louisville', 'UConn', 'BYU', 'Buffalo', 'Ole Miss', 'Oklahoma', 'Syracuse', 'Arizona',
  'Miss St', 'Miss St.', 'Elon', 'Arizona St', 'Arizona St.', 'Texas A&M', 'Georgia', 'Colorado St', 'Colorado St.',
  'Colorado State', 'UCLA', 'Kansas St', 'Kansas St.', 'Kansas State', 'Ok St', 'Ok St.', 'OK St', 'Oklahoma State', 'OSU', 'Houston', 'Washington', 'Wash', 'Memphis',
  'Cinci', 'Cincinnati', 'TCU', 'South Florida', 'Auburn', 'Georgia St', 'Georgia St.', 'Boise St', 'Boise',
  'Penn St', 'Penn St.', 'Penn State', 'Ball St', 'Ball St.', 'Ball State', 'Miami(OH)', 'Miami (OH)', 'Miami Ohio', 'ASU',
  'Oregon', 'Western Mich', 'Weetern Mich', 'Western Michigan', 'JMU', 'Kentucky', 'Rice', 'Toledo', 'Boston College',
  'Boston Colleg', 'NW', 'Mizz', 'Missouri', 'Cincy', 'UNC', 'Wyoming', 'South Alabama', 'Northern Illinois', 'NIU',
  'Georgia Tech', 'California', 'Cal', 'Virginia Tech', 'Virginia Tech.', 'VaTech', 'Texas St', 'Texas St.', 'Montana',
  'San Diego St', 'San Diego St.', 'San Diego State', 'Liberty', 'Coastal Carolina', 'UTSA', 'Western Kentucky', 'Louisiana Lafay',
  'Louisiana Lafayette', 'New Mexico St', 'Minn', 'Minnesota', 'Bowling Green', 'UNLV', 'UTEP', 'Akron', 'Indiana State',
  'Illinois State', 'Missouri State', 'North Dakota State', 'South Dakota State', 'Sacramento State', 'Delaware State',
  'Hampton', 'Delaware', 'UC Davis', 'Northern Colorado', 'Eastern Washington', 'Weber State', 'Cal Poly', 'Idaho State',
  'Idaho', 'Southern Utah', 'Utah Tech', 'Kennesaw State', 'Tusculum', 'Nevada', 'Long Island University', 'Auburn',
  'Sam Houston', 'Gardner-Webb', 'Appalachian State', 'Charlotte', 'Eastern Kentucky', 'Howard', 'Eastern Michigan',
  'Monmouth', 'Georgia Southern', 'The Citadel', 'Rhode Island', 'UT Martin', 'Bethune-Cookman', 'Central Michigan',
  'SE Louisiana', 'South Dakota', 'Nicholls', 'Florida Atlantic', 'UAB', 'Villanova', 'Sacred Heart', 'Abilene Christian',
  'Chattanooga', 'New Mexico', 'Fresno State', 'San José State', 'Georgia State', 'Boise State', 'Western Kentucky', 'Appalachian State', 'Jacksonville State'
];

async function main() {
  const { rows: dbTeams } = await pool.query("SELECT DISTINCT team FROM (SELECT home_team AS team FROM games UNION SELECT away_team AS team FROM games) AS t");
  const teamNames = dbTeams.map(r => r.team);

  const mappings = {};

  for (const shorthand of SHORTHANDS) {
    // Try exact match first
    let bestMatch = teamNames.find(t => t.toLowerCase() === shorthand.toLowerCase());
    if (bestMatch) {
      mappings[shorthand] = bestMatch;
      continue;
    }

    // Try exact substring match
    const matches = teamNames.filter(t => t.toLowerCase().includes(shorthand.toLowerCase()));
    if (matches.length === 1) {
      mappings[shorthand] = matches[0];
      continue;
    }

    // Try matching location or nickname
    const locationMatch = teamNames.find(t => t.toLowerCase().startsWith(shorthand.toLowerCase() + ' '));
    if (locationMatch) {
      mappings[shorthand] = locationMatch;
      continue;
    }
  }

  // Manual overrides for tricky ones
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
  mappings['Hawaii'] = "Hawai'i Rainbow Warriors";
  mappings['Cal'] = 'California Golden Bears';
  mappings['Florida'] = 'Florida Gators';
  mappings['Iowa'] = 'Iowa Hawkeyes';
  mappings['Indiana'] = 'Indiana Hoosiers';
  mappings['Duke'] = 'Duke Blue Devils';
  mappings['Kansas'] = 'Kansas Jayhawks';
  mappings['Texas'] = 'Texas Longhorns';
  mappings['Tennessee'] = 'Tennessee Volunteers';
  mappings['Colorado'] = 'Colorado Buffaloes';
  mappings['Alabama'] = 'Alabama Crimson Tide';
  mappings['Utah'] = 'Utah Utes';
  mappings['Oklahoma'] = 'Oklahoma Sooners';
  mappings['Georgia'] = 'Georgia Bulldogs';
  mappings['Oregon'] = 'Oregon Ducks';
  mappings['Auburn'] = 'Auburn Tigers';
  mappings['Troy'] = 'Troy Trojans';
  mappings['Air Force'] = 'Air Force Falcons';
  mappings['Arizona'] = 'Arizona Wildcats';
  mappings['Virginia Tech'] = 'Virginia Tech Hokies';
  mappings['Oklahoma State'] = 'Oklahoma State Cowboys';
  mappings['Washington State'] = 'Washington State Cougars';
  mappings['Missouri'] = 'Missouri Tigers';
  mappings['Kansas State'] = 'Kansas State Wildcats';
  mappings['Texas Tech'] = 'Texas Tech Red Raiders';
  mappings['Baylor'] = 'Baylor Bears';
  mappings['Ole Miss'] = 'Ole Miss Rebels';
  mappings['Michigan State'] = 'Michigan State Spartans';
  mappings['Florida State'] = 'Florida State Seminoles';
  mappings['North Carolina'] = 'North Carolina Tar Heels';
  mappings['Coastal Carolina'] = 'Coastal Carolina Chanticleers';
  mappings['Georgia Tech'] = 'Georgia Tech Yellow Jackets';
  mappings['Western Kentucky'] = 'Western Kentucky Hilltoppers';
  mappings['San Diego State'] = 'San Diego State Aztecs';
  mappings['Appalachian State'] = 'Appalachian State Mountaineers';
  mappings['Middle Tennessee'] = 'Middle Tennessee Blue Raiders';
  mappings['Florida International'] = 'Florida International Panthers';
  mappings['Louisiana Tech'] = 'Louisiana Tech Bulldogs';
  mappings['Vanderbilt'] = 'Vanderbilt Commodores';
  mappings['Wake Forest'] = 'Wake Forest Demon Deacons';
  mappings['Boston College'] = 'Boston College Eagles';
  mappings['San José State'] = 'San José State Spartans';
  mappings['Georgia State'] = 'Georgia State Panthers';
  mappings['Boise State'] = 'Boise State Broncos';
  mappings['Western Michigan'] = 'Western Michigan Broncos';
  mappings['James Madison'] = 'James Madison Dukes';
  mappings['Kentucky'] = 'Kentucky Wildcats';
  mappings['Rice'] = 'Rice Owls';
  mappings['Toledo'] = 'Toledo Rockets';
  mappings['Northwestern'] = 'Northwestern Wildcats';
  mappings['Wyoming'] = 'Wyoming Cowboys';
  mappings['South Alabama'] = 'South Alabama Jaguars';
  mappings['Northern Illinois'] = 'Northern Illinois Huskies';
  mappings['California'] = 'California Golden Bears';
  mappings['Liberty'] = 'Liberty Flames';
  mappings['UTSA'] = 'UTSA Roadrunners';
  mappings['UTEP'] = 'UTEP Miners';
  mappings['Akron'] = 'Akron Zips';
  mappings['Ohio'] = 'Ohio Bobcats';
  mappings['Arkansas'] = 'Arkansas Razorbacks';
  mappings['Houston'] = 'Houston Cougars';
  mappings['Wash'] = 'Washington Huskies';
  mappings['UNC'] = 'North Carolina Tar Heels';
  mappings['Cincy'] = 'Cincinnati Bearcats';
  mappings['Cinci'] = 'Cincinnati Bearcats';
  mappings['Miami'] = 'Miami Hurricanes';
  mappings['Clemson'] = 'Clemson Tigers';
  mappings['Michigan'] = 'Michigan Wolverines';
  mappings['Rutgers'] = 'Rutgers Scarlet Knights';
  mappings['Louisville'] = 'Louisville Cardinals';
  mappings['BYU'] = 'BYU Cougars';
  mappings['Buffalo'] = 'Buffalo Bulls';
  mappings['Syracuse'] = 'Syracuse Orange';
  mappings['Mississippi State'] = 'Mississippi State Bulldogs';
  mappings['Elon'] = 'Elon Phoenix';
  mappings['Arizona State'] = 'Arizona State Sun Devils';
  mappings['Texas A&M'] = 'Texas A&M Aggies';
  mappings['UCLA'] = 'UCLA Bruins';
  mappings['Washington'] = 'Washington Huskies';
  mappings['Memphis'] = 'Memphis Tigers';
  mappings['TCU'] = 'TCU Horned Frogs';
  mappings['South Florida'] = 'South Florida Bulls';
  mappings['Oregon State'] = 'Oregon State Beavers';
  mappings['Stanford'] = 'Stanford Cardinal';
  mappings['Maryland'] = 'Maryland Terrapins';
  mappings['Temple'] = 'Temple Owls';
  mappings['LSU'] = 'LSU Tigers';
  mappings['Purdue'] = 'Purdue Boilermakers';
  mappings['Army'] = 'Army Black Knights';
  mappings['SMU'] = 'SMU Mustangs';
  mappings['Tulane'] = 'Tulane Green Wave';
  mappings['Old Dominion'] = 'Old Dominion Monarchs';
  mappings['North Texas'] = 'North Texas Mean Green';
  mappings['West Virginia'] = 'West Virginia Mountaineers';
  mappings['South Carolina'] = 'South Carolina Gamecocks';
  mappings['Notre Dame'] = 'Notre Dame Fighting Irish';
  mappings['Miss State'] = 'Mississippi State Bulldogs';
  mappings['NC State'] = 'NC State Wolfpack';
  mappings['Virginia'] = 'Virginia Cavaliers';
  mappings['UCF'] = 'UCF Knights';
  mappings['JMU'] = 'James Madison Dukes';
  mappings['Michigan State'] = 'Michigan State Spartans';
  mappings['Ohio State'] = 'Ohio State Buckeyes';
  mappings['Colorado State'] = 'Colorado State Rams';
  mappings['Indiana State'] = 'Indiana State Sycamores';
  mappings['Illinois State'] = 'Illinois State Redbirds';
  mappings['Missouri State'] = 'Missouri State Bears';
  mappings['North Dakota State'] = 'North Dakota State Bison';
  mappings['South Dakota State'] = 'South Dakota State Jackrabbits';
  mappings['Sacramento State'] = 'Sacramento State Hornets';
  mappings['Delaware State'] = 'Delaware State Hornets';
  mappings['Hampton'] = 'Hampton Pirates';
  mappings['Delaware'] = 'Delaware Blue Hens';
  mappings['UC Davis'] = 'UC Davis Aggies';
  mappings['Northern Colorado'] = 'Northern Colorado Bears';
  mappings['Eastern Washington'] = 'Eastern Washington Eagles';
  mappings['Weber State'] = 'Weber State Wildcats';
  mappings['Cal Poly'] = 'Cal Poly Mustangs';
  mappings['Idaho State'] = 'Idaho State Bengals';
  mappings['Idaho'] = 'Idaho Vandals';
  mappings['Southern Utah'] = 'Southern Utah Thunderbirds';
  mappings['Utah Tech'] = 'Utah Tech Trailblazers';
  mappings['Kennesaw State'] = 'Kennesaw State Owls';
  mappings['Tusculum'] = 'Tusculum Pioneers';
  mappings['Nevada'] = 'Nevada Wolf Pack';
  mappings['Long Island University'] = 'Long Island University Sharks';
  mappings['Sam Houston'] = 'Sam Houston Bearkats';
  mappings['Gardner-Webb'] = "Gardner-Webb Runnin' Bulldogs";
  mappings['Charlotte'] = 'Charlotte 49ers';
  mappings['Eastern Kentucky'] = 'Eastern Kentucky Colonels';
  mappings['Howard'] = 'Howard Bison';
  mappings['Eastern Michigan'] = 'Eastern Michigan Eagles';
  mappings['Monmouth'] = 'Monmouth Hawks';
  mappings['Georgia Southern'] = 'Georgia Southern Eagles';
  mappings['The Citadel'] = 'The Citadel Bulldogs';
  mappings['Rhode Island'] = 'Rhode Island Rams';
  mappings['UT Martin'] = 'UT Martin Skyhawks';
  mappings['Bethune-Cookman'] = 'Bethune-Cookman Wildcats';
  mappings['Central Michigan'] = 'Central Michigan Chippewas';
  mappings['SE Louisiana'] = 'SE Louisiana Lions';
  mappings['South Dakota'] = 'South Dakota Coyotes';
  mappings['Nicholls'] = 'Nicholls Colonels';
  mappings['Florida Atlantic'] = 'Florida Atlantic Owls';
  mappings['UAB'] = 'UAB Blazers';
  mappings['Villanova'] = 'Villanova Wildcats';
  mappings['Sacred Heart'] = 'Sacred Heart Pioneers';
  mappings['Abilene Christian'] = 'Abilene Christian Wildcats';
  mappings['Chattanooga'] = 'Chattanooga Mocs';
  mappings['New Mexico'] = 'New Mexico Lobos';
  mappings['Fresno State'] = 'Fresno State Bulldogs';

  const content = `module.exports = ${JSON.stringify(mappings, null, 2)};`;
  fs.writeFileSync(path.join(__dirname, 'nicks_mappings.js'), content);
  console.log('Successfully generated nicks_mappings.js');
  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
