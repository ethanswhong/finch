import React from 'react';
import CharacterFace from './CharacterFace.jsx';
import { interruptScreenReaderSpeech } from '../utils/accessibility.js';

export default function CharacterButton({ active, onClick, label, talking = false, listening = false, expression = 'neutral' }) {
  return (
    <button
      type="button"
      className={`character-trigger ${active ? 'active' : ''} ${active && listening ? 'is-listening' : ''}`}
      onClick={(event) => {
        event.stopPropagation();
        interruptScreenReaderSpeech();
        onClick();
      }}
      aria-label={`${label} voice conversation`}
    >
      <CharacterFace small expression={expression} talking={active && talking} />
    </button>
  );
}
