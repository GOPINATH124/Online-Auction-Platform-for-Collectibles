import React from 'react';
import './BadgeDisplay.css';

function BadgeDisplay({ badges }) {
  if (!badges || badges.length === 0) {
    return null;
  }

  return (
    <div className="badge-container">
      {badges.map((badge, index) => (
        <div 
          key={index} 
          className="badge-item"
          title={`${badge.name} - Earned ${new Date(badge.earnedAt).toLocaleDateString()}`}
        >
          <span className="badge-icon">{badge.icon}</span>
          <span className="badge-name">{badge.name}</span>
        </div>
      ))}
    </div>
  );
}

export default BadgeDisplay;
