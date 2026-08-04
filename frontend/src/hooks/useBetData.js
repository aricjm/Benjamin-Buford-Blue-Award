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
  const [allPlayerStats, setAllPlayerStats] = useState([]);

  // Action functions
  const loadStats = useCallback(async (player) => {
    if (!player) return;
    setPlayerStats(null);
    setConferenceStats(null);
    try {
      const res = await fetch(`/api/stats/${player}?range=${statsTimeRange}&week=${selectedWeek}&season=${selectedSeason}`);
      const data = await res.json();
      setPlayerStats(data);
    } catch (error) {
      console.error('Failed to load stats', error);
    }
  }, [statsTimeRange, selectedWeek, selectedSeason]);

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
            const existing = picksObj[p.game_id] || {};
            picksObj[p.game_id] = {
              gameId: p.game_id,
              selectionTeam: p.selection_team !== null ? p.selection_team : existing.selectionTeam,
              selectionSide: p.selection_side !== null ? p.selection_side : existing.selectionSide,
              spread: p.spread !== null ? p.spread : existing.spread,
              selectionTotal: p.selection_total !== null ? p.selection_total : existing.selectionTotal,
              totalLine: p.total_line !== null ? p.total_line : existing.totalLine,
              isMandatory: p.is_mandatory ? true : existing.isMandatory,
              result: p.result !== null ? p.result : existing.result,
              result_total: p.result_total !== null ? p.result_total : existing.result_total
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
        const [playersRes, seasonsRes, teamsRes, leadersRes] = await Promise.all([
          fetch('/api/players'),
          fetch('/api/seasons'),
          fetch('/api/teams'),
          fetch('/api/stats/leaders')
        ]);
        setPlayers(await playersRes.json());
        setSeasons(await seasonsRes.json());
        setTeams(await teamsRes.json());
        setAllPlayerStats(await leadersRes.json());
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
      const existing = prev[key] || { gameId: game.id, isMandatory: game.is_mandatory };
      
      if (!team) {
        if (!existing.selectionTotal) {
          const next = { ...prev };
          delete next[key];
          return next;
        }
        return { ...prev, [key]: { ...existing, selectionTeam: null, selectionSide: null, spread: null } };
      }
      
      return {
        ...prev,
        [key]: {
          ...existing,
          selectionTeam: team,
          selectionSide: team === game.home_team ? 'home' : 'away',
          spread: team === game.home_team ? game.spread_home : game.spread_away
        }
      };
    });
  };

  const handleTotalChange = (game, totalPick) => {
    setPicks((prev) => {
      const key = game.id;
      const existing = prev[key] || { gameId: game.id, isMandatory: game.is_mandatory };
      
      if (!totalPick) {
        if (!existing.selectionTeam) {
          const next = { ...prev };
          delete next[key];
          return next;
        }
        return { ...prev, [key]: { ...existing, selectionTotal: null, totalLine: null } };
      }
      
      return {
        ...prev,
        [key]: {
          ...existing,
          selectionTotal: totalPick,
          totalLine: game.over_under
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
    allPlayerStats,
    setLoading,
    setMessage,
    loadStats,
    loadWeek,
    handlePickChange,
    handleTotalChange,
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