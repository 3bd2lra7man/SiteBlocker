// ==UserScript==
// @name         SiteBlocker
// @version      1.6.4
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
            const stored = GM_getValue(storageKey, '["facebook"]'); // Added facebook to default list
            const list = JSON.parse(stored);
            console.log('[SiteBlocker] Loaded block list:', list);
            return list;
        } catch (e) {
            console.error('[SiteBlocker] Failed to load block list:', e);
            return ["facebook"]; // Fallback with facebook included
        }
    }

    function saveBlockList(list) {
        // Ensure facebook is always in the list
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

        // Inject a permissive Trusted Types policy (to prevent TrustedHTML errors in Chrome in some sites like youtube)
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
        `;

        // force the document to write
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

            const currentList = loadBlockList().filter(x => x !== "facebook"); // Don't show facebook in editable list
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
