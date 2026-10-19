import React from 'react';
import CharacterFace from './CharacterFace.jsx';

export default function CharacterButton({ active, onClick, label, talking = false, listening = false, expression = 'neutral' }) {
  return (
    <button
      type="button"
      className={`character-trigger ${active ? 'active' : ''} ${active && listening ? 'is-listening' : ''}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={active ? `End conversation with ${label}` : `Introduce ${label} and start a voice conversation`}
      aria-pressed={active}
    >
      <CharacterFace small expression={expression} talking={active && talking} />
    </button>
  );
}
