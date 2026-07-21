require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

const PICKS_TEXT = `Week 0
Navy-ND o 48.5
Jacksonville St +2
Ohio +3
Mass-New Mex St u45
Vandy -17.5
USC -31.5
FIU-LA Tech o57.5
Week 1
Texas Tech -14
Florida +4.5
Tulsa -21
Nebraska +7
Mich St -14.5
Miami FL -17
Hawaii +3.5
Iowa-Utah St o44.5
Ohio St- Indiana o59.5
USC -38
South Car +2.5
Coastal Car +14.5
Northwestern +6.5
San Jose St +16.5
FSU +2.5
Duke +13
Week 2
Indiana-Indiana St u46
Illinois-Kansas u56.5
Army -35
Vandy-Wake Forest u57.5
Nebraska +3
Iowa -4
SMU +16
Texas +7
North Car St +7.5
Tulane +7
Washington St +6
Standford-USC o70
Texas Tech +6
Baylor +7
North Car -19
Week 3
Navy-Memphis u47
Maryland -15
Temple -21
LSU -9.5
Ohio +2.5
Illinois +14
Iowa -28.5
Tenn -6.5
Arkansas -8
Purdue +2.5
Colorado -23.5
Week 4
Iowa +14.5
Ohio St -3.5
Troy -1
Wisconsin -6
Air Force -6
Clemson +2
Mich-Rutgers u44
Colorado +21
Bama -7
Utah -3.5
Iowa St -3.5
Oregon St -3
USC -34.5
Week 5
Louisville -3.5
Utah +4
UConn +3
Colorado +21.5
BYU +1
Buffalo +3
Nebraska +17.5
Ole Miss +2.5
Notre Dame -5.5
Oklahoma -20
Syracuse +7
Florida +1.5
Maryland -14.5
Iowa -10.5
Arizona +20
Tulane -21.5
Texas -16
Miss St +14.5
Week 6
Iowa -2.5
Texas -5.5
Elon +14
Colorado-Arizona St u59
Illinois -3
LSU -5.5
Texas A&M +2.5
Georgia -14.5
Louisville +6
Michigan -18
Colorado St-Utah St o62.5
Oregon St -7.5
USC -21
Kansas St-Ok St o53
UCLA -3.5
Syracuse +9.5
Arkansas +12.5
Week 7
Houston +3
Washington -3🏈
Ohio -2
Memphis +4.5
Stanford-Colorado o60
Syracuse-FSU o55.5
Michigan -33
Bama -20
Cinci -5
Texas A&M +3
Kansas -3
TCU -5.5
South Florida -2.5
Iowa-Wisconsin u34.5🏈
Auburn-LSU o61
Georgia St -1
Notre Dame -2.5 🏈🔒
Miami +3.5🏈
Oregon St -3.5🏈
Boise St -7.5
Hawaii +6
Week 8
Iowa-Minn u30.5
Penn St +4.5🏈
Ball St -3
Air Force -10🏈🔒
Miami(OH) +2🏈
Auburn +6.5🏈
USC -7🏈
Bama -9.5
South Carolina +7.5
Wisconsin -3
BYU +3
Duke +14
Michigan -24.5
Miami +3
ASU-Washington u60
Week 9
Kansas +9.5
Florida +14
Western Mich -14
Colorado-UCLA u61
Arizona +3
Northwestern +14
Oregon -6.5
Nebraska -1
Duke +6
Miss St +6.5
JMU -21
Kentucky-Tenn o50.5
Rice +10
Week 10
Bama -3
Notre Dame -3
Toledo -21
Syracuse-Boston College u50.5
Kansas St +4
Nebraska -3
Florida -3.5
Iowa - NW u30.5
Oklahoma - OK St o62.5
Iowa St. -2.5
Michigan -32.5
Wash - USC o76.5
Mizz +15
Oregon St. +13.5
Arizona +2.5
Week 11
Michigan -4.5
Kentucky +11
Buffalo +14
Arizona - Colorado o54.5
Iowa - Rutgers u27.5
Washington -8
Tennessee -3
Kansas St. -21
Oregon St. -21.5
Georgia -10.5
North Carolina -13
BYU +8
USC - Oregon o76.5
Week 12
Oregon St. -1.5
Michigan -18.5
Montana -20
Penn State -20.5
NW -2
Mich St. +3.5
Arizona -1
Iowa - Illinois u32.5
Tennessee +9.5
USC -5
Minnesota +28
Nebraska +6.5
Kentucky +2.5
San Diego St. +15
Week 13
Michigan -3.5
Iowa - Nebraska o25
Bowling Green -20
Oregon -14
Auburn +13.5
Wash - Wash St. o67
Florida +6.5
UNC -2.5
Kentucky +8
Arizona -11
BYU +16.5
Wisconsin -2.5
Rutgers +1.5
Clemson -7.5
Cincy +7
Iowa State +10
Week 14
Washington +9.5
Texas -15
Liberty -10
Miami OH +7
UNLV +2.5
Georgia - Bama o54.5
Tulane -3
Troy -5
Florida St -1
Iowa +22
Bowl Picks
Michigan -1.5
Iowa-Tenn u36.5
Washington +4
Liberty +17.5
Wisconsin +8.5 🔒
Wyoming -3
Georgia -14
Maryland +2.5
Penn St -3.5
Missouri -2.5
Iowa St -8.5
Oregon St +6.5
Kentucky +5
Arizona -3
Kansas St -3 🔒🔒
Rutgers +1
SMU -11
Texas A&M -2.5
Louisville -7.5
North Carolina +6.5
Virginia Tech -7.5
Kansas -12.5
Texas St -4
Minnesota -3.5
Coastal Carolina +10
Northwestern +7
South Alabama -16.5
Georgia St +1
Air Force +2.5
Northern Illinois +1
Troy -7.5
Georgia Tech +5
South Florida +3
UTSA -13
Western Kentucky +2.5
California +3
UCLA -4
New Mexico St -3.5
Miami OH +6.5
Louisiana Lafay +2.5`;

