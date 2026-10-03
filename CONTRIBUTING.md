# Contributing · مشارکت

Thanks for taking the time to help! / از اینکه وقت می‌گذارید ممنونیم!

## Quick start

```bash
git clone https://github.com/majidshilehsari/RTL-MarkDown-Editor.git
cd RTL-MarkDown-Editor
npm install
npm run dev     # http://localhost:3000
npm run build   # must pass before you open a PR
```

## Adding or fixing a translation

The whole UI lives in a single file: **`lib/i18n.js`**.

1. Add your language to the `LANGS` array:
   ```js
   { code: 'he', label: 'עברית', flag: '🇮🇱', dir: 'rtl' }
   ```
2. Copy the `en` dictionary, translate the values (keep the keys and the emoji prefixes), and register it in `TR`.
3. Optionally add a demo document for your language in `lib/samples.js`.
4. Run `npm run build` and switch to your language from the ☰ menu to check the layout — especially if your language is LTR while the rest are RTL.

Every dictionary must contain **the same keys**; missing keys silently fall back to Persian.

## Code style

- Plain JavaScript + React function components, no TypeScript build step.
- Keep the editor dependency-light: everything runs client-side, there is no backend.
- Markdown rendering lives in `lib/markdown.js`, bidi/text repair logic in `lib/bidi.js`, UI in `app/Editor.jsx`, styles in `app/globals.css`.
- Sanitise anything that ends up in the preview — all HTML goes through DOMPurify.

## Reporting bugs

Please include: browser and OS, the text you pasted (if it can be shared), what you expected, and what happened. Screenshots of broken direction are extremely helpful.

## Pull requests

- One topic per PR, with a short description of the user-visible change.
- Make sure `npm run build` is green.
- By contributing you agree your work is released under the [MIT License](LICENSE).
