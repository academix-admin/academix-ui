'use client';

import React, { useEffect } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export type HeaderTheme = 'light' | 'dark';
export type HeaderPosition = 'fixed' | 'sticky' | 'static';

/**
 * Visual variant.
 * - `bar`   — AppBar style: fixed at the top, backdrop blur, border, single-line
 *             title (the redeem-codes header).
 * - `title` — Page-title style: in-flow section with a large bold title, an
 *             optional description underneath, and icon actions (the
 *             home/payment/profile/quiz/rewards "-title" headers).
 */
export type HeaderVariant = 'bar' | 'title';

/** A single right-side action (icon button) in the header. */
export interface HeaderAction {
  /** Icon to render (any React node). Hidden while `loading` is true. */
  icon: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  /** Native tooltip (the button's `title` attribute). */
  title?: string;
  disabled?: boolean;
  /** Show a spinner instead of the icon (and disable the button). */
  loading?: boolean;
  /** Small badge over the icon (e.g. a notification count). */
  badge?: React.ReactNode;
  /** Per-action class override (added to the default action class). */
  className?: string;
  /** Stable key; falls back to the array index. */
  key?: string;
}

/** Per-part class overrides. Each is appended to the built-in class. */
export interface HeaderClassNames {
  root?: string;        // mainSection equivalent
  content?: string;
  titles?: string;      // titleSection equivalent
  title?: string;       // titleTop equivalent
  description?: string; // titleBot equivalent
  backButton?: string;
  backIcon?: string;
  action?: string;      // notificationIcon / iconButton equivalent
  iconWrap?: string;    // iconWrapper equivalent
  badge?: string;       // notificationBadge equivalent
}

/**
 * Where the description sits relative to the title.
 * - `below`  — stacked under the title (home/rewards style).
 * - `beside` — inline next to the title, bottom/baseline-aligned
 *              (payment style: "Today  23 July").
 */
export type HeaderDescriptionPlacement = 'below' | 'beside';

export interface HeaderProps {
  /** Title text (or any node). Rendered as an <h1>. */
  title?: React.ReactNode;
  /** Smaller line under (or beside) the title (titleBot). */
  description?: React.ReactNode;
  /** Description placement relative to the title. Default 'below'. */
  descriptionPlacement?: HeaderDescriptionPlacement;
  /** Visual variant. Default 'bar'. */
  variant?: HeaderVariant;
  /** Colour scheme. Default 'light'. */
  theme?: HeaderTheme;
  /** Back handler. When set (and `showBack` is not false), a back button shows. */
  onBack?: () => void;
  /** Force the back button on/off. Defaults to `onBack != null`. */
  showBack?: boolean;
  /** Override the back icon. Defaults to the built-in chevron. */
  backIcon?: React.ReactNode;
  backAriaLabel?: string;
  /** Disable the back button (e.g. while a flow is submitting). */
  backDisabled?: boolean;
  /** Right-side action buttons. */
  actions?: HeaderAction[];
  /** Escape hatch: extra custom nodes rendered after `actions`. */
  rightContent?: React.ReactNode;
  /** Root element class (convenience alias for `classNames.root`). Default: none. */
  className?: string;
  /** Per-part class overrides. */
  classNames?: HeaderClassNames;
  style?: React.CSSProperties;
  /** Positioning. Defaults: 'fixed' for variant="bar", 'static' for variant="title". */
  position?: HeaderPosition;
  id?: string;
}

// ─── Styles (self-contained, injected once) ─────────────────────────────────
//
// Tokens are CSS variables with fallbacks so they drop into an existing design
// system but need no configuration:
//   --ax-header-sidebar-width  (fallback: --sidebar-width, then 0px)
//   --ax-header-text-color     (fallback: --text-color, then currentColor)
//   --ax-header-z              (fallback: 10)
//   --ax-header-badge-bg       (fallback: #ff4d4f)

