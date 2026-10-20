import React from 'react';
import CharacterFace from './CharacterFace.jsx';

export default function FinchHeaderButton({ active = false, contextName = '', onClick, buttonRef, surface = 'plain' }) {
  const label = active
    ? contextName
      ? `Conversing with ${contextName}. Double tap to end conversation.`
      : 'Conversing with Finch. Double tap to end conversation.'
    : contextName
      ? `Talk with Finch about ${contextName}`
      : 'Talk with Finch';

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`finch-header-button finch-header-${surface} ${active ? 'active' : ''}`}
      aria-label={label}
      data-finch-preserve-context="true"
      onClick={onClick}
    >
      <CharacterFace small expression="friendly" talking={false} label="Finch" />
    </button>
  );
}
