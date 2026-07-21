require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
const TEAM_MAPPINGS = require('./nicks_mappings');

const PICKS_TEXT = `Week 0
Navy +20.5
UTEP -1.5
Ohio +2.5
UMass +7
Hawaii +17.5
SJSU +30.5
LA Tech -12.5
Week 1
Nebraska-Minnesota u43.5
Utah -4 
Florida - Utah o44.5
Michigan State -14
Miami Ohio +17
Hawaii +3.5
Utah State - Iowa u45.5
Kentucky-Ball State u49.5
Colorado-TCU u63.5
NIU-Boston Colleg u50.5
Ohio State-Indiana o59.5
Purdue -3.5
Wash State - Colorado State u54.5
Old Dominion - VaTech u47.5
UMass +35
North Texas +6.5
West Virginia +20.5
Clemson -12.5
LSU -2.5
San Jose State +16.5
Louisville -7.5
Northwestern +6.5
Bama -40
Wyoming +14
UTSA -1.5
UNC - South Carolina u64.5
Week 2
Notre Dame -7
Colorado - Nebraska u57.5
Colorado -2.5
Tulane +7
Bama -7
Wisconsin -5.5
Northwestern -1
Georgia -42
Iowa -3.5
Iowa - Iowa State u36.5
Stanford - USC u69.5
Week 3
Iowa - Weetern Mich u42
Iowa -28.5
Memphis -13.5
Iowa State -2.5
LSU - Miss State o54
Tennessee - Florida u56
Syracuse -2.5
Colorado - Colorado State o62.5
Penn State -14
Indiana +10
Wisconsin -20
Rutgers -6.5
West Virginia -2.5
Ole Miss -17.5
Week 4
Ohio State -3.5
Oregon State -3
UCLA +5.5
Alabam -7
Wisconsin -6.5
Rutgers - Michigan o44
Rutgers +24
Iowa +14.5
Iowa - Penn State o40
NC State - Virginia o48
FSU -2
Syracuse -13
Ole Miss - Alabama o55.5
Colorado +21
Western Michigan +21.5
Maryland -7.5
Colorado State +3
Week 5
Cincy - BYU u47.5
Akron -2.5
Michigan -16.5
LSU - Ole Miss u67.5
Duke +6
Cal -13
Michigan State +12
Mich State - Iowa o36.5
Illinois +0.5
Indiana - Maryland o50.5
Utah - Oregon St u44.5
Texas A&M - Arkansas o53.5
Georgia -14
Alabama -14.5
Kansas - Texas o60.5
Louisville -3.5
Week 6
Oklahoma - Texas o60.5
Texas -5.5
Georgia -14
Notre Dame -6.5
Colorado State -3
Cal +7.5
Kansas State -11.5
Purdue +2.5
LSU - Mizz o63.5
Texas Tech - Baylor o59.5
UCF -2
Nebraska +3
Wisco -13
Maryland +19.5
Michigan -18.5
Alabama -2
Ole Miss -12.5
Week 7
Oregon - Wash o67.5
USC +3
UNC -4
UCLA - Oregon St o54.5
Wisconsin -10
Louisville -7.5
Duke -3
Ohio State -19.5
Cal - Utah o45.5
Florida +2.5
Auburn  - LSU o60.5
Arkansas - Bama o47.5
Week 8
Penn State - OSU o45.5
Air Force -10
Miami (OH) +2
Ole Miss -6.5
Utah - USC o51.5
Penn State +4.5
Northwestern +10.5
Minnesota - Iowa o30.5
Michigan -24.5
Wash State +19.5
Washington o59.5
Tennessee - Bama o47.5
Week 9
Utah +6.5
Georgia -14
Tulane -10 
Kentucky +4 
JMU -21 
Maryland -14 
Penn State -31 
Nebraska -1.5
Ohio State -15
Week 10
Texas -3.5
Missouri @ Georgia o55.5 
Oklahoma -6
Washington -3 
LSU @ Bama o61.5
Clemson +3.5
Cal-Oregon o59.5
Utah -10.5
Iowa State -3
FSU o50.5
Miami -6
Nebraska -3
Ohio State -18.5
Penn State -8.5
Northwestern +5.5
Michigan -32.5
Week 11
Penn State +4.5
Arizona -10
TCU +12
FSU-14
Washington -8.5
Georgia Tech +14
Nebraska +2
Baylor +21
Virginia Tech -1.5
Northwestern +11
Oklahoma State -2.5
Rutgers - Iowa u28.5 
Arkansas -2
Washington State +2.5
Oregon - USC o76.5
UNLV -5.5
Michigan State - Ohio State o46.5
BYU +7.5
Tennessee -2.5 
Georgia -11
Week 12
Northwestern +3
Michigan -19.5
Penn State -20.5
Minnesota +27.5
Nebraska +6
Louisville -1
JMU -9.5
Utah +1
Illinois - Iowa u32.5 🔒
Georgia -9.5
USC -5.5
Air Force -2.5
Week 13
Oregon -14
Ohio St +3.5
Alabama -13.5
Florida St -6.5
North Carolina -2.5
Iowa +2.5
Oklahoma -9.5
Tulane -3.5
Penn State -22.5
Louisville -8
Week 14
Miami (OH) +7.5
Texas -15
Boise -2.5
Georgia -5.5
Tulane -3
Troy -5
FSU -1.5
Michigan -22
Oregon - Wash u65.5`;

