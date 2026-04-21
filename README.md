# Local HTML Embed

Local HTML Embed is an Obsidian plugin that embeds a vault-local HTML file inside a note with an `html-embed` code block.

It is useful when you keep standalone HTML reports, diagrams, dashboards, or interactive prototypes in your vault and want to view them directly from Markdown notes.

## Features

- Embed a vault-local `.html` file in an iframe.
- Use explicit vault-relative paths or `auto` mode.
- Optional fixed iframe height.
- Automatic height mode when no height is provided.
- Preserves UTF-8 text and supports relative assets with a generated `<base>` URL.
- Injects fallback theme variables for common tab/card HTML layouts.
- Adds optional collapsible presentation for common section-based HTML layouts.

## Installation

### Manual installation

1. Download `main.js`, `manifest.json`, and `versions.json` from the latest release.
2. Create this folder in your vault:

   ```text
   .obsidian/plugins/local-html-embed/
   ```

3. Put the three files into that folder.
4. Restart Obsidian or reload plugins.
5. Enable **Local HTML Embed** in Settings → Community plugins.

## Release process

This repository is validated against Obsidian's community plugin checks.

Before publishing a version:

1. Make sure `manifest.json`, `main.js`, and `versions.json` in the repo root are final.
2. Run `npm run validate:release`.
3. Create and push a git tag that exactly matches `manifest.json`'s `version`, for example `0.0.1`.
4. Let GitHub Actions upload `main.js`, `manifest.json`, and `versions.json` as individual assets on that release.

Do not rely on the auto-generated source zip or tarball. The community validator checks for the individual uploaded assets.

## Usage

### Embed a file by path

````markdown
```html-embed
examples/sample.html
```
````

The path is relative to the vault root.

### Use a fixed height

````markdown
```html-embed
examples/sample.html
900
```
````

The second line may be a number or a pixel value such as `900px`.

### Use auto mode

````markdown
```html-embed
auto
```
````

`auto` resolves to an HTML file with the same path and basename as the current Markdown note.

For example:

```text
notes/report.md
notes/report.html
```

## Example

See the `examples/` directory:

- `examples/basic.md`
- `examples/auto.md`
- `examples/sample.html`

## Security notes

This plugin embeds local HTML from your vault and allows scripts inside the iframe so interactive HTML can work.

Only embed HTML files that you trust. Treat local HTML files like executable content.

The iframe uses a sandbox with script support. This is necessary for many interactive local HTML documents, but it also means untrusted HTML can run JavaScript inside the embedded frame.

## Desktop support

This plugin is currently marked desktop-only because local iframe/blob behavior and script execution have not been validated on Obsidian mobile.

## Community plugin status

This repository is prepared for Obsidian community plugin submission. Until it is accepted into the community plugin list, install it manually from GitHub releases.
