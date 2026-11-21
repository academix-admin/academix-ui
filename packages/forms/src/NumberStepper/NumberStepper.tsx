'use client';

import React, { useId } from 'react';

/**
 * NumberStepper — a whole number changed one step at a time with − and + buttons (a quantity, a
 * group size, a count). Use it where typing a number is more work than tapping: small ranges.
 *
 * Accessible: a `role="group"` named by its label; two buttons with their own accessible names
 * (`decreaseLabel` / `increaseLabel`), disabled at `min` / `max`; the value in an `<output>` that
 * announces changes politely. `display` replaces the shown text ("20 people") without changing the
 * number.
 *
 * Headless, same contract as the rest of the family: no styles are bundled; style every part through
 * `classNames`.
 */
export interface NumberStepperClassNames {
  /** the outer wrapper. */
  root?: string;
  /** the label. */
  label?: string;
  /** the `role="group"` row holding the buttons and the value. */
  control?: string;
  /** both buttons. */
  button?: string;
  /** appended to the − button. */
  decrease?: string;
  /** appended to the + button. */
  increase?: string;
  /** the `<output>` showing the value. */
  value?: string;
  /** the text below the control. */
  helper?: string;
}

export interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  label?: React.ReactNode;
  /** an accessible name for the group when there is no visible `label`. */
  ariaLabel?: string;
  min?: number;
  max?: number;
  /** how much one tap changes the value. Default 1. */
  step?: number;
  /** what to show instead of the bare number, e.g. "20 people". */
  display?: React.ReactNode;
  /** accessible name of the − button. Default "Decrease". */
  decreaseLabel?: string;
  /** accessible name of the + button. Default "Increase". */
  increaseLabel?: string;
  /** content of the − button. Default "−". */
  decreaseIcon?: React.ReactNode;
  /** content of the + button. Default "+". */
  increaseIcon?: React.ReactNode;
  disabled?: boolean;
  helperText?: React.ReactNode;
  classNames?: NumberStepperClassNames;
  /** shortcut for `classNames.root`. */
  className?: string;
  style?: React.CSSProperties;
  /** accepted for the family's contract; there are no built-in styles to theme. */
  theme?: 'light' | 'dark';
}

export function NumberStepper({
  value, onChange, label, ariaLabel, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, step = 1, display,
  decreaseLabel = 'Decrease', increaseLabel = 'Increase', decreaseIcon = '−', increaseIcon = '+',
  disabled, helperText, classNames = {}, className, style,
}: NumberStepperProps) {
  const labelId = useId();
  const helperId = useId();
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const join = (...c: (string | undefined)[]) => c.filter(Boolean).join(' ') || undefined;
  return (
    <div className={className ?? classNames.root} style={style}>
      {label != null && <span id={labelId} className={classNames.label}>{label}</span>}
      <div
        className={classNames.control}
        role="group"
        aria-labelledby={label != null ? labelId : undefined}
        aria-label={label == null ? ariaLabel : undefined}
        aria-describedby={helperText != null ? helperId : undefined}
      >
        <button
          type="button"
          className={join(classNames.button, classNames.decrease)}
          aria-label={decreaseLabel}
          disabled={disabled || value <= min}
          onClick={() => onChange(clamp(value - step))}
        >
          {decreaseIcon}
        </button>
        <output className={classNames.value} aria-live="polite">{display ?? value}</output>
        <button
          type="button"
          className={join(classNames.button, classNames.increase)}
          aria-label={increaseLabel}
          disabled={disabled || value >= max}
          onClick={() => onChange(clamp(value + step))}
        >
          {increaseIcon}
        </button>
      </div>
      {helperText != null && <p id={helperId} className={classNames.helper}>{helperText}</p>}
    </div>
  );
}
