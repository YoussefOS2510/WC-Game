import React, { useState } from 'react';
import { Calendar, Info, Search, Filter } from 'lucide-react';
import { normalizeTeamName } from '../utils/scoring';
import TeamFlag from '../components/TeamFlag';

export default function Matches({ matches, players }) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate pick counts for each team
  const getTeamPicksCount = (teamName) => {
    if (!teamName) return 0;
    const cleanTeam = normalizeTeamName(teamName);
    
    let count = 0;
    players.forEach(p => {
      const selections = [
        ...(p.selections?.pot1 || []),
        p.selections?.pot2,
        p.selections?.pot3,
        ...(p.selections?.darkHorses || [])
      ].filter(Boolean).map(t => normalizeTeamName(t));
      
      if (selections.includes(cleanTeam)) {
        count++;
      }
    });
    return count;
  };

  // Get flag abbreviation
  const getAbbreviation = (teamName) => {
    if (!teamName) return '??';
    const clean = teamName.replace(/[^a-zA-Z\s]/g, '').trim();
    if (clean.length <= 3) return clean.toUpperCase();
    
    const words = clean.split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  // Filter matches
  const filteredMatches = matches.filter(match => {
    const matchesStatus = filterStatus === 'ALL' || match.status === filterStatus;
    const matchesSearch = 
      match.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.awayTeam.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="matches-view">
      <div className="leaderboard-header">
        <div className="title-section">
          <h1>Tournament Matches</h1>
          <p>Live scores, fixtures, and predictions statistics</p>
        </div>
        
        <div className="controls-section" style={{ flexWrap: 'wrap', gap: '12px' }}>
          {/* Status Filter Tabs */}
          <div className="tabs-header" style={{ margin: 0 }}>
            <button 
              className={`tab-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterStatus('ALL')}
            >
              All
            </button>
            <button 
              className={`tab-btn ${filterStatus === 'SCHEDULED' ? 'active' : ''}`}
              onClick={() => setFilterStatus('SCHEDULED')}
            >
              Scheduled
            </button>
            <button 
              className={`tab-btn ${filterStatus === 'LIVE' ? 'active' : ''}`}
              onClick={() => setFilterStatus('LIVE')}
            >
              Live
            </button>
            <button 
              className={`tab-btn ${filterStatus === 'FINISHED' ? 'active' : ''}`}
              onClick={() => setFilterStatus('FINISHED')}
            >
              Finished
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '240px' }}>
            <Search 
              size={16} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-muted)' 
              }} 
            />
            <input
              type="text"
              className="search-input"
              placeholder="Search by team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px', height: '38px', paddingRight: '12px' }}
            />
          </div>
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No matches found matching your filters.
        </div>
      ) : (
        <div className="matches-grid">
          {filteredMatches.map(match => {
            const homePicks = getTeamPicksCount(match.homeTeam);
            const awayPicks = getTeamPicksCount(match.awayTeam);
            
            return (
              <div key={match.id} className="match-card glass-panel">
                
                {/* Match Card Header */}
                <div className="match-meta">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} style={{ color: 'var(--primary)' }} />
                    <span>{match.date}</span>
                    <span style={{ color: 'var(--text-dark)' }}>•</span>
                    <span>{match.stage} STAGE</span>
                  </div>
                  <span className={`match-status-badge ${match.status.toLowerCase()}`}>
                    {match.status}
                  </span>
                </div>

                {/* Score / Teams Body */}
                <div className="match-teams-container">
                  {/* Home Team */}
                  <div className="team-display">
                    <TeamFlag teamName={match.homeTeam} size="lg" />
                    <span className="team-name">{match.homeTeam}</span>
                  </div>

                  {/* Score */}
                  <div className="match-score-display">
                    {match.status === 'SCHEDULED' ? (
                      <span className="score-separator">VS</span>
                    ) : (
                      <>
                        <span className="score-digit">{match.homeScore}</span>
                        <span className="score-separator">-</span>
                        <span className="score-digit">{match.awayScore}</span>
                      </>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="team-display">
                    <TeamFlag teamName={match.awayTeam} size="lg" />
                    <span className="team-name">{match.awayTeam}</span>
                  </div>
                </div>

                {/* Prediction Stats Banner */}
                <div className="match-affects-banner">
                  <Info size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>
                    Predictions at stake: <strong>{homePicks}</strong> players selected {match.homeTeam} vs <strong>{awayPicks}</strong> players selected {match.awayTeam}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
