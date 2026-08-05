import React, { useState, useEffect } from 'react';
import { Award, Trophy, ShieldAlert, Lock, Flame, LucideRoad, Sparkles, TrendingUp, DogIcon, Home, TrendingDown, ArrowUpLeftFromSquare, Hash, ArrowLeftRight } from 'lucide-react';
import logo from "../resources/images/benjamin_buford_blue_award_cutout.png";
import realTrophyImg from "../resources/images/platinum_shrimp_trophy.webp";

const AWARD_META = {
  goldenFade: {
    title: "The Golden Fade Award",
    description: "Awarded to the player whose picks were the most profitable to bet against (lowest win percentage).",
    icon: <ShieldAlert size={20} color="#e74c3c" />,
    badgeColor: "rgba(231, 76, 60, 0.15)"
  },
  locksmith: {
    title: "The Locksmith Award",
    description: "Awarded to the player with the highest win percentage on mortal lock picks.",
    icon: <Lock size={20} color="#f1c40f" />,
    badgeColor: "rgba(241, 196, 15, 0.15)"
  },
  downUnder: {
    title: "The Down Under Award",
    description: "Awarded to the player with the highest percentage of their total picks being on the 'Under'.",
    icon: <TrendingDown size={20} color="#34495e" />,
    badgeColor: "rgba(52, 73, 94, 0.15)"
  },
  roadWarrior: {
    title: "The Road Warrior",
    description: "Awarded to the player with the highest win percentage on away teams.",
    icon: <LucideRoad size={20} color="#e67e22" />,
    badgeColor: "rgba(230, 126, 34, 0.15)"
  },
  overlord: {
    title: "The Overlord Award",
    description: "Awarded to the player who picked the most 'Over' game totals.",
    icon: <Sparkles size={20} color="#9b59b6" />,
    badgeColor: "rgba(155, 89, 182, 0.15)"
  },
  underdogWhisperer: {
    title: "The Underdog Whisperer Award",
    description: "Awarded to the player who had the highest win percentage when picking underdogs against the spread.",
    icon: <DogIcon size={20} color="#2ecc71" />,
    badgeColor: "rgba(46, 204, 113, 0.15)"
  },
  homeField: {
    title: "The Homer Award",
    description: "Awarded to the player with the highest win percentage on home teams.",
    icon: <Home size={20} color="#3498db" />,
    badgeColor: "rgba(52, 152, 219, 0.15)"
  },
  chalkEater: {
    title: "The Chalk Eater Award",
    description: "Awarded to the player with the highest win percentage when picking favorites against the spread.",
    icon: <Flame size={20} color="#e74c3c" />,
    badgeColor: "rgba(231, 76, 60, 0.15)"
  },
  volumeShooter: {
    title: "The Volume Shooter Award",
    description: "Awarded to the player who made the most total picks.",
    icon: <Hash size={20} color="#95a5a6" />,
    badgeColor: "rgba(149, 165, 166, 0.15)"
  },
  pushMaster: {
    title: "The Push Master Award",
    description: "Awarded to the player who had the most pushes.",
    icon: <ArrowLeftRight size={20} color="#1abc9c" />,
    badgeColor: "rgba(26, 188, 156, 0.15)"
  }
};

