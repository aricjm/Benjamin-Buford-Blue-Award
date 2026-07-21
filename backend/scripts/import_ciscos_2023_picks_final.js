require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
const TEAM_MAPPINGS = require('./ciscos_mappings');

const PICKS_TEXT = `Week 0
Hawaii/Vandy o55.5
Navy +20.5
UTEP/Jax o54.5
Ohio/SDSU o 47.5
New Mex -7
USC -30.5
LA Tech -12
Week 1
UNC/ South Car O 64
Nebraska +7
Miami(OH) /Miami ) O 45.5
Iowa -23.5
Ohio St/ Indiana O 59.5
MSU -13.5
Louisville/ Ga Tech U 49.5
Hawaii +3
Colorado +20.5
Tennessee -27.5
Liberty -9.5
Purdue -3.5
Umass/Auburn O 51.5
Texas/ Rice O 58.5
Boise St +14.5
A&M/ New Mexico O 48.5
UTSA/ Houston O 59.5
Texas Tech -14
Coastal/ UCLA O 66.5
Oregon State/ SJSU O 55.5
LSU -2.5
Clemson -12.5
Week 2
Wisco -5.5
Notre Dame -7.5
Neb Colorado O 58.5
Ole Miss -6.5
Bama vs Texas O 53.5
Utah/Baylor O 46.5
Purdue/ VT O 49.5
JMU/Vir O 40.5
Iowa -3.5
Iowa/ISU O 36.5
A&M/Miami O 51.5
UNC/App State O 58.5
Oregon -6.5
UCLA -13.5
USC/Stanford U69.5
Week 3
Colorado -23.5
Iowa St -3.5
LSU/ Miss St O 54.5
Tenn -6.5
Syracuse/Purdue O 57.5
Wisco -19.5
UNC -7.5
Oregon State/SDSU O 48.5
OSU -29.5
Hawaii/Oregon O 69.5
Texas -29.5
Texas/Wyoming O 49.5
Washington/MSU O 55.5
Nebraska -9.5
Maryland/UVA O 46.5
Week 4
Utah -3.5
Oklahoma/Cincy O 57.5
Clemson +1.5
Auburn A&M o 50.5
Michigan -24
Bama -7
Colorado +21
ISU/OSU O 35.5
Liberty -10
Oregon state -3
App state over 44.5
OSU -3.5
Week 5
LSU -2.5
BYU -1
Louisville -3.5
Buffalo / Akron O 54.5
Michigan / Nebraska O 39.5
Notre Dame -5.5
Oregon State -3.5
Minnestoa -11.5
Florida/Kentucky O 43.5
Texas / Kansas Under 61.5
MSU +10.5
SCAR +11.5
Washington -19.5
Week 6
Oregon State -8
Texas -5.5
Georgia/UK O 51.5
ND -6.5
Utah State -1
OK State +7
OSU -19.5
OSU/ Maryland O 58.5
Wisconsin/ Rutgers O 40.5
Buffalo +1
UNC -6.5
Bama/ A&M O 52.5
Rice -10
Colorado -4
Michigan -16.5
Boise State -7
Week 7
Iowa +9.5
Oregon/Washington O 66.5
USC +2.5
Miami/UNC U 56.5
UCLA/Oregon St U 54.5
Ohio State -17.5
Bama/Ark O 45.5
Rutgers -4.5
Tennessee -3
Kansas -3
LSU -10.5
Wyoming +11.5
Oregon State -3.5
Week 8
Oregon/WSU O 60.5
OSU -4.5
Navy/AF O 34.5
Rutgers +5.5
Baylor/UC O 50.5
Iowa -3.5
Mizzou/SCAR O 57.5
Toledo -1.5
UNC/UVA O 57.5
Ole Miss -6.5
MSU +25.5
Clemson -3
USC -6.5
USC/Utah O 51.5
ASU +27.5
Standford +17.5
Week 9
Oklahoma -7.5
Pitt +20.5
Wake/FSU O 52.5
Neb -1.5
OSU/Wisco O 46
BYU/Texas O49.5
Oregon -6
Oregon/Utah O47.5
Kentucky +3.5
UT/UK O50.5
Uconn +14.5
JMU/ODU O 48.5
Rice +10.5
FL/GA O 49.5
Week 10
Bama -3.5
Texas -3.5
Missouri/Georgia O 55.5
Oklahoma/Oklahoma St O 61.5
Washington -3
Wash/USC U 77.5
JMU -5.5
Coastal/ODU O 51.5
ND -3.5
OSU/Rut O 43.5
FSU/Pitt O 50.5
Tulane/ECU O 45.5
Iowa -5
Michigan/Purdue O 53.5
NC State +5.5
UCLA -2.5
Colorado/OSU O 58.5
Harvard/Columbia O 38.5
Yale -6.5
Week 11
YALE/Printon O 37.5
Michigan -4.5
Colorado/Arizona O 54.5
Tennessee -2.5
BYU +8.5
Alaama/Kentucky O 46.5
Kansas/Texas Tech O 62.5
Florida St/Miami O 50.5
Wash/Utah O 48.5
Rutgers +1.5
Stanford +21.5
Florida +14.5
Ohio St/Mich St O 46.5
North Carolina -12.5
Air Force/Hawaii O 46.5
Week 12
Indiana -3.5
Rutgers +20
Northwestern -2
OSU -27.5
Wisco -6
Miami/Louiville over 46.5
Dartmouth/Brown O 49.5
North Carolina/Clemson U 59.5
Notre Dame/Wake Forest O 47.5
Kansas +9.5
Washington +1.5
LSU -31.5
Air Force -2.5
Oklahoma State -6.5
Kentuck/South Carolina O 51.5
Texas/Iowa St O 44.5
Week 13
North Carolina -2.5
Oregon St +14
Ohio St/ Michigan O46.5
Alabama -13.5
Florida St -6.5
LSU -11.5
Kentucky/Louisville O 47.5
BYU +16.5
Arizona/ASU O 49.5
Washington/Washington St O 65.5
Georgia -24.5
KSU -9.5
Coastal/James Madison O 50.5
Stanford +26
Clemson/USC O48.5
UCLA -9.5
West Virgina/Baylor O 54.5
Wisconsin -2.5
Week 14
Troy -5.5
Oklahoma St. +14.5
Miami OH - Toledo o42.5
UNLV +2.5
SMU - Tulane o47.5
Georgia - Alabama o54.5
Florida State -1.5
Michigan -21.5`;

