import React, { useState, useEffect } from 'react';
import { Trophy, Tv, ShieldAlert, Sparkles } from 'lucide-react';
import { getSettings, getMatches, getPlayers, seedDatabase } from './services/db';
import Leaderboard from './pages/Leaderboard';
import Matches from './pages/Matches';
import Admin from './pages/Admin';
import './App.css';

export default function App() {
  const [activePage, setActivePage] = useState('leaderboard');
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [toast, setToast] = useState(null);

  // Toast helper
  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load database items
  const loadData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const loadedSettings = await getSettings();
      const loadedMatches = await getMatches();
      const loadedPlayers = await getPlayers();

      // If database is completely empty (no players), seed automatically for smooth user onboarding
      if (loadedPlayers.length === 0) {
        console.log('Database empty, performing initial seeding...');
        const seeded = await seedDatabase();
        setPlayers(seeded.players);
        setMatches(seeded.matches);
        setSettings(seeded.settings);
        triggerToast('Database seeded with 25 player responses!', 'success');
      } else {
        setSettings(loadedSettings);
        setMatches(loadedMatches);
        setPlayers(loadedPlayers);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      triggerToast('Error loading database: ' + err.message, 'error');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, []);

  return (
    <div className="app-container">
      {/* Header and Nav */}
      <header className="app-header">
        <div className="nav-container">
          <div className="app-logo">
            <Trophy size={26} style={{ color: 'var(--gold)' }} />
            <span>2026 World Cup Prediction Game</span>
          </div>
          
          <nav className="nav-links">
            <button 
              className={`nav-link ${activePage === 'leaderboard' ? 'active' : ''}`}
              onClick={() => setActivePage('leaderboard')}
            >
              <Trophy size={16} /> Leaderboard
            </button>
            <button 
              className={`nav-link ${activePage === 'matches' ? 'active' : ''}`}
              onClick={() => setActivePage('matches')}
            >
              <Tv size={16} /> Matches
            </button>
            <button 
              className={`nav-link ${activePage === 'admin' ? 'active' : ''}`}
              onClick={() => setActivePage('admin')}
            >
              <ShieldAlert size={16} /> Admin Panel
            </button>
          </nav>
        </div>
      </header>

      {/* Main Body */}
      <main className="main-content">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '16px' }}>
            <div className="spin" style={{ width: '40px', height: '40px', border: '3px solid var(--primary-glow)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
            <p style={{ color: 'var(--text-muted)' }}>Loading prediction stands...</p>
          </div>
        ) : (
          <>
            {activePage === 'leaderboard' && (
              <Leaderboard 
                players={players} 
                matches={matches} 
                settings={settings} 
              />
            )}
            {activePage === 'matches' && (
              <Matches 
                matches={matches} 
                players={players} 
              />
            )}
            {activePage === 'admin' && (
              <Admin 
                players={players} 
                matches={matches} 
                settings={settings} 
                onRefresh={loadData}
                triggerToast={triggerToast}
                isAuthenticated={isAdminAuthenticated}
                setIsAuthenticated={setIsAdminAuthenticated}
              />
            )}
          </>
        )}
      </main>

      {/* Toast popup */}
      {toast && (
        <div className="toast" style={{ borderLeftColor: toast.type === 'error' ? 'var(--danger)' : 'var(--success)' }}>
          <Sparkles size={16} style={{ color: toast.type === 'error' ? 'var(--danger)' : 'var(--success)' }} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Global CSS spinner rule */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
