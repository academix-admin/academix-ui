import { createContext, useContext, useRef, useState } from 'react';
import NavigationStack, { ColumnBody, useLocation, useNav } from '@academix-admin/navigation-stack';
import { AppShell, useAppShell, useAppShellBar, type AppShellTab } from '@academix-admin/app-shell';

/**
 * A SHOP IN AN APP SHELL — the whole frame from one component, and the things that have broken on
 * real phones, on purpose:
 *
 *   - Stock → a product → its form: three pages deep. Change tab and come back; it kept its place.
 *     Tap Stock again: back to the first page.
 *   - The form's "Add" waits, then puts the cursor back in its box from code — what a till does after
 *     an item is added. On iOS that raises no keyboard, and the tab bar must stay.
 *   - "Full screen" hides the tab bar and the sidebar; the pages stay where they were.
 *   - A pill that rides on the tab bar (`useAppShellBar`).
 *
 * Wider than 800px it is a sidebar instead of a tab bar. `e2e/app-shell.spec.ts` runs all of it in
 * WebKit (iPhone) and Chromium (Android).
 */

function Screen({ title, children, back = true }: { title: string; children?: React.ReactNode; back?: boolean }) {
  const nav = useNav();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--ax-shell-bg)' }}>
      <header style={{ background: '#0b6252', color: '#fff', padding: '12px 16px', flex: 'none' }}>
        {back && (
          <button onClick={() => void nav.pop()} style={{ background: 'transparent', border: 0, color: '#fff', font: 'inherit', padding: 0 }}>
            ‹ Back
          </button>
        )}
        <h2 style={{ margin: back ? '6px 0 0' : 0, fontSize: 18 }}>{title}</h2>
      </header>
      <ColumnBody>
        <div style={{ padding: 16 }}>{children}</div>
      </ColumnBody>
    </div>
  );
}

const row: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left', padding: '14px 12px', border: '1px solid #dde1e0',
  borderRadius: 10, background: '#fff', marginBottom: 8, font: 'inherit',
};

function StockList() {
  const nav = useNav();
  const { setActive, immersive } = useAppShell();
  const setFull = useContext(FullScreen);
  return (
    <Screen title="Stock" back={false}>
      <button style={row} onClick={() => setFull(!immersive)}>{immersive ? 'Leave full screen' : 'Full screen'}</button>
      <button style={row} onClick={() => setActive('people')}>Go to People</button>
      {Array.from({ length: 40 }, (_, i) => (
        <button key={i} style={row} onClick={() => void nav.push('product', { name: `Product ${i + 1}` })}>
          Product {i + 1}
        </button>
      ))}
    </Screen>
  );
}

function Product() {
  const nav = useNav();
  const name = useLocation()?.params?.name as string | undefined;
  return (
    <Screen title={name ?? 'Product'}>
      <button style={row} onClick={() => void nav.push('sell', { name })}>Sell some →</button>
    </Screen>
  );
}

function Sell() {
  const name = useLocation()?.params?.name as string | undefined;
  const box = useRef<HTMLInputElement | null>(null);
  const [added, setAdded] = useState<string[]>([]);
  return (
    <Screen title={`Sell ${name ?? ''}`}>
      <label style={{ display: 'block', marginBottom: 8 }}>
        How many
        <input ref={box} aria-label="How many" inputMode="numeric" style={{ display: 'block', width: '100%', padding: 12, font: 'inherit', boxSizing: 'border-box' }} />
      </label>
      <button
        style={row}
        onClick={async () => {
          setAdded((a) => [...a, box.current?.value || '1']);
          if (box.current) box.current.value = '';
          // As a till does: the item is saved, THEN the cursor goes back in the box — from code.
          await new Promise((r) => setTimeout(r, 300));
          box.current?.focus();
        }}
      >
        Add
      </button>
      <p aria-live="polite">{added.length} added</p>
    </Screen>
  );
}

function PeopleList() {
  const nav = useNav();
  return (
    <Screen title="People" back={false}>
      {Array.from({ length: 25 }, (_, i) => (
        <button key={i} style={row} onClick={() => void nav.push('person', { name: `Customer ${i + 1}` })}>
          Customer {i + 1}
        </button>
      ))}
    </Screen>
  );
}

function Person() {
  const name = useLocation()?.params?.name as string | undefined;
  return <Screen title={name ?? 'Customer'} />;
}

/** A pill on the tab bar's line that moves with it. */
function Total() {
  const bar = useAppShellBar();
  const above = bar && !bar.hidden ? bar.height : '0px';
  return (
    <div
      data-testid="total"
      data-bar={bar ? (bar.hidden ? 'hidden' : 'shown') : 'unknown'}
      style={{
        position: 'absolute', right: 16, bottom: `calc(${above} + 16px)`, zIndex: 30, padding: '10px 14px',
        borderRadius: 999, background: '#0b6252', color: '#fff', fontWeight: 600, transition: 'bottom 200ms',
      }}
    >
      ₦12,000
    </div>
  );
}

/** Full screen is the app's to decide; the shell is told through `immersive`. */
const FullScreen = createContext<(on: boolean) => void>(() => {});

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d={d} />
  </svg>
);

const tabs: AppShellTab[] = [
  {
    id: 'stock', label: 'Stock', icon: icon('M3 7h18M3 12h18M3 17h18'),
    stack: <NavigationStack id="stock" navLink={{ stock: StockList, product: Product, sell: Sell }} entry="stock" transition="slide" syncHistory />,
  },
  {
    id: 'people', label: 'People', icon: icon('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a8 8 0 0 1 16 0'),
    stack: <NavigationStack id="people" navLink={{ people: PeopleList, person: Person }} entry="people" transition="slide" syncHistory />,
  },
];

export default function App() {
  const [full, setFull] = useState(false);
  return (
    <FullScreen.Provider value={setFull}>
    <AppShell
      id="demo"
      tabs={tabs}
      immersive={full}
      persist={false}
      logo={<strong style={{ color: '#0b6252' }}>Shop</strong>}
      navigationBar={{ floatingButton: icon('M3 6h18M3 12h18M3 18h18') }}
    >
      <Total />
    </AppShell>
    </FullScreen.Provider>
  );
}
