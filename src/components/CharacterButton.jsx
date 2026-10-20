import React from 'react';
import CharacterFace from './CharacterFace.jsx';

export default function CharacterButton({ active, onClick, label, talking = false, listening = false, expression = 'neutral' }) {
  return (
    <button
      type="button"
      className={`character-trigger ${active ? 'active' : ''} ${active && listening ? 'is-listening' : ''}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick(event);
      }}
      aria-label={active ? `Conversing with ${label}. Select again to end conversation.` : `Talk to ${label}`}
    >
      <CharacterFace small expression={expression} talking={active && talking} />
    </button>
  );
}
