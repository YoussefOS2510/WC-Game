import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  writeBatch,
  getDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import initialResponses from '../data/responses.json';

// Check if Firebase config variables are defined in the environment
const hasFirebaseConfig = 
  import.meta.env.VITE_FIREBASE_API_KEY && 
  import.meta.env.VITE_FIREBASE_API_KEY !== 'placeholder' &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID;

let db = null;
let useFirebase = false;

if (hasFirebaseConfig) {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    useFirebase = true;
    console.log('Firebase initialized successfully in Firestore mode.');
  } catch (error) {
    console.error('Failed to initialize Firebase, falling back to Local Storage mode:', error);
  }
} else {
  console.log('No Firebase config found. Running in Local Storage Demo Mode.');
}

// --- Default Seed Data ---

const defaultSettings = {
  pot1WinPoints: 3,
  pot2WinPoints: 4,
  pot3WinPoints: 5,
  pot1DrawPoints: 1,
  pot2DrawPoints: 2,
  pot3DrawPoints: 3,
  darkHorseMultiplier: 2,
  goalDifferenceBonus: 1, // e.g., +1 point per +1 GD
  awardPointsBonus: 10,
  actualBestPlayer: '',
  actualTopScorer: '',
  actualBestGoalkeeper: '',
  apiEndpoint: import.meta.env.VITE_FOOTBALL_API_URL || 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json',
  apiKey: import.meta.env.VITE_FOOTBALL_API_KEY || '',
  useMockApi: import.meta.env.VITE_FOOTBALL_API_KEY ? false : false // default to false so we fetch the real public JSON matches out-of-the-box!
};

const defaultMatches = [];

// LocalStorage Helper functions
const loadLocal = (key, fallback) => {
  const data = localStorage.getItem(`worldcup_game_${key}`);
  return data ? JSON.parse(data) : fallback;
};

const saveLocal = (key, value) => {
  localStorage.setItem(`worldcup_game_${key}`, JSON.stringify(value));
};

// --- API Functions ---

export const isFirebaseActive = () => useFirebase;

/**
 * Fetch settings from the database.
 */
export async function getSettings() {
  if (useFirebase) {
    const docRef = doc(db, 'config', 'settings');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...defaultSettings, ...docSnap.data() };
    } else {
      // Create default settings if not exists
      await setDoc(docRef, defaultSettings);
      return defaultSettings;
    }
  } else {
    return loadLocal('settings', defaultSettings);
  }
}

/**
 * Save settings to the database.
 */
export async function saveSettings(settings) {
  if (useFirebase) {
    const docRef = doc(db, 'config', 'settings');
    await setDoc(docRef, settings, { merge: true });
  } else {
    saveLocal('settings', settings);
  }
  return settings;
}

/**
 * Fetch matches list.
 */