function parsePick(line, week) {
  let cleanLine = line.replace(/[🏈🔒]/g, '').trim();
  // Clean up stray parentheses before O/U indicator (e.g. "Miami ) O 45.5" -> "Miami O 45.5")
  cleanLine = cleanLine.replace(/\s*\)\s+(?=[ouOU]\s*[\d.]+)/g, ' ');

  // Pattern 1: Team1/Team2 o/u number or Team1 vs Team2 o/u number or Team1 @ Team2 o/u number
  const ouMatch = cleanLine.match(/^(.+?)(?:\/|vs|@|-)\s*(.+?)\s*([ou]|over|under)\s*([\d.]+)$/i);
  if (ouMatch) {
    return {
      team1: ouMatch[1].trim(),
      team2: ouMatch[2].trim(),
      type: 'total',
      selection: ouMatch[3].toLowerCase().startsWith('o') ? 'over' : 'under',
      line: parseFloat(ouMatch[4])
    };
  }

  // Pattern 1b: Space-separated teams total (e.g. "Neb Colorado O 58.5" or "Auburn A&M o 50.5")
  const spaceOuMatch = cleanLine.match(/^([A-Za-z0-9&\s]+?)\s+([A-Za-z0-9&\s]+?)\s+([ou]|over|under)\s*([\d.]+)$/i);
  if (spaceOuMatch) {
    const parts = cleanLine.split(/\s+/);
    if (parts.length >= 4) {
      const selection = parts[parts.length - 2].toLowerCase().startsWith('o') ? 'over' : 'under';
      const lineVal = parseFloat(parts[parts.length - 1]);
      const firstWord = parts[0];
      const restOfTeams = parts.slice(1, parts.length - 2).join(' ');
      if (restOfTeams.toLowerCase() === 'state' || restOfTeams.toLowerCase() === 'st' || restOfTeams.toLowerCase() === 'st.') {
        // Fall through to single team total
      } else {
        return {
          team1: firstWord,
          team2: restOfTeams,
          type: 'total',
          selection,
          line: lineVal
        };
      }
    }
  }

  // Pattern 2: Single Team o/u number (e.g. "Washington o59.5" or "FSU o50.5")
  const singleTeamOuMatch = cleanLine.match(/^(.+?)\s+([ou]|over|under)\s*([\d.]+)$/i);
  if (singleTeamOuMatch) {
    return {
      team: singleTeamOuMatch[1].trim(),
      type: 'single_total',
      selection: singleTeamOuMatch[2].toLowerCase().startsWith('o') ? 'over' : 'under',
      line: parseFloat(singleTeamOuMatch[3])
    };
  }

  // Pattern 3: Team +/- number (spread)
  const spreadMatch = cleanLine.match(/^(.+?)\s*([\+\-])\s*([\d.]+)$/);
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
    } else if (currentWeek !== null) {
      const pick = parsePick(line, currentWeek);
      if (pick) {
        picks.push({ week: currentWeek, pick, rawLine: line });
      } else {
        console.warn(`Could not parse line: "${line}"`);
      }
    }
  }

  return picks;
}

function determinePickResult(game, selectionTeam, spread) {
  if (game.score_home === null || game.score_away === null || !game.completed) {
    return 'pending';
  }

  const homeScore = Number(game.score_home);
  const awayScore = Number(game.score_away);
  const isHome = selectionTeam === game.home_team;

  const selectionScore = isHome ? homeScore + spread : awayScore + spread;
  const opponentScore = isHome ? awayScore : homeScore;

  if (selectionScore > opponentScore) return 'win';
  if (selectionScore < opponentScore) return 'loss';
  return 'push';
}

