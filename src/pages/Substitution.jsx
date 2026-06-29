import React, { useState, useEffect } from 'react';
import { RefreshCw, ShieldAlert, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { validatePlayerPassword } from '../utils/auth';
import { calculatePlayerPoints } from '../utils/scoring';
import { savePlayer } from '../services/db';
import TeamFlag from '../components/TeamFlag';

const ROUND_OF_32_TEAMS = [
  'Algeria', 'Argentina', 'Australia', 'Austria', 'Belgium', 'Bosnia & Herzegovina',
  'Brazil', 'Canada', 'Cape Verde', 'Colombia', 'Croatia', 'DR Congo', 'Ecuador',
  'Egypt', 'England', 'France', 'Germany', 'Ghana', 'Ivory Coast', 'Japan',
  'Mexico', 'Morocco', 'Netherlands', 'Norway', 'Paraguay', 'Portugal',
  'Senegal', 'South Africa', 'Spain', 'Sweden', 'Switzerland', 'USA'
].sort();

const POT_1_TEAMS = [
  'United States', 'USA', 'Mexico', 'Canada', 'Spain', 'Argentina', 'France',
  'England', 'Brazil', 'Portugal', 'Netherlands', 'Belgium', 'Germany'
];
const POT_2_TEAMS = [
  'Croatia', 'Morocco', 'Colombia', 'Uruguay', 'Switzerland', 'Japan',
  'Senegal', 'Iran', 'South Korea', 'Ecuador', 'Austria', 'Australia'
];
const POT_3_TEAMS = [
  'Norway', 'Panama', 'Egypt', 'Algeria', 'Scotland', 'Paraguay',
  'Tunisia', 'Ivory Coast', 'Uzbekistan', 'Qatar', 'Saudi Arabia', 'South Africa'
];
const DARK_HORSES_TEAMS = [
  'Norway', 'Panama', 'Egypt', 'Algeria', 'Scotland', 'Paraguay',
  'Tunisia', 'Ivory Coast', 'Uzbekistan', 'Qatar', 'Saudi Arabia', 'South Africa',
  'Jordan', 'Cape Verde', 'Ghana', 'Curaçao', 'Haiti', 'New Zealand',
  'Bosnia & Herzegovina', 'Sweden', 'Türkiye', 'Czechia', 'DR Congo', 'Iraq'
];

const normalizeName = (name) => {
  if (!name) return '';
  const clean = name.trim().toLowerCase();
  if (clean === 'united states' || clean === 'united states of america') return 'usa';
  if (clean === 'türkiye' || clean === 'turkiye') return 'turkey';
  if (clean === 'czechia' || clean === 'czech republic') return 'czech republic';
  return clean;
};

export default function Substitution({ players, matches, settings, onRefresh, triggerToast }) {
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedNewTeam, setSelectedNewTeam] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset authentication and selections when player changes
  useEffect(() => {
    setIsAuthenticated(false);
    setPassword('');
    setSelectedSlot('');
    setSelectedNewTeam('');
  }, [selectedPlayerId]);

  // Find the selected player
  const player = players.find(p => p.id === selectedPlayerId);

  // Authenticate player
  const handleVerifyPassword = (e) => {
    e.preventDefault();
    if (!player) {
      triggerToast('Please select a player first', 'error');
      return;
    }

    if (validatePlayerPassword(player, password)) {
      setIsAuthenticated(true);
      triggerToast('Password verified!', 'success');
    } else {
      triggerToast('Incorrect password. Please try again.', 'error');
    }
  };

  // Get active choices of player for the slots
  const getPlayerSlots = () => {
    if (!player) return [];
    
    const slots = [];

    // Pot 1 (usually 2 selections)
    if (player.selections?.pot1) {
      player.selections.pot1.forEach((team, index) => {
        slots.push({
          id: `pot1-${index}`,
          name: `Pot 1 Selection ${index + 1}`,
          team: team,
          slotName: 'pot1',
          index: index
        });
      });
    }

    // Pot 2
    if (player.selections?.pot2) {
      slots.push({
        id: 'pot2',
        name: 'Pot 2 Selection',
        team: player.selections.pot2,
        slotName: 'pot2',
        index: null
      });
    }

    // Pot 3
    if (player.selections?.pot3) {
      slots.push({
        id: 'pot3',
        name: 'Pot 3 Selection',
        team: player.selections.pot3,
        slotName: 'pot3',
        index: null
      });
    }

    // Dark Horses
    if (player.selections?.darkHorses) {
      player.selections.darkHorses.forEach((team, index) => {
        slots.push({
          id: `darkHorses-${index}`,
          name: `Dark Horse Selection ${index + 1}`,
          team: team,
          slotName: 'darkHorses',
          index: index
        });
      });
    }

    return slots;
  };

  const slots = getPlayerSlots();
  const targetSlotObj = slots.find(s => s.id === selectedSlot);

  // Calculate points gained by the selected slot's team
  const getForfeitedPoints = () => {
    if (!player || !targetSlotObj) return 0;
    const { breakdown } = calculatePlayerPoints(player, matches, settings);
    
    if (targetSlotObj.slotName === 'pot1') {
      return breakdown.pot1?.[targetSlotObj.team] || 0;
    } else if (targetSlotObj.slotName === 'pot2') {
      return breakdown.pot2?.[targetSlotObj.team] || 0;
    } else if (targetSlotObj.slotName === 'pot3') {
      return breakdown.pot3?.[targetSlotObj.team] || 0;
    } else if (targetSlotObj.slotName === 'darkHorses') {
      return breakdown.darkHorses?.[targetSlotObj.team] || 0;
    }
    return 0;
  };

  const forfeitedPoints = getForfeitedPoints();

  // Get available teams in the Round of 32 (excluding teams player has already selected in ANY slot, filtered by target slot's pot)
  const getAvailableSwapTeams = () => {
    if (!player) return ROUND_OF_32_TEAMS;

    // Compile currently active selections (except the one we are swapping out)
    const currentSelections = new Set();
    
    if (player.selections?.pot1) {
      player.selections.pot1.forEach((t, i) => {
        if (targetSlotObj?.slotName !== 'pot1' || targetSlotObj?.index !== i) {
          currentSelections.add(t.toLowerCase().trim());
        }
      });
    }
    if (player.selections?.pot2 && targetSlotObj?.slotName !== 'pot2') {
      currentSelections.add(player.selections.pot2.toLowerCase().trim());
    }
    if (player.selections?.pot3 && targetSlotObj?.slotName !== 'pot3') {
      currentSelections.add(player.selections.pot3.toLowerCase().trim());
    }
    if (player.selections?.darkHorses) {
      player.selections.darkHorses.forEach((t, i) => {
        if (targetSlotObj?.slotName !== 'darkHorses' || targetSlotObj?.index !== i) {
          currentSelections.add(t.toLowerCase().trim());
        }
      });
    }

    // Filter ROUND_OF_32_TEAMS by the target slot's pot list
    let candidates = ROUND_OF_32_TEAMS;
    if (targetSlotObj) {
      let allowedList = [];
      if (targetSlotObj.slotName === 'pot1') allowedList = POT_1_TEAMS;
      else if (targetSlotObj.slotName === 'pot2') allowedList = POT_2_TEAMS;
      else if (targetSlotObj.slotName === 'pot3') allowedList = POT_3_TEAMS;
      else if (targetSlotObj.slotName === 'darkHorses') allowedList = DARK_HORSES_TEAMS;
      
      const normalizedAllowed = allowedList.map(t => normalizeName(t));
      candidates = ROUND_OF_32_TEAMS.filter(t => normalizedAllowed.includes(normalizeName(t)));
    }

    return candidates.filter(t => !currentSelections.has(t.toLowerCase().trim()));
  };

  const availableSwapTeams = getAvailableSwapTeams();

  // Execute Swap
  const handleExecuteSwap = async () => {
    if (!player || !targetSlotObj || !selectedNewTeam) {
      triggerToast('Please complete all selection fields', 'error');
      return;
    }

    const confirmMsg = `Are you sure you want to swap out ${targetSlotObj.team} for ${selectedNewTeam}?
    
This action:
1. Incurs a -5 points persistent penalty.
2. Forfeits all points gained by ${targetSlotObj.team} (${forfeitedPoints} pts).
3. Causes ${selectedNewTeam} to start from 0 points (points from past matches will not count).
    
This cannot be undone!`;

    if (!window.confirm(confirmMsg)) return;

    setIsSubmitting(true);
    try {
      // Find all matches for the swapped-in team that have already finished or are live
      // Plus ALL group stage matches (so it starts from 0 in the R32)
      const excludedMatchIds = [];
      const teamLower = selectedNewTeam.toLowerCase().trim();

      matches.forEach(match => {
        const home = match.homeTeam.toLowerCase().trim();
        const away = match.awayTeam.toLowerCase().trim();
        
        if (home === teamLower || away === teamLower) {
          // Exclude if it's a GROUP stage match OR if it's KNOCKOUT but already finished/live
          if (match.stage === 'GROUP' || match.status === 'FINISHED' || match.status === 'LIVE') {
            excludedMatchIds.push(match.id);
          }
        }
      });

      // Construct swap record
      const newSwap = {
        slot: targetSlotObj.slotName,
        index: targetSlotObj.index,
        swappedOut: targetSlotObj.team,
        swappedIn: selectedNewTeam,
        timestamp: Date.now(),
        excludedMatchIds: excludedMatchIds
      };

      // Create a deep copy of player
      const updatedPlayer = JSON.parse(JSON.stringify(player));
      
      // Update selections
      if (targetSlotObj.slotName === 'pot1') {
        updatedPlayer.selections.pot1[targetSlotObj.index] = selectedNewTeam;
      } else if (targetSlotObj.slotName === 'pot2') {
        updatedPlayer.selections.pot2 = selectedNewTeam;
      } else if (targetSlotObj.slotName === 'pot3') {
        updatedPlayer.selections.pot3 = selectedNewTeam;
      } else if (targetSlotObj.slotName === 'darkHorses') {
        updatedPlayer.selections.darkHorses[targetSlotObj.index] = selectedNewTeam;
      }

      // Initialize swaps array if not present, then append
      if (!updatedPlayer.swaps) {
        updatedPlayer.swaps = [];
      }
      updatedPlayer.swaps.push(newSwap);

      // Save to database
      await savePlayer(updatedPlayer);
      
      triggerToast(`Successfully swapped ${targetSlotObj.team} for ${selectedNewTeam}!`, 'success');
      
      // Reset state and refresh
      setSelectedPlayerId('');
      onRefresh();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to execute swap: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-view" style={{ maxWidth: '680px', margin: '40px auto' }}>
      <div className="leaderboard-header" style={{ marginBottom: '24px', textAlign: 'center', justifyContent: 'center' }}>
        <div className="title-section">
          <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <RefreshCw size={28} className="text-secondary" /> Round of 32 Team Substitution
          </h1>
          <p>Replace an active team selection with another available Round of 32 team.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Step 1: Select Player */}
        <div className="form-group">
          <label className="form-label">Select Your Name</label>
          <select 
            className="form-select"
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
          >
            <option value="">-- Choose Player --</option>
            {players.filter(p => !p.hidden).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {selectedPlayerId && !isAuthenticated && (
          <form onSubmit={handleVerifyPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Enter Your Authorization Password</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Required to authorize swap</span>
              </label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter 6-digit swap password"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              Verify Password
            </button>
          </form>
        )}

        {/* Step 2: Authenticated Substitution Form */}
        {isAuthenticated && player && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(236, 64, 122, 0.05)', borderLeft: '3px solid var(--secondary)', padding: '12px 16px', borderRadius: '4px', fontSize: '0.85rem' }}>
              <ShieldAlert size={18} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
              <div>
                <strong>Warning:</strong> You will incur a <strong>-5 points penalty</strong> for this substitution, and you will forfeit all points accumulated by the team you swap out.
              </div>
            </div>

            <div className="form-row">
              {/* Select Slot to Swap Out */}
              <div className="form-group">
                <label className="form-label">Team to Swap Out</label>
                <select
                  className="form-select"
                  value={selectedSlot}
                  onChange={(e) => {
                    setSelectedSlot(e.target.value);
                    setSelectedNewTeam('');
                  }}
                >
                  <option value="">-- Select Team --</option>
                  {slots.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.team})</option>
                  ))}
                </select>
              </div>

              {/* Select Team to Swap In */}
              <div className="form-group">
                <label className="form-label">New Team (Swap In)</label>
                <select
                  className="form-select"
                  value={selectedNewTeam}
                  onChange={(e) => setSelectedNewTeam(e.target.value)}
                  disabled={!selectedSlot}
                >
                  <option value="">-- Choose Round of 32 Team --</option>
                  {availableSwapTeams.map(teamName => (
                    <option key={teamName} value={teamName}>{teamName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Substitution Preview Comparison Panel */}
            {selectedSlot && selectedNewTeam && (
              <div className="admin-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} className="text-secondary" /> Substitution Preview
                </h4>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  
                  {/* Left: Swapped Out */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '120px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>Swapping Out</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TeamFlag teamName={targetSlotObj.team} size="sm" />
                      <strong style={{ fontSize: '1rem' }}>{targetSlotObj.team}</strong>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)' }}>
                      Forfeits: <strong style={{ color: 'var(--danger)' }}>-{forfeitedPoints} points</strong>
                    </span>
                  </div>

                  <ArrowRight size={24} style={{ color: 'var(--text-dark)' }} />

                  {/* Right: Swapped In */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '120px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Swapping In</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TeamFlag teamName={selectedNewTeam} size="sm" />
                      <strong style={{ fontSize: '1rem' }}>{selectedNewTeam}</strong>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)' }}>
                      Starts from: <strong style={{ color: 'var(--success)' }}>0 points</strong>
                    </span>
                  </div>

                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Persistent Swap Penalty:</span>
                    <span style={{ color: 'var(--danger)' }}>-5 points</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Points Lost by {targetSlotObj.team}:</span>
                    <span style={{ color: 'var(--danger)' }}>-{forfeitedPoints} points</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.85rem', color: '#fff', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', marginTop: '4px' }}>
                    <span>Total Score Impact:</span>
                    <span style={{ color: 'var(--danger)' }}>-{(forfeitedPoints + 5)} points</span>
                  </div>
                </div>

                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  disabled={isSubmitting}
                  onClick={handleExecuteSwap}
                  style={{ width: '100%', border: '1px solid rgba(236, 64, 122, 0.3)', color: '#f472b6', marginTop: '8px' }}
                >
                  <RefreshCw size={16} className={isSubmitting ? 'spin' : ''} /> {isSubmitting ? 'Processing Swap...' : 'Confirm Team Swap Now'}
                </button>
              </div>
            )}
            
          </div>
        )}

      </div>
    </div>
  );
}
