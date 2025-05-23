// ==UserScript==
// @name         SiteBlocker
// @version      1.6.5
// @description  Block specific URLs or domains with editable list (Alt+Shift+Z to edit). Includes dev logs and uses global storage.
// @icon         https://github.com/3bd2lra7man/SiteBlocker/raw/refs/heads/main/res/icon.ico
// @author       Abdalrahman Saad
// @match        *://*/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @updateURL    https://github.com/3bd2lra7man/SiteBlocker/raw/refs/heads/main/siteblocker.user.js
// @downloadURL  https://github.com/3bd2lra7man/SiteBlocker/raw/refs/heads/main/siteblocker.user.js
// @namespace    http://tampermonkey.net/
// ==/UserScript==

(function () {
    console.log('[SiteBlocker] Script loaded ✔');

    const storageKey = 'globalSiteBlockerList';
    let lastCheckedUrl = '';

    function loadBlockList() {
        try {
            const stored = GM_getValue(storageKey, '["facebook"]');
            const list = JSON.parse(stored);
            console.log('[SiteBlocker] Loaded block list:', list);
            return list;
        } catch (e) {
            console.error('[SiteBlocker] Failed to load block list:', e);
            return ["facebook"];
        }
    }

    function saveBlockList(list) {
        const updatedList = Array.from(new Set(list.concat(["facebook"])));
        GM_setValue(storageKey, JSON.stringify(updatedList));
        console.log('[SiteBlocker] Block list updated:', updatedList);
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

        // Inject a permissive Trusted Types policy
        if (window.trustedTypes && trustedTypes.createPolicy) {
            try {
                trustedTypes.createPolicy('default', {
                    createHTML: input => input,
                    createScript: input => input,
                    createScriptURL: input => input,
                });
                console.log('[SiteBlocker] Trusted Types policy injected.');
            } catch (e) {
                console.warn('[SiteBlocker] Failed to inject Trusted Types policy:', e);
            }
        }

        const blockedHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Site Blocked</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        background-color: #ff4444;
                        color: white;
                        font-family: 'Roboto', sans-serif;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        padding: 20px;
                        text-align: center;
                    }
                    .block-icon {
                        font-size: 3rem;
                        margin-bottom: 20px;
                    }
                    .block-message {
                        font-size: 1.5rem;
                        font-weight: bold;
                        margin-bottom: 10px;
                        word-break: break-word;
                    }
                    .block-url {
                        font-size: 1rem;
                        color: rgba(255,255,255,0.8);
                        margin-top: 10px;
                        word-break: break-all;
                    }
                    @media (max-width: 480px) {
                        .block-message {
                            font-size: 1.2rem;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="block-icon">🚫</div>
                <div class="block-message">This site has been blocked</div>
                <div class="block-message">'${displayName}'</div>
                <div class="block-url">${location.href}</div>
            </body>
            </html>
        `;

        document.open();
        document.write(blockedHtml);
        document.close();
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

    // Hotkey: Alt + Shift + Z
    window.addEventListener('keydown', function (e) {
        if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'z') {
            console.log('[SiteBlocker] Hotkey triggered: Alt+Shift+Z');
            e.preventDefault();

            const currentList = loadBlockList().filter(x => x !== "facebook");
            const current = currentList.join(', ');
            const input = prompt("Edit blocked URLs or domains (comma separated):\n(Note: 'facebook' is always blocked)", current);
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
        }
    });

    console.log('[SiteBlocker] Ready. Press Alt+Shift+Z to edit the block list.');
})();
