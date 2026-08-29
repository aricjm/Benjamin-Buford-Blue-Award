import React from 'react';
import { Library, Award, Lock, TrendingUp, Radio, ListOrdered } from 'lucide-react';
import ChevronLeftIcon from "../resources/icons/ChevronLeftIcon";
import ChevronRightIcon from "../resources/icons/ChevronRightIcon";
import FootballIcon from "../resources/icons/FootballIcon";
import StatsIcon from "../resources/icons/StatsIcon";
import LeaderboardIcon from "../resources/icons/LeaderboardIcon";
import AdminIcon from "../resources/icons/AdminIcon";
import ComponentsIcon from "../resources/icons/ComponentsIcon";

const Sidebar = ({ 
  menuOpen, 
  setMenuOpen,
  isSidebarCollapsed, 
  setIsSidebarCollapsed, 
  activePage, 
  handlePageChange,
  selectedPlayer,
  hasLiveGames = false
}) => {
  const toggleSidebar = () => {
    const next = !isSidebarCollapsed;
    setIsSidebarCollapsed(next);
    localStorage.setItem('sidebarCollapsed', next);
  };

  return (
    <aside className={`sidebar ${menuOpen ? 'open' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <button 
          onClick={toggleSidebar}
          style={{ 
            background: 'rgba(255,255,255,0.06)', 
            border: 'none', 
            color: '#f5f5f5', 
            cursor: 'pointer', 
            width: '44px', 
            height: '44px',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 0
          }}
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className="sidebar-toggle-btn"
        >
          {isSidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
        <button 
          onClick={() => setMenuOpen && setMenuOpen(false)}
          className="mobile-close-btn"
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: '#f5f5f5', 
            cursor: 'pointer', 
            fontSize: '1.2em',
            fontWeight: 'bold',
            padding: '10px'
          }}
        >
          ✕
        </button>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <button
          className={activePage === 'picks' ? 'active' : ''}
          onClick={() => handlePageChange('picks')}
          style={{ 
            padding: '8px 16px', 
            fontSize: '0.9rem', 
            textAlign: isSidebarCollapsed ? 'center' : 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            gap: '10px'
          }}
          title={isSidebarCollapsed ? "Picks" : ""}
        >
          <FootballIcon />
          {!isSidebarCollapsed && <span>Picks</span>}
        </button>
        {hasLiveGames && (
          <button
            className={activePage === 'live-scores' ? 'active' : ''}
            onClick={() => handlePageChange('live-scores')}
            style={{ 
              padding: '8px 16px', 
              fontSize: '0.9rem', 
              textAlign: isSidebarCollapsed ? 'center' : 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
              gap: '10px',
              color: activePage === 'live-scores' ? '#fff' : undefined
            }}
            title={isSidebarCollapsed ? "Live Scores" : ""}
          >
            <Radio size={20} style={{ color: '#e74c3c' }} />
            {!isSidebarCollapsed && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Live Scores
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#e74c3c', display: 'inline-block' }} />
              </span>
            )}
          </button>
        )}
        <button
          className={activePage === 'bbbmlp' ? 'active' : ''}
          onClick={() => handlePageChange('bbbmlp')}
          style={{ 
            padding: '8px 16px', 
            fontSize: '0.9rem', 
            textAlign: isSidebarCollapsed ? 'center' : 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            gap: '10px'
          }}
          title={isSidebarCollapsed ? "BBBMLP" : ""}
        >
          <Lock size={20} />
          {!isSidebarCollapsed && <span>BBBMLP</span>}
        </button>
        <button
          className={activePage === 'stats' ? 'active' : ''}
          onClick={() => handlePageChange('stats')}
          style={{ 
            padding: '8px 16px', 
            fontSize: '0.9rem', 
            textAlign: isSidebarCollapsed ? 'center' : 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            gap: '10px'
          }}
          title={isSidebarCollapsed ? "Stats" : ""}
        >
          <StatsIcon />
          {!isSidebarCollapsed && <span>Stats</span>}
        </button>
        <button
          className={activePage === 'research' ? 'active' : ''}
          onClick={() => handlePageChange('research')}
          style={{ 
            padding: '8px 16px', 
            fontSize: '0.9rem', 
            textAlign: isSidebarCollapsed ? 'center' : 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            gap: '10px'
          }}
          title={isSidebarCollapsed ? "Research" : ""}
        >
          <Library size={20} />
          {!isSidebarCollapsed && <span>Research</span>}
        </button>
        <button
          className={activePage === 'odds-history' ? 'active' : ''}
          onClick={() => handlePageChange('odds-history')}
          style={{ 
            padding: '8px 16px', 
            fontSize: '0.9rem', 
            textAlign: isSidebarCollapsed ? 'center' : 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            gap: '10px'
          }}
          title={isSidebarCollapsed ? "Odds History" : ""}
        >
          <TrendingUp size={20} />
          {!isSidebarCollapsed && <span>Odds History</span>}
        </button>
        <button
          className={activePage === 'rankings-history' ? 'active' : ''}
          onClick={() => handlePageChange('rankings-history')}
          style={{ 
            padding: '8px 16px', 
            fontSize: '0.9rem', 
            textAlign: isSidebarCollapsed ? 'center' : 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            gap: '10px'
          }}
          title={isSidebarCollapsed ? "Rankings History" : ""}
        >
          <ListOrdered size={20} />
          {!isSidebarCollapsed && <span>Rankings History</span>}
        </button>
        <button
          className={activePage === 'summary' ? 'active' : ''}
          onClick={() => handlePageChange('summary')}
          style={{ 
            padding: '8px 16px', 
            fontSize: '0.9rem', 
            textAlign: isSidebarCollapsed ? 'center' : 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            gap: '10px'
          }}
          title={isSidebarCollapsed ? "Leaderboards" : ""}
        >
          <LeaderboardIcon />
          {!isSidebarCollapsed && <span>Leaderboards</span>}
        </button>
        <button
          className={activePage === 'awards' ? 'active' : ''}
          onClick={() => handlePageChange('awards')}
          style={{ 
            padding: '8px 16px', 
            fontSize: '0.9rem', 
            textAlign: isSidebarCollapsed ? 'center' : 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            gap: '10px'
          }}
          title={isSidebarCollapsed ? "Awards" : ""}
        >
          <Award size={20} />
          {!isSidebarCollapsed && <span>Awards</span>}
        </button>
        {selectedPlayer === 'Aric' && <button
          className={activePage === 'admin' ? 'active' : ''}
          onClick={() => handlePageChange('admin')}
          style={{ 
            padding: '8px 16px', 
            fontSize: '0.9rem', 
            textAlign: isSidebarCollapsed ? 'center' : 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            gap: '10px'
          }}
          title={isSidebarCollapsed ? "Admin" : ""}
        >
          <AdminIcon />
          {!isSidebarCollapsed && <span>Admin</span>}
        </button>}
      </nav>
    </aside>
  );
};

export default Sidebar;