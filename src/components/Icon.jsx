import React from 'react';

const paths = {
  chevronDown: <path d="m6 9 6 6 6-6" />,
  arrowDown: <><path d="M12 4.5v15" /><path d="m6.5 14 5.5 5.5 5.5-5.5" /></>,
  arrowRight: <><path d="M4.5 12h15" /><path d="m14 6.5 5.5 5.5-5.5 5.5" /></>,
  back: <><path d="M21 12H3.5" /><path d="m9.5 5.5-6.5 6.5 6.5 6.5" /></>,
  user: <><circle cx="12" cy="7.2" r="3.7" /><path d="M5.2 20.4v-1.1c0-3.8 3-6.7 6.8-6.7s6.8 2.9 6.8 6.7v1.1Z" /></>,
  bell: <><path d="M18.1 9.2a6.1 6.1 0 1 0-12.2 0v3.7c0 1.7-.6 2.9-1.7 4.1h15.6c-1.1-1.2-1.7-2.4-1.7-4.1Z" /><path d="M9.4 20a3.2 3.2 0 0 0 5.2 0" /></>,
  cart: <><path d="M3 4.3h2.3l2.1 9.2a2 2 0 0 0 2 1.6h8a2 2 0 0 0 1.9-1.5L21 7H6.1" /><circle cx="9.5" cy="19.4" r="1.25" /><circle cx="17.7" cy="19.4" r="1.25" /></>,
  heart: <path d="M20.8 4.9a5.3 5.3 0 0 0-7.5 0L12 6.2l-1.3-1.3a5.3 5.3 0 0 0-7.5 7.5L12 21l8.8-8.6a5.3 5.3 0 0 0 0-7.5Z" />,
  share: <><path d="M12 15V3" /><path d="m7.5 7.5 4.5-4.5 4.5 4.5" /><path d="M5 11v8.5h14V11" /></>,
  more: <><circle cx="5" cy="12" r="1.55" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.55" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.55" fill="currentColor" stroke="none" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m19.5 19.5-4-4" /></>,
  sliders: <><path d="M4 7h10" /><path d="M18 7h2" /><circle cx="16" cy="7" r="2" /><path d="M4 17h2" /><path d="M10 17h10" /><circle cx="8" cy="17" r="2" /></>,
  menu: <><path d="M7.5 6H20" /><path d="M7.5 12H20" /><path d="M7.5 18H20" /><circle cx="4" cy="6" r=".7" fill="currentColor"/><circle cx="4" cy="12" r=".7" fill="currentColor"/><circle cx="4" cy="18" r=".7" fill="currentColor"/></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2 6.4 20.2 7.5 14 3 9.6l6.2-.9L12 3Z" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><path d="M12 7h.01" /></>,
  tag: <><path d="M20 12 12 20 4 12V4h8l8 8Z" /><circle cx="9" cy="9" r="1.2" /></>,
  agent: <><path d="M5.2 8.2c1.5-1.8 3.3-2.7 5.4-2.7 2.1 0 3.8.8 5.2 2.3" /><path d="M14.5 7.2c1.5-.7 3-.7 4.4.1" /><circle cx="9" cy="11" r="1.05" fill="currentColor" stroke="none" /><circle cx="15.3" cy="11" r="1.05" fill="currentColor" stroke="none" /><path d="M12 11.9c-.2 1.7-.7 3.1-1.5 4.3 1.2.4 2.5.4 3.8 0" /><path d="M7.7 18.2c1.4 1.1 2.9 1.6 4.5 1.6 1.8 0 3.4-.6 4.8-1.8" /></>,
  sparkle: <><path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3L12 3Z" /><path d="m18 14 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z" /></>,
};

export default function Icon({ name, size = 24, strokeWidth = 2.2, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name] || null}
    </svg>
  );
}
