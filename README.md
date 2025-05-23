# SiteBlocker

🚫 **Block specific websites or URLs directly in your browser with an easy-to-edit list!**

---

## What is SiteBlocker?

SiteBlocker is a lightweight, open-source userscript that lets you block access to selected websites or URLs by showing a bold "This site is blocked" message in your browser. Perfect for staying focused, managing distractions, or enforcing parental controls — all configurable on the fly!

It works on any website, supports single-page applications (SPA), and allows you to edit your block list with a convenient keyboard shortcut.

---

## Features

- Block websites/domains or full URLs based on keywords or exact matches
- Editable block list stored in browser local storage (no external server needed)
- Works on modern browsers supporting userscripts (Tampermonkey, Greasemonkey, Violentmonkey)
- Supports SPA navigation detection and dynamic blocking
- Fully customizable block message style and content
- Keyboard shortcut (default: **Alt + Shift + Z**) to quickly edit your block list
- Stops page loading immediately on blocked sites for faster blocking
- Clean, simple, and easy to extend

---

## Installation

1. Install a userscript manager extension:
   - [Tampermonkey](https://tampermonkey.net/) (Chrome, Firefox, Edge, Safari)
   - [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) (Firefox)
   - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox, Edge)

2. Click the **Install** button on the [raw script link](https://raw.githubusercontent.com/yourname/siteblocker/main/siteblocker.user.js) or add it manually via your userscript manager.

3. The script will start blocking any sites you add to your block list.

---

## Usage

- To edit the list of blocked sites or URLs, press the keyboard shortcut:

  **Alt + Shift + Z**

- Enter your comma-separated list of domains or keywords, e.g.:

  ```
  facebook.com, tiktok, reddit, youtube.com/shorts
  ```

- Save and reload the page to apply changes.

- Blocked pages will show a big red message indicating the site is blocked.

---

## Customize

Feel free to fork and modify the script to:

- Change the block message style or text
- Adjust the blocking criteria or matching logic
- Add custom notifications or logging

---

## Development & Contribution

Contributions, suggestions, and bug reports are welcome! Please open an issue or submit a pull request.

---

## License

This project is unlicensed, and it's full free to edit or use.

---

## Author

**Abdalrahman Saad**  
[GitHub Profile](https://github.com/3bd2lra7man) | [Contact](mailto:sitobluemaks@gmail.com)

---

> Stay focused, block distractions, and surf smarter!  
> 🚫🌐
