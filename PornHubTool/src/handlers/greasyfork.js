export default function initGreasyforkHandler() {
    const url = window.location.href;
    const isGreasy = url.includes('greasyfork.org');
    const isSleazy = url.includes('sleazyfork.org');
    if (!isGreasy && !isSleazy) return;
    const target = url.replace(
        isGreasy ? 'greasyfork' : 'sleazyfork',
        isGreasy ? 'sleazyfork' : 'greasyfork'
    );
    const nav = document.querySelector('#site-nav > nav');
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = target;
    link.textContent = isGreasy ? 'SleazyFork' : 'GreasyFork';
    li.appendChild(link);
    if (nav.firstChild) nav.insertBefore(li, nav.firstChild);
    else nav.appendChild(li);
}
