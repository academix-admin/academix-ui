import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChoiceChips, NumberStepper } from '../src/index';

const AMOUNTS = [
  { value: 'a', label: 'One' },
  { value: 'b', label: 'Two', disabled: true },
  { value: 'c', label: 'Three' },
];

function Chips({ initial = null as string | null, onChange = (_: string) => {} }) {
  const [v, setV] = useState<string | null>(initial);
  return <ChoiceChips label="Amount" options={AMOUNTS} value={v} onChange={(x) => { setV(x); onChange(x); }} classNames={{ chip: 'chip', chipSelected: 'on', helper: 'help' }} helperText="Pick one" />;
}

describe('ChoiceChips', () => {
  it('is a named radio group of radio buttons, with the selection checked', () => {
    render(<Chips initial="c" />);
    expect(screen.getByRole('radiogroup', { name: 'Amount' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Three' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'One' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: 'Three' })).toHaveClass('chip', 'on');
    expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription('Pick one');
  });
  it('one chip is in the tab order: the selected one, or the first enabled one', () => {
    const { unmount } = render(<Chips initial="c" />);
    expect(screen.getByRole('radio', { name: 'Three' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('radio', { name: 'One' })).toHaveAttribute('tabindex', '-1');
    unmount();
    render(<Chips />);
    expect(screen.getByRole('radio', { name: 'One' })).toHaveAttribute('tabindex', '0');
  });
  it('a click selects; the arrow keys move and select, skipping disabled chips and wrapping', () => {
    const changed = vi.fn();
    render(<Chips onChange={changed} />);
    fireEvent.click(screen.getByRole('radio', { name: 'One' }));
    expect(changed).toHaveBeenLastCalledWith('a');
    fireEvent.keyDown(screen.getByRole('radio', { name: 'One' }), { key: 'ArrowRight' });
    expect(changed).toHaveBeenLastCalledWith('c');
    expect(screen.getByRole('radio', { name: 'Three' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Three' }), { key: 'ArrowRight' });
    expect(changed).toHaveBeenLastCalledWith('a');
    fireEvent.keyDown(screen.getByRole('radio', { name: 'One' }), { key: 'End' });
    expect(changed).toHaveBeenLastCalledWith('c');
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Three' }), { key: 'Home' });
    expect(changed).toHaveBeenLastCalledWith('a');
  });
  it('numbers work as values', () => {
    const changed = vi.fn();
    render(<ChoiceChips<number> ariaLabel="Size" options={[{ value: 5, label: '5' }, { value: 10, label: '10' }]} value={5} onChange={changed} />);
    fireEvent.click(screen.getByRole('radio', { name: '10' }));
    expect(changed).toHaveBeenCalledWith(10);
    expect(screen.getByRole('radiogroup', { name: 'Size' })).toBeInTheDocument();
  });
});

function Stepper() {
  const [n, setN] = useState(5);
  return <NumberStepper label="People" value={n} onChange={setN} min={5} max={7} display={`${n} people`} decreaseLabel="Fewer people" increaseLabel="More people" helperText="5 to 7" classNames={{ button: 'b', decrease: 'dec', increase: 'inc', value: 'v' }} />;
}

describe('NumberStepper', () => {
  it('is a named group with two named buttons and the value shown', () => {
    render(<Stepper />);
    expect(screen.getByRole('group', { name: 'People' })).toHaveAccessibleDescription('5 to 7');
    expect(screen.getByRole('button', { name: 'Fewer people' })).toHaveClass('b', 'dec');
    expect(screen.getByRole('button', { name: 'More people' })).toHaveClass('b', 'inc');
    expect(screen.getByRole('status')).toHaveTextContent('5 people');
  });
  it('steps within min and max, and disables the button at each end', () => {
    render(<Stepper />);
    const less = screen.getByRole('button', { name: 'Fewer people' });
    const more = screen.getByRole('button', { name: 'More people' });
    expect(less).toBeDisabled();
    fireEvent.click(more);
    fireEvent.click(more);
    expect(screen.getByRole('status')).toHaveTextContent('7 people');
    expect(more).toBeDisabled();
    fireEvent.click(less);
    expect(screen.getByRole('status')).toHaveTextContent('6 people');
  });
  it('defaults: step 1, "Decrease" / "Increase", the bare number', () => {
    const changed = vi.fn();
    render(<NumberStepper ariaLabel="Count" value={2} onChange={changed} step={2} />);
    fireEvent.click(screen.getByRole('button', { name: 'Increase' }));
    expect(changed).toHaveBeenCalledWith(4);
    expect(screen.getByRole('group', { name: 'Count' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('2');
  });
});
