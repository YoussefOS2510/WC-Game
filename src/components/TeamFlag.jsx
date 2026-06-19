import React, { useState } from 'react';
import { getTeamFlagUrl } from '../utils/flags';

export default function TeamFlag({ teamName, size = 'md', style = {} }) {
  const [imgError, setImgError] = useState(false);
  const flagUrl = getTeamFlagUrl(teamName);

  // Set flag dimensions based on sizes
  let width, height, fontSize;
  if (size === 'sm') {
    width = '22px';
    height = '15px';
    fontSize = '0.65rem';
  } else if (size === 'lg') {
    width = '54px';
    height = '36px';
    fontSize = '1rem';
  } else { // md
    width = '32px';
    height = '22px';
    fontSize = '0.75rem';
  }

  // Get abbreviation if image fails
  const getAbbreviation = (name) => {
    if (!name) return '??';
    const clean = name.replace(/[^a-zA-Z\s]/g, '').trim();
    if (clean.length <= 3) return clean.toUpperCase();
    
    const words = clean.split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  if (imgError || !flagUrl) {
    return (
      <div 
        className="team-flag-placeholder"
        style={{
          width: size === 'lg' ? '48px' : size === 'sm' ? '24px' : '36px',
          height: size === 'lg' ? '48px' : size === 'sm' ? '24px' : '36px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: fontSize,
          color: '#94a3b8',
          lineHeight: 1,
          ...style
        }}
      >
        {getAbbreviation(teamName)}
      </div>
    );
  }

  return (
    <img 
      src={flagUrl} 
      alt={`${teamName} flag`}
      onError={() => setImgError(true)}
      style={{
        width: width,
        height: height,
        objectFit: 'cover',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.15)',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style
      }}
    />
  );
}
