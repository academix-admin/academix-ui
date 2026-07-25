'use client';

import React from 'react';

/**
 * PinInput — a segmented numeric code input (OTP / PIN). Headless: it renders accessible
 * markup and you style every slot via `classNames` (bring your own classes). React-only,
 * no app/theme coupling, so it is safe for any consumer.
 *
 * The focus / auto-advance / backspace-cascade / paste / focus-guard behavior is the
 * device-proven academix logic, preserved exactly. Set `mask` for a hidden PIN (digits
 * render as `*` unless `revealed`); leave it off for a visible OTP.
 */

export interface PinInputClassNames {
  /** the boxes wrapper. */
  container?: string;
  /** appended to the container while `error` is true. */
  containerError?: string;
  /** each single-character box. */
  input?: string;
}

export interface PinInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  /** render digits masked (as `*`) unless `revealed`. */
  mask?: boolean;
  /** when `mask`, show the real digits. */
  revealed?: boolean;
  /** autofocus the first box on mount (when not in error). Default true. */
  autoFocus?: boolean;
  classNames?: PinInputClassNames;
  /** shortcut for `classNames.container`. */
  className?: string;
  /** spread onto every box (e.g. password-manager suppression attrs, incl. `data-*`). */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement> & Record<`data-${string}`, unknown>;
}

export function PinInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  error = false,
  mask = false,
  revealed = false,
  autoFocus = true,
  classNames = {},
  className,
  inputProps,
}: PinInputProps) {
  const inputs = Array(length).fill(0);

  const getFirstInvalidIndex = (val: string) => {
    for (let i = 0; i < length; i++) {
      if (!val[i]) return i;
    }
    return length - 1; // all full → last field
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1);

    const otpArray = value.split('');
    otpArray[index] = digit || '';
    const nextValue = otpArray.join('');

    onChange(nextValue);

    // compute allowed index from the new value
    const allowedIndex = getFirstInvalidIndex(nextValue);

    // Auto-advance only if digit is valid and index < allowed position
    if (digit && index < length - 1 && index < allowedIndex) {
      const next = e.target.nextElementSibling as HTMLInputElement | null;
      next?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key !== 'Backspace') return;

    // Error mode: clear everything
    if (error && value.length === length) {
      onChange('');
      const els = e.currentTarget.parentElement!.querySelectorAll('input');
      (els[0] as HTMLInputElement).focus();
      return;
    }

    const els = e.currentTarget.parentElement!.querySelectorAll('input');

    // Build a snapshot of the current actual values from DOM, not from state.
    const domValues = Array.from(els).map((input) => (input as HTMLInputElement).value);

    // If current field already empty → move back
    if (!domValues[index] && index > 0) {
      const prev = els[index - 1] as HTMLInputElement;
      prev.focus();
    }

    // Clear current char (and everything after) and update parent state
    const otpArray = value.split('');
    for (let i = index; i < otpArray.length; i++) {
      otpArray[i] = '';
    }
    onChange(otpArray.join(''));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pasted) {
      onChange(pasted.slice(0, length));
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>, index: number) => {
    const els = e.currentTarget.parentElement!.querySelectorAll('input');

    // Determine focusable index based on ACTUAL input values
    let allowedIndex = 0;
    for (let i = 0; i < length; i++) {
      if ((els[i] as HTMLInputElement).value === '') {
        allowedIndex = i;
        break;
      }
      if (i === length - 1) allowedIndex = length - 1;
    }

    // Prevent skipping ahead
    if (index > allowedIndex) {
      (els[allowedIndex] as HTMLInputElement).focus();
    }
  };

  const display = (index: number) => {
    if (mask && !revealed) return value[index] ? '*' : '';
    return value[index] || '';
  };

  const containerClass = `${className ?? classNames.container ?? ''}${
    error && classNames.containerError ? ` ${classNames.containerError}` : ''
  }`.trim() || undefined;

  return (
    <div className={containerClass}>
      {inputs.map((_, index) => (
        <input
          {...inputProps}
          key={index}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={display(index)}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          disabled={disabled}
          className={classNames.input}
          autoFocus={autoFocus && index === 0 && !error}
          onFocus={(e) => handleFocus(e, index)}
        />
      ))}
    </div>
  );
}
