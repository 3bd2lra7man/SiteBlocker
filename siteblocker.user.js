// ==UserScript==
// @name         SiteBlocker
// @version      1.6.7
// @description  Block specific URLs or domains with editable list via menu (not hotkey). Includes dev logs and uses global storage.
// @icon         https://github.com/3bd2lra7man/SiteBlocker/raw/refs/heads/main/res/icon.ico
// @author       Abdalrahman Saad
// @match        *://*/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @updateURL    https://github.com/3bd2lra7man/SiteBlocker/raw/refs/heads/main/siteblocker.user.js
// @downloadURL  https://github.com/3bd2lra7man/SiteBlocker/raw/refs/heads/main/siteblocker.user.js
// ==/UserScript==

(function () {
    console.log('[SiteBlocker] Script loaded ✔');

    const storageKey = 'globalSiteBlockerList';
    let lastCheckedUrl = '';

    function loadBlockList() {
        try {
            const stored = GM_getValue(storageKey, '[]');
            const list = JSON.parse(stored);
            console.log('[SiteBlocker] Loaded block list:', list);
            return list;
        } catch (e) {
            console.error('[SiteBlocker] Failed to load block list:', e);
            return [];
        }
    }

    function saveBlockList(list) {
        GM_setValue(storageKey, JSON.stringify(list));
        console.log('[SiteBlocker] Block list updated:', list);
    }

    function shouldBlockCurrentUrl() {
        const currentUrl = location.href;
        if (currentUrl === lastCheckedUrl) return false;
        lastCheckedUrl = currentUrl;

        const sitesToBlock = loadBlockList();
        for (const entry of sitesToBlock) {
            if (currentUrl.includes(entry)) {
                console.log(`[SiteBlocker] Match found for: ${entry}`);
                return entry;
            }
        }
        return null;
    }

    function blockPage(matchedEntry) {
    const displayName = matchedEntry.includes('.')
        ? matchedEntry
        : matchedEntry.charAt(0).toUpperCase() + matchedEntry.slice(1);

    console.log(`[SiteBlocker] Blocking page: ${location.href}`);

    // 1. Block all common network activity before displaying blocked page
    Object.defineProperties(window, {
        fetch: {
            value: () => Promise.reject(new Error("Blocked by SiteBlocker")),
            writable: false
        },
        XMLHttpRequest: {
            value: function () {
                throw new Error("Blocked by SiteBlocker");
            },
            writable: false
        },
        WebSocket: {
            value: function () {
                throw new Error("Blocked by SiteBlocker");
            },
            writable: false
        }
    });

    // 2. Block HTML element loading
    const blockElements = ['img', 'script', 'iframe', 'audio', 'video', 'link', 'source'];
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1 && blockElements.includes(node.tagName.toLowerCase())) {
                    node.remove();
                    console.log(`[SiteBlocker] Blocked tag: <${node.tagName.toLowerCase()}>`);
                }
            }
        }
    });
    observer.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true
    });

    // 3. Trusted types (Chrome fix)
    if (window.trustedTypes && trustedTypes.createPolicy) {
        try {
            trustedTypes.createPolicy('default', {
                createHTML: input => input,
                createScript: input => input,
                createScriptURL: input => input,
            });
        } catch (e) { }
    }

    // 4. Replace entire page
    const blockedHtml = 
        `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Blocked</title>
            <style>
                body {
                    background-color: red;
                    color: black;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    font-family: sans-serif;
                    font-weight: bold;
                    font-size: 2.5em;
                    margin: 0;
                }
            </style>
        </head>
        <body>
            🚫 This site '${displayName}' is blocked
        </body>
        </html>
    ;
    document.open();
    document.write(blockedHtml);
    document.close();`
}


    function initBlocker() {
        const match = shouldBlockCurrentUrl();
        if (match) blockPage(match);
    }

    // Initial check
    initBlocker();

    // SPA navigation handling
    const observer = new MutationObserver(() => initBlocker());
    observer.observe(document, { subtree: true, childList: true });
    window.addEventListener('hashchange', initBlocker);
    window.addEventListener('popstate', initBlocker);

    // ⬇️ Add menu command instead of hotkey
    GM_registerMenuCommand("✏️ Edit Block List", () => {
        console.log('[SiteBlocker] Menu triggered: Edit Block List');

        const currentList = loadBlockList();
        const current = currentList.join(', ');
        const input = prompt("Edit blocked URLs or domains (comma separated):", current);
        if (input !== null) {
            const updated = input
                .split(',')
                .map(s => s.trim().toLowerCase())
                .filter(Boolean);

            if (JSON.stringify(currentList) !== JSON.stringify(updated)) {
                saveBlockList(updated);
                alert('Block list updated. Reloading page...');
                window.location.reload();
            } else {
                console.log('[SiteBlocker] No changes to block list.');
            }
        }
    });

    console.log('[SiteBlocker] Ready. Use menu command to edit the block list.');
    
    GM_registerMenuCommand("🔁 Convert to Regular Video URL", () => {
    const url = new URL(location.href);
    const host = url.hostname.replace(/^www\./, '');
    let newUrl = '';

    // YouTube Shorts -> Watch
    if ((host === 'youtube.com' || host === 'youtu.be') && url.pathname.startsWith('/shorts/')) {
        const id = url.pathname.split('/')[2];
        newUrl = `https://www.youtube.com/watch?v=${id}`;
    }

    // Facebook Reels or Watch
    else if (host === 'facebook.com' || host === 'fb.watch') {
        if (url.pathname.startsWith('/reel/')) {
            const id = url.pathname.split('/')[2];
            newUrl = `https://www.facebook.com/watch/?v=${id}`;
        } else if (url.pathname.startsWith('/watch/')) {
            const vParam = url.searchParams.get('v');
            if (vParam) {
                newUrl = `https://www.facebook.com/watch/?v=${vParam}`;
            }
        } else if (host === 'fb.watch') {
            // fb.watch/abc123/ → try to extract ID and redirect
            const id = url.pathname.split('/')[1];
            if (id) {
                newUrl = `https://www.facebook.com/watch/?v=${id}`;
            }
        }
    }

    // Instagram Reels
    else if (host === 'instagram.com' && url.pathname.startsWith('/reel/')) {
        const id = url.pathname.split('/')[2];
        newUrl = `https://www.instagram.com/p/${id}/`;
    }

    if (newUrl && newUrl !== location.href) {
        console.log('[SiteBlocker] Redirecting to regular video URL:', newUrl);
        location.href = newUrl;
    } else {
        alert("This URL is either already in standard format or not supported.");
    }
});
})();
