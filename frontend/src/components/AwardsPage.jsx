import React, { useState } from 'react';
import { Award, Trophy, ShieldAlert, Zap, Flame, Heart, Sparkles, TrendingUp, Home, TrendingDown, ArrowUpLeftFromSquare } from 'lucide-react';
import logo from "../resources/images/benjamin_buford_blue_award_cutout.png";
import realTrophyImg from "../resources/images/platinum_shrimp_trophy.webp";

const AwardsPage = ({ seasons = [] }) => {
  const [showRealTrophy, setShowRealTrophy] = useState(false);
  const awardsBySeason = {
    '2025': [
      {
        title: "The Golden Fade Award",
        description: "Awarded to the player whose picks were the most profitable to bet against (lowest win percentage).",
        winner: "Nicholas Wood",
        reason: "Finished with a 22.22% win rate (4-14-0), making him the ultimate fade of the season.",
        icon: <ShieldAlert size={24} color="#e74c3c" />,
        badgeColor: "rgba(231, 76, 60, 0.15)"
      },
      {
        title: "The Locksmith Award",
        description: "Awarded to the player with the highest win percentage on mandatory/lock picks.",
        winner: "Andrew Cisco",
        reason: "Secured a 62.5% win rate on lock picks, proving to be the most reliable when the stakes were highest.",
        icon: <Zap size={24} color="#f1c40f" />,
        badgeColor: "rgba(241, 196, 15, 0.15)"
      },
      {
        title: "The Heart Attack Kid",
        description: "Awarded to the player who had the most games decided by 3 points or less (win or loss).",
        winner: "Aric Myers",
        reason: "Had 14 picks decided in the final seconds or by a field goal or less, keeping everyone on the edge of their seats.",
        icon: <Heart size={24} color="#e84393" />,
        badgeColor: "rgba(232, 67, 147, 0.15)"
      },
      {
        title: "The Backdoor Cover Specialist",
        description: "Awarded for the most miraculous, statistically improbable covers in garbage time.",
        winner: "Nicholas Wood",
        reason: "Won 8 picks in the final 2 minutes of games thanks to meaningless late touchdowns.",
        icon: <Flame size={24} color="#e67e22" />,
        badgeColor: "rgba(230, 126, 34, 0.15)"
      },
      {
        title: "The Overlord",
        description: "Awarded to the player who picked the most 'Over' game totals.",
        winner: "Aric Myers",
        reason: "Picked the Over in 78% of his total picks, because life is too short to bet the under.",
        icon: <Sparkles size={24} color="#9b59b6" />,
        badgeColor: "rgba(155, 89, 182, 0.15)"
      },
      {
        title: "The Underdog Whisperer",
        description: "Awarded to the player who had the highest win percentage when picking underdogs against the spread.",
        winner: "Andrew Cisco",
        reason: "Hit 64.3% of his underdog picks, showing a keen eye for value in points.",
        icon: <TrendingUp size={24} color="#2ecc71" />,
        badgeColor: "rgba(46, 204, 113, 0.15)"
      },
      {
        title: "The Home Field Advantage",
        description: "Awarded to the player with the highest win percentage on home teams.",
        winner: "Aric Myers",
        reason: "Hit 60.0% of his home team picks, defending the home turf.",
        icon: <Home size={24} color="#3498db" />,
        badgeColor: "rgba(52, 152, 219, 0.15)"
      },
      {
        title: "The Bad Beat Victim",
        description: "Awarded to the player who suffered the most heartbreaking, statistically improbable losses on the final play of the game.",
        winner: "Nicholas Wood",
        reason: "Suffered 5 losses on walk-off field goals or defensive touchdowns as time expired.",
        icon: <TrendingDown size={24} color="#e74c3c" />,
        badgeColor: "rgba(231, 76, 60, 0.15)"
      }
    ],
    '2024': [
      {
        title: "The Golden Fade Award",
        description: "Awarded to the player whose picks were the most profitable to bet against (lowest win percentage).",
        winner: "Aric Myers",
        reason: "Finished with a 50.00% win rate (110-110-3), perfectly balanced, as all things should be, but unprofitable after juice.",
        icon: <ShieldAlert size={24} color="#e74c3c" />,
        badgeColor: "rgba(231, 76, 60, 0.15)"
      },
      {
        title: "The Locksmith Award",
        description: "Awarded to the player with the highest win percentage on mandatory/lock picks.",
        winner: "Nicholas Wood",
        reason: "Hit 70% of his lock picks, carrying him to the 2024 season championship.",
        icon: <Zap size={24} color="#f1c40f" />,
        badgeColor: "rgba(241, 196, 15, 0.15)"
      },
      {
        title: "The Heart Attack Kid",
        description: "Awarded to the player who had the most games decided by 3 points or less (win or loss).",
        winner: "Andrew Cisco",
        reason: "Had 18 games decided by 3 points or less, including 3 overtime thrillers.",
        icon: <Heart size={24} color="#e84393" />,
        badgeColor: "rgba(232, 67, 147, 0.15)"
      },
      {
        title: "The Backdoor Cover Specialist",
        description: "Awarded for the most miraculous, statistically improbable covers in garbage time.",
        winner: "Aric Myers",
        reason: "Covered 9 spreads in garbage time, much to the dismay of Nick and Cisco.",
        icon: <Flame size={24} color="#e67e22" />,
        badgeColor: "rgba(230, 126, 34, 0.15)"
      },
      {
        title: "The Overlord",
        description: "Awarded to the player who picked the most 'Over' game totals.",
        winner: "Andrew Cisco",
        reason: "Picked the Over in 65% of his total picks, cheering for points all season long.",
        icon: <Sparkles size={24} color="#9b59b6" />,
        badgeColor: "rgba(155, 89, 182, 0.15)"
      },
      {
        title: "The Underdog Whisperer",
        description: "Awarded to the player who had the highest win percentage when picking underdogs against the spread.",
        winner: "Nicholas Wood",
        reason: "Hit 58.8% of his underdog picks, riding several outright upsets.",
        icon: <TrendingUp size={24} color="#2ecc71" />,
        badgeColor: "rgba(46, 204, 113, 0.15)"
      },
      {
        title: "The Home Field Advantage",
        description: "Awarded to the player with the highest win percentage on home teams.",
        winner: "Andrew Cisco",
        reason: "Hit 57.1% of his home team picks, feeding off the home crowd energy.",
        icon: <Home size={24} color="#3498db" />,
        badgeColor: "rgba(52, 152, 219, 0.15)"
      },
      {
        title: "The Bad Beat Victim",
        description: "Awarded to the player who suffered the most heartbreaking, statistically improbable losses on the final play of the game.",
        winner: "Aric Myers",
        reason: "Lost a lock pick on a blocked field goal returned 98 yards for a touchdown.",
        icon: <TrendingDown size={24} color="#e74c3c" />,
        badgeColor: "rgba(231, 76, 60, 0.15)"
      }
    ],
    '2023': [
      {
        title: "The Golden Fade Award",
        description: "Awarded to the player whose picks were the most profitable to bet against (lowest win percentage).",
        winner: "Nicholas Wood",
        reason: "Finished with a 46.83% win rate (96-109-3), struggling to find consistency.",
        icon: <ShieldAlert size={24} color="#e74c3c" />,
        badgeColor: "rgba(231, 76, 60, 0.15)"
      },
      {
        title: "The Locksmith Award",
        description: "Awarded to the player with the highest win percentage on mandatory/lock picks.",
        winner: "Aric Myers",
        reason: "Hit 75% of his lock picks, propelling him to a dominant 2023 championship.",
        icon: <Zap size={24} color="#f1c40f" />,
        badgeColor: "rgba(241, 196, 15, 0.15)"
      },
      {
        title: "The Heart Attack Kid",
        description: "Awarded to the player who had the most games decided by 3 points or less (win or loss).",
        winner: "Nicholas Wood",
        reason: "Suffered 12 losses by 3 points or less, a truly heartbreaking season.",
        icon: <Heart size={24} color="#e84393" />,
        badgeColor: "rgba(232, 67, 147, 0.15)"
      },
      {
        title: "The Backdoor Cover Specialist",
        description: "Awarded for the most miraculous, statistically improbable covers in garbage time.",
        winner: "Andrew Cisco",
        reason: "Had 7 backdoor covers, including a legendary 99-yard interception return for a touchdown as time expired.",
        icon: <Flame size={24} color="#e67e22" />,
        badgeColor: "rgba(230, 126, 34, 0.15)"
      },
      {
        title: "The Overlord",
        description: "Awarded to the player who picked the most 'Over' game totals.",
        winner: "Aric Myers",
        reason: "Picked the Over in 72% of his total picks, refusing to bet on defense.",
        icon: <Sparkles size={24} color="#9b59b6" />,
        badgeColor: "rgba(155, 89, 182, 0.15)"
      },
      {
        title: "The Underdog Whisperer",
        description: "Awarded to the player who had the highest win percentage when picking underdogs against the spread.",
        winner: "Aric Myers",
        reason: "Hit 61.1% of his underdog picks, finding diamonds in the rough.",
        icon: <TrendingUp size={24} color="#2ecc71" />,
        badgeColor: "rgba(46, 204, 113, 0.15)"
      },
      {
        title: "The Home Field Advantage",
        description: "Awarded to the player with the highest win percentage on home teams.",
        winner: "Nicholas Wood",
        reason: "Hit 58.3% of his home team picks, finding comfort in familiar stadiums.",
        icon: <Home size={24} color="#3498db" />,
        badgeColor: "rgba(52, 152, 219, 0.15)"
      },
      {
        title: "The Bad Beat Victim",
        description: "Awarded to the player who suffered the most heartbreaking, statistically improbable losses on the final play of the game.",
        winner: "Andrew Cisco",
        reason: "Lost 4 picks due to teams kneeling out the clock and losing yards to miss the spread by half a point.",
        icon: <TrendingDown size={24} color="#e74c3c" />,
        badgeColor: "rgba(231, 76, 60, 0.15)"
      }
    ],
    '2022': [
      {
        title: "The Golden Fade Award",
        description: "Awarded to the player whose picks were the most profitable to bet against (lowest win percentage).",
        winner: "Nicholas Wood",
        reason: "Finished with a 51.29% win rate (118-112-3), which was 3rd place in a highly competitive inaugural season.",
        icon: <ShieldAlert size={24} color="#e74c3c" />,
        badgeColor: "rgba(231, 76, 60, 0.15)"
      },
      {
        title: "The Locksmith Award",
        description: "Awarded to the player with the highest win percentage on mandatory/lock picks.",
        winner: "Andrew Cisco",
        reason: "Hit 68% of his lock picks, keeping the race for 1st place neck-and-neck until the final week.",
        icon: <Zap size={24} color="#f1c40f" />,
        badgeColor: "rgba(241, 196, 15, 0.15)"
      },
      {
        title: "The Heart Attack Kid",
        description: "Awarded to the player who had the most games decided by 3 points or less (win or loss).",
        winner: "Aric Myers",
        reason: "Had 15 games decided by a field goal or less, including a double-overtime win in the bowl season.",
        icon: <Heart size={24} color="#e84393" />,
        badgeColor: "rgba(232, 67, 147, 0.15)"
      },
      {
        title: "The Backdoor Cover Specialist",
        description: "Awarded for the most miraculous, statistically improbable covers in garbage time.",
        winner: "Nicholas Wood",
        reason: "Covered 10 spreads in the 4th quarter of games that were already decided.",
        icon: <Flame size={24} color="#e67e22" />,
        badgeColor: "rgba(230, 126, 34, 0.15)"
      },
      {
        title: "The Overlord",
        description: "Awarded to the player who picked the most 'Over' game totals.",
        winner: "Andrew Cisco",
        reason: "Picked the Over in 60% of his total picks, riding high-scoring offenses.",
        icon: <Sparkles size={24} color="#9b59b6" />,
        badgeColor: "rgba(155, 89, 182, 0.15)"
      },
      {
        title: "The Underdog Whisperer",
        description: "Awarded to the player who had the highest win percentage when picking underdogs against the spread.",
        winner: "Andrew Cisco",
        reason: "Hit 59.5% of his underdog picks, proving points are a bettor's best friend.",
        icon: <TrendingUp size={24} color="#2ecc71" />,
        badgeColor: "rgba(46, 204, 113, 0.15)"
      },
      {
        title: "The Home Field Advantage",
        description: "Awarded to the player with the highest win percentage on home teams.",
        winner: "Aric Myers",
        reason: "Hit 62.1% of his home team picks, making home field a lock.",
        icon: <Home size={24} color="#3498db" />,
        badgeColor: "rgba(52, 152, 219, 0.15)"
      },
      {
        title: "The Bad Beat Victim",
        description: "Awarded to the player who suffered the most heartbreaking, statistically improbable losses on the final play of the game.",
        winner: "Nicholas Wood",
        reason: "Suffered a backdoor cover on a lateral-filled kickoff return with 0:00 on the clock.",
        icon: <TrendingDown size={24} color="#e74c3c" />,
        badgeColor: "rgba(231, 76, 60, 0.15)"
      }
    ]
  };

  const [selectedSeason, setSelectedSeason] = useState(() => {
    if (seasons && seasons.length > 0) {
      const validSeasons = seasons.filter(s => s !== 'All-Time');
      return validSeasons.includes('2025') ? '2025' : validSeasons[0];
    }
    return '2025';
  });

  const currentAwards = awardsBySeason[selectedSeason] || [];

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
          margin: '20px auto'
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
              fontFamily: 'monospace',
              letterSpacing: '1px',
              textShadow: '0 0 1px #111'
            }}>
              2025
            </div>

            {/* Main Logo Text */}
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '950', 
              color: '#111', 
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              margin: '8px 0 12px 0',
              lineHeight: '1.2',
              maxWidth: '200px',
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
              lineHeight: '1.2'
            }}>
              Andrew Cisco
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
              fontFamily: 'monospace',
              color: '#ddd',
              textAlign: 'left',
              padding: '0 10px'
            }}>
              <div>2025: Andrew Cisco</div>
              <div>2024: Nicholas Wood</div>
              <div>2023: Aric Myers</div>
              <div>2022: Aric Myers</div>
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
            {seasons.filter(s => s !== 'All-Time' && awardsBySeason[s]).map(s => (
              <option key={s} value={s} style={{ backgroundColor: '#1e1e2e', color: '#fff' }}>{s} Season</option>
            ))}
          </select>
        </div>

        {currentAwards.length === 0 ? (
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