const AwardsPage = ({ seasons = [], selectedPlayer }) => {
  const [showRealTrophy, setShowRealTrophy] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(() => {
    if (seasons && seasons.length > 0) {
      const validSeasons = seasons.filter(s => s !== 'All-Time');
      return validSeasons.includes('2025') ? '2025' : validSeasons[0];
    }
    return '2025';
  });
  const [awardsData, setAwardsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playerAwards, setPlayerAwards] = useState(null);
  const [loadingPlayerAwards, setLoadingPlayerAwards] = useState(false);

  useEffect(() => {
    if (!selectedSeason) return;
    setLoading(true);
    fetch(`/api/season/${selectedSeason}/awards`)
      .then(r => r.json())
      .then(data => setAwardsData(data))
      .catch(() => setAwardsData(null))
      .finally(() => setLoading(false));
  }, [selectedSeason]);

  useEffect(() => {
    if (!selectedPlayer) return;
    setLoadingPlayerAwards(true);
    fetch(`/api/player/${selectedPlayer}/awards`)
      .then(r => r.json())
      .then(data => setPlayerAwards(data))
      .catch(() => setPlayerAwards(null))
      .finally(() => setLoadingPlayerAwards(false));
  }, [selectedPlayer]);

  const champion = awardsData?.champion;
  const allTimeChamps = awardsData?.allTimeChamps || [];
  const sa = awardsData?.specialtyAwards || {};

  const currentAwards = awardsData ? [
    {
      title: "The Golden Fade Award",
      description: "Awarded to the player whose picks were the most profitable to bet against (lowest win percentage).",
      winner: sa.goldenFade?.player || "None",
      reason: sa.goldenFade ? `Finished with a ${sa.goldenFade.win_pct}% win rate (${sa.goldenFade.wins}-${sa.goldenFade.losses}-0), making them the ultimate fade of the season.` : "No data.",
      icon: <ShieldAlert size={24} color="#e74c3c" />,
      badgeColor: "rgba(231, 76, 60, 0.15)"
    },
    {
      title: "The Locksmith Award",
      description: "Awarded to the player with the highest win percentage on mortal lock picks.",
      winner: sa.locksmith?.player || "None",
      reason: sa.locksmith ? `Secured a ${sa.locksmith.win_pct}% win rate on lock picks (${sa.locksmith.wins}-${sa.locksmith.losses}-0), proving to be the most reliable when the stakes were highest.` : "No data.",
      icon: <Lock size={24} color="#f1c40f" />,
      badgeColor: "rgba(241, 196, 15, 0.15)"
    },
    {
      title: "The Down Under Award",
      description: "Awarded to the player with the highest percentage of their total picks being on the 'Under'.",
      winner: sa.downUnder?.player || "None",
      reason: sa.downUnder ? `Picked the Under in ${sa.downUnder.pct}% of their total picks (${sa.downUnder.under_picks} of ${sa.downUnder.total_picks}).` : "No data.",
      icon: <TrendingDown size={24} color="#34495e" />,
      badgeColor: "rgba(52, 73, 94, 0.15)"
    },
    {
      title: "The Road Warrior Award",
      description: "Awarded to the player with the highest win percentage on away teams.",
      winner: sa.roadWarrior?.player || "None",
      reason: sa.roadWarrior ? `Hit ${sa.roadWarrior.win_pct}% of their away team picks (${sa.roadWarrior.wins}-${sa.roadWarrior.losses}-0).` : "No data.",
      icon: <LucideRoad size={24} color="#e67e22" />,
      badgeColor: "rgba(230, 126, 34, 0.15)"
    },
    {
      title: "The Overlord Award",
      description: "Awarded to the player who picked the most 'Over' game totals.",
      winner: sa.overlord?.player || "None",
      reason: sa.overlord ? `Picked the Over in ${sa.overlord.pct}% of their total picks (${sa.overlord.over_picks} of ${sa.overlord.total_picks}).` : "No data.",
      icon: <Sparkles size={24} color="#9b59b6" />,
      badgeColor: "rgba(155, 89, 182, 0.15)"
    },
    {
      title: "The Underdog Whisperer Award",
      description: "Awarded to the player who had the highest win percentage when picking underdogs against the spread.",
      winner: sa.underdogWhisperer?.player || "None",
      reason: sa.underdogWhisperer ? `Hit ${sa.underdogWhisperer.win_pct}% of their underdog picks (${sa.underdogWhisperer.wins}-${sa.underdogWhisperer.losses}-0).` : "No data.",
      icon: <DogIcon size={24} color="#2ecc71" />,
      badgeColor: "rgba(46, 204, 113, 0.15)"
    },
    {
      title: "The Homer Award",
      description: "Awarded to the player with the highest win percentage on home teams.",
      winner: sa.homeField?.player || "None",
      reason: sa.homeField ? `Hit ${sa.homeField.win_pct}% of their home team picks (${sa.homeField.wins}-${sa.homeField.losses}-0).` : "No data.",
      icon: <Home size={24} color="#3498db" />,
      badgeColor: "rgba(52, 152, 219, 0.15)"
    },
    {
      title: "The Chalk Eater Award",
      description: "Awarded to the player with the highest win percentage when picking favorites against the spread.",
      winner: sa.chalkEater?.player || "None",
      reason: sa.chalkEater ? `Hit ${sa.chalkEater.win_pct}% of their picks on favorites (${sa.chalkEater.wins}-${sa.chalkEater.losses}-0).` : "No data.",
      icon: <Flame size={24} color="#e74c3c" />,
      badgeColor: "rgba(231, 76, 60, 0.15)"
    },
    {
      title: "The Volume Shooter Award",
      description: "Awarded to the player who made the most total picks.",
      winner: sa.volumeShooter?.player || "None",
      reason: sa.volumeShooter ? `Fired off a total of ${sa.volumeShooter.total_picks} picks throughout the season.` : "No data.",
      icon: <Hash size={24} color="#95a5a6" />,
      badgeColor: "rgba(149, 165, 166, 0.15)"
    },
    {
      title: "The Push Master Award",
      description: "Awarded to the player who had the most pushes.",
      winner: sa.pushMaster?.player || "None",
      reason: sa.pushMaster ? `Finished with ${sa.pushMaster.pushes} pushes, perfectly matching the line.` : "No data.",
      icon: <ArrowLeftRight size={24} color="#1abc9c" />,
      badgeColor: "rgba(26, 188, 156, 0.15)"
    }
  ] : [];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <Award size={36} color="#ffc107" /> The Awards Room
        </h1>
        <p style={{ color: '#888', fontSize: '1.1rem' }}>Honoring greatness, fading disasters, and celebrating the gridiron grind.</p>
      </div>

      {/* Main Trophy Section */}
      <div style={{ 
        background: 'rgba(255,255,255,0.02)', 
        border: '1px solid rgba(255,255,255,0.08)', 
        borderRadius: '16px', 
        padding: '40px 20px', 
        marginBottom: '50px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        {/* Trophy Visual */}
        <div className="trophy-container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          margin: '20px auto',
          transformOrigin: 'top center',
        }}>
          {/* Left Handle */}
          <div style={{
            position: 'absolute',
            top: '40px',
            left: '-35px',
            width: '50px',
            height: '110px',
            border: '10px solid #d1d5db',
            borderRight: 'none',
            borderRadius: '50% 0 0 50%',
            zIndex: 1
          }} />

          {/* Right Handle */}
          <div style={{
            position: 'absolute',
            top: '40px',
            right: '-35px',
            width: '50px',
            height: '110px',
            border: '10px solid #d1d5db',
            borderLeft: 'none',
            borderRadius: '0 50% 50% 0',
            zIndex: 1
          }} />

          {/* Trophy Cup */}
          <div style={{
            width: '240px',
            height: '260px',
            background: 'linear-gradient(135deg, #f3f4f6 0%, #d1d5db 50%, #9ca3af 100%)',
            borderRadius: '0 0 120px 120px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            boxShadow: '0 10px 20px rgba(0,0,0,0.3), inset 0 -10px 20px rgba(0,0,0,0.2)',
            border: '4px solid #f9fafb',
            borderTop: 'none',
            position: 'relative',
            zIndex: 2
          }}>
            {/* Hanging Shrimp (SVG) - Head is inside the cup (hidden), body and tail hang out */}
            <svg 
              width="90" 
              height="115" 
              viewBox="0 0 70 90" 
              style={{
                position: 'absolute',
                top: '-35px',
                right: '-5px',
                zIndex: 3,
                pointerEvents: 'none',
                filter: 'drop-shadow(0px 3px 5px rgba(0,0,0,0.35))'
              }}
            >
              <defs>
                <linearGradient id="shrimpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff8f66" />
                  <stop offset="40%" stopColor="#ff6b4a" />
                  <stop offset="80%" stopColor="#ff4f38" />
                  <stop offset="100%" stopColor="#e74c3c" />
                </linearGradient>
              </defs>
              {/* Tail Fan */}
              <path 
                d="M 46,72 C 50,78 56,82 62,80 C 59,74 54,70 46,72 Z" 
                fill="#ff4f38" 
              />
              <path 
                d="M 46,72 C 44,78 44,84 38,83 C 41,77 44,72 46,72 Z" 
                fill="#ff4f38" 
              />
              {/* Shrimp Body (Head is cut off at the bottom-left, inside the cup) */}
              <path 
                d="M 15,45 C 15,20 38,10 48,28 C 54,40 52,60 46,72 C 42,60 46,44 41,35 C 36,26 23,28 23,45 Z" 
                fill="url(#shrimpGrad)" 
              />
              {/* Segment Stripes */}
              <path d="M 26,26 Q 31,22 37,24" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.5" />
              <path d="M 31,32 Q 37,28 42,32" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.5" />
              <path d="M 37,40 Q 43,38 46,44" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.5" />
              <path d="M 41,50 Q 47,50 48,56" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.5" />
              <path d="M 42,60 Q 47,62 46,68" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.5" />
            </svg>

            {/* Previous Year */}
            <div style={{ 
              fontSize: '30px', 
              fontWeight: '950', 
              color: '#111', 
              marginBottom: '8px',
              fontFamily: '"Baskerville Old Face", Baskerville, serif',
              letterSpacing: '1px',
              textShadow: '0 0 1px #111'
            }}>
              {selectedSeason}
            </div>

            {/* Main Logo Text */}
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '950', 
              color: '#111', 
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              margin: '-4px 0 12px 0',
              lineHeight: '1.2',
              maxWidth: '200px',
              fontFamily: '"Baskerville Old Face", Baskerville, serif',
              textShadow: '0 0 1px #111'
            }}>
              Benjamin Buford Blue Award
            </div>

            {/* Winner Name */}
            <div style={{ 
              fontSize: '22px', 
              fontWeight: '800', 
              color: '#222', 
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              lineHeight: '1.2',
              fontFamily: '"Baskerville Old Face", Baskerville, serif'
            }}>
              {champion ? champion.player : "No Champion"}
            </div>
          </div>

          {/* Trophy Stem */}
          <div style={{
            width: '35px',
            height: '45px',
            background: 'linear-gradient(90deg, #9ca3af 0%, #d1d5db 50%, #9ca3af 100%)',
            boxShadow: '0 5px 10px rgba(0,0,0,0.2)',
            zIndex: 2
          }} />

          {/* Trophy Base */}
          <div style={{
            width: '300px',
            background: 'linear-gradient(180deg, #2c3e50 0%, #1a252f 100%)',
            border: '3px solid #d1d5db',
            borderRadius: '8px',
            padding: '20px 10px',
            boxShadow: '0 15px 30px rgba(0,0,0,0.4)',
            textAlign: 'center',
            color: '#fff',
            zIndex: 2
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '8px 12px',
              fontSize: '11px', 
              fontFamily: '"Baskerville Old Face", Baskerville, serif',
              color: '#ddd',
              textAlign: 'left',
              padding: '0 10px'
            }}>
              {allTimeChamps.map(c => (
                <div key={c.season}>{c.season}: {c.player}</div>
              ))}
              {allTimeChamps.length === 0 && <div>No champions yet</div>}
            </div>
          </div>
        </div>

        {/* Link to see the real thing */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: '10px', paddingRight: '10px' }}>
          <button 
            onClick={() => setShowRealTrophy(true)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#4d7cff', 
              cursor: 'pointer', 
              fontSize: '0.85rem', 
              textDecoration: 'underline',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
             <ArrowUpLeftFromSquare size={14} />Real Trophy Image
          </button>
        </div>
      </div>

      {/* Other Awards Section */}
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px', 
          borderBottom: '1px solid rgba(255,255,255,0.08)', 
          paddingBottom: '10px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <h2 style={{ 
            fontSize: '1.8rem', 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Trophy size={24} color="#ffc107" /> Specialty & Novelty Awards
          </h2>
          <select 
            value={selectedSeason} 
            onChange={(e) => setSelectedSeason(e.target.value)}
            style={{ 
              padding: '6px 10px', 
              borderRadius: '6px', 
              border: '1px solid rgba(255,255,255,0.1)', 
              backgroundColor: '#1e1e2e', 
              color: '#fff', 
              fontSize: '14px' 
            }}
          >
            {seasons.filter(s => s !== 'All-Time' && s !== '2026').map(s => (
              <option key={s} value={s} style={{ backgroundColor: '#1e1e2e', color: '#fff' }}>{s} Season</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div style={{ color: '#888', padding: '40px', textAlign: 'center' }}>Loading awards...</div>
        ) : currentAwards.length === 0 || !currentAwards.some(a => a.winner && a.winner !== 'None') ? (
          <div style={{ 
            color: '#888', 
            padding: '40px', 
            textAlign: 'center', 
            background: 'rgba(255,255,255,0.02)', 
            borderRadius: '12px', 
            border: '1px solid rgba(255,255,255,0.06)' 
          }}>
            Awards for the {selectedSeason} season will be announced at the conclusion of the season.
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '20px' 
          }}>
            {currentAwards.map((award, idx) => (
              <div key={idx} style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, border-color 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ 
                      padding: '8px', 
                      borderRadius: '8px', 
                      backgroundColor: award.badgeColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {award.icon}
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>{award.title}</h3>
                  </div>
                  <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '16px', lineHeight: '1.4' }}>
                    {award.description}
                  </p>
                </div>
                <div style={{ 
                  borderTop: '1px solid rgba(255,255,255,0.06)', 
                  paddingTop: '12px',
                  marginTop: '12px'
                }}>
                  <div style={{ fontSize: '0.85rem', color: '#ffc107', fontWeight: 'bold', marginBottom: '4px' }}>
                    Winner: {award.winner}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#888', lineHeight: '1.3' }}>
                    {award.reason}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Player's Trophy Room */}
      {selectedPlayer && (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '24px',
          marginTop: '40px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
            <Trophy size={24} color="#ffc107" /> {selectedPlayer}'s Trophy Room
          </h2>

          {loadingPlayerAwards ? (
            <div style={{ color: '#888', padding: '20px', textAlign: 'center' }}>Loading trophy room...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {/* Main Middle Shelf (Championships) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', padding: '20px 0 40px 0' }}>
                <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', alignItems: 'flex-end', minHeight: '120px', width: '100%', zIndex: 2 }}>
                  {playerAwards?.championships?.map(season => (
                    <div key={season} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', cursor: 'default' }} title={`${season} Champion`}>
                      {/* Mini Trophy Cup */}
                      <div style={{
                        width: '60px',
                        height: '65px',
                        background: 'linear-gradient(135deg, #9c9c9a 0%, #7c7c7b 50%, rgb(51, 51, 50) 100%)',
                        borderRadius: '0 0 30px 30px',
                        border: '2px solid #fff',
                        borderTop: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                      }}>
                        <span style={{ fontSize: '16px', fontWeight: '900', color: '#111', fontFamily: 'serif' }}>{season}</span>
                      </div>
                      {/* Mini Stem */}
                      <div style={{ width: '10px', height: '12px', background: 'linear-gradient(90deg, #9c9c9a 0%, #7c7c7b 50%, #533020 100%)' }} />
                      {/* Mini Base */}
                      <div style={{
                        width: '80px',
                        height: '16px',
                        background: 'linear-gradient(180deg, #2c3e50 0%, #1a252f 100%)',
                        border: '1px solid #f1c40f',
                        borderRadius: '3px',
                        fontSize: '9px',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                      }}>
                        CHAMPION
                      </div>
                    </div>
                  ))}
                  {(!playerAwards?.championships || playerAwards.championships.length === 0) && (
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', fontSize: '0.95rem', marginBottom: '10px' }}>
                      No Benjamin Buford Blue Award Trophies won yet.
                    </div>
                  )}
                </div>
                {/* Wooden Shelf Bar */}
                <div style={{
                  width: '100%',
                  height: '12px',
                  background: 'linear-gradient(180deg, #8b5a2b 0%, #5c4033 100%)',
                  borderRadius: '4px',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
                  marginTop: '4px',
                  zIndex: 1
                }} />
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: '8px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Championship Shelf
                </div>
              </div>

              {/* Specialty & Novelty Awards (Shelves below) */}
              <div>
                {playerAwards?.specialtyAwards && playerAwards.specialtyAwards.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                    {(() => {
                      // Chunk awards into rows of 9 to fit nicely on shelves
                      const chunks = [];
                      const size = 9;
                      for (let i = 0; i < playerAwards.specialtyAwards.length; i += size) {
                        chunks.push(playerAwards.specialtyAwards.slice(i, i + size));
                      }
                      return chunks.map((chunk, chunkIdx) => (
                        <div key={chunkIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'flex-end', minHeight: '70px', width: '100%', zIndex: 2, flexWrap: 'wrap', padding: '0 10px' }}>
                            {chunk.map((award, idx) => {
                              const meta = AWARD_META[award.awardKey] || {};
                              return (
                                <div 
                                  key={idx} 
                                  style={{
                                    width: '50px',
                                    height: '65px',
                                    background: 'linear-gradient(135deg, #301a06 0%, #533020 100%)',
                                    border: '1px solid #d4ac0d',
                                    borderRadius: '4px',
                                    padding: '4px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
                                    cursor: 'default',
                                    position: 'relative',
                                    transition: 'transform 0.2s'
                                  }}
                                  title={`${meta.title || award.awardKey}: ${award.reason}`}
                                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                  {/* Plaque Icon */}
                                  <div style={{
                                    padding: '4px',
                                    borderRadius: '4px',
                                    backgroundColor: meta.badgeColor || 'rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '2px',
                                    flexShrink: 0
                                  }}>
                                    {meta.icon ? React.cloneElement(meta.icon, { size: 24 }) : <Award size={24} />}
                                  </div>
                                  {/* Plaque Year */}
                                  <div style={{ 
                                    fontSize: '8px', 
                                    color: '#f1c40f', 
                                    fontWeight: 'bold', 
                                    marginTop: 'auto',
                                    borderTop: '1px solid rgba(255,255,255,0.15)',
                                    width: '100%',
                                    textAlign: 'center',
                                    paddingTop: '2px'
                                  }}>
                                    {award.season}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {/* Wooden Shelf Bar */}
                          <div style={{
                            width: '100%',
                            height: '8px',
                            background: 'linear-gradient(180deg, #8b5a2b 0%, #5c4033 100%)',
                            borderRadius: '3px',
                            boxShadow: '0 6px 12px rgba(0,0,0,0.5)',
                            marginTop: '4px',
                            zIndex: 1
                          }} />
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
                    No Specialty or Novelty Awards won yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Real Trophy Modal Popup */}
      {showRealTrophy && (
        <div 
          onClick={() => setShowRealTrophy(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            cursor: 'pointer'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90%',
              maxHeight: '90%',
              background: '#1e1e2e',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
            }}
          >
            <button 
              onClick={() => setShowRealTrophy(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.5)',
                border: 'none',
                color: '#fff',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1010
              }}
            >
              ✕
            </button>
            <img 
              src={realTrophyImg} 
              alt="The Real Benjamin Buford Blue Award" 
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                borderRadius: '8px',
                objectFit: 'contain'
              }}
            />
            <div style={{ color: '#aaa', marginTop: '10px', fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold' }}>
              The Real Benjamin Buford Blue Award
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AwardsPage;
