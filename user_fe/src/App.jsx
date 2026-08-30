import React, { useState, useEffect } from 'react';
import { LogIn, Menu, X, ArrowUp } from 'lucide-react';
import Sidebar from './components/Sidebar';
import CountdownCard from './components/CountdownCard';

import genshinImg from './assets/genshin.webp';
import hsrImg from './assets/hsr.webp';
import zzzImg from './assets/zzz.webp';
import wwImg from './assets/ww.webp';
import endfieldImg from './assets/endfield.webp';
import nteImg from './assets/nte.webp';
import heroImg from './assets/hero.png';

const gameToSlug = (gameName) => {
  if (!gameName || gameName === 'Home') return '';
  // Removes spaces, colons, and special characters and converts to lowercase -> e.g. "Arknights Endfield" becomes "arknightsendfield"
  return gameName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
};

const getGameFromHash = () => {
  const rawHash = decodeURIComponent(window.location.hash.replace('#', '')).trim().toLowerCase();
  const validGames = [
    'Genshin Impact',
    'Honkai: Star Rail',
    'Zenless Zone Zero',
    'Wuthering Waves',
    'Arknights Endfield',
    'Neverness To Everness'
  ];
  if (!rawHash) return 'Home';
  const matched = validGames.find(g => {
    const slug = gameToSlug(g);
    return slug === rawHash || g.toLowerCase() === rawHash;
  });
  return matched || 'Home';
};

