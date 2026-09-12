import ElementTracker from '../../core/ElementTracker.js';
import disableBackgroundPause from './backgroundPlayback.js';
import replaceFavicon from './favicon.js';
import { dismissAgeDisclaimer, showOriginalTitle, unmuteGif } from './videoEnhancements.js';
import addGifLink from './gifLink.js';
import addSearchSwitch from './searchSwitch.js';

export default function initPornhubHandler() {
    const url = window.location.href;
    if (!url.includes('pornhub.com')) return;

    const tracker = new ElementTracker();
    disableBackgroundPause();
    replaceFavicon();
    dismissAgeDisclaimer(tracker);
    unmuteGif(tracker);
    showOriginalTitle(tracker);
    addGifLink(tracker);
    addSearchSwitch(url);
}