function determineTotalResult(game, selectionTotal, totalLine) {
  if (game.score_home === null || game.score_away === null || !game.completed) {
    return 'pending';
  }

  const totalScore = Number(game.score_home) + Number(game.score_away);
  if (totalScore > totalLine) return selectionTotal === 'over' ? 'win' : 'loss';
  if (totalScore < totalLine) return selectionTotal === 'under' ? 'win' : 'loss';
  return 'push';
}

async function main() {
  const picks = parseAllPicks(PICKS_TEXT);
  console.log(`Parsed ${picks.length} picks. Starting database insertion...`);

  // Delete any existing 2023 picks for Cisco to avoid duplicates
  await pool.query(
    `DELETE FROM picks
     WHERE player = 'Cisco'
       AND game_id IN (SELECT id FROM games WHERE season = '2023')`
  );
  console.log('Cleared existing 2023 picks for Cisco.');

  let insertedCount = 0;
  let failedCount = 0;
  const now = new Date().toISOString();

  for (const { week, pick, rawLine } of picks) {
    let game = null;
    let selectionTeam = null;
    let selectionSide = null;
    let result = null;
    let selectionTotal = null;
    let totalLine = null;
    let resultTotal = null;

    if (pick.type === 'spread') {
      const mappedTeam = TEAM_MAPPINGS[pick.team] || pick.team;

      const { rows } = await pool.query(
        `SELECT id, home_team, away_team, score_home, score_away, completed
         FROM games
         WHERE week = $1 AND season = '2023'
           AND (home_team = $2 OR away_team = $2)
         LIMIT 1`,
        [week, mappedTeam]
      );

      if (rows.length) {
        game = rows[0];
        selectionTeam = mappedTeam;
        selectionSide = selectionTeam === game.home_team ? 'home' : 'away';
        result = determinePickResult(game, selectionTeam, pick.line);
      }
    } else if (pick.type === 'single_total') {
      const mappedTeam = TEAM_MAPPINGS[pick.team] || pick.team;

      const { rows } = await pool.query(
        `SELECT id, home_team, away_team, score_home, score_away, completed
         FROM games
         WHERE week = $1 AND season = '2023'
           AND (home_team = $2 OR away_team = $2)
         LIMIT 1`,
        [week, mappedTeam]
      );

      if (rows.length) {
        game = rows[0];
        selectionTotal = pick.selection;
        totalLine = pick.line;
        resultTotal = determineTotalResult(game, selectionTotal, totalLine);
      }
    } else {
      // Two-team total pick
      let mappedTeam1 = TEAM_MAPPINGS[pick.team1] || pick.team1;
      let mappedTeam2 = TEAM_MAPPINGS[pick.team2] || pick.team2;

      // Special case for Week 10 Colorado/OSU
      if (week === 10 && (pick.team1 === 'Colorado' && pick.team2 === 'OSU')) {
        mappedTeam2 = 'Oregon State Beavers';
      }
      // Special case for Week 4 ISU/OSU
      if (week === 4 && (pick.team1 === 'ISU' && pick.team2 === 'OSU')) {
        mappedTeam2 = 'Oklahoma State Cowboys';
      }
      // Special case for Clemson/USC (South Carolina)
      if (pick.team1 === 'Clemson' && pick.team2 === 'USC') {
        mappedTeam2 = 'South Carolina Gamecocks';
      }
      if (pick.team1 === 'USC' && pick.team2 === 'Clemson') {
        mappedTeam1 = 'South Carolina Gamecocks';
      }

      const { rows } = await pool.query(
        `SELECT id, home_team, away_team, score_home, score_away, completed
         FROM games
         WHERE week = $1 AND season = '2023'
           AND (
             (home_team = $2 AND away_team = $3) OR
             (home_team = $3 AND away_team = $2)
           )
         LIMIT 1`,
        [week, mappedTeam1, mappedTeam2]
      );

      if (rows.length) {
        game = rows[0];
        selectionTotal = pick.selection;
        totalLine = pick.line;
        resultTotal = determineTotalResult(game, selectionTotal, totalLine);
      }
    }

    if (game) {
      if (pick.type === 'spread') {
        await pool.query(
          `INSERT INTO picks (
            week, player, game_id, selection_team, selection_side, spread, result, picked_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [week, 'Cisco', game.id, selectionTeam, selectionSide, pick.line, result, now, now]
        );
      } else {
        await pool.query(
          `INSERT INTO picks (
            week, player, game_id, selection_total, total_line, result, picked_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [week, 'Cisco', game.id, selectionTotal, totalLine, resultTotal, now, now]
        );
      }
      insertedCount++;
    } else {
      console.error(`Could not find game for pick: "${rawLine}" (week ${week})`);
      failedCount++;
    }
  }

  console.log(`\nDone! Inserted ${insertedCount} picks. Failed: ${failedCount}.`);
  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
