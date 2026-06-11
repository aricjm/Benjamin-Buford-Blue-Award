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
      <button 
        onClick={toggleSidebar}
        style={{ 
          background: 'rgba(255,255,255,0.06)', 
          border: 'none', 
          color: '#f5f5f5', 
          cursor: 'pointer', 
          width: '100%', 
          fontSize: '1.2rem', 
          padding: '10px 0',
          borderRadius: '12px',
          marginBottom: '12px'
        }}
        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isSidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </button>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <button
          className={activePage === 'picks' ? 'active' : ''}
          onClick={() => handlePageChange('picks')}
          style={{ padding: '8px 16px', fontSize: '0.9rem', textAlign: isSidebarCollapsed ? 'center' : 'left' }}
          title={isSidebarCollapsed ? "Picks" : ""}
        >
          {isSidebarCollapsed ? <FootballIcon /> : 'Picks'}
        </button>
        <button
          className={activePage === 'stats' ? 'active' : ''}
          onClick={() => handlePageChange('stats')}
          style={{ padding: '8px 16px', fontSize: '0.9rem', textAlign: isSidebarCollapsed ? 'center' : 'left' }}
          title={isSidebarCollapsed ? "My Stats" : ""}
        >
          {isSidebarCollapsed ? <StatsIcon /> : 'My Stats'}
        </button>
        <button
          className={activePage === 'summary' ? 'active' : ''}
          onClick={() => handlePageChange('summary')}
          style={{ padding: '8px 16px', fontSize: '0.9rem', textAlign: isSidebarCollapsed ? 'center' : 'left' }}
          title={isSidebarCollapsed ? "Leaderboards" : ""}
        >
          {isSidebarCollapsed ? <LeaderboardIcon /> : 'Leaderboards'}
        </button>
        <button
          className={activePage === 'manual' ? 'active' : ''}
          onClick={() => handlePageChange('manual')}
          style={{ padding: '8px 16px', fontSize: '0.9rem', textAlign: isSidebarCollapsed ? 'center' : 'left' }}
          title={isSidebarCollapsed ? "Add Manual Game" : ""}
        >
          {isSidebarCollapsed ? <AddIcon /> : 'Add Game Manually'}
        </button>
        <button
          className={activePage === 'admin' ? 'active' : ''}
          onClick={() => handlePageChange('admin')}
          style={{ padding: '8px 16px', fontSize: '0.9rem', textAlign: isSidebarCollapsed ? 'center' : 'left' }}
          title={isSidebarCollapsed ? "Admin" : ""}
        >
          {isSidebarCollapsed ? <AdminIcon /> : 'Admin'}
        </button>
        <button
          className={activePage === 'buttons' ? 'active' : ''}
          onClick={() => handlePageChange('buttons')}
          style={{ padding: '8px 16px', fontSize: '0.9rem', textAlign: isSidebarCollapsed ? 'center' : 'left' }}
          title={isSidebarCollapsed ? "Buttons" : ""}
        >
          {isSidebarCollapsed ? <ComponentsIcon /> : 'Buttons'}
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;