const TEAM_MAPPINGS = require('./nicks_mappings');

function parsePick(line) {
  let cleanLine = line.replace(/[🏈🔒]/g, '').trim();
  
  const ouMatch = cleanLine.match(/^(.+?)-(.+?)\s*([ou])\s*([\d.]+)$/i);
  if (ouMatch) {
    return {
      team1: ouMatch[1].trim(),
      team2: ouMatch[2].trim(),
      type: 'total',
      selection: ouMatch[3].toLowerCase() === 'o' ? 'over' : 'under',
      line: parseFloat(ouMatch[4])
    };
  }
  
  const spreadMatch = cleanLine.match(/^(.+?)\s+([\+\-])([\d.]+)$/);
  if (spreadMatch) {
    const team = spreadMatch[1].trim();
    const sign = spreadMatch[2];
    const value = parseFloat(spreadMatch[3]);
    const spread = sign === '+' ? value : -value;
    return {
      team,
      type: 'spread',
      line: spread
    };
  }
  
  return null;
}

function parseAllPicks(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const picks = [];
  let currentWeek = null;
  
  for (const line of lines) {
    if (line.startsWith('Week ')) {
      currentWeek = parseInt(line.split(' ')[1]);
    } else if (line === 'Bowl Picks') {
      currentWeek = 16;
    } else if (currentWeek !== null) {
      const pick = parsePick(line);
      if (pick) {
        picks.push({ week: currentWeek, pick, rawLine: line });
      }
    }
  }
  
  return picks;
}

function determinePickResult(game) {
  if (game.score_home === null || game.score_away === null || !game.completed) {
    return 'pending';
  }
  return 'completed'; // For this script, we only care if it's pending or not
}

async function main() {
  const picks = parseAllPicks(PICKS_TEXT);
  const pendingPicks = [];

  for (const { week, pick, rawLine } of picks) {
    let game = null;
    let result = null;

    if (pick.type === 'spread') {
      const mappedTeam = TEAM_MAPPINGS[pick.team] || pick.team;
      
      const { rows } = await pool.query(
        `SELECT id, home_team, away_team, score_home, score_away, completed, season 
         FROM games 
         WHERE week = $1 AND (home_team = $2 OR away_team = $2)
         LIMIT 1`,
        [week, mappedTeam]
      );

      if (rows.length) {
        game = rows[0];
        result = determinePickResult(game);
      }
    } else { // total
      const mappedTeam1 = TEAM_MAPPINGS[pick.team1] || pick.team1;
      const mappedTeam2 = TEAM_MAPPINGS[pick.team2] || pick.team2;

      const { rows } = await pool.query(
        `SELECT id, home_team, away_team, score_home, score_away, completed, season 
         FROM games 
         WHERE week = $1 AND ( (home_team = $2 AND away_team = $3) OR (home_team = $3 AND away_team = $2) )
         LIMIT 1`,
        [week, mappedTeam1, mappedTeam2]
      );

      if (rows.length) {
        game = rows[0];
        result = determinePickResult(game);
      }
    }

    if (game && result === 'pending') {
        let pickDetails = '';
        if (pick.type === 'spread') {
            pickDetails = `Spread: ${pick.team} ${pick.line > 0 ? '+' : ''}${pick.line}`;
        } else {
            pickDetails = `Total: ${pick.selection.toUpperCase()} ${pick.line}`;
        }

        pendingPicks.push({
            season: game.season,
            week: game.week,
            game: `${game.away_team} @ ${game.home_team}`,
            pick: pickDetails,
        });
    }
  }

  console.log(`\n=== ARIC'S PENDING PICKS (${pendingPicks.length}) ===`);
  if (pendingPicks.length > 0) {
    console.table(pendingPicks);
  } else {
    console.log("No pending picks found for Aric.");
  }

  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});