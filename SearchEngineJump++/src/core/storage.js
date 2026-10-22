import { GM_getValue, GM_setValue } from '$';

const memoryFallback = new Map();

function hasGM() {
  return typeof GM_getValue === 'function' && typeof GM_setValue === 'function';
}

export function getValue(key, defaultValue) {
  if (hasGM()) {
    try {
      return GM_getValue(key, defaultValue);
    } catch (e) {
      console.warn('[SEJ] GM_getValue 失败，回退内存存储', e);
    }
  }
  if (memoryFallback.has(key)) return memoryFallback.get(key);
  return defaultValue;
}

export function setValue(key, value) {
  if (hasGM()) {
    try {
      GM_setValue(key, value);
      return;
    } catch (e) {
      console.warn('[SEJ] GM_setValue 失败，回退内存存储', e);
    }
  }
  memoryFallback.set(key, value);
}
