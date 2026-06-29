/**
 * Deterministic 6-character uppercase password generator using a salted hash of player IDs.
 * Matches the logic used to pre-compute the passwords list.
 * 
 * @param {string} playerId - The unique ID of the player
 * @returns {string} 6-character alphanumeric password
 */
export function getDeterministicPassword(playerId) {
  if (!playerId) return '';
  let hash = 0;
  const str = playerId + "worldcup-2026-salt";
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let password = '';
  let temp = Math.abs(hash);
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(temp % chars.length);
    temp = Math.floor(temp / chars.length);
  }
  return password;
}

/**
 * Validates a player's password.
 * Supports custom database passwords if present, otherwise checks deterministic password.
 * 
 * @param {Object} player - The player record
 * @param {string} enteredPassword - The password entered by the user
 * @returns {boolean} True if correct, false otherwise
 */
export function validatePlayerPassword(player, enteredPassword) {
  if (!player || !enteredPassword) return false;
  
  const cleanEntered = enteredPassword.trim().toUpperCase();
  const dbPassword = player.password ? player.password.trim().toUpperCase() : null;
  const deterministicPassword = getDeterministicPassword(player.id);
  
  if (dbPassword) {
    return cleanEntered === dbPassword || cleanEntered === deterministicPassword;
  }
  
  return cleanEntered === deterministicPassword;
}
