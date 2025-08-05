// ==UserScript==
// @name         SiteBlocker
// @version      1.6.8
// @description  Block specific URLs or domains with editable list via menu (not hotkey) or blocklist server. Includes dev logs and uses global storage.
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
    'use strict';

    const storageKey = "blocked_sites";
    let lastCheckedUrl = "";

    // تحميل القائمة من التخزين والمحلي
    async function loadBlockList() {
        try {
            const stored = GM_getValue(storageKey, '[]');
            const localList = JSON.parse(stored);
            let serverList = [];

            try {
                const res = await fetch("http://localhost:8944/blocked_sites");
                if (res.ok) {
                    serverList = await res.json();
                    console.log('[SiteBlocker] Loaded server-side block list:', serverList);
                }
            } catch (e) {
                console.warn('[SiteBlocker] Could not fetch server block list:', e);
            }

            const combinedList = [...new Set([...serverList, ...localList])];
            return { combinedList, serverList };
        } catch (e) {
            console.error('[SiteBlocker] Failed to load block list:', e);
            return { combinedList: [], serverList: [] };
        }
    }

    // حفظ قائمة الحظر (المواقع المحلية فقط)
    function saveBlockList(list) {
        const unique = [...new Set(list.map(s => s.trim().toLowerCase()).filter(Boolean))];
        GM_setValue(storageKey, JSON.stringify(unique));
        console.log('[SiteBlocker] Block list saved:', unique);
    }

    // حظر الصفحة
    function blockPage(matched) {
        console.warn(`[SiteBlocker] Blocking site due to match: ${matched}`);
        document.documentElement.innerHTML = `
            <div style="display:flex;justify-content:center;align-items:center;height:100vh;font-size:32px;font-family:sans-serif;">
                🚫 This site is blocked: <b style="margin-left:10px;">${matched}</b>
            </div>
        `;
    }

    // تحقق ما إذا كان يجب الحظر
    async function shouldBlockCurrentUrl() {
        const currentUrl = location.href;
        if (currentUrl === lastCheckedUrl) return false;
        lastCheckedUrl = currentUrl;

        const { combinedList } = await loadBlockList();
        for (const entry of combinedList) {
            if (currentUrl.includes(entry)) {
                return entry;
            }
        }
        return null;
    }

    // بداية الفحص
    async function initBlocker() {
        const match = await shouldBlockCurrentUrl();
        if (match) {
            blockPage(match);
        }
    }

    // قائمة التعديل (تحرير المحلي فقط)
    GM_registerMenuCommand("✏️ Edit Block List", async () => {
        const { combinedList, serverList } = await loadBlockList();
        const editableList = combinedList.filter(entry => !serverList.includes(entry));
        const current = editableList.join(', ');
        const input = prompt("Edit blocked URLs/domains (comma separated):", current);
        if (input !== null) {
            const updated = input
                .split(',')
                .map(s => s.trim().toLowerCase())
                .filter(Boolean);

            if (JSON.stringify(editableList) !== JSON.stringify(updated)) {
                saveBlockList(updated);
                alert('Block list updated. Reloading page...');
                location.reload();
            } else {
                console.log('[SiteBlocker] No changes made.');
            }
        }
    });

    // تنفيذ الحظر
    initBlocker();
})();
