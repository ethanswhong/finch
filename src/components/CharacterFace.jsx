import React from 'react';

const EXPRESSION_MAP = {
  friendly: 'neutral',
  calm: 'neutral',
  neutral: 'neutral',
  playful: 'playful',
  bold: 'skeptical',
  skeptical: 'skeptical'
};

function normalizeExpression(expression = 'neutral') {
  return EXPRESSION_MAP[expression] || 'neutral';
}

const FACE_CONFIG = {
  neutral: {
    brow: 'M53 38 C60 32, 71 32, 78 38',
    topAccent: false,
    cheek: false
  },
  playful: {
    brow: 'M55 39 C63 27, 73 29, 79 40',
    topAccent: true,
    cheek: false
  },
  skeptical: {
    brow: 'M52 40 C61 38, 70 36, 80 31',
    topAccent: false,
    cheek: true
  }
};

export default function CharacterFace({ expression = 'neutral', talking = false, small = false, label = 'Character' }) {
  const normalized = normalizeExpression(expression);
  const config = FACE_CONFIG[normalized];

  return (
    <div
      className={`character-face expression-${normalized} ${talking ? 'is-talking' : ''} ${small ? 'is-small' : ''}`}
      aria-hidden="true"
      title={label}
    >
      <svg className="character-face-svg" viewBox="0 0 120 120" role="presentation">
        <circle className="ring ring-left" cx="41" cy="69" r="36" />
        <circle className="ring ring-right" cx="80" cy="36" r="36" />

        {config.topAccent && <path className="top-accent" d="M47 32 L51 40" />}
        <path className="brow" d={config.brow} />

        <circle className="eye" cx="69" cy="56" r="8.5" />
        <circle className="shine shine-large" cx="65.6" cy="52.2" r="2.6" />
        <circle className="shine shine-small" cx="72.9" cy="59.8" r="1.55" />

        {config.cheek && (
          <g className="cheek-lines">
            <path d="M81 66 L87 64" />
            <path d="M83 72 L90 70" />
          </g>
        )}
      </svg>
    </div>
  );
}
