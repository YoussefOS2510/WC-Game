import React, { useState } from 'react';
import { 
  Lock, 
  Settings as SettingsIcon, 
  Users, 
  Tv, 
  RefreshCw, 
  Plus, 
  Save, 
  Trash2, 
  AlertCircle,
  Database,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import { seedDatabase, saveSettings, saveMatch, savePlayer, deleteMatch, deletePlayer, syncMatchesFromAPI, isFirebaseActive } from '../services/db';

export default function Admin({ players, matches, settings, onRefresh, triggerToast, isAuthenticated, setIsAuthenticated }) {
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('config');

  // Login checking
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'YoussefOS') {
      setIsAuthenticated(true);
      triggerToast('Access granted', 'success');
    } else {
      triggerToast('Invalid password', 'error');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '400px', margin: '80px auto', padding: '24px' }} className="glass-panel">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: 'var(--primary-glow)', padding: '12px', borderRadius: '50%' }}>
            <Lock size={32} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 style={{ margin: 0 }}>Admin Authentication</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
            Enter password to access dashboard controls
          </p>
        </div>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Unlock Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-view">
      <div className="leaderboard-header">
        <div className="title-section">
          <h1>Admin Control Panel</h1>
          <p>
            Database management, configuration settings, and match updates
            {isFirebaseActive() ? (
              <span className="badge badge-visible" style={{ marginLeft: '10px' }}>Firebase Connected</span>
            ) : (
              <span className="badge badge-hidden" style={{ marginLeft: '10px' }}>Local Storage Mode</span>
            )}
          </p>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="tabs-header">
        <button 
          className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          <SettingsIcon size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          Config & Seeding
        </button>
        <button 
          className={`tab-btn ${activeTab === 'players' ? 'active' : ''}`}
          onClick={() => setActiveTab('players')}
        >
          <Users size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          Player Visibility ({players.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          <Tv size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          Matches & API Sync ({matches.length})
        </button>
      </div>

      <div className="admin-grid">
        {activeTab === 'config' && (
          <ConfigTab 
            settings={settings} 
            onRefresh={onRefresh} 
            triggerToast={triggerToast} 
          />
        )}
        {activeTab === 'players' && (
          <PlayersTab 
            players={players} 
            onRefresh={onRefresh} 
            triggerToast={triggerToast} 
          />
        )}
        {activeTab === 'matches' && (
          <MatchesTab 
            matches={matches} 
            settings={settings} 
            onRefresh={onRefresh} 
            triggerToast={triggerToast} 
          />
        )}
      </div>
    </div>
  );
}

