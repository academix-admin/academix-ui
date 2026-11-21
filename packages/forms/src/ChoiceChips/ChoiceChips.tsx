'use client';

import React, { useId, useRef } from 'react';

/**
 * ChoiceChips — pick ONE value from a short row of chips (a Flutter `ChoiceChip` group). Use it where
 * a RadioGroup's stacked cards take too much room: amounts, frequencies, sizes.
 *
 * Accessible as a radio group: a `<fieldset>` with its `<legend>`, a `role="radiogroup"` row of
 * `role="radio"` buttons carrying `aria-checked`. One chip is in the tab order (the selected one, or
 * the first enabled one); the arrow keys, Home and End move between chips and select as they go, as
 * native radios do.
 *
 * Headless, same contract as the rest of the family: no styles are bundled; style every part through
 * `classNames`. The selected chip gets `chipSelected` as well as `chip`.
 */
export interface ChoiceChipOption<V extends string | number = string> {
  value: V;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface ChoiceChipsClassNames {
  /** the `<fieldset>`. */
  root?: string;
  /** the `<legend>`. */
  label?: string;
  /** the `role="radiogroup"` row holding the chips. */
  group?: string;
  /** every chip `<button>`. */
  chip?: string;
  /** appended to the selected chip. */
  chipSelected?: string;
  /** the text below the chips. */
  helper?: string;
}

export interface ChoiceChipsProps<V extends string | number = string> {
  /** the group's name, shown as its legend (and its accessible name). */
  label?: React.ReactNode;
  /** an accessible name when there is no visible `label`. */
  ariaLabel?: string;
  options: ChoiceChipOption<V>[];
  /** the selected value; `null` for none yet. */
  value: V | null;
  onChange: (value: V) => void;
  disabled?: boolean;
  helperText?: React.ReactNode;
  classNames?: ChoiceChipsClassNames;
  /** shortcut for `classNames.root`. */
  className?: string;
  style?: React.CSSProperties;
  /** accepted for the family's contract; there are no built-in styles to theme. */
  theme?: 'light' | 'dark';
}

export function ChoiceChips<V extends string | number = string>({
  label, ariaLabel, options, value, onChange, disabled, helperText, classNames = {}, className, style,
}: ChoiceChipsProps<V>) {
  const helperId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = (i: number) => !disabled && !options[i]?.disabled;
  const selectedIndex = options.findIndex((o) => o.value === value);
  const tabStop = selectedIndex >= 0 && enabled(selectedIndex) ? selectedIndex : options.findIndex((_, i) => enabled(i));

  const move = (from: number, step: 1 | -1 | 'first' | 'last') => {
    const n = options.length;
    let i = step === 'first' ? -1 : step === 'last' ? n : from;
    const dir = step === 'last' || step === -1 ? -1 : 1;
    for (let tries = 0; tries < n; tries++) {
      i = (i + dir + n) % n;
      if (enabled(i)) {
        refs.current[i]?.focus();
        onChange(options[i].value);
        return;
      }
    }
  };
  const onKeyDown = (i: number) => (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const key = e.key;
    const step = key === 'ArrowRight' || key === 'ArrowDown' ? 1 : key === 'ArrowLeft' || key === 'ArrowUp' ? -1
      : key === 'Home' ? 'first' : key === 'End' ? 'last' : null;
    if (step === null) return;
    e.preventDefault();
    move(i, step);
  };

  return (
    <fieldset className={className ?? classNames.root} style={style} disabled={disabled}>
      {label != null && <legend className={classNames.label}>{label}</legend>}
      <div
        className={classNames.group}
        role="radiogroup"
        aria-label={typeof label === 'string' ? label : ariaLabel}
        aria-describedby={helperText != null ? helperId : undefined}
      >
        {options.map((o, i) => {
          const on = o.value === value;
          return (
            <button
              key={String(o.value)}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={i === tabStop ? 0 : -1}
              disabled={disabled || o.disabled}
              className={[classNames.chip, on ? classNames.chipSelected : undefined].filter(Boolean).join(' ') || undefined}
              onClick={() => onChange(o.value)}
              onKeyDown={onKeyDown(i)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {helperText != null && <p id={helperId} className={classNames.helper}>{helperText}</p>}
    </fieldset>
  );
}
