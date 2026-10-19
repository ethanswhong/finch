import React from 'react';

const EXPRESSION_MAP = {
  friendly: 'neutral',
  calm: 'neutral',
  neutral: 'neutral',
  bold: 'skeptical',
  skeptical: 'skeptical',
  playful: 'mischievous',
  mischievous: 'mischievous'
};

const FACE_STATES = {
  neutral: {
    eyeX: 507,
    eyeY: 306,
    eyeR: 29,
    brow: 'M 463 265 C 484 238 524 235 551 268',
    browWidth: 6,
    accents: false
  },
  skeptical: {
    eyeX: 519,
    eyeY: 304,
    eyeR: 26,
    brow: 'M 464 278 C 483 260 525 270 551 261',
    browWidth: 7.6,
    accents: false
  },
  mischievous: {
    eyeX: 526,
    eyeY: 298,
    eyeR: 24,
    brow: 'M 464 281 C 483 263 525 280 551 255',
    browWidth: 8.2,
    accents: true
  }
};

export default function CharacterFace({ expression = 'neutral', talking = false, small = false, label = 'Character' }) {
  const stateName = EXPRESSION_MAP[expression] || 'neutral';
  const state = FACE_STATES[stateName];

  return (
    <div
      className={`character-face expression-${stateName} ${talking ? 'is-talking' : ''} ${small ? 'is-small' : ''}`}
      aria-hidden="true"
      title={label}
    >
      <svg
        className="character-face-svg"
        viewBox="230 48 560 500"
        role="presentation"
        preserveAspectRatio="xMidYMid meet"
      >
        <circle className="ring ring-lower" cx="420" cy="355" r="176" />
        <circle className="ring ring-upper" cx="590" cy="243" r="176" />

        <g className="eye-group">
          <ellipse className="iris" cx={state.eyeX} cy={state.eyeY} rx={state.eyeR} ry={state.eyeR} />
          <circle className="eye-highlight" cx={state.eyeX - 9} cy={state.eyeY - 10} r="6.2" />
          <path className="brow" d={state.brow} style={{ strokeWidth: small ? state.browWidth * 2 : state.browWidth }} />
          {state.accents && (
            <g className="accent-marks">
              <path d="M 575 337 l 14 -5" />
              <path d="M 585 347 l 14 -6" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
