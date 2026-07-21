require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
const TEAM_MAPPINGS = require('./ciscos_mappings');

const PICKS_TEXT = `Week 1
Penn St -3
Indiana -2
Iowa-SDSU o44.5
Arkansas -6.5
Georgia -17
Florida +3
Ohio St -17
Florida St +3.5
GA Tech-Clemson o50.5
Week 2
Iowa-Iowa St u40
UCF -6
Alaama -20
Northwestern -10
Tennessee -6
Kentucky +6
USC -8
Baylor-BYU o53.5
Arizona St +11.5
Marshall +21
South Carolina +9
Boise St -17
Week 3
Penn St -3
Oklahoma-Nebraska u66
Washington -3.5
Texas A&M -5.5
NC State -10
Florida St -2.5
Air Force -15
Purdue Pk
South Carolina +24.5
Norte Dame -10.5
Colorado +27.5
Georgia Tech +17
LSU +2
Fresno St-USC o74
Iowa -23
Week 4
Virginia Tech +2.5
Clemson -7
Tennessee -10.5
Arkansas +2.5
Oregon St +6.5
BYU -22
Miami -25.5
Michigan St +3
Stanford +13.5
Washington St +7
Virginia +9.5
UTEP +15.5
Baylor +2.5
Notre Dame +1.5
Iowa -7.5
Iowa u34
Week 5
South Carolina-South Carolina State u55.5
Houston -2.5
Washington -2.5
Navy-Air Force u37.5
Michigan -11
Kentucky +7
TCU +6.5
Ball St-Northern Illiniois o60.5
Baylor -2
Penn St -25.5
Florida St -7
Arkansas +17.5
LSU -8
Clemson -6.5
Stanford +17
Kent St-Ohio o65.5
California +4
USTA -4.5
Week 6
Nebraska -3
Nevada -3.5
Kansas +6.5
Texas-OU o65.5
LSU +2.5
Utah -3.5
Wisconsin -10
Kentucky -7
Western Kentucky-UTSA o73
Iowa-Illinois u36.5
Notre Dame -3.5
Florida St +3
Oregon-Arizona o70.5
Week 7
Lafayette +10.5
Lafayette-Marshall u46.5
Navy +12.5
Penn St +7
Minn -6.5
Oklahoma -7
Iowa St +16.5
Tenn +7.5
North Carolina St +4
Oklahoma St +3.5
LSU-Florida o51
Kentucky +7
Florida St +3.5
Stanford +16.5
USC +3.5
UNLV +9
Week 8
UAB +1.5
Texas -6.5
Kansas State +3.5
Clemson -13.5
UCLA +6
Minn +4
Miss St-Alabama o61
Iowa-Ohio St u49.5
Liberty +7
Maryland -14
LSU -2 
California +7.5
UCLA-Oregon o71.5
Arizona St +2.5
Week 9
Washington St +7
BYU -3.5
Penn St +15.5
Iowa St +1.5
West Virgina +7.5
Central Florida -1.5
Georgia-Florida o56.5
Kansas State -1.5
Iowa -11
Wake Forest -3.5
South Carolina -4
Kentucky +12.5
Costal Carolina +2.5
USC-Arizona o76.5
Michigan St +23
Fresno St -8.5
Hawaii +10.5
Week 10
Buffalo-Ohio o59
App St -3
Washington -3.5
Air Force-Army u40
Iowa-Purdue u43
Kentucky -1.5
Nebraska +16
Virgina +7.5
Tulsa +7.5
Baylor +3
Oklahoma St -2.5
Pittsburg -3.5
Georgia -8.5
UAB +1.5
Arkansas -13.5
Alabama -13
Texas -2.5 
Arizona-Utah o67.5
Norte Dame +5
Wake Forest -5
UCLA -10.5
Week 11
Tulsa-Mephis o61.5
Arkansas +3.5
Alabama -11.5
Tulane -1.5
Washington +13
Texas -7.5
East Carolina +4.5
Colorado-USC u66
Fresno St -9
Michigan St -9
Oklahoma St +2
Iowa Pk 
Baylor -2.5
Auburn -1.5
Florida St -8.5
Arizona-UCLA o77
Utah St-Hawaii o54
Week 12
South Florida +13.5
Illiniois-Michigan u42.5
Colorado +31
Louisville -4
UCLA +2.5
Utah-Oregon u61.5
SMU-Tulane o65
Washington St -4.5
Notre Dame -21
Navy +16.5
Iowa +3
Florida St -21
Kentucky +22
Oklahoma -7.5
Arkansas +2.5
Wake Forest -10
Week 13
Cincinnati -1.5
Iowa-Nebraska o38.5
Florida St -9.5
Michigan +9
Oregon State +3
North Carolina -7
South Carolina +14.5
Kentucky -3
Alabama-Auburn o49
Iowa St +10
Norte Dame +5
Kansas St -11.5
Week 14
North Texas-UTSA o69.5
Utah +2.5
Kansas St +2.5
Toledo -3
Troy -8.5
Fresno St +3
LSU +17.5
Tulane -3.5
Clemson-North Carolina u63.5
Michigan -17`;

function parsePick(line, week) {
  let cleanLine = line.replace(/[🏈🔒*]/g, '').trim();
  cleanLine = cleanLine.replace(/\s*\)\s+(?=[ouOU]\s*[\d.]+)/g, ' ');

  // Pattern 1: Team1/Team2 o/u number or Team1 vs Team2 o/u number or Team1 @ Team2 o/u number or Team1-Team2 o/u number
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

  // Pattern 4: Team Pk (Pick'em)
  const pkMatch = cleanLine.match(/^(.+?)\s+Pk$/i);
  if (pkMatch) {
    return {
      team: pkMatch[1].trim(),
      type: 'spread',
      line: 0
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

  // Delete any existing 2022 picks for Aric in Weeks 1-14 to avoid duplicates
  await pool.query(
    `DELETE FROM picks
     WHERE player = 'Aric'
       AND week <= 14
       AND game_id IN (SELECT id FROM games WHERE season = '2022')`
  );
  console.log('Cleared existing 2022 regular season picks for Aric.');

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
         WHERE week = $1 AND season = '2022'
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
         WHERE week = $1 AND season = '2022'
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

      // Special case for Week 1 Iowa-SDSU
      if (week === 1 && (pick.team1 === 'SDSU' || pick.team2 === 'SDSU')) {
        if (pick.team1 === 'SDSU') mappedTeam1 = 'South Dakota State Jackrabbits';
        if (pick.team2 === 'SDSU') mappedTeam2 = 'South Dakota State Jackrabbits';
      }

      const { rows } = await pool.query(
        `SELECT id, home_team, away_team, score_home, score_away, completed
         FROM games
         WHERE week = $1 AND season = '2022'
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
          [week, 'Aric', game.id, selectionTeam, selectionSide, pick.line, result, now, now]
        );
      } else {
        await pool.query(
          `INSERT INTO picks (
            week, player, game_id, selection_total, total_line, result, picked_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [week, 'Aric', game.id, selectionTotal, totalLine, resultTotal, now, now]
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
