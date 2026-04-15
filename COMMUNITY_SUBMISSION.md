# Community Plugin Submission Notes

Repository: https://github.com/shygoly/obsidian-local-html-embed

Plugin ID: `local-html-embed`

Plugin name: Local HTML Embed

Description: Embed a vault-local HTML file inside notes via an `html-embed` code block.

Release files:

- `main.js`
- `manifest.json`
- `versions.json`

Security note:

This plugin embeds vault-local HTML and allows scripts inside a sandboxed iframe so interactive HTML documents can work. Users should only embed trusted local HTML files.

Desktop/mobile note:

The plugin is marked `isDesktopOnly: true` because local iframe/blob behavior and script execution have not been validated on Obsidian mobile.
