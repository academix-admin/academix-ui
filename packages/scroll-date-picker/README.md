# @academix/scroll-date-picker

A smooth, touch-friendly **wheel / scroll date picker** for React — iOS-style
spinning columns with an optional magnifier, quick "Today / Yesterday" shortcuts,
and full theming. Zero dependencies beyond React.

## Install

```bash
npm install @academix/scroll-date-picker
npm install react react-dom
```

## Usage

```tsx
'use client';
import CustomScrollDatePicker from '@academix/scroll-date-picker';

export default function Example() {
  return (
    <CustomScrollDatePicker
      onChange={(date) => console.log(date)}
      quickDate
      useMagnifier
      height={240}
      minYear={1950}
      maxYear={2035}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onChange` | `(date: Date) => void` | — | **Required.** Called whenever the selected date changes. |
| `startFromDate` | `Date \| null` | today | Initial selected date. |
| `defaultDate` | `boolean` | — | Start from the default (today) date. |
| `quickDate` | `boolean` | — | Show quick "Today / Yesterday" shortcuts. |
| `minDate` / `maxDate` | `Date` | — | Clamp selectable range. |
| `minYear` / `maxYear` | `number` | — | Bound the year column. |
| `height` | `number` | — | Picker height in px. |
| `itemExtent` | `number` | — | Row height for each wheel item. |
| `textSize` | `number` | — | Font size of items. |
| `useMagnifier` | `boolean` | — | Enable the center magnifier lens. |
| `magnification` | `number` | — | Magnifier zoom factor. |
| `opacity` | `number` | — | Opacity falloff for off-center items. |
| `backgroundColor` | `string` | — | Picker background. |
| `primaryTextColor` | `string` | — | Selected item color. |
| `secondaryTextColor` | `string` | — | Unselected item color. |
| `todayText` / `yesterdayText` | `string` | — | Labels for the quick shortcuts. |
| `formatMonthsNames` | `((monthIndex: number) => string) \| string` | — | Custom month labels / locale. |
| `id` | `string` | — | Optional element id. |

The `CustomScrollDatePickerProps` type is exported for convenience.

## SSR / Next.js

Client-only (ships the `"use client"` directive). Import it from a client
component.

## License

MIT © Academix