// ==================== CONFIG TAB ====================
function ConfigTab({ settings, onRefresh, triggerToast }) {
  const [formSettings, setFormSettings] = useState({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleInputChange = (key, value) => {
    setFormSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveSettings(formSettings);
      triggerToast('Settings saved successfully', 'success');
      onRefresh();
    } catch (err) {
      triggerToast('Failed to save settings: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeed = async () => {
    if (window.confirm('WARNING: Seeding the database will reset all players, matches, and configurations to their default values. Do you want to proceed?')) {
      setIsSeeding(true);
      try {
        await seedDatabase();
        triggerToast('Database seeded from Excel responses!', 'success');
        onRefresh();
      } catch (err) {
        triggerToast('Failed to seed database: ' + err.message, 'error');
      } finally {
        setIsSeeding(false);
      }
    }
  };

  return (
    <>
      {/* Settings Form */}
      <form onSubmit={handleSave} className="admin-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 className="admin-card-title">
          <SettingsIcon size={18} /> Point Configuration Rules
        </h3>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Pot 1 Win Points</label>
            <input
              type="number"
              className="form-input"
              value={formSettings.pot1WinPoints || 0}
              onChange={(e) => handleInputChange('pot1WinPoints', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Pot 1 Draw Points</label>
            <input
              type="number"
              className="form-input"
              value={formSettings.pot1DrawPoints || 0}
              onChange={(e) => handleInputChange('pot1DrawPoints', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Pot 2 Win Points</label>
            <input
              type="number"
              className="form-input"
              value={formSettings.pot2WinPoints || 0}
              onChange={(e) => handleInputChange('pot2WinPoints', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Pot 2 Draw Points</label>
            <input
              type="number"
              className="form-input"
              value={formSettings.pot2DrawPoints || 0}
              onChange={(e) => handleInputChange('pot2DrawPoints', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Pot 3 Win Points</label>
            <input
              type="number"
              className="form-input"
              value={formSettings.pot3WinPoints || 0}
              onChange={(e) => handleInputChange('pot3WinPoints', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Pot 3 Draw Points</label>
            <input
              type="number"
              className="form-input"
              value={formSettings.pot3DrawPoints || 0}
              onChange={(e) => handleInputChange('pot3DrawPoints', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Dark Horse Multiplier</label>
            <input
              type="number"
              step="0.1"
              className="form-input"
              value={formSettings.darkHorseMultiplier || 1.0}
              onChange={(e) => handleInputChange('darkHorseMultiplier', parseFloat(e.target.value) || 1.0)}
              min="1.0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Goal Difference Points Bonus</label>
            <input
              type="number"
              className="form-input"
              value={formSettings.goalDifferenceBonus || 0}
              onChange={(e) => handleInputChange('goalDifferenceBonus', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Player Awards Bonus (End of Tournament)</label>
            <input
              type="number"
              className="form-input"
              value={formSettings.awardPointsBonus || 0}
              onChange={(e) => handleInputChange('awardPointsBonus', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
          <div className="form-group">
            {/* Empty block for layout alignment */}
          </div>
        </div>

        <h3 className="admin-card-title" style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
          Official Tournament Winners
        </h3>

        <div className="form-group">
          <label className="form-label">Best Player (Golden Ball)</label>
          <input
            type="text"
            className="form-input"
            value={formSettings.actualBestPlayer}
            onChange={(e) => handleInputChange('actualBestPlayer', e.target.value)}
            placeholder="Official Best Player name"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Top Goal Scorer (Golden Boot)</label>
          <input
            type="text"
            className="form-input"
            value={formSettings.actualTopScorer}
            onChange={(e) => handleInputChange('actualTopScorer', e.target.value)}
            placeholder="Official Top Scorer name"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Best Goalkeeper (Golden Glove)</label>
          <input
            type="text"
            className="form-input"
            value={formSettings.actualBestGoalkeeper}
            onChange={(e) => handleInputChange('actualBestGoalkeeper', e.target.value)}
            placeholder="Official Goalkeeper name"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={isSaving}>
          <Save size={16} /> {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      {/* Database Seeding Card */}
      <div className="admin-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'space-between' }}>
        <div>
          <h3 className="admin-card-title" style={{ color: 'var(--secondary)' }}>
            <Database size={18} /> Initial Database Seeding
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.6' }}>
            Click below to initialize the application database. This imports all 25 player records, their choices, and default matches from the Excel responses file.
          </p>
          <div style={{ padding: '12px', borderLeft: '3px solid var(--secondary)', background: 'rgba(236, 64, 122, 0.05)', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span>• 25 players list from responses.json</span>
            <span>• 18 default Group Stage fixtures</span>
            <span>• Resets point configurations to standard defaults</span>
          </div>
        </div>

        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={handleSeed}
          disabled={isSeeding}
          style={{ width: '100%', borderColor: 'rgba(236, 64, 122, 0.2)', color: '#f472b6' }}
        >
          <RefreshCw size={16} className={isSeeding ? 'spin' : ''} /> {isSeeding ? 'Seeding...' : 'Reset & Seed Database'}
        </button>
      </div>
    </>
  );
}

// ==================== PLAYERS TAB ====================
function PlayersTab({ players, onRefresh, triggerToast }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPlayer, setEditingPlayer] = useState(null);

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVisibilityToggle = async (player) => {
    const updated = { ...player, hidden: !player.hidden };
    try {
      await savePlayer(updated);
      triggerToast(`${player.name} is now ${updated.hidden ? 'hidden' : 'visible'}`, 'success');
      onRefresh();
    } catch (err) {
      triggerToast('Error: ' + err.message, 'error');
    }
  };

  const handleAddNewPlayer = () => {
    const name = window.prompt("Enter new player's name:");
    if (!name || !name.trim()) return;

    const newPlayer = {
      id: `p-manual-${Date.now()}`,
      name: name.trim(),
      selections: {
        pot1: [],
        pot2: '',
        pot3: '',
        darkHorses: []
      },
      awards: {
        bestPlayer: '',
        topScorer: '',
        bestGoalkeeper: ''
      },
      points: 0,
      hidden: false
    };

    savePlayer(newPlayer).then(() => {
      triggerToast(`Player ${name} added!`, 'success');
      onRefresh();
    });
  };

  const handleDeletePlayer = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deletePlayer(id);
        triggerToast('Player deleted', 'success');
        onRefresh();
      } catch (err) {
        triggerToast('Error deleting: ' + err.message, 'error');
      }
    }
  };

  return (
    <div className="admin-card glass-panel" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h3 className="admin-card-title" style={{ margin: 0 }}>
          <Users size={18} /> Player List Manager
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '200px', height: '36px', padding: '0 12px' }}
          />
          <button className="btn btn-primary btn-sm" onClick={handleAddNewPlayer}>
            <Plus size={14} /> Add Player
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredPlayers.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No players found.
          </div>
        ) : (
          filteredPlayers.map(player => (
            <div key={player.id} className="admin-list-item">
              <div className="item-info">
                <span className="item-title">
                  {player.name}
                  {player.hidden && (
                    <span className="badge badge-hidden" style={{ marginLeft: '8px' }}>
                      <EyeOff size={10} style={{ display: 'inline', marginRight: '2px' }} /> Hidden
                    </span>
                  )}
                </span>
                <span className="item-subtitle" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                  Pots: {player.selections?.pot1?.join(', ') || 'None'} | {player.selections?.pot2 || 'None'} | {player.selections?.pot3 || 'None'}
                </span>
              </div>
              
              <div className="item-actions">
                {/* Visibility Toggle Switch */}
                <button 
                  className={`btn btn-secondary btn-sm`} 
                  onClick={() => handleVisibilityToggle(player)}
                  title={player.hidden ? "Show on public leaderboard" : "Hide from public leaderboard"}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {player.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                  {player.hidden ? 'Show' : 'Hide'}
                </button>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeletePlayer(player.id, player.name)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ==================== MATCHES TAB ====================
function MatchesTab({ matches, settings, onRefresh, triggerToast }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState(null);
  
  // Form for manual match adding/editing
  const [matchForm, setMatchForm] = useState({
    id: '',
    homeTeam: '',
    awayTeam: '',
    homeScore: 0,
    awayScore: 0,
    status: 'SCHEDULED',
    stage: 'GROUP',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncMatchesFromAPI(settings);
      triggerToast('Matches synchronized successfully', 'success');
      onRefresh();
    } catch (err) {
      triggerToast('API Sync Failed: ' + err.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveMatch = async (e) => {
    e.preventDefault();
    if (!matchForm.homeTeam.trim() || !matchForm.awayTeam.trim()) {
      triggerToast('Please input team names', 'error');
      return;
    }

    const m = {
      ...matchForm,
      id: matchForm.id || `m-manual-${Date.now()}`,
      homeTeam: matchForm.homeTeam.trim(),
      awayTeam: matchForm.awayTeam.trim(),
      homeScore: parseInt(matchForm.homeScore) || 0,
      awayScore: parseInt(matchForm.awayScore) || 0
    };

    try {
      await saveMatch(m);
      triggerToast('Match saved', 'success');
      setEditingMatchId(null);
      setMatchForm({
        id: '',
        homeTeam: '',
        awayTeam: '',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        stage: 'GROUP',
        date: new Date().toISOString().split('T')[0]
      });
      onRefresh();
    } catch (err) {
      triggerToast('Error saving match: ' + err.message, 'error');
    }
  };

  const handleEditClick = (match) => {
    setEditingMatchId(match.id);
    setMatchForm({ ...match });
  };

  const handleDeleteMatch = async (id) => {
    if (window.confirm('Delete this fixture?')) {
      await deleteMatch(id);
      triggerToast('Match deleted', 'success');
      onRefresh();
    }
  };

  return (
    <>
      {/* API Sync and Quick Fixtures */}
      <div className="admin-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 className="admin-card-title">
          <RefreshCw size={18} /> Score Sync Control
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <p>
            Status: <strong>{settings.useMockApi ? 'Simulated Sync (Mock API)' : 'Live Scores API Connection'}</strong>
          </p>
          {settings.useMockApi ? (
            <p>Mock mode simulates live game updates. Clicking sync updates random matches with finished scores for testing.</p>
          ) : (
            <p>App will fetch live outcomes from Football-Data.org. Requires API configuration keys.</p>
          )}
        </div>

        <button 
          className="btn btn-primary" 
          onClick={handleSync}
          disabled={isSyncing}
          style={{ width: '100%', marginTop: '8px' }}
        >
          <RefreshCw size={16} className={isSyncing ? 'spin' : ''} />
          {isSyncing ? 'Synchronizing...' : 'Sync Matches Now'}
        </button>

        <h3 className="admin-card-title" style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
          {editingMatchId ? 'Edit Match Details' : 'Add New Fixture'}
        </h3>

        <form onSubmit={handleSaveMatch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Home Team</label>
              <input
                type="text"
                className="form-input"
                value={matchForm.homeTeam}
                onChange={(e) => setMatchForm(prev => ({ ...prev, homeTeam: e.target.value }))}
                placeholder="e.g. Argentina"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Away Team</label>
              <input
                type="text"
                className="form-input"
                value={matchForm.awayTeam}
                onChange={(e) => setMatchForm(prev => ({ ...prev, awayTeam: e.target.value }))}
                placeholder="e.g. Morocco"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Home Score</label>
              <input
                type="number"
                className="form-input"
                value={matchForm.homeScore}
                onChange={(e) => setMatchForm(prev => ({ ...prev, homeScore: parseInt(e.target.value) || 0 }))}
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Away Score</label>
              <input
                type="number"
                className="form-input"
                value={matchForm.awayScore}
                onChange={(e) => setMatchForm(prev => ({ ...prev, awayScore: parseInt(e.target.value) || 0 }))}
                min="0"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select 
                className="form-select"
                value={matchForm.status}
                onChange={(e) => setMatchForm(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="SCHEDULED">Scheduled</option>
                <option value="LIVE">Live</option>
                <option value="FINISHED">Finished</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Stage</label>
              <select 
                className="form-select"
                value={matchForm.stage}
                onChange={(e) => setMatchForm(prev => ({ ...prev, stage: e.target.value }))}
              >
                <option value="GROUP">Group Stage</option>
                <option value="R16">Round of 16</option>
                <option value="QF">Quarterfinal</option>
                <option value="SF">Semifinal</option>
                <option value="FINAL">Final</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Match Date</label>
            <input
              type="date"
              className="form-input"
              value={matchForm.date}
              onChange={(e) => setMatchForm(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Save size={16} /> Save Fixture
            </button>
            {editingMatchId && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                  setEditingMatchId(null);
                  setMatchForm({
                    id: '',
                    homeTeam: '',
                    awayTeam: '',
                    homeScore: 0,
                    awayScore: 0,
                    status: 'SCHEDULED',
                    stage: 'GROUP',
                    date: new Date().toISOString().split('T')[0]
                  });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Match List Manager */}
      <div className="admin-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 className="admin-card-title">
          Fixtures Database ({matches.length})
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
          {matches.map(m => (
            <div key={m.id} className="admin-list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span className={`match-status-badge ${m.status.toLowerCase()}`} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                    {m.status}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.date} ({m.stage})</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(m)} style={{ padding: '4px 8px' }}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMatch(m.id)} style={{ padding: '4px 8px' }}>
                    Delete
                  </button>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', padding: '4px 0' }}>
                <span style={{ fontWeight: m.homeScore > m.awayScore && m.status === 'FINISHED' ? 'bold' : 'normal' }}>
                  {m.homeTeam}
                </span>
                <strong style={{ fontSize: '1rem', letterSpacing: '4px', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '4px' }}>
                  {m.status === 'SCHEDULED' ? 'VS' : `${m.homeScore}-${m.awayScore}`}
                </strong>
                <span style={{ fontWeight: m.awayScore > m.homeScore && m.status === 'FINISHED' ? 'bold' : 'normal' }}>
                  {m.awayTeam}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