export async function getMatches() {
  if (useFirebase) {
    const colRef = collection(db, 'matches');
    const snapshot = await getDocs(colRef);
    const matches = [];
    snapshot.forEach(doc => {
      matches.push({ id: doc.id, ...doc.data() });
    });
    // Sort matches by date
    return matches.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else {
    const localMatches = loadLocal('matches', defaultMatches);
    return localMatches.sort((a, b) => new Date(a.date) - new Date(b.date));
  }
}

/**
 * Save or update a single match.
 */
export async function saveMatch(match) {
  if (useFirebase) {
    const docRef = doc(db, 'matches', match.id);
    await setDoc(docRef, match, { merge: true });
  } else {
    const matches = await getMatches();
    const index = matches.findIndex(m => m.id === match.id);
    if (index !== -1) {
      matches[index] = { ...matches[index], ...match };
    } else {
      matches.push(match);
    }
    saveLocal('matches', matches);
  }
  return match;
}

/**
 * Delete a match.
 */
export async function deleteMatch(matchId) {
  if (useFirebase) {
    const docRef = doc(db, 'matches', matchId);
    await deleteDoc(docRef);
  } else {
    const matches = await getMatches();
    const filtered = matches.filter(m => m.id !== matchId);
    saveLocal('matches', filtered);
  }
}

/**
 * Fetch players list.
 */
export async function getPlayers() {
  if (useFirebase) {
    const colRef = collection(db, 'players');
    const snapshot = await getDocs(colRef);
    const players = [];
    snapshot.forEach(doc => {
      players.push({ id: doc.id, ...doc.data() });
    });
    return players;
  } else {
    return loadLocal('players', []);
  }
}

/**
 * Save or update a single player.
 */
export async function savePlayer(player) {
  if (useFirebase) {
    const docRef = doc(db, 'players', player.id);
    await setDoc(docRef, player, { merge: true });
  } else {
    const players = await getPlayers();
    const index = players.findIndex(p => p.id === player.id);
    if (index !== -1) {
      players[index] = { ...players[index], ...player };
    } else {
      players.push(player);
    }
    saveLocal('players', players);
  }
  return player;
}

/**
 * Delete a player.
 */
export async function deletePlayer(playerId) {
  if (useFirebase) {
    const docRef = doc(db, 'players', playerId);
    await deleteDoc(docRef);
  } else {
    const players = await getPlayers();
    const filtered = players.filter(p => p.id !== playerId);
    saveLocal('players', filtered);
  }
}

/**
 * Seed database from initial responses.
 */
export async function seedDatabase() {
  // Map the raw responses from excel sheet into our structured player model
  const players = initialResponses.map((res, index) => {
    return {
      id: `p-${index}-${res.Name.replace(/\s+/g, '-').toLowerCase()}`,
      name: res.Name.trim(),
      selections: {
        pot1: [res['Pot 1 Selection 1'].trim(), res['Pot 1 Selection 2'].trim()].filter(Boolean),
        pot2: res['Pot 2 Selection']?.trim() || '',
        pot3: res['Pot 3 Selection']?.trim() || '',
        darkHorses: [res['Dark Horse 1'].trim(), res['Dark Horse 2'].trim()].filter(Boolean)
      },
      awards: {
        bestPlayer: res['Best Player']?.trim() || '',
        topScorer: String(res['Top Goal Scorer'] || '').trim(), // Force string, sometimes it is a number
        bestGoalkeeper: res['Best Goalkeeper']?.trim() || ''
      },
      points: 0,
      hidden: false
    };
  });

  if (useFirebase) {
    // Write all to Firestore in batches
    const batch = writeBatch(db);
    
    // 1. Seed players
    players.forEach(player => {
      const docRef = doc(db, 'players', player.id);
      batch.set(docRef, player);
    });

    // 2. Seed default matches
    defaultMatches.forEach(match => {
      const docRef = doc(db, 'matches', match.id);
      batch.set(docRef, match);
    });

    // 3. Seed default settings
    const settingsRef = doc(db, 'config', 'settings');
    batch.set(settingsRef, defaultSettings);

    await batch.commit();
  } else {
    saveLocal('players', players);
    saveLocal('matches', defaultMatches);
    saveLocal('settings', defaultSettings);
  }
  
  return { players, matches: defaultMatches, settings: defaultSettings };
}

/**
 * Synchronize matches with a football scores API.
 * In a real-world scenario, we hit the API.
 * If useMockApi is enabled, we simulate live score updates.
 */
export async function syncMatchesFromAPI(settings) {
  if (settings.useMockApi) {
    // SIMULATED MOCK API SYNC
    // Read current matches and randomly update some scores, or progress scheduled games to finished
    const currentMatches = await getMatches();
    const updatedMatches = currentMatches.map(match => {
      // 30% chance to finish a scheduled match or update its scores
      if (match.status === 'SCHEDULED' && Math.random() < 0.4) {
        const homeScore = Math.floor(Math.random() * 4); // 0-3 goals
        const awayScore = Math.floor(Math.random() * 4);
        return {
          ...match,
          homeScore,
          awayScore,
          status: 'FINISHED'
        };
      }
      return match;
    });

    // Save all matches
    for (const match of updatedMatches) {
      await saveMatch(match);
    }
    return updatedMatches;
  } else {
    // REAL API SYNC
    // Using fetch to get matches from API
    try {
      let endpoint = settings.apiEndpoint;
      if (!endpoint) throw new Error('API Endpoint not configured');
      
      // CORS & Tier Protection: if pointing to restricted/CORS-blocked football-data.org API, redirect to public raw github feed
      if (endpoint.includes('api.football-data.org')) {
        console.warn('Redirecting restricted football-data.org endpoint to free openfootball GitHub feed to bypass browser CORS blocks.');
        endpoint = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';
      }
      
      // Check if we are currently rate-limited
      const rateLimitBlockedUntil = localStorage.getItem('worldcup_api_blocked_until');
      if (rateLimitBlockedUntil) {
        const blockedTime = parseInt(rateLimitBlockedUntil);
        if (Date.now() < blockedTime) {
          const secondsLeft = Math.ceil((blockedTime - Date.now()) / 1000);
          throw new Error(`Rate limit reached. Please wait ${secondsLeft} seconds before syncing again.`);
        }
      }

      const headers = {};
      // Only attach the custom X-Auth-Token header when calling the original football-data.org API
      // to avoid triggering browser CORS preflight blocks on raw GitHub fetches
      if (settings.apiKey && endpoint.includes('api.football-data.org')) {
        headers['X-Auth-Token'] = settings.apiKey;
      }

      const response = await fetch(endpoint, { headers });
      
      // Inspect and store rate-limiting headers to prevent hitting blocks
      const requestsAvailable = response.headers.get('X-RequestsAvailable');
      const resetSeconds = response.headers.get('X-RequestCounter-Reset');
      
      if (requestsAvailable !== null && parseInt(requestsAvailable) === 0) {
        const delay = parseInt(resetSeconds || '60') * 1000;
        const blockedUntil = Date.now() + delay;
        localStorage.setItem('worldcup_api_blocked_until', blockedUntil.toString());
      }

      if (!response.ok) {
        // If the API itself responds with a 429 Too Many Requests, extract reset header if available
        if (response.status === 429) {
          const delay = parseInt(resetSeconds || '60') * 1000;
          localStorage.setItem('worldcup_api_blocked_until', (Date.now() + delay).toString());
          throw new Error(`Rate limit exceeded. Please wait ${resetSeconds || '60'} seconds before trying again.`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Parse the response, accommodating both openfootball and football-data.org schemas
      if (data.matches && Array.isArray(data.matches)) {
        const updatedMatches = [];
        data.matches.forEach((apiMatch, idx) => {
          let mappedMatch = null;
          
          // openfootball format: has team1, team2, and optionally score.ft
          if (apiMatch.team1 && apiMatch.team2) {
            mappedMatch = {
              id: `api-${apiMatch.num || idx + 1}`,
              homeTeam: apiMatch.team1,
              awayTeam: apiMatch.team2,
              homeScore: apiMatch.score?.ft?.[0] ?? 0,
              awayScore: apiMatch.score?.ft?.[1] ?? 0,
              status: apiMatch.score ? 'FINISHED' : 'SCHEDULED',
              stage: apiMatch.group ? 'GROUP' : 'KNOCKOUT',
              date: apiMatch.date
            };
          } 
          // football-data.org format: has homeTeam, awayTeam
          else if (apiMatch.homeTeam && apiMatch.awayTeam) {
            mappedMatch = {
              id: `api-${apiMatch.id}`,
              homeTeam: apiMatch.homeTeam?.name || apiMatch.homeTeam?.shortName || '',
              awayTeam: apiMatch.awayTeam?.name || apiMatch.awayTeam?.shortName || '',
              homeScore: apiMatch.score?.fullTime?.home ?? 0,
              awayScore: apiMatch.score?.fullTime?.away ?? 0,
              status: apiMatch.status === 'FINISHED' ? 'FINISHED' : 
                      apiMatch.status === 'IN_PLAY' || apiMatch.status === 'LIVE' ? 'LIVE' : 'SCHEDULED',
              stage: apiMatch.stage || 'GROUP',
              date: apiMatch.utcDate ? apiMatch.utcDate.split('T')[0] : new Date().toISOString().split('T')[0]
            };
          }
          
          if (mappedMatch && mappedMatch.homeTeam && mappedMatch.awayTeam) {
            updatedMatches.push(mappedMatch);
          }
        });

        // Save all matches to active database (Firestore or LocalStorage)
        for (const match of updatedMatches) {
          await saveMatch(match);
        }
        return updatedMatches;
      }
      
      throw new Error('API returned data in an unexpected format. No matches array found.');
    } catch (error) {
      console.error('API Sync Failed:', error);
      throw error; // Let admin dashboard handle the display of error
    }
  }
}
