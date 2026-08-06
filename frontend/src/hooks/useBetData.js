import { useState, useEffect, useCallback } from 'react';

const DEFAULT_SEASON = new Date().getUTCFullYear().toString();

export const useBetData = (selectedSeason, selectedWeek, selectedPlayer, selectedConference, statsTimeRange) => {
  const [players, setPlayers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [games, setGames] = useState([]);
  const [picks, setPicks] = useState({});
  const [loadedPicks, setLoadedPicks] = useState({});
  const [summary, setSummary] = useState([]);
  const [seasonSummary, setSeasonSummary] = useState([]);
  const [allTimeSummary, setAllTimeSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [playerStats, setPlayerStats] = useState(null);
  const [conferenceStats, setConferenceStats] = useState(null);
  const [allPlayerStats, setAllPlayerStats] = useState([]);

  // Action functions
  const buildQueryString = (params) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        query.set(key, value);
      }
    });
    return query.toString();
  };

  const loadStats = useCallback(async (player) => {
    if (!player) return;
    setPlayerStats(null);
    setConferenceStats(null);
    try {
      const query = buildQueryString({ range: statsTimeRange, week: selectedWeek, season: selectedSeason });
      const res = await fetch(`/api/stats/${encodeURIComponent(player)}${query ? `?${query}` : ''}`);
      const data = await res.json();
      setPlayerStats(data);
    } catch (error) {
      console.error('Failed to load stats', error);
    }
  }, [statsTimeRange, selectedWeek, selectedSeason]);

  const loadWeek = useCallback(async (week, season, player) => {
    setLoading(true);
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
            const isLock = p.is_lock === 1 || p.is_lock === true;
            const lockType = isLock
              ? (p.selection_team !== null ? 'spread' : 'total')
              : existing.lockType;
            picksObj[p.game_id] = {
              gameId: p.game_id,
              selectionTeam: p.selection_team !== null ? p.selection_team : existing.selectionTeam,
              selectionSide: p.selection_side !== null ? p.selection_side : existing.selectionSide,
              spread: p.spread !== null ? p.spread : existing.spread,
              selectionTotal: p.selection_total !== null ? p.selection_total : existing.selectionTotal,
              totalLine: p.total_line !== null ? p.total_line : existing.totalLine,
              isMandatory: p.is_mandatory ? true : existing.isMandatory,
              result: p.result !== null ? p.result : existing.result,
              result_total: p.result_total !== null ? p.result_total : existing.result_total,
              isLock: isLock || existing.isLock || false,
              lockType: isLock ? lockType : existing.lockType || null
            };
          }
        });
      }
      setPicks(picksObj);
      setLoadedPicks(picksObj);
      setMessage('');
    } catch (error) {
      setMessage('Unable to load week data.');
      setLoadedPicks({});
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
      const query = buildQueryString({ conference: selectedConference, range: statsTimeRange, week: selectedWeek, season: selectedSeason });
      const res = await fetch(`/api/stats/${encodeURIComponent(selectedPlayer)}/conference?${query}`);
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
        return { 
          ...prev, 
          [key]: { 
            ...existing, 
            selectionTeam: null, 
            selectionSide: null, 
            spread: null,
            isLock: existing.lockType === 'spread' ? false : existing.isLock,
            lockType: existing.lockType === 'spread' ? null : existing.lockType
          } 
        };
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
        return { 
          ...prev, 
          [key]: { 
            ...existing, 
            selectionTotal: null, 
            totalLine: null,
            isLock: existing.lockType === 'total' ? false : existing.isLock,
            lockType: existing.lockType === 'total' ? null : existing.lockType
          } 
        };
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

  const handleLockToggle = (game, type) => {
    setPicks((prev) => {
      const key = game.id;
      const existing = prev[key];
      
      if (!existing) return prev;
      if (type === 'spread' && !existing.selectionTeam) return prev;
      if (type === 'total' && !existing.selectionTotal) return prev;

      const isCurrentlyLocked = existing.isLock && existing.lockType === type;

      const nextPicks = {};
      Object.keys(prev).forEach((gameId) => {
        const p = prev[gameId];
        nextPicks[gameId] = {
          ...p,
          isLock: false,
          lockType: null
        };
      });

      if (!isCurrentlyLocked) {
        nextPicks[key] = {
          ...existing,
          isLock: true,
          lockType: type
        };
      }

      return nextPicks;
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
    loadedPicks,
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
    handleLockToggle,
    addManualGame,
    savePicks: async (playerPicks) => {
        setLoading(true);
        setMessage('');
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