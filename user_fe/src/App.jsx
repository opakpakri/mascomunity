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

export default function App() {
  const [selectedGame, setSelectedGame] = useState('Home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

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

  // Format today's date Indonesian style matching Ags 27, 2026
  const getFormattedDate = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const d = new Date();
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
        onSelectGame={setSelectedGame}
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
              <span>Home</span>
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
              <div className="banner-meta">Last updated: {getFormattedDate()}</div>
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
                    onClick={() => setSelectedGame(game.name)}
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
