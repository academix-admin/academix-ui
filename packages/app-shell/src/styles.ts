/**
 * THE SHELL'S CSS, rendered with the shell (not injected after it mounts), so the server's HTML is
 * already laid out and the first paint is the app — never a page that jumps into place on hydration.
 *
 * Scoped to one shell by `[data-ax-shell="<id>"]`. The class names are public: `ax-shell`,
 * `ax-shell__row`, `ax-shell__side`, `ax-shell__stacks`, `ax-shell__bar` — style them from your own
 * CSS, or add classes through `classNames`. Colours are CSS variables (see `README.md`), so a theme
 * switch is a variable change, never a re-render.
 */
export function shellCss(id: string, breakpoint: number, keyboardSafe: boolean): string {
  const at = `[data-ax-shell="${id.replace(/"/g, '')}"]`;
  return `
${at}{position:fixed;left:0;right:0;display:flex;flex-direction:column;overflow:hidden;background:var(--ax-shell-bg,#f6f7f8);
${keyboardSafe ? 'top:var(--ax-viewport-offset-top,0px);height:100dvh;height:var(--ax-vv-height,100dvh);' : 'top:0;height:100dvh;'}}
${at} .ax-shell__row{display:flex;flex:1;min-height:0}
${at} .ax-shell__side{flex:none;height:100%;z-index:20}
${at} .ax-shell__stacks{flex:1;min-width:0;min-height:0;position:relative}
${at} .ax-shell__bar{flex:none;padding-bottom:env(safe-area-inset-bottom,0px);background:var(--ax-shell-surface,#ffffff)}
@media (min-width:${breakpoint + 1}px){${at} .ax-shell__bar{display:none}}
@media (max-width:${breakpoint}px){${at} .ax-shell__side{display:none}}
${keyboardSafe ? `html[data-ax-keyboard='open'] ${at} .ax-shell__bar{display:none}` : ''}
`;
}
