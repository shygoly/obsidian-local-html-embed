const { Plugin, TFile, Notice } = require('obsidian');

const INJECTED_THEME_CSS = `
:root {
  color-scheme: light dark;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --color-text-primary: #1f2937;
  --color-text-secondary: #4b5563;
  --color-text-tertiary: #6b7280;
  --color-text-info: #1d4ed8;
  --color-text-warning: #92400e;
  --color-text-success: #166534;
  --color-text-danger: #b91c1c;
  --color-background-primary: #ffffff;
  --color-background-secondary: #f3f4f6;
  --color-background-info: #dbeafe;
  --color-background-warning: #fef3c7;
  --color-background-success: #dcfce7;
  --color-background-danger: #fee2e2;
  --color-border-secondary: #cbd5e1;
  --color-border-tertiary: #e5e7eb;
  --color-border-warning: #f59e0b;
  --border-radius-md: 10px;
  --border-radius-lg: 14px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-text-primary: #f3f4f6;
    --color-text-secondary: #d1d5db;
    --color-text-tertiary: #9ca3af;
    --color-text-info: #93c5fd;
    --color-text-warning: #fcd34d;
    --color-text-success: #86efac;
    --color-text-danger: #fca5a5;
    --color-background-primary: #111827;
    --color-background-secondary: #1f2937;
    --color-background-info: rgba(59, 130, 246, 0.18);
    --color-background-warning: rgba(245, 158, 11, 0.18);
    --color-background-success: rgba(34, 197, 94, 0.18);
    --color-background-danger: rgba(239, 68, 68, 0.18);
    --color-border-secondary: #475569;
    --color-border-tertiary: #334155;
    --color-border-warning: #fbbf24;
  }
}

html, body {
  background: transparent;
  color: var(--color-text-primary);
  overflow: hidden;
}

body {
  font-family: var(--font-sans);
  line-height: 1.5;
}

.tabs {
  gap: 10px !important;
  margin-bottom: 1rem !important;
}

.tab {
  position: relative;
  padding: 8px 16px !important;
  border: 1px solid var(--color-border-secondary) !important;
  border-radius: 999px !important;
  background: var(--color-background-secondary) !important;
  color: var(--color-text-secondary) !important;
  font-weight: 600 !important;
  letter-spacing: 0.01em;
  box-shadow: inset 0 0 0 1px transparent;
}

.tab:hover {
  color: var(--color-text-primary) !important;
  border-color: var(--color-text-info) !important;
}

.tab.active {
  background: var(--color-background-info) !important;
  color: var(--color-text-info) !important;
  border-color: var(--color-text-info) !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.12);
}

.tab.active::after {
  content: "";
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: -6px;
  height: 3px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.85;
}

.panel {
  background: transparent;
}

.local-html-embed-collapsible {
  margin: 12px 0;
  border: 1px solid var(--color-border-tertiary);
  border-radius: var(--border-radius-md);
  background: var(--color-background-primary);
  overflow: hidden;
}

.local-html-embed-collapsible > summary {
  list-style: none;
  cursor: pointer;
  padding: 12px 42px 12px 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  background: var(--color-background-secondary);
  position: relative;
  white-space: normal;
  line-height: 1.45;
}

.local-html-embed-collapsible > summary::-webkit-details-marker {
  display: none;
}

.local-html-embed-collapsible > summary::after {
  content: "+";
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: var(--color-text-tertiary);
}

.local-html-embed-collapsible[open] > summary::after {
  content: "−";
}

.local-html-embed-collapsible > *:not(summary) {
  padding: 12px 14px 14px;
}
`;

