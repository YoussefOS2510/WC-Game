import React, { useState } from 'react';
import { 
  Trophy, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Award, 
  Sparkles, 
  TrendingUp, 
  EyeOff, 
  ShieldAlert, 
  Star,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { calculatePlayerPoints } from '../utils/scoring';
import TeamFlag from '../components/TeamFlag';

export default function Leaderboard({ players, matches, settings }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPlayerId, setExpandedPlayerId] = useState(null);

  // Calculate scores and enrich player records
  const playersWithScores = players.map(player => {
    const { totalPoints, breakdown } = calculatePlayerPoints(player, matches, settings);
    return {
      ...player,
      totalPoints,
      breakdown
    };
  });

  // Sort by points descending, then by name
  const sortedPlayers = [...playersWithScores].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    return a.name.localeCompare(b.name);
  });

  // Public leaderboard filters out players with hidden: true
  const publicPlayers = sortedPlayers.filter(p => !p.hidden);

  // Search filter
  const filteredPlayers = publicPlayers.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (id) => {
    setExpandedPlayerId(expandedPlayerId === id ? null : id);
  };

  // Stats calculation
  const totalPublicPlayers = publicPlayers.length;
  const finishedMatches = matches.filter(m => m.status === 'FINISHED').length;
  
  // Find top score
  const topScore = publicPlayers.length > 0 ? publicPlayers[0].totalPoints : 0;
  
  // Calculate team pick statistics
  const teamPickCounts = {};
  players.forEach(p => {
    const selections = [
      ...(p.selections?.pot1 || []),
      p.selections?.pot2,
      p.selections?.pot3,
      ...(p.selections?.darkHorses || [])
    ].filter(Boolean);
    
    selections.forEach(team => {
      teamPickCounts[team] = (teamPickCounts[team] || 0) + 1;
    });
  });

  const topPickTeam = Object.entries(teamPickCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  return (
    <div className="leaderboard-view">
      {/* Stats Widgets */}
      <div className="stats-container">
        <div className="stat-card glass-panel">
          <div className="stat-val">{totalPublicPlayers}</div>
          <div className="stat-lbl">Players Ranked</div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-val" style={{ color: 'var(--gold)' }}>{topScore} pts</div>
          <div className="stat-lbl">Leader Score</div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-val">{finishedMatches}</div>
          <div className="stat-lbl">Matches Finished</div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-val" style={{ color: 'var(--secondary)' }}>{topPickTeam}</div>
          <div className="stat-lbl">Most Picked Team</div>
        </div>
      </div>

      <div className="leaderboard-header">
        <div className="title-section">
          <h1>Public Leaderboard</h1>
          <p>Real-time tournament predictions standings</p>
        </div>
        <div className="controls-section">
          <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
            <Search 
              size={18} 
              style={{ 
                position: 'absolute', 
                left: '14px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-muted)' 
              }} 
            />
            <input
              type="text"
              className="search-input"
              placeholder="Search player name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '42px' }}
            />
          </div>
        </div>
      </div>

      {filteredPlayers.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlignment: 'center', color: 'var(--text-muted)' }}>
          {searchTerm ? 'No players match your search.' : 'No players to display yet. Admin needs to seed the data!'}
        </div>
      ) : (
        <div className="leaderboard-list">
          {filteredPlayers.map((player, idx) => {
            const isExpanded = expandedPlayerId === player.id;
            const rank = idx + 1;
            let rankClass = '';
            if (rank === 1) rankClass = 'rank-1';
            else if (rank === 2) rankClass = 'rank-2';
            else if (rank === 3) rankClass = 'rank-3';

            return (
              <div 
                key={player.id} 
                className={`player-row glass-panel ${rankClass}`}
                onClick={() => toggleExpand(player.id)}
              >
                <div className="player-row-header">
                  <div className="player-identity">
                    <div className="rank-badge">
                      {rank === 1 ? <Trophy size={18} /> : rank}
                    </div>
                    <div>
                      <span className="player-name">{player.name}</span>
                      {player.hidden && (
                        <span className="badge badge-hidden" style={{ marginLeft: '10px' }}>
                          <EyeOff size={10} style={{ marginRight: '4px', display: 'inline' }} /> Hidden
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="player-summary">
                    <div className="points-display">
                      <span className="points-val">{player.totalPoints}</span>
                      <span className="points-lbl">Points</span>
                    </div>
                    {isExpanded ? <ChevronUp size={20} className="text-muted" /> : <ChevronDown size={20} className="text-muted" />}
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="player-details" onClick={(e) => e.stopPropagation()}>
                    {player.breakdown?.swapPenalty > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid var(--danger)', padding: '8px 12px', borderRadius: '4px', fontSize: '0.8rem', color: '#fca5a5', marginBottom: '8px', gridColumn: '1 / -1' }}>
                        <ShieldAlert size={14} style={{ color: 'var(--danger)' }} />
                        <span>Active Substitution Penalty: <strong>-{player.breakdown.swapPenalty} points</strong> deducted from total score.</span>
                      </div>
                    )}
                    
                    {/* Team Selections Column */}
                    <div className="details-section">
                      <div className="details-section-title">Team Picks & Scores</div>
                      <div className="selections-grid">
                        
                        {/* Pot 1 */}
                        {(player.selections?.pot1 || []).map((team, tIdx) => (
                          <div key={`pot1-${tIdx}`} className="selection-pill">
                            <span className="selection-lbl">
                              <Star size={14} style={{ color: 'var(--primary)' }} /> Pot 1 Selection
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <TeamFlag teamName={team} size="sm" />
                              <span className="selection-team">{team}</span>
                              <span className="selection-points">
                                {player.breakdown?.pot1?.[team] || 0} pts
                              </span>
                            </div>
                          </div>
                        ))}

                        {/* Pot 2 */}
                        {player.selections?.pot2 && (
                          <div className="selection-pill">
                            <span className="selection-lbl">
                              <Star size={14} style={{ color: 'var(--secondary)' }} /> Pot 2 Selection
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <TeamFlag teamName={player.selections.pot2} size="sm" />
                              <span className="selection-team">{player.selections.pot2}</span>
                              <span className="selection-points">
                                {player.breakdown?.pot2?.[player.selections.pot2] || 0} pts
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Pot 3 */}
                        {player.selections?.pot3 && (
                          <div className="selection-pill">
                            <span className="selection-lbl">
                              <Star size={14} style={{ color: 'var(--text-dark)' }} /> Pot 3 Selection
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <TeamFlag teamName={player.selections.pot3} size="sm" />
                              <span className="selection-team">{player.selections.pot3}</span>
                              <span className="selection-points">
                                {player.breakdown?.pot3?.[player.selections.pot3] || 0} pts
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Dark Horses */}
                        {(player.selections?.darkHorses || []).map((team, tIdx) => (
                          <div key={`dh-${tIdx}`} className="selection-pill" style={{ borderLeft: '3px solid var(--secondary)' }}>
                            <span className="selection-lbl">
                              <Sparkles size={14} style={{ color: 'var(--secondary)' }} /> Dark Horse
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <TeamFlag teamName={team} size="sm" />
                              <span className="selection-team">{team}</span>
                              <span className="selection-points" style={{ background: 'rgba(236, 64, 122, 0.15)', color: '#f472b6' }}>
                                {player.breakdown?.darkHorses?.[team] || 0} pts
                              </span>
                            </div>
                          </div>
                        ))}

                      </div>
                    </div>

                    {/* Awards Selections Column */}
                    <div className="details-section">
                      <div className="details-section-title">End-of-Tournament Awards</div>
                      <div className="selections-grid">
                        
                        {/* Best Player */}
                        <div className={`award-pill ${player.breakdown?.awards?.bestPlayer ? 'award-correct' : ''}`}>
                          <div className="award-header">
                            <span className="award-name">Golden Ball (Best Player)</span>
                            <span className="selection-points">
                              {player.breakdown?.awards?.bestPlayer || 0} pts
                            </span>
                          </div>
                          <span className="award-prediction">{player.awards?.bestPlayer || 'No prediction'}</span>
                        </div>

                        {/* Top Goal Scorer */}
                        <div className={`award-pill ${player.breakdown?.awards?.topScorer ? 'award-correct' : ''}`}>
                          <div className="award-header">
                            <span className="award-name">Golden Boot (Top Goal Scorer)</span>
                            <span className="selection-points">
                              {player.breakdown?.awards?.topScorer || 0} pts
                            </span>
                          </div>
                          <span className="award-prediction">{player.awards?.topScorer || 'No prediction'}</span>
                        </div>

                        {/* Best Goalkeeper */}
                        <div className={`award-pill ${player.breakdown?.awards?.bestGoalkeeper ? 'award-correct' : ''}`}>
                          <div className="award-header">
                            <span className="award-name">Golden Glove (Best Goalkeeper)</span>
                            <span className="selection-points">
                              {player.breakdown?.awards?.bestGoalkeeper || 0} pts
                            </span>
                          </div>
                          <span className="award-prediction">{player.awards?.bestGoalkeeper || 'No prediction'}</span>
                        </div>

                      </div>
                    </div>

                    {/* Substitution History Column */}
                    {player.breakdown?.swaps && player.breakdown.swaps.length > 0 && (
                      <div className="details-section" style={{ gridColumn: '1 / -1', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                        <div className="details-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <RefreshCw size={14} className="text-secondary" /> Substitution History
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {player.breakdown.swaps.map((swap, sIdx) => (
                            <div key={sIdx} className="selection-pill" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(236, 64, 122, 0.03)', borderLeft: '3px solid var(--secondary)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <TeamFlag teamName={swap.swappedOut} size="sm" />
                                  <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{swap.swappedOut}</span>
                                </div>
                                <ArrowRight size={14} style={{ color: 'var(--text-dark)' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <TeamFlag teamName={swap.swappedIn} size="sm" />
                                  <strong style={{ color: 'var(--success)' }}>{swap.swappedIn}</strong>
                                </div>
                              </div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 'bold' }}>
                                -5 pts penalty
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
