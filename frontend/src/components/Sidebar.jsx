import React from 'react';
import ChevronLeftIcon from "../resources/icons/ChevronLeftIcon";
import ChevronRightIcon from "../resources/icons/ChevronRightIcon";
import FootballIcon from "../resources/icons/FootballIcon";
import StatsIcon from "../resources/icons/StatsIcon";
import LeaderboardIcon from "../resources/icons/LeaderboardIcon";
import AddIcon from "../resources/icons/AddIcon";
import AdminIcon from "../resources/icons/AdminIcon";
import ComponentsIcon from "../resources/icons/ComponentsIcon";

const Sidebar = ({ 
  menuOpen, 
  isSidebarCollapsed, 
  setIsSidebarCollapsed, 
  activePage, 
  handlePageChange 
}) => {
  const toggleSidebar = () => {
    const next = !isSidebarCollapsed;
    setIsSidebarCollapsed(next);
    localStorage.setItem('sidebarCollapsed', next);
  };

  return (
    <aside className={`sidebar ${menuOpen ? 'open' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <div style={{ display: 'flex', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', marginBottom: '12px' }}>
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
          className={activePage === 'manual' ? 'active' : ''}
          onClick={() => handlePageChange('manual')}
          style={{ 
            padding: '8px 16px', 
            fontSize: '0.9rem', 
            textAlign: isSidebarCollapsed ? 'center' : 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            gap: '10px'
          }}
          title={isSidebarCollapsed ? "Add Manual Game" : ""}
        >
          <AddIcon />
          {!isSidebarCollapsed && <span>Add Game Manually</span>}
        </button>
        <button
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
        </button>
        <button
          className={activePage === 'buttons' ? 'active' : ''}
          onClick={() => handlePageChange('buttons')}
          style={{ 
            padding: '8px 16px', 
            fontSize: '0.9rem', 
            textAlign: isSidebarCollapsed ? 'center' : 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            gap: '10px'
          }}
          title={isSidebarCollapsed ? "Buttons" : ""}
        >
          <ComponentsIcon />
          {!isSidebarCollapsed && <span>Buttons</span>}
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;