module.exports = class LocalHtmlEmbedPlugin extends Plugin {
  onload() {
    this.registerMarkdownCodeBlockProcessor('html-embed', async (source, el, ctx) => {
      const lines = source
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const inputPath = lines[0];
      const heightLine = lines[1] || '';
      const heightMatch = heightLine.match(/^(\d+)(px)?$/i);
      const requestedHeight = heightMatch ? Number(heightMatch[1]) : null;
      const height = requestedHeight ? `${requestedHeight}px` : '720px';

      const renderMessage = (title, detail, level = 'info') => {
        const box = el.createDiv({ cls: 'local-html-embed-message' });
        box.style.margin = '8px 0 16px';
        box.style.padding = '12px 14px';
        box.style.borderRadius = '12px';
        box.style.border = '1px solid var(--background-modifier-border)';
        box.style.background = level === 'error'
          ? 'var(--background-modifier-error-hover)'
          : 'var(--background-secondary)';

        box.createEl('div', {
          text: title,
          attr: { style: 'font-weight: 600; margin-bottom: 6px;' }
        });

        if (detail) {
          box.createEl('div', {
            text: detail,
            attr: { style: 'font-size: 12px; color: var(--text-muted); white-space: pre-wrap;' }
          });
        }
      };

      if (!inputPath) {
        renderMessage('html-embed 缺少文件路径', '用法：第一行写 vault 内 html 路径，或写 auto 自动匹配同目录同名 .html；第二行可选写高度，例如 900；不写高度则自动按最大 tab 内容撑开。', 'error');
        return;
      }

      let targetPath = inputPath;
      if (inputPath.toLowerCase() === 'auto') {
        const sourcePath = ctx?.sourcePath;
        if (!sourcePath || !sourcePath.toLowerCase().endsWith('.md')) {
          renderMessage('auto 模式无法定位当前笔记', '请在 Markdown 笔记中使用 ```html-embed\nauto\n```。', 'error');
          return;
        }
        targetPath = sourcePath.replace(/\.md$/i, '.html');
      }

      const abstractFile = this.app.vault.getAbstractFileByPath(targetPath);
      if (!(abstractFile instanceof TFile)) {
        renderMessage('找不到 HTML 文件', `路径：${targetPath}\n请确认这是相对于 vault 根目录的路径。`, 'error');
        return;
      }

      if (!targetPath.toLowerCase().endsWith('.html')) {
        renderMessage('目标文件不是 .html', `当前路径：${targetPath}`, 'error');
        return;
      }

      try {
        const html = await this.app.vault.read(abstractFile);
        if (!html.trim()) {
          renderMessage('HTML 文件为空', `路径：${targetPath}`, 'error');
          return;
        }

        const baseHref = this.app.vault.getResourcePath(abstractFile).replace(/[^/]+$/, '');
        const normalizedHtml = html.replace(/<meta[^>]*charset[^>]*>/i, '');
        const wrappedHtml = `<!doctype html><html><head><meta charset="utf-8"><base href="${baseHref}"><style>${INJECTED_THEME_CSS}</style></head><body>${normalizedHtml}</body></html>`;
        const blob = new Blob([wrappedHtml], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);

        const wrapper = el.createDiv({ cls: 'local-html-embed-wrapper' });
        wrapper.style.width = '100%';
        wrapper.style.margin = '8px 0 16px';
        wrapper.style.border = '1px solid var(--background-modifier-border)';
        wrapper.style.borderRadius = '12px';
        wrapper.style.overflow = 'hidden';
        wrapper.style.background = 'var(--background-primary)';

        const meta = wrapper.createDiv({ cls: 'local-html-embed-meta' });
        meta.style.padding = '8px 12px';
        meta.style.fontSize = '12px';
        meta.style.color = 'var(--text-muted)';
        meta.style.borderBottom = '1px solid var(--background-modifier-border)';
        meta.setText(`HTML Embed · ${targetPath} · ${requestedHeight ? `高度 ${height}` : '高度自动'}`);

        const iframe = wrapper.createEl('iframe');
        iframe.src = blobUrl;
        iframe.sandbox.add('allow-scripts');
        iframe.sandbox.add('allow-same-origin');
        iframe.style.width = '100%';
        iframe.style.height = height;
        iframe.style.border = '0';
        iframe.style.display = 'block';
        iframe.setAttribute('loading', 'lazy');
        iframe.setAttribute('referrerpolicy', 'no-referrer');

        iframe.addEventListener('load', () => {
          const doc = iframe.contentDocument;
          if (!doc) return;

          const getCollapsibleChildren = (panel) => {
            if (panel.querySelector('.fw-step')) {
              return Array.from(panel.children).filter((child) => child.classList.contains('fw-step') || child.classList.contains('fw-return'));
            }

            return Array.from(panel.children).filter((child) => {
              return child.matches('.layer, .score-item, .verdict, .phase, .risk-box');
            });
          };

          const getSectionLabel = (section, index) => {
            const titleEl = section.querySelector('.layer-title, .fw-title, .phase-title, .verdict-title, .risk-title, .score-label');
            const fallback = section.classList.contains('fw-return') ? '飞轮闭合' : `第 ${index + 1} 项`;
            return titleEl?.textContent?.trim() || fallback;
          };

          const panels = Array.from(doc.querySelectorAll('.panel'));
          panels.forEach((panel) => {
            const sections = getCollapsibleChildren(panel);
            if (sections.length < 2) return;

            sections.forEach((section, index) => {
              if (section.closest('details')) return;

              const details = doc.createElement('details');
              details.className = 'local-html-embed-collapsible';
              details.open = true;

              const summary = doc.createElement('summary');
              summary.textContent = getSectionLabel(section, index);
              details.appendChild(summary);

              section.parentNode.insertBefore(details, section);
              details.appendChild(section);
            });
          });

          const resizeToMaxPanelHeight = () => {
            if (requestedHeight) return;

            const activePanels = panels.map((panel) => panel.classList.contains('active'));
            const activeTabs = Array.from(doc.querySelectorAll('.tab')).map((tab) => tab.classList.contains('active'));
            const tabsHeight = doc.querySelector('.tabs')?.getBoundingClientRect().height || 0;
            let maxPanelHeight = 0;

            panels.forEach((panel) => {
              panel.classList.add('active');
              maxPanelHeight = Math.max(maxPanelHeight, panel.scrollHeight, panel.getBoundingClientRect().height);
              panel.classList.remove('active');
            });

            panels.forEach((panel, index) => panel.classList.toggle('active', activePanels[index]));
            Array.from(doc.querySelectorAll('.tab')).forEach((tab, index) => tab.classList.toggle('active', activeTabs[index]));

            const bodyStyles = doc.defaultView.getComputedStyle(doc.body);
            const bodyPadding = parseFloat(bodyStyles.paddingTop) + parseFloat(bodyStyles.paddingBottom);
            const nextHeight = Math.ceil(tabsHeight + maxPanelHeight + bodyPadding + 48);
            iframe.style.height = `${nextHeight}px`;
          };

          // Pages without `.panel` tabs (e.g. apps that render their views with JavaScript):
          // follow the content height for as long as the embed is shown.
          const followContentHeight = () => {
            const win = doc.defaultView;
            if (!doc.body || !win?.ResizeObserver) return;

            const measure = () => {
              const marginBottom = parseFloat(win.getComputedStyle(doc.body).marginBottom) || 0;
              return Math.ceil(doc.body.getBoundingClientRect().bottom + marginBottom);
            };

            let lastHeight = 0;
            let growthTimes = [];
            const observer = new win.ResizeObserver(() => {
              const nextHeight = measure();
              if (Math.abs(nextHeight - lastHeight) <= 1) return;

              // A page sized from the viewport (e.g. `100vh` plus a margin) grows every time the
              // iframe grows. Stop following if it keeps growing many times within a second.
              if (nextHeight > lastHeight) {
                const now = Date.now();
                growthTimes = growthTimes.filter((time) => now - time < 1000);
                growthTimes.push(now);
                if (growthTimes.length > 30) {
                  observer.disconnect();
                  return;
                }
              }

              lastHeight = nextHeight;
              iframe.style.height = `${nextHeight}px`;
            });
            observer.observe(doc.body);
          };

          if (!requestedHeight && panels.length === 0) {
            followContentHeight();
          } else {
            resizeToMaxPanelHeight();
            doc.querySelectorAll('details').forEach((details) => details.addEventListener('toggle', resizeToMaxPanelHeight));
          }
        });

        iframe.addEventListener('error', () => {
          renderMessage('iframe 加载失败', `路径：${targetPath}`, 'error');
        });

        this.register(() => URL.revokeObjectURL(blobUrl));
      } catch (error) {
        console.error('local-html-embed failed', error);
        new Notice(`HTML 嵌入失败：${targetPath}`);
        renderMessage('HTML 嵌入失败', `${targetPath}\n${error?.message || error}`, 'error');
      }
    });
  }
};