const HEADER_CSS = `
/* ── bar variant (AppBar) ─────────────────────────────────────────────── */
.ax-header {
  position: fixed;
  top: 0;
  left: var(--ax-header-sidebar-width, var(--sidebar-width, 0px));
  right: 0;
  z-index: var(--ax-header-z, 10);
  display: flex;
  backdrop-filter: blur(8px);
  box-sizing: border-box;
}
.ax-header[data-position="sticky"] { position: sticky; left: 0; }
.ax-header[data-position="static"] { position: static; left: 0; }
.ax-header[data-theme="light"] {
  background-color: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid #E5E5E5;
}
.ax-header[data-theme="dark"] {
  background-color: rgba(18, 18, 18, 0.95);
  border-bottom: 1px solid #333;
}
.ax-header__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 1rem;
  box-sizing: border-box;
  min-width: 0;
  padding: 8px 16px;
}
.ax-header__back {
  min-width: 44px;
  min-height: 44px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ax-header-text-color, var(--text-color, currentColor));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  margin-left: -8px;
}
.ax-header__back:hover { background-color: rgba(0, 0, 0, 0.05); }
.ax-header__back:disabled { opacity: 0.5; cursor: default; }
.ax-header__back-icon { width: 20px; height: 20px; }
.ax-header__titles {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.ax-header__titles[data-placement="beside"] {
  flex-direction: row;
  align-items: baseline; /* bottom text-axis alignment (e.g. "Today  23 July") */
  gap: 8px;
}
.ax-header__titles[data-placement="beside"] > .ax-header__description {
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ax-header__title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  text-align: start;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-sizing: border-box;
  color: var(--ax-header-text-color, var(--text-color, inherit));
}
.ax-header__description {
  font-size: clamp(0.875rem, 2.5vw, 1rem);
  margin: 0.25rem 0 0;
  line-height: 1.4;
}
.ax-header[data-theme="light"] .ax-header__description { color: #666; }
.ax-header[data-theme="dark"] .ax-header__description { color: #c4c4c4; }
.ax-header__action {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ax-header-text-color, var(--text-color, currentColor));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  flex-shrink: 0;
  opacity: 1;
  transition: opacity 0.2s, background-color 0.2s ease;
}
.ax-header__action:hover { background-color: rgba(0, 0, 0, 0.05); }
.ax-header__action:disabled { opacity: 0.5; cursor: default; }
.ax-header__icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ax-header__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: var(--ax-header-badge-bg, #ff4d4f);
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  pointer-events: none;
}
.ax-header__spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: ax-header-spin 0.8s linear infinite;
}
@keyframes ax-header-spin { to { transform: rotate(360deg); } }

/* ── title variant (page-title section) ───────────────────────────────── */
.ax-header[data-variant="title"] {
  position: static;
  left: auto;
  right: auto;
  top: auto;
  backdrop-filter: none;
  background: none;
  border-bottom: none;
}
.ax-header[data-variant="title"][data-position="fixed"] { position: fixed; }
.ax-header[data-variant="title"][data-position="sticky"] { position: sticky; }
.ax-header[data-variant="title"] .ax-header__content {
  align-items: flex-start;
  padding: 24px 28px 32px 28px;
}
.ax-header[data-variant="title"] .ax-header__title {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 700;
  line-height: 1.2;
}
.ax-header[data-variant="title"][data-theme="light"] .ax-header__title { color: #1a1a1a; }
.ax-header[data-variant="title"][data-theme="dark"] .ax-header__title { color: #ffffff; }
.ax-header[data-variant="title"] .ax-header__action {
  padding: 12px;
  margin: -12px;
  transition: background-color 0.2s ease;
}
.ax-header[data-variant="title"] .ax-header__action:active { transform: scale(0.95); }

/* ── responsive ───────────────────────────────────────────────────────── */
@media screen and (min-width: 500px) and (max-width: 800px) {
  .ax-header { left: 0; }
  .ax-header__badge { width: 16px; height: 16px; font-size: 10px; top: -3px; right: -3px; }
  .ax-header[data-variant="title"] .ax-header__content { gap: 0.875rem; padding: 18px 20px 24px 20px; }
}
@media screen and (max-width: 800px) {
  .ax-header { left: 0; }
  .ax-header__content { padding: 8px 16px; }
  .ax-header[data-variant="title"] .ax-header__content { padding: 18px 20px 24px 20px; }
}
@media screen and (max-width: 500px) {
  .ax-header { left: 0; }
  .ax-header__content { margin: 0; padding: 8px 16px; }
  .ax-header__title { font-size: 1.2rem; }
  .ax-header__back-icon { width: 16px; height: 16px; }
  .ax-header__badge { width: 14px; height: 14px; font-size: 9px; top: -2px; right: -2px; }
  .ax-header[data-variant="title"] .ax-header__content { gap: 0.75rem; padding: 16px 16px 18px 16px; }
  .ax-header[data-variant="title"] .ax-header__title { font-size: 1.375rem; }
  .ax-header[data-variant="title"] .ax-header__description { font-size: 0.8125rem; }
}

/* ── accessibility ────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .ax-header__action, .ax-header__spinner { transition: none; animation: none; }
}
@media (prefers-contrast: high) {
  .ax-header[data-variant="title"][data-theme="light"] .ax-header__title { color: #000000; }
  .ax-header[data-theme="light"] .ax-header__description { color: #333333; }
  .ax-header[data-theme="dark"] .ax-header__description { color: #e0e0e0; }
  .ax-header__badge { border: 1px solid white; }
}
`;

