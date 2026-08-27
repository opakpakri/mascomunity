import React from 'react';
import { Home, ChevronLeft, ChevronRight, Gamepad2, Menu, X, LogIn } from 'lucide-react';

export default function Sidebar({ 
  selectedGame, 
  onSelectGame, 
  isCollapsed, 
  setIsCollapsed,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onSignInClick
}) {
  const gamesList = [
    'Genshin Impact',
    'Honkai: Star Rail',
    'Zenless Zone Zero',
    'Wuthering Waves',
    'Arknights Endfield',
    'Neverness To Everness'
  ];

  const handleGameSelect = (game) => {
    onSelectGame(game);
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <a href="/" className="logo" onClick={(e) => { e.preventDefault(); handleGameSelect('Home'); }}>
          Mas<span>Comunity.</span>
        </a>

        {/* Desktop Collapse Button */}
        <button 
          className="collapse-btn" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {/* Mobile Header Right Controls (Hamburger & Sign In Icon) */}
        <div className="mobile-header-controls">
          <button 
            className="mobile-hamburger-btn" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            title="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <button className="sign-in-btn mobile-signin-btn" onClick={onSignInClick} title="Sign In">
            <LogIn size={15} />
            <span className="sign-in-text">Sign In</span>
          </button>
        </div>
      </div>

      <div className={`sidebar-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <button 
          className={`nav-item ${selectedGame === 'Home' ? 'active' : ''}`}
          onClick={() => handleGameSelect('Home')}
        >
          <Home size={18} />
          <span className="nav-item-text">Home</span>
        </button>

        <div className="nav-section-title">Games</div>

        {gamesList.map((game) => (
          <button 
            key={game}
            className={`nav-item ${selectedGame === game ? 'active' : ''}`}
            onClick={() => handleGameSelect(game)}
          >
            <Gamepad2 size={18} className={selectedGame === game ? 'text-accent' : ''} />
            <span className="nav-item-text">{game}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
