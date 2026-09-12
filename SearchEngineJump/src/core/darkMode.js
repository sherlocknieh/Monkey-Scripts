import { addStyle } from './shadow.js';

export const DARK_MODE_STYLE = `
  :root,
  :host {
    --font-color-qxin: #bdc1bc;
    --background-color-qxin: #202124f0;
    --background-avtive-color-qxin: #424242;
    --background-active-enable-qxin: #274144;
    --background-active-disable-qxin: #583535;
    --background-hover-color-qxin: #424242;
    --trigger-shown-qxin: #424242 !important;
    --background-btn-qxin: #292f36;
    --background-setting-qxin: #202124;
    --box-shadow-color-sej: hsla(0, 0%, 70%, 10%);
    --border-color-sej: #3b4547;
  }
`;

function isBackgroundDark(bgColor) {
  try {
    const match = bgColor.match(/rgba?\(([^)]+)\)/);
    if (!match) return false;

    const values = match[1].split(/\s*,\s*/).map(Number);
    const [r, g, b, a] = values;

    if (a !== undefined && a < 0.5) return false;

    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq < 128;
  } catch (e) {
    return false;
  }
}

export function isDarkMode() {
  const html = document.documentElement;
  const body = document.body;

  const darkModeIndicators = [
    html.getAttribute('data-theme'),
    html.getAttribute('data-color-scheme'),
    html.getAttribute('data-color-mode'),
    html.getAttribute('theme'),
    body?.getAttribute('data-theme'),
    body?.getAttribute('data-color-scheme'),
    body?.getAttribute('data-color-mode'),
    body?.getAttribute('theme'),
    html.className,
    body?.className,
  ];

  for (const indicator of darkModeIndicators) {
    if (indicator && typeof indicator === 'string') {
      const lower = indicator.toLowerCase();
      if (lower.includes('dark') || lower.includes('night')) return true;
      if (lower.includes('light') && !lower.includes('dark')) return false;
    }
  }

  const elementsToCheck = [
    document.body,
    document.documentElement,
    document.querySelector('main'),
    document.querySelector('#app'),
    document.querySelector('.app'),
    document.querySelector('[role="main"]'),
  ];

  for (const element of elementsToCheck) {
    if (element) {
      try {
        const bgColor = getComputedStyle(element).backgroundColor;
        if (
          bgColor &&
          bgColor !== 'rgba(0, 0, 0, 0)' &&
          bgColor !== 'transparent'
        ) {
          return isBackgroundDark(bgColor);
        }
      } catch (e) {
        // ignore
      }
    }
  }

  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return true;
  }

  return false;
}

export function applyDarkModeIfNeeded() {
  if (isDarkMode()) addStyle(DARK_MODE_STYLE);
}

let darkModeWatched = false;

export function watchDarkModeChanges() {
  if (darkModeWatched || !window.matchMedia) return;
  darkModeWatched = true;

  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  let lastDarkModeState = darkModeQuery.matches;

  const handleChange = (e) => {
    if (e.matches !== lastDarkModeState) {
      lastDarkModeState = e.matches;
      if (isDarkMode()) addStyle(DARK_MODE_STYLE);
    }
  };

  if (darkModeQuery.addEventListener) {
    darkModeQuery.addEventListener('change', handleChange);
  } else if (darkModeQuery.addListener) {
    darkModeQuery.addListener(handleChange);
  }
}
