const favicon = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
    <circle cx="32" cy="32" r="32" fill="black"/>
    <text x="32" y="42" text-anchor="middle" font-size="32" fill="white">PH</text>
</svg>`);

export default function replaceFavicon() {
    document.querySelectorAll('link[rel*="icon"]').forEach(link => {
        link.href = favicon;
        link.type = 'image/svg+xml';
    });
}
