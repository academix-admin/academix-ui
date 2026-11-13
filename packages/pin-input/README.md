# @academix-admin/pin-input

Headless code entry for React. `PinInput` shows the boxes of an OTP or PIN, and `Keypad` is an on-screen number pad that types into them. Both are accessible, and their focus and paste handling has been tested on iOS and Android. You style every part through a `classNames` map.

```sh
npm install @academix-admin/pin-input
```

React 18 or 19.

## PinInput

```tsx
import { PinInput } from '@academix-admin/pin-input';

<PinInput
  length={6}
  value={code}
  onChange={setCode}
  error={wrong}
  loading={verifying}
  classNames={{ container: s.boxes, containerError: s.shake, input: s.box }}
/>
```

- `value` and `onChange(value)` hold the whole code, and `length` sets how many boxes (default 6).
- Only digits are taken, typed or pasted. Pasting a full code fills every box. Typing moves to the next box, and Backspace goes back.
- `error` turns on `classNames.containerError`. `loading` (a verify in flight) disables the boxes and turns on `classNames.containerLoading`.
- `mask` shows `*` for each digit unless `revealed` is set. Use it for PINs.
- `autoFocus` (default `true`) focuses the first box on mount, unless `error` is set.
- `inputProps` is spread onto every box, for example to stop password managers offering to fill them, `data-*` attributes included.
- **Parts (`PinInputClassNames`):** `container`, `containerError`, `containerLoading` and `input`. `className` is a shortcut for `container`.

## Keypad

An on-screen number pad that edits the same `value`. Use it for a PIN you don't want the phone's keyboard involved in, such as an app lock.

```tsx
import { Keypad, PinInput } from '@academix-admin/pin-input';

<PinInput length={4} value={pin} onChange={setPin} mask revealed={show} autoFocus={false} inputProps={{ readOnly: true }} />
<Keypad length={4} value={pin} onChange={setPin} showMaskToggle revealed={show} onToggleReveal={setShow} loading={checking} />
```

- `value`, `onChange` and `length` match the PinInput the keypad types into.
- `disabled` and `error` work as on PinInput.
- `loading` disables every key and turns on `classNames.loading`. `loadingIndicator` is drawn inside the pad while loading.
- `showMaskToggle` adds an eye key, with `revealed` and `onToggleReveal(revealed)`.
- `backspaceLabel` sets the backspace key's content (default `✕`).
- **Parts (`KeypadClassNames`):** `keypad`, `grid`, `button`, `backspace`, `toggle` and `loading`. `className` is a shortcut for `keypad`.

## Exports

`PinInput` and `Keypad`, and their types `PinInputProps`, `PinInputClassNames`, `KeypadProps` and `KeypadClassNames`.

## License

MIT