export default function App() {
  const [selectedGame, setSelectedGame] = useState(() => getGameFromHash());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Sync with browser back / forward navigation (popstate & hashchange)
  useEffect(() => {
    const handlePopState = () => {
      const game = getGameFromHash();
      setSelectedGame(game);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const handleSelectGame = (game) => {
    setSelectedGame(game);
    const slug = gameToSlug(game);
    const hash = slug ? `#${slug}` : '#';
    if (window.location.hash !== hash) {
      window.history.pushState({ game }, '', hash);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Scroll listener for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch countdown data from backend
  useEffect(() => {
    let isMounted = true;

    const fetchEvents = async (isInitial = false) => {
      if (isInitial) setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/games`);
        if (response.ok && isMounted) {
          const data = await response.json();
          setEvents(data);
        } else if (!response.ok) {
          console.error('Failed to fetch events from API');
        }
      } catch (err) {
        console.error('API connection failed. Using fallback empty state or log warnings:', err);
      } finally {
        if (isInitial && isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEvents(true);
    // Poll data silently every 30 seconds to keep fresh without triggering loading UI
    const interval = setInterval(() => fetchEvents(false), 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);


  const triggerToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSignInClick = () => {
    triggerToast("Sign In is not available for now.");
    setTimeout(() => {
      
    }, 1000);
  };

  // Map banners
  const gameBanners = {
    'Home': heroImg,
    'Genshin Impact': genshinImg,
    'Honkai: Star Rail': hsrImg,
    'Zenless Zone Zero': zzzImg,
    'Wuthering Waves': wwImg,
    'Arknights Endfield': endfieldImg,
    'Neverness To Everness': nteImg
  };

  const currentBanner = gameBanners[selectedGame] || gameBanners['Home'];

  // Filter events based on active selection
  const filteredEvents = selectedGame === 'Home' 
    ? events 
    : events.filter(e => e.nama_game.toLowerCase() === selectedGame.toLowerCase());

  // Split into sections
  const endGameEvents = filteredEvents.filter(e => e.kategori.toLowerCase() === 'endgame' || e.kategori.toLowerCase() === 'end game');
  const otherEvents = filteredEvents.filter(e => e.kategori.toLowerCase() === 'event' || e.kategori.toLowerCase() === 'content');

  // Format last updated date based on the latest admin input/update timestamp
  const getFormattedLastUpdated = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

    if (!events || events.length === 0) {
      return 'Ags 30, 2026';
    }

    let latestTime = 0;
    events.forEach(e => {
      const t = new Date(e.updated_at || e.created_at || e.tanggal_mulai || 0).getTime();
      if (!isNaN(t) && t > latestTime) {
        latestTime = t;
      }
    });

    if (latestTime === 0) {
      return 'Ags 30, 2026';
    }

    const d = new Date(latestTime);
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  return (
    <div className="app-container">
      {/* Toast alert */}
      {toastMessage && (
        <div className="toast">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Dark Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-backdrop" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <Sidebar 
        selectedGame={selectedGame} 
        onSelectGame={handleSelectGame}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onSignInClick={handleSignInClick}
      />

      {/* Main Panel */}
      <div className="main-content">
        <header className="header">
          <div className="header-left">
            <div className="breadcrumb">
              <span 
                style={{ cursor: 'pointer' }} 
                onClick={() => handleSelectGame('Home')}
                title="Go to Home"
              >
                Home
              </span>
              {selectedGame !== 'Home' && (
                <>
                  <span className="breadcrumb-separator">/</span>
                  <span className="breadcrumb-active">{selectedGame}</span>
                </>
              )}
            </div>
          </div>
          <div className="header-right">
            <button className="sign-in-btn desktop-signin-btn" onClick={handleSignInClick} title="Sign In">
              <LogIn size={15} />
              <span>Sign In</span>
            </button>
          </div>
        </header>

        <main className="page-body">
          {/* Hero Banner */}
          <div 
            className="game-banner"
            style={{ backgroundImage: `url(${currentBanner})` }}
          >
            <div className="banner-content">
              <h1 className="banner-title">{selectedGame === 'Home' ? 'Gacha Community Hub' : selectedGame}</h1>
              <div className="banner-subtitle">
                {selectedGame === 'Home' ? 'ALL ACTIVE EVENTS' : 'CONTENT COUNT DOWN'}
              </div>
              <div className="banner-meta">Last updated: {getFormattedLastUpdated()}</div>
            </div>
          </div>

          {selectedGame === 'Home' ? (
            <>
              <div className="countdown-header">REGISTERED GAMES</div>
              <div className="divider-line"></div>
              <p className="description-text">
                Select a game below to view its active endgame countdowns and ongoing community events.
              </p>

              <div className="game-shortcuts-grid">
                {[
                  { name: 'Genshin Impact', banner: genshinImg },
                  { name: 'Honkai: Star Rail', banner: hsrImg },
                  { name: 'Zenless Zone Zero', banner: zzzImg },
                  { name: 'Wuthering Waves', banner: wwImg },
                  { name: 'Arknights Endfield', banner: endfieldImg },
                  { name: 'Neverness To Everness', banner: nteImg }
                ].map(game => (
                  <div 
                    key={game.name} 
                    className="shortcut-card" 
                    style={{ backgroundImage: `url(${game.banner})` }}
                    onClick={() => handleSelectGame(game.name)}
                  >
                    <div className="shortcut-content">
                      <h3 className="shortcut-title">{game.name}</h3>
                      <div className="shortcut-action">View Countdowns &rarr;</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="countdown-header">COUNT DOWN</div>
              <div className="divider-line"></div>
              <p className="description-text">
                This website features countdowns for games played by the developer, so if your game isn't listed here, 
                please understand—or you can request the game you want through my Discord.
              </p>

              {loading ? (
                <div className="no-data-msg">Loading events data...</div>
              ) : (
                <div className="categories-grid">
                  {/* END GAME COLUMN */}
                  <div className="category-column">
                    <h3 className="category-title">End Game</h3>
                    <div className="divider-line" style={{ marginBottom: '16px' }}></div>
                    {endGameEvents.length === 0 ? (
                      <div className="no-data-msg">No end-game countdowns currently active.</div>
                    ) : (
                      endGameEvents.map(event => (
                        <CountdownCard key={event.id} event={event} />
                      ))
                    )}
                  </div>

                  {/* EVENTS COLUMN */}
                  <div className="category-column">
                    <h3 className="category-title">Event</h3>
                    <div className="divider-line" style={{ marginBottom: '16px' }}></div>
                    {otherEvents.length === 0 ? (
                      <div className="no-data-msg">No game events currently active.</div>
                    ) : (
                      otherEvents.map(event => (
                        <CountdownCard key={event.id} event={event} />
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        <footer className="footer">
          Copyright © {new Date().getFullYear()} MasCommunity.
        </footer>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button className="scroll-to-top-btn" onClick={scrollToTop} title="Back to top">
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
}
