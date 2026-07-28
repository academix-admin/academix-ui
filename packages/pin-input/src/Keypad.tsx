'use client';

import React from 'react';

/**
 * Keypad — an on-screen numeric keypad (0-9 + backspace, optional reveal/mask toggle)
 * that drives a `PinInput`'s value. Headless: style each slot via `classNames`. React-only.
 *
 * Behavior preserved from academix: append up to `length` digits; while `error` and the
 * value is full, the next digit replaces it and backspace clears it. Set `showMaskToggle`
 * for the PIN eye button (calls `onToggleReveal`); omit it for a plain OTP keypad.
 */

export interface KeypadClassNames {
  /** outer wrapper. */
  keypad?: string;
  /** the button grid. */
  grid?: string;
  /** every key (digits, backspace, toggle). */
  button?: string;
  /** appended to the backspace key. */
  backspace?: string;
  /** appended to the mask-toggle key. */
  toggle?: string;
  /** appended to the outer wrapper while `loading` (style your overlay/dimming here). */
  loading?: string;
}

export interface KeypadProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
  /** disables every key (a verify/submit in flight) and applies `classNames.loading`. */
  loading?: boolean;
  /** rendered inside the wrapper while `loading` (e.g. a spinner); position via `classNames.loading`. */
  loadingIndicator?: React.ReactNode;
  /** render the reveal/mask (eye) toggle key. */
  showMaskToggle?: boolean;
  /** current reveal state (for the toggle icon/label). */
  revealed?: boolean;
  onToggleReveal?: (revealed: boolean) => void;
  /** backspace key content. Default `✕`. */
  backspaceLabel?: React.ReactNode;
  classNames?: KeypadClassNames;
  /** shortcut for `classNames.keypad`. */
  className?: string;
}

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

export function Keypad({
  value,
  onChange,
  length = 6,
  disabled = false,
  error,
  loading = false,
  loadingIndicator,
  showMaskToggle = false,
  revealed = false,
  onToggleReveal,
  backspaceLabel = '✕',
  classNames = {},
  className,
}: KeypadProps) {
  const busy = disabled || loading;

  const handleDigitInput = (digit: number) => {
    if (value.length < length) {
      onChange(value + digit);
    } else if (!!error && value.length === length) {
      onChange(`${digit}`);
    }
  };

  const handleBackspace = () => {
    if (value.length > 0 && !error) {
      onChange(value.slice(0, -1));
    } else if (!!error && value.length === length) {
      onChange('');
    }
  };

  const btn = classNames.button ?? '';
  const wrapperClass = `${className ?? classNames.keypad ?? ''}${
    loading && classNames.loading ? ` ${classNames.loading}` : ''
  }`.trim() || undefined;

  return (
    <div className={wrapperClass} aria-busy={loading || undefined}>
      <div className={classNames.grid}>
        {DIGITS.map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigitInput(digit)}
            disabled={busy}
            className={btn || undefined}
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={handleBackspace}
          disabled={busy}
          className={`${btn} ${classNames.backspace ?? ''}`.trim() || undefined}
        >
          {backspaceLabel}
        </button>
        {showMaskToggle && (
          <button
            type="button"
            onClick={() => onToggleReveal?.(!revealed)}
            disabled={busy}
            className={`${btn} ${classNames.toggle ?? ''}`.trim() || undefined}
            title={revealed ? 'Hide' : 'Show'}
            aria-label={revealed ? 'Hide' : 'Show'}
          >
            {revealed ? <EyeOpen /> : <EyeClosed />}
          </button>
        )}
      </div>
      {loading && loadingIndicator}
    </div>
  );
}

function EyeOpen() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function EyeClosed() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
