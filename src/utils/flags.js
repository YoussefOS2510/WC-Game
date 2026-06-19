// Utility to get FlagCDN URLs for different footballing nations
export function getTeamFlagUrl(teamName) {
  if (!teamName) return null;
  
  // Normalize team names to match flag codes
  const name = teamName.trim().toLowerCase();
  
  // Mapping for World Cup participating nations and predictions selections
  const flagsMap = {
    'argentina': 'ar',
    'spain': 'es',
    'france': 'fr',
    'england': 'gb-eng', // flagcdn supports gb-eng for England
    'portugal': 'pt',
    'brazil': 'br',
    'netherlands': 'nl',
    'morocco': 'ma',
    'croatia': 'hr',
    'japan': 'jp',
    'switzerland': 'ch',
    'senegal': 'sn',
    'colombia': 'co',
    'egypt': 'eg',
    'norway': 'no',
    'ivory coast': 'ci',
    'cote d\'ivoire': 'ci',
    'cote d’ivoire': 'ci',
    'tunisia': 'tn',
    'algeria': 'dz',
    'saudi arabia': 'sa',
    'australia': 'au',
    'ghana': 'gh',
    'paraguay': 'py',
    'sweden': 'se',
    'czechia': 'cz',
    'czech republic': 'cz',
    'south africa': 'za',
    'turkey': 'tr',
    'türkiye': 'tr',
    'turkiye': 'tr',
    'germany': 'de',
    'italy': 'it',
    'belgium': 'be',
    'uruguay': 'uy',
    'mexico': 'mx',
    'usa': 'us',
    'united states': 'us',
    'canada': 'ca',
    'ecuador': 'ec',
    'wales': 'gb-wls',
    'scotland': 'gb-sct',
    'northern ireland': 'gb-nir',
    'south korea': 'kr',
    'korea': 'kr',
    'korea republic': 'kr',
    'qatar': 'qa',
    'cameroon': 'cm',
    'serbia': 'rs',
    'costa rica': 'cr',
    'peru': 'pe',
    'chile': 'cl',
    'austria': 'at',
    'hungary': 'hu',
    'romania': 'ro',
    'slovakia': 'sk',
    'slovenia': 'si',
    'georgia': 'ge',
    'albania': 'al',
    'nigeria': 'ng',
    'new zealand': 'nz',
    'iraq': 'iq',
    'jamaica': 'jm',
    'panama': 'pa',
    'venezuela': 've',
    'bolivia': 'bo',
    'honduras': 'hn',
    'el salvador': 'sv',
    'greece': 'gr',
    'finland': 'fi',
    'ireland': 'ie',
    'iceland': 'is',
    'china': 'cn',
    'india': 'in',
    'ukraine': 'ua'
  };

  const code = flagsMap[name];
  if (code) {
    return `https://flagcdn.com/w40/${code}.png`;
  }
  
  // Standard two letter fallback if not in dictionary
  const fallback = name.replace(/[^a-z]/g, '').slice(0, 2);
  if (fallback.length === 2) {
    return `https://flagcdn.com/w40/${fallback}.png`;
  }
  
  return null;
}
