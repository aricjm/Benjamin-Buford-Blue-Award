const axios = require('axios');

async function main() {
  // We will fetch all weeks of 2023 for group 81 (FCS)
  console.log('Fetching all Montana games in 2023...');
  const allGames = [];
  for (let week = 1; week <= 16; week++) {
    const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?season=2023&week=${week}&groups=81&limit=100`;
    try {
      const { data } = await axios.get(url);
      const events = data.events || [];
      const montanaEvents = events.filter(e => 
        e.name.toLowerCase().includes('montana')
      );
      montanaEvents.forEach(e => {
        const comp = e.competitions?.[0] || {};
        const home = comp.competitors?.find(c => c.homeAway === 'home') || {};
        const away = comp.competitors?.find(c => c.homeAway === 'away') || {};
        allGames.push({
          week,
          id: e.id,
          name: e.name,
          date: e.date,
          score: `${away.score} - ${home.score}`,
          completed: comp.status?.type?.completed
        });
      });
    } catch (err) {
      console.error(`Error week ${week}: ${err.message}`);
    }
  }
  console.table(allGames);
}

main();
