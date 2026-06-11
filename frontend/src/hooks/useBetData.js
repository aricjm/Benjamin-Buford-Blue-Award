import { useState, useEffect, useCallback } from 'react';

const DEFAULT_SEASON = new Date().getUTCFullYear().toString();

export const useBetData = (selectedSeason, selectedWeek, selectedPlayer, selectedConference, statsTimeRange) => {
  const [players, setPlayers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [games, setGames] = useState([]);
  const [picks, setPicks] = useState({});
  const [summary, setSummary] = useState([]);
  const [seasonSummary, setSeasonSummary] = useState([]);
  const [allTimeSummary, setAllTimeSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [playerStats, setPlayerStats] = useState(null);
  const [conferenceStats, setConferenceStats] = useState(null);

  // Action functions
  const loadStats = useCallback(async (player) => {
    if (!player) return;
    try {
      const res = await fetch(`/api/stats/${player}`);
      const data = await res.json();
      setPlayerStats(data);
    } catch (error) {
      console.error('Failed to load stats', error);
    }
  }, []);

  const loadWeek = useCallback(async (week, season, player) => {
    setLoading(true);
    setMessage('Loading week data...');
    try {
      const res = await fetch(`/api/week/${week}/games?season=${season}`);
      const data = await res.json();
      setGames(data.games || []);
      setSummary(data.summary || []);

      const picksObj = {};
      if (data.picks && player) {
        data.picks.forEach((p) => {
          if (p.player === player) {
            picksObj[p.game_id] = {
              gameId: p.game_id,
              selectionTeam: p.selection_team,
              selectionSide: p.selection_side,
              spread: p.spread,
              isMandatory: !!p.is_mandatory
            };
          }
        });
      }
      setPicks(picksObj);
      setMessage('');
    } catch (error) {
      setMessage('Unable to load week data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConferenceStats = useCallback(async () => {
    if (!selectedPlayer || !selectedConference) {
      setConferenceStats(null);
      return;
    }
    try {
      const res = await fetch(`/api/stats/${selectedPlayer}/conference?conference=${selectedConference}&range=${statsTimeRange}&week=${selectedWeek}&season=${selectedSeason}`);
      const data = await res.json();
      setConferenceStats(data);
    } catch (error) {
      console.error('Failed to load conference stats', error);
    }
  }, [selectedPlayer, selectedConference, statsTimeRange, selectedWeek, selectedSeason]);

  // Initialize metadata
  useEffect(() => {
    async function loadMeta() {
      setLoading(true);
      try {
        const [playersRes, seasonsRes, teamsRes] = await Promise.all([
          fetch('/api/players'),
          fetch('/api/seasons'),
          fetch('/api/teams')
        ]);
        setPlayers(await playersRes.json());
        setSeasons(await seasonsRes.json());
        setTeams(await teamsRes.json());
      } catch (error) {
        setMessage('Unable to load initial metadata.');
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, []);

  // Load season specific data
  useEffect(() => {
    if (!selectedSeason) return;
    async function loadSeasonData() {
      setLoading(true);
      setMessage('Loading season data...');
      try {
        const weeksRes = await fetch(`/api/weeks?season=${selectedSeason}`);
        setWeeks(await weeksRes.json());
        
        const seasonSummaryRes = await fetch(`/api/season/${selectedSeason}/summary`);
        setSeasonSummary(await seasonSummaryRes.json());
        
        const allTimeRes = await fetch('/api/summary/alltime');
        setAllTimeSummary(await allTimeRes.json());
      } catch (error) {
        setMessage('Unable to load season data.');
      } finally {
        setLoading(false);
      }
    }
    loadSeasonData();
  }, [selectedSeason]);

  // Load player stats
  useEffect(() => {
    loadStats(selectedPlayer);
  }, [selectedPlayer, loadStats]);

  // Load week games
  useEffect(() => {
    if (selectedWeek === null || !selectedSeason) return;
    loadWeek(selectedWeek, selectedSeason, selectedPlayer);
  }, [selectedWeek, selectedSeason, selectedPlayer, loadWeek]);

  // Load conference drill-down
  useEffect(() => {
    loadConferenceStats();
  }, [loadConferenceStats]);

  const handlePickChange = (game, team) => {
    setPicks((prev) => {
      const key = game.id;
      if (!team) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return {
        ...prev,
        [key]: {
          gameId: game.id,
          selectionTeam: team,
          selectionSide: team === game.home_team ? 'home' : 'away',
          spread: team === game.home_team ? game.spread_home : game.spread_away,
          isMandatory: game.is_mandatory
        }
      };
    });
  };

  const addManualGame = async (gameData) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/week/${selectedWeek}/games?season=${selectedSeason}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
      });
      const data = await response.json();
      if (response.ok) {
        if (data.games) setGames(data.games);
        else loadWeek(selectedWeek, selectedSeason, selectedPlayer);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  return {
    players,
    seasons,
    weeks,
    teams,
    games,
    picks,
    summary,
    seasonSummary,
    allTimeSummary,
    loading,
    message,
    playerStats,
    conferenceStats,
    setLoading,
    setMessage,
    loadStats,
    loadWeek,
    handlePickChange,
    addManualGame,
    savePicks: async (playerPicks) => {
        setLoading(true);
        setMessage('Saving your picks...');
        try {
          const response = await fetch(`/api/week/${selectedWeek}/picks?season=${selectedSeason}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player: selectedPlayer, picks: playerPicks })
          });
          const data = await response.json();
          if (response.ok) {
            setSummary(data.summary || []);
          }
          return { ok: response.ok, data };
        } finally {
          setLoading(false);
        }
    }
  };
};