function parsePick(line) {
  let cleanLine = line.replace(/[🏈🔒]/g, '').trim();
  
  // Pattern 1: Team1-Team2 o/u number or Team1 @ Team2 o/u number
  const ouMatch = cleanLine.match(/^(.+?)(?:-|@)(.+?)\s*([ou])\s*([\d.]+)$/i);
  if (ouMatch) {
    return {
      team1: ouMatch[1].trim(),
      team2: ouMatch[2].trim(),
      type: 'total',
      selection: ouMatch[3].toLowerCase() === 'o' ? 'over' : 'under',
      line: parseFloat(ouMatch[4])
    };
  }
  
  // Pattern 2: Single Team o/u number (e.g. "Washington o59.5" or "FSU o50.5")
  const singleTeamOuMatch = cleanLine.match(/^(.+?)\s+([ou])\s*([\d.]+)$/i);
  if (singleTeamOuMatch) {
    return {
      team: singleTeamOuMatch[1].trim(),
      type: 'single_total',
      selection: singleTeamOuMatch[2].toLowerCase() === 'o' ? 'over' : 'under',
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
      const pick = parsePick(line);
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
  console.log(`Parsed ${picks.length} picks.`);

  const weekStats = {};
  const unmatched = [];

  for (const { week, pick, rawLine } of picks) {
    if (!weekStats[week]) {
      weekStats[week] = { wins: 0, losses: 0, pushes: 0, pending: 0, total: 0, details: [] };
    }

    let game = null;
    let selectionTeam = null;
    let result = null;

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
        result = determineTotalResult(game, pick.selection, pick.line);
      }
    } else {
      const mappedTeam1 = TEAM_MAPPINGS[pick.team1] || pick.team1;
      const mappedTeam2 = TEAM_MAPPINGS[pick.team2] || pick.team2;

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
        result = determineTotalResult(game, pick.selection, pick.line);
      }
    }

    if (game) {
      if (result === 'win') weekStats[week].wins++;
      else if (result === 'loss') weekStats[week].losses++;
      else if (result === 'push') weekStats[week].pushes++;
      else weekStats[week].pending++;
      weekStats[week].total++;

      weekStats[week].details.push({
        rawLine,
        game: `${game.away_team} @ ${game.home_team}`,
        score: `${game.score_away} - ${game.score_home}`,
        result
      });
    } else {
      unmatched.push({ week, rawLine, pick });
    }
  }

  console.log('\n=== WEEKLY WIN/LOSS RECORDS ===');
  let totalWins = 0;
  let totalLosses = 0;
  let totalPushes = 0;
  let totalPicks = 0;

  const sortedWeeks = Object.keys(weekStats).map(Number).sort((a, b) => a - b);
  for (const week of sortedWeeks) {
    const stats = weekStats[week];
    totalWins += stats.wins;
    totalLosses += stats.losses;
    totalPushes += stats.pushes;
    totalPicks += stats.total;
    console.log(`Week ${week}: ${stats.wins}W - ${stats.losses}L - ${stats.pushes}P (Total: ${stats.total})`);
  }
  console.log(`---------------------------------`);
  console.log(`TOTAL RECORD: ${totalWins}W - ${totalLosses}L - ${totalPushes}P (Total matched: ${totalPicks})`);

  if (unmatched.length > 0) {
    console.log(`\n=== UNMATCHED PICKS (${unmatched.length}) ===`);
    unmatched.forEach(u => {
      console.log(`  Week ${u.week}: "${u.rawLine}"`);
    });
  }

  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
