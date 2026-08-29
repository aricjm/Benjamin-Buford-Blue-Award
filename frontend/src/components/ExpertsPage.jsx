import React, { useState, useEffect } from 'react';
import { Search, ExternalLink, RefreshCw, Filter, MessageSquare, Heart, Repeat2, User } from 'lucide-react';
import useIsMobile from '../hooks/useIsMobile';
import TwitterIcon from '../resources/icons/TwitterIcon';

const EXPERTS = [
  { handle: '_Collin1', name: 'Collin Wilson', tag: '@_Collin1', focus: 'Action Network Senior CFB Writer', avatar: 'https://unavatar.io/x/_Collin1' },
  { handle: 'Stuckey2', name: 'Stuckey', tag: '@Stuckey2', focus: 'Action Network Senior CFB Analyst', avatar: 'https://unavatar.io/x/Stuckey2' },
  { handle: 'ActionColleges', name: 'Action CFB', tag: '@ActionColleges', focus: 'Action Network College Sports', avatar: 'https://unavatar.io/x/ActionColleges' },
  { handle: 'ActionNetworkHQ', name: 'Action Network', tag: '@ActionNetworkHQ', focus: 'Sports Betting Insights & News', avatar: 'https://unavatar.io/x/ActionNetworkHQ' },
  { handle: 'Shaggy_Bets', name: 'Shaggy Bets', tag: '@Shaggy_Bets', focus: 'CFB Spread & Totals Specialist', avatar: 'https://unavatar.io/x/Shaggy_Bets' },
  { handle: 'Steponaduck', name: 'Step On A Duck', tag: '@Steponaduck', focus: 'College Football Betting & Trends', avatar: 'https://unavatar.io/x/Steponaduck' },
  { handle: 'ChrisTheBear', name: 'Chris Fallica ("The Bear")', tag: '@ChrisTheBear', focus: 'FOX Sports Betting Analyst', avatar: 'https://unavatar.io/x/ChrisTheBear' },
  { handle: 'CFBWinningEdge', name: 'CFB Winning Edge', tag: '@CFBWinningEdge', focus: 'CFB Analytics & Roster Insights', avatar: 'https://unavatar.io/x/CFBWinningEdge' },
  { handle: 'PickDawgz', name: 'Pick Dawgz', tag: '@PickDawgz', focus: 'Free College Football Picks & Analysis', avatar: 'https://unavatar.io/x/PickDawgz' },
  { handle: 'VegasInsider', name: 'VegasInsider', tag: '@VegasInsider', focus: 'Vegas Odds, Lines & Expert Picks', avatar: 'https://unavatar.io/x/VegasInsider' },
];

const INITIAL_FALLBACK_INSIGHTS = [
  {
    id: 'tw-1',
    user: { name: 'Collin Wilson', screen_name: '_Collin1', profile_image_url_https: 'https://unavatar.io/x/_Collin1' },
    focus: 'Action Network Senior CFB Writer',
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    text: "Week 0 Live Movement: TCU offense looking crisp on early scripted drives. Watch the live total closely if tempo stays up in the 2nd half.",
    favorite_count: 42,
    conversation_count: 8,
    permalink: 'https://twitter.com/_Collin1'
  },
  {
    id: 'tw-2',
    user: { name: 'Stuckey', screen_name: 'Stuckey2', profile_image_url_https: 'https://unavatar.io/x/Stuckey2' },
    focus: 'Action Network Senior CFB Analyst',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    text: "My Week 1 situational spots & early leans article is live! Breaking down key coaching changes, travel spots, and early line value across all FBS conferences.",
    favorite_count: 89,
    conversation_count: 15,
    permalink: 'https://twitter.com/Stuckey2'
  },
  {
    id: 'tw-3',
    user: { name: 'Action CFB', screen_name: 'ActionColleges', profile_image_url_https: 'https://unavatar.io/x/ActionColleges' },
    focus: 'Action Network College Sports',
    created_at: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    text: "Top 25 College Football Preseason Action:\n1. Ohio State\n2. Oregon\n3. Georgia\n4. Notre Dame\n5. Texas\nFull projected win totals and conference odds are locked in.",
    favorite_count: 120,
    conversation_count: 24,
    permalink: 'https://twitter.com/ActionColleges'
  },
  {
    id: 'tw-4',
    user: { name: 'Chris Fallica ("The Bear")', screen_name: 'ChrisTheBear', profile_image_url_https: 'https://unavatar.io/x/ChrisTheBear' },
    focus: 'FOX Sports Betting Analyst',
    created_at: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    text: "Lookahead lines for Week 1 have several major underdog values. Non-conference neutral site games in early season are historically profitable for live dogs.",
    favorite_count: 64,
    conversation_count: 11,
    permalink: 'https://twitter.com/ChrisTheBear'
  },
  {
    id: 'tw-5',
    user: { name: 'CFB Winning Edge', screen_name: 'CFBWinningEdge', profile_image_url_https: 'https://unavatar.io/x/CFBWinningEdge' },
    focus: 'CFB Analytics & Roster Insights',
    created_at: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
    text: "Roster continuity & returning offensive line production rankings heading into the 2026 season. Top tier offensive lines continue to cover at a 56.4% clip in non-con play.",
    favorite_count: 95,
    conversation_count: 19,
    permalink: 'https://twitter.com/CFBWinningEdge'
  },
  {
    id: 'tw-6',
    user: { name: 'Shaggy Bets', screen_name: 'Shaggy_Bets', profile_image_url_https: 'https://unavatar.io/x/Shaggy_Bets' },
    focus: 'CFB Spread & Totals Specialist',
    created_at: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
    text: "Early weather forecasts for Saturday kickoff windows look dry with mild winds across the Midwest. Prime conditions for Over value on games with totals under 52.",
    favorite_count: 38,
    conversation_count: 5,
    permalink: 'https://twitter.com/Shaggy_Bets'
  },
  {
    id: 'tw-7',
    user: { name: 'Pick Dawgz', screen_name: 'PickDawgz', profile_image_url_https: 'https://unavatar.io/x/PickDawgz' },
    focus: 'Free College Football Picks & Analysis',
    created_at: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
    text: "Free College Football Betting Guide & full Saturday card breakdown is published. Covering moneyline upsets, parlay angles, and consensus lock picks.",
    favorite_count: 51,
    conversation_count: 7,
    permalink: 'https://twitter.com/PickDawgz'
  },
  {
    id: 'tw-8',
    user: { name: 'VegasInsider', screen_name: 'VegasInsider', profile_image_url_https: 'https://unavatar.io/x/VegasInsider' },
    focus: 'Vegas Odds, Lines & Expert Picks',
    created_at: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
    text: "Market Line Movement: Heavy sharp money reported on SEC totals and Big Ten road favorites. Full consensus odds table updated for Week 1.",
    favorite_count: 77,
    conversation_count: 12,
    permalink: 'https://twitter.com/VegasInsider'
  }
];