let stylesInjected = false;
function useInjectStyles() {
  useEffect(() => {
    if (stylesInjected || typeof document === 'undefined') return;
    stylesInjected = true;
    const el = document.createElement('style');
    el.setAttribute('data-ax-header', '');
    el.textContent = HEADER_CSS;
    document.head.appendChild(el);
  }, []);
}

// ─── Default back icon (the app's chevron) ──────────────────────────────────

function DefaultBackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M10.0424 0.908364L1.01887 8.84376C0.695893 9.12721 0.439655 9.46389 0.264823 9.83454C0.089992 10.2052 0 10.6025 0 11.0038C0 11.405 0.089992 11.8024 0.264823 12.173C0.439655 12.5437 0.695893 12.8803 1.01887 13.1638L10.0424 21.0992C12.2373 23.0294 16 21.6507 16 18.9239V3.05306C16 0.326231 12.2373 -1.02187 10.0424 0.908364Z"
        fill="currentColor"
      />
    </svg>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

const cx = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

/**
 * A Flutter `AppBar`-style header with two variants:
 *
 * - `variant="bar"` (default): fixed top bar — back button, single-line title,
 *   right-side icon actions.
 * - `variant="title"`: in-flow page-title section — large bold title, optional
 *   `description` underneath, icon actions (with badge support). Back button is
 *   simply hidden by not passing `onBack`.
 *
 * Styles are self-contained (injected once); every part accepts a class
 * override via `classNames`.
 */
export function Header({
  title,
  description,
  descriptionPlacement = 'below',
  variant = 'bar',
  theme = 'light',
  onBack,
  showBack,
  backIcon,
  backAriaLabel = 'Go back',
  backDisabled,
  actions = [],
  rightContent,
  className,
  classNames = {},
  style,
  position,
  id,
}: HeaderProps) {
  useInjectStyles();
  const backVisible = showBack ?? onBack != null;
  const resolvedPosition = position ?? (variant === 'title' ? 'static' : 'fixed');

  return (
    <header
      id={id}
      data-variant={variant}
      data-theme={theme}
      data-position={resolvedPosition}
      className={cx('ax-header', className ?? classNames.root)}
      style={style}
    >
      <div className={cx('ax-header__content', classNames.content)}>
        {backVisible && (
          <button
            type="button"
            className={cx('ax-header__back', classNames.backButton)}
            onClick={onBack}
            aria-label={backAriaLabel}
            disabled={backDisabled}
          >
            {backIcon ?? <DefaultBackIcon className={cx('ax-header__back-icon', classNames.backIcon)} />}
          </button>
        )}

        {(title != null || description != null) && (
          <div
            className={cx('ax-header__titles', classNames.titles)}
            data-placement={descriptionPlacement}
          >
            {title != null && (
              <h1 className={cx('ax-header__title', classNames.title)}>{title}</h1>
            )}
            {description != null && (
              <p className={cx('ax-header__description', classNames.description)}>{description}</p>
            )}
          </div>
        )}

        {actions.map((action, i) => (
          <button
            key={action.key ?? i}
            type="button"
            className={cx('ax-header__action', action.className ?? classNames.action)}
            onClick={action.onClick}
            disabled={action.disabled || action.loading}
            aria-label={action.ariaLabel}
            title={action.title}
          >
            {action.loading ? (
              <span className="ax-header__spinner" aria-hidden="true" />
            ) : action.badge != null ? (
              <span className={cx('ax-header__icon-wrap', classNames.iconWrap)}>
                {action.icon}
                <span className={cx('ax-header__badge', classNames.badge)}>{action.badge}</span>
              </span>
            ) : (
              action.icon
            )}
          </button>
        ))}

        {rightContent}
      </div>
    </header>
  );
}

export default Header;
