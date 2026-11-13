// THE PARTS ARE PUBLIC (13 Nov). Every package already draws its parts with stable class names; an app
// that styled one had no promise it would survive a release, so apps reached for internals instead. This
// writes, per package: a "Styling the parts" README section naming them, and test/parts.test.ts, which
// fails if one disappears from the source — renaming a part is a breaking change, made on purpose.
//
//   node scripts/write-parts-contract.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../packages/', import.meta.url));

const PARTS = {
  'bottom-viewer': ['bottom-viewer-container', 'bottom-viewer-header', 'bottom-viewer-drag-handle', 'bottom-viewer-cancel-btn', 'bottom-viewer-content'],
  'dialog-viewer': ['dialog-overlay', 'dialog-container', 'dialog-header', 'dialog-title', 'dialog-content', 'dialog-message', 'dialog-actions', 'dialog-button'],
  'navigation-bar': ['navigation-bar', 'nav-item', 'fab'],
  sidebar: ['sidebar', 'sidebar-header', 'sidebar-logo', 'sidebar-toggle', 'sidebar-nav', 'sidebar-item', 'sidebar-item-icon', 'sidebar-item-text', 'sidebar-footer'],
  'side-drawer': ['sidedrawer', 'sidedrawer-backdrop'],
  'scroll-date-picker': ['date-picker-container', 'pickers-wrapper', 'wheel-column', 'wheel-item', 'quick-buttons', 'quick-button'],
  'search-viewer': ['search-viewer-search', 'search-viewer-search-back-button', 'search-viewer-search-clear-button', 'search-viewer-fullscreen-search', 'search-viewer-content', 'search-viewer-loading', 'search-viewer-no-results', 'search-viewer-error'],
  'selection-viewer': ['selection-viewer-header', 'selection-viewer-drag-handle', 'selection-viewer-cancel', 'selection-viewer-search', 'selection-viewer-search-back-button', 'selection-viewer-search-clear-button', 'selection-viewer-fullscreen-search', 'selection-viewer-content', 'selection-viewer-loading', 'selection-viewer-no-results', 'selection-viewer-error'],
  'modal-sheet': ['react-modal-sheet-backdrop', 'react-modal-sheet-container', 'react-modal-sheet-header-container', 'react-modal-sheet-content', 'react-modal-sheet-content-scroller'],
};

for (const [pkg, parts] of Object.entries(PARTS)) {
  const base = `${root}${pkg}/`;
  const list = parts.map((p) => `'${p}'`).join(', ');

  writeFileSync(
    `${base}test/parts.test.ts`,
    `/**
 * THE PARTS ARE PUBLIC. Apps style these class names (README, "Styling the parts"), so renaming or
 * dropping one breaks them silently — no type error, just an unstyled screen. This fails first.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PARTS = [${list}];

function source(dir: string): string {
  return readdirSync(dir)
    .map((f) => join(dir, f))
    .map((p) => (statSync(p).isDirectory() ? source(p) : /\\.(tsx?|css)$/.test(p) ? readFileSync(p, 'utf8') : ''))
    .join('\\n');
}

describe('styling the parts', () => {
  const src = source(join(__dirname, '..', 'src'));
  it.each(PARTS)('still draws .%s', (part) => {
    expect(src).toMatch(new RegExp(\`["'\\\`\\\\s.]\${part}(?![\\\\w-])\`));
  });
});
`,
  );

  const readme = `${base}README.md`;
  if (!existsSync(readme)) continue;
  let text = readFileSync(readme, 'utf8');
  if (text.includes('## Styling the parts')) continue;
  const section = `## Styling the parts

Each part carries a stable class name you can style from your own CSS. These names are public: a release that renames or removes one is a breaking change (\`test/parts.test.ts\` holds them).

${parts.map((p) => `- \`.${p}\``).join('\n')}

`;
  text = text.includes('## License') ? text.replace('## License', `${section}## License`) : `${text.trimEnd()}\n\n${section}`;
  writeFileSync(readme, text);
  console.log(`${pkg}: ${parts.length} parts`);
}
