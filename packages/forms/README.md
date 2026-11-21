# @academix-admin/forms

Headless form fields for React: `TextInput`, `SelectField`, `Checkbox`, `RadioGroup`, `ChoiceChips` and `NumberStepper`. They use accessible, semantic markup (a real `<label>` tied to its `<input>`, and `aria-invalid` on an error), and you style every part through a `classNames` map. No styles are bundled, so the fields look like your app, not like this package.

```sh
npm install @academix-admin/forms
```

React 18 or 19.

## TextInput

```tsx
import { TextInput } from '@academix-admin/forms';

<TextInput
  label="Phone number"
  value={phone}
  onChange={(value) => setPhone(value)}
  keyboardType="tel"
  prefix="+234"
  helperText={error ?? 'We text a code to this number'}
  status={error ? 'error' : 'default'}
  classNames={{ root: s.field, label: s.label, field: s.box, input: s.input, helper: s.helper }}
/>
```

- **Value:** controlled (`value` and `onChange(value, event)`) or uncontrolled (`defaultValue`).
- **Decoration:**
  - `label`, `hint` (the placeholder), `prefix` and `suffix`;
  - `helperText` with `status`: `'default'`, `'error'`, `'valid'` or `'info'`;
  - `counter`: `true`, or a function `(length, maxLength) => ReactNode`.
- **Behaviour:**
  - `keyboardType` sets the phone keyboard: `'text'`, `'numeric'`, `'decimal'`, `'tel'`, `'email'`, `'url'` or `'search'`;
  - `obscureText` with `secureToggle` and `onSecureToggle(revealed)` gives a password field with a show/hide button;
  - `transform` is `'uppercase'` or `'lowercase'`;
  - the standard input attributes: `maxLength`, `pattern`, `autoFocus`, `disabled`, `required`, `readOnly`, `name`, `id`, `autoComplete`, `autoCapitalize`, `enterKeyHint`, `inputMode`.
- **Escape hatches:** `onFocus`, `onBlur` and `onKeyDown`, a `ref` forwarded to the `<input>`, and `inputProps` spread onto the input.
- **Parts (`TextInputClassNames`):** `root`, `label`, `field`, `input`, `prefix`, `suffix`, `toggle`, `helper`, `counter`. Also `className`, `style` and `theme` (`'light'` or `'dark'`).

## SelectField

A button that looks like a field and opens your picker. Pair it with `@academix-admin/selection-viewer`.

```tsx
import { SelectField } from '@academix-admin/forms';

<SelectField
  label="Country"
  value={country?.name}
  placeholder="Choose a country"
  onOpen={() => picker.open()}
  helperText={error}
  status={error ? 'error' : 'default'}
/>
```

Props are `label`, `description`, `value`, `placeholder`, `onOpen`, `trailing` (your chevron or icon), `disabled`, `helperText`, `status`, `id`, `name`, `className`, `style` and `theme`. The parts (`SelectFieldClassNames`) are `root`, `label`, `description`, `control`, `trailing` and `helper`.

## Checkbox

```tsx
import { Checkbox } from '@academix-admin/forms';

<Checkbox checked={agreed} onChange={(checked) => setAgreed(checked)}>
  I agree to the terms
</Checkbox>
```

`checked` / `defaultChecked`, `onChange(checked, event)`, `children` (the label), `icon` (the tick), plus `disabled`, `required`, `name`, `id`, `value`, `className`, `style` and `theme`. The parts (`CheckboxClassNames`) are `label`, `input`, `box`, `icon` and `text`.

## RadioGroup

```tsx
import { RadioGroup } from '@academix-admin/forms';

<RadioGroup
  name="plan"
  value={plan}
  onChange={setPlan}
  options={[
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly', disabled: !canYearly },
  ]}
/>
```

`name`, `value`, `onChange(value)`, `options` (`RadioOption[]`: `value`, `label`, `disabled`), `disabled`, `className`, `style` and `theme`. The value type follows your options (`RadioGroup<'monthly' | 'yearly'>`). The parts (`RadioGroupClassNames`) are `group`, `item`, `itemSelected`, `input`, `content` and `text`.

## ChoiceChips

Pick one value from a short row of chips: amounts, frequencies, sizes. Where `RadioGroup`'s stacked
cards would take too much room.

```tsx
import { ChoiceChips } from '@academix-admin/forms';

<ChoiceChips
  label="How much each time"
  value={amount}
  onChange={setAmount}
  options={[
    { value: '2000', label: '₦2,000' },
    { value: '5000', label: '₦5,000' },
    { value: 'other', label: 'Other amount' },
  ]}
  classNames={{ root: s.field, label: s.label, group: s.chips, chip: s.chip, chipSelected: s.chipOn }}
/>
```

It is a radio group: a `<fieldset>` and `<legend>`, then a `role="radiogroup"` row of
`role="radio"` buttons with `aria-checked`. Only one chip is in the tab order. The arrow keys, Home
and End move between chips and select as they go, as native radios do, skipping disabled chips.

Props: `label`, `ariaLabel` (when there is no visible label), `options` (`ChoiceChipOption[]`:
`value`, `label`, `disabled`), `value` (`null` for nothing chosen yet), `onChange(value)`,
`disabled`, `helperText`, `className`, `style` and `theme`. Values may be strings or numbers
(`ChoiceChips<number>`). The parts (`ChoiceChipsClassNames`) are `root`, `label`, `group`, `chip`,
`chipSelected` and `helper`.

## NumberStepper

A whole number changed one step at a time with − and + buttons: a quantity, a group size, a count.

```tsx
import { NumberStepper } from '@academix-admin/forms';

<NumberStepper
  label="People in the group"
  value={size}
  onChange={setSize}
  min={5}
  max={30}
  display={`${size} people`}
  decreaseLabel="Fewer people"
  increaseLabel="More people"
  decreaseIcon={<MinusIcon />}
  increaseIcon={<PlusIcon />}
/>
```

It is a `role="group"` named by its label, with two buttons that have their own names and are
disabled at `min` and `max`. The value sits in an `<output>`, which announces changes.

Props: `value`, `onChange(value)`, `label`, `ariaLabel`, `min`, `max`, `step` (default 1),
`display` (shown instead of the bare number), `decreaseLabel` / `increaseLabel` (default "Decrease"
/ "Increase"), `decreaseIcon` / `increaseIcon` (default − and +), `disabled`, `helperText`,
`className`, `style` and `theme`. The parts (`NumberStepperClassNames`) are `root`, `label`,
`control`, `button`, `decrease`, `increase`, `value` and `helper`.

## Exports

`TextInput`, `SelectField`, `Checkbox`, `RadioGroup`, `ChoiceChips`, `NumberStepper`, and their types: `TextInputProps`, `TextInputClassNames`, `TextInputStatus`, `TextInputKeyboard`, `SelectFieldProps`, `SelectFieldClassNames`, `SelectFieldStatus`, `CheckboxProps`, `CheckboxClassNames`, `RadioGroupProps`, `RadioGroupClassNames`, `RadioOption`, `ChoiceChipsProps`, `ChoiceChipsClassNames`, `ChoiceChipOption`, `NumberStepperProps` and `NumberStepperClassNames`.

## License

MIT