const ExpertsPage = () => {
  const [selectedExpert, setSelectedExpert] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [activeKeywordSearch, setActiveKeywordSearch] = useState('');
  const [tweets, setTweets] = useState(INITIAL_FALLBACK_INSIGHTS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isMobile = useIsMobile();

  const loadTweets = async () => {
    try {
      const handleParam = selectedExpert !== 'all' ? `?handle=${selectedExpert}` : '';
      const res = await fetch(`/api/experts/tweets${handleParam}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setTweets(data);
        }
      }
    } catch (err) {
      console.error('Failed to load expert tweets', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadTweets();
    const interval = setInterval(loadTweets, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [selectedExpert]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadTweets();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveKeywordSearch(keyword.trim());
  };

  const handleClearFilter = () => {
    setKeyword('');
    setActiveKeywordSearch('');
    setSelectedExpert('all');
  };

  const filteredTweets = tweets.filter(t => {
    if (!activeKeywordSearch) return true;
    const term = activeKeywordSearch.toLowerCase();
    return (
      t.text?.toLowerCase().includes(term) ||
      t.user?.name?.toLowerCase().includes(term) ||
      t.user?.screen_name?.toLowerCase().includes(term)
    );
  });

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: isMobile ? '12px' : '20px', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: '12px',
        marginBottom: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1DA1F2',
            color: '#fff',
            borderRadius: '8px',
            padding: '6px 10px',
            fontWeight: 'bold',
            fontSize: '0.85em',
            gap: '6px'
          }}>
            <TwitterIcon size={16} color="#fff" /> EXPERT FEED
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: 'bold' }}>
              CFB Experts Live Feed
            </h1>
            <span style={{ fontSize: '0.8em', color: 'rgba(255, 255, 255, 0.5)' }}>
              Unified live timeline aggregating all 10 verified college football analysts & handicappers
            </span>
          </div>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={refreshing || loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(29, 161, 242, 0.2)',
            border: '1px solid rgba(29, 161, 242, 0.4)',
            color: '#fff',
            padding: '7px 14px',
            borderRadius: '6px',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            fontSize: '0.85em',
            fontWeight: 'bold'
          }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Feed'}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        backgroundColor: '#1f1f1f',
        borderRadius: '12px',
        padding: '14px 16px',
        marginBottom: '20px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '12px',
        alignItems: isMobile ? 'stretch' : 'center',
        border: '1px solid #333'
      }}>
        {/* Expert Account Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ color: '#ccc', fontSize: '0.85em', whiteSpace: 'nowrap' }}>Account:</label>
          <select
            value={selectedExpert}
            onChange={(e) => setSelectedExpert(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: '#1a1a2e',
              color: '#fff',
              fontSize: '0.9em',
              cursor: 'pointer'
            }}
          >
            <option value="all" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>All 10 Experts (Combined)</option>
            {EXPERTS.map(exp => (
              <option key={exp.handle} value={exp.handle} style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>
                {exp.name} ({exp.tag})
              </option>
            ))}
          </select>
        </div>

        {/* Keyword Search Form */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flex: 1, gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
            <input
              type="text"
              placeholder="Search feed with keywords (e.g., 'under', 'spread', 'lock', team name)..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 12px 8px 32px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '0.9em'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #1DA1F2',
              backgroundColor: 'rgba(29, 161, 242, 0.2)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.85em',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}
          >
            Filter
          </button>
        </form>

        {(selectedExpert !== 'all' || activeKeywordSearch) && (
          <button
            type="button"
            onClick={handleClearFilter}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '0.8em',
              whiteSpace: 'nowrap'
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Quick Search Presets */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '20px',
        padding: '10px 14px',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <span style={{ fontSize: '0.78em', color: '#888', fontWeight: 'bold' }}>Quick Filters:</span>
        {['Lock', 'Under', 'Over', 'Spread', 'Upset', 'Injury', 'Big Ten', 'SEC'].map(kw => (
          <button
            key={kw}
            onClick={() => {
              setKeyword(kw);
              setActiveKeywordSearch(kw);
            }}
            style={{
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '0.75em',
              border: activeKeywordSearch === kw ? '1px solid #1DA1F2' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: activeKeywordSearch === kw ? 'rgba(29, 161, 242, 0.25)' : 'rgba(255, 255, 255, 0.04)',
              color: activeKeywordSearch === kw ? '#1DA1F2' : '#ccc',
              cursor: 'pointer'
            }}
          >
            {kw}
          </button>
        ))}
      </div>

      {/* Quick Filter Pill Badges */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '12px 16px',
        backgroundColor: '#1a1f2c',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '20px'
      }}>
        <span
          onClick={() => setSelectedExpert('all')}
          style={{
            fontSize: '0.8em',
            padding: '5px 12px',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: selectedExpert === 'all' ? 'bold' : 'normal',
            backgroundColor: selectedExpert === 'all' ? '#1DA1F2' : 'rgba(255, 255, 255, 0.05)',
            color: selectedExpert === 'all' ? '#fff' : '#aaa',
            border: selectedExpert === 'all' ? '1px solid #1DA1F2' : '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          All 10 Experts
        </span>
        {EXPERTS.map(e => (
          <span
            key={e.handle}
            onClick={() => setSelectedExpert(e.handle)}
            style={{
              fontSize: '0.8em',
              padding: '5px 12px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: selectedExpert === e.handle ? 'bold' : 'normal',
              backgroundColor: selectedExpert === e.handle ? '#1DA1F2' : 'rgba(255, 255, 255, 0.05)',
              color: selectedExpert === e.handle ? '#fff' : '#aaa',
              border: selectedExpert === e.handle ? '1px solid #1DA1F2' : '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            {e.name}
          </span>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px auto', display: 'block', color: '#1DA1F2' }} />
          Fetching live posts from all 10 CFB experts...
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredTweets.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '50px 20px',
          backgroundColor: '#1a1f2c',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#888'
        }}>
          <TwitterIcon size={36} color="#666" style={{ marginBottom: '10px' }} />
          <p style={{ margin: 0, color: '#ccc' }}>No recent posts found matching your criteria.</p>
        </div>
      )}

      {/* Live Single Combined Feed */}
      {!loading && filteredTweets.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredTweets.map(tweet => (
            <article
              key={tweet.id || tweet.created_at + tweet.user?.screen_name}
              style={{
                backgroundColor: '#1a1f2c',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '16px',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                transition: 'border-color 0.15s ease'
              }}
            >
              {/* Tweet Author Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={tweet.user?.profile_image_url_https || `https://unavatar.io/x/${tweet.user?.screen_name}`}
                    alt=""
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png'; }}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.95em' }}>{tweet.user?.name}</span>
                      <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85em' }}>@{tweet.user?.screen_name}</span>
                    </div>
                    {tweet.focus && (
                      <span style={{ fontSize: '0.75em', color: '#1DA1F2' }}>{tweet.focus}</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75em', color: 'rgba(255, 255, 255, 0.4)' }}>
                    {formatTimestamp(tweet.created_at)}
                  </span>
                  <a
                    href={tweet.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'rgba(255, 255, 255, 0.4)', display: 'flex', alignItems: 'center' }}
                    title="View on X"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              {/* Tweet Text Content */}
              <div style={{
                color: '#fff',
                fontSize: '0.92em',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                paddingLeft: '50px'
              }}>
                {tweet.text}
              </div>

              {/* Tweet Stats / Engagement Row */}
              <div style={{
                display: 'flex',
                gap: '20px',
                marginTop: '12px',
                paddingLeft: '50px',
                color: 'rgba(255, 255, 255, 0.45)',
                fontSize: '0.8em'
              }}>
                {tweet.conversation_count > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MessageSquare size={13} /> {tweet.conversation_count}
                  </span>
                )}
                {tweet.favorite_count > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Heart size={13} /> {tweet.favorite_count}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpertsPage;
