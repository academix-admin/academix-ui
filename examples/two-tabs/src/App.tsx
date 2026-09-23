import { useMemo, useState } from 'react';
import NavigationStack, { GroupNavigationStack, useLocation, useNav } from '@academix-admin/navigation-stack';

/**
 * TWO TABS THAT REMEMBER WHERE YOU WERE.
 *
 * The thing to try, because it is the thing that cannot be described:
 *
 *   1. In Stock, open a product, then open its history. You are three pages deep.
 *   2. Scroll the long list on that page a long way down.
 *   3. Switch to People. Open somebody.
 *   4. Come back to Stock.
 *
 * You are still three pages deep, and still scrolled to where you were. Then press the browser's
 * Back button: it pops one page of THIS tab, and never jumps to the other one.
 *
 * A router cannot do that, because a route is an address and this is a place.
 */

/* ── Pages ──────────────────────────────────────────────────────────────────────── */

function Screen({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  const nav = useNav();
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#fff' }}>
      <header style={{ position: 'sticky', top: 0, background: '#0b6252', color: '#fff', padding: '14px 16px' }}>
        <button
          onClick={() => void nav.pop()}
          style={{ background: 'transparent', border: 0, color: '#fff', font: 'inherit', cursor: 'pointer', padding: 0 }}
        >
          ‹ Back
        </button>
        <h2 style={{ margin: '6px 0 0', fontSize: 18 }}>{title}</h2>
        {subtitle && <p style={{ margin: 0, opacity: 0.8, fontSize: 13 }}>{subtitle}</p>}
      </header>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

const row: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left', padding: '14px 12px',
  border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', marginBottom: 8,
  font: 'inherit', cursor: 'pointer',
};

function StockList() {
  const nav = useNav();
  return (
    <Screen title="Stock" subtitle="Open one, then scroll its history">
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
  // Params arrive through the location. (They are also spread as props, so `function Product({ name })`
  // works — but reading them here keeps a page honest about where its inputs come from.)
  const name = useLocation()?.params?.name as string | undefined;
  return (
    <Screen title={name ?? 'Product'} subtitle="Two pages deep">
      <button style={row} onClick={() => void nav.push('history', { name })}>
        Open its history →
      </button>
    </Screen>
  );
}

function History() {
  const name = useLocation()?.params?.name as string | undefined;
  return (
    <Screen title="History" subtitle={`${name ?? ''} — scroll down, then change tab and come back`}>
      {Array.from({ length: 120 }, (_, i) => (
        <div key={i} style={{ ...row, cursor: 'default' }}>
          Entry {i + 1} — the scroll position here is remembered per entry
        </div>
      ))}
    </Screen>
  );
}

function PeopleList() {
  const nav = useNav();
  return (
    <Screen title="People" subtitle="A second tab, with a stack of its own">
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
  return <Screen title={name ?? 'Customer'} subtitle="Now go back to Stock — it kept its place" />;
}

/* ── The two stacks, and the group that holds them ──────────────────────────────── */

const TABS = [
  { id: 'stock', label: 'Stock' },
  { id: 'people', label: 'People' },
];

export default function App() {
  const [current, setCurrent] = useState('stock');

  // A Map of tab id → the stack for that tab. Built once: rebuilding it would rebuild the stacks.
  const navStack = useMemo(
    () =>
      new Map<string, React.ReactElement>([
        [
          'stock',
          <NavigationStack
            key="stock"
            id="stock"
            navLink={{ stock: StockList, product: Product, history: History }}
            entry="stock"
            transition="slide"
            syncHistory
            persist
          />,
        ],
        [
          'people',
          <NavigationStack
            key="people"
            id="people"
            navLink={{ people: PeopleList, person: Person }}
            entry="people"
            transition="slide"
            syncHistory
            persist
          />,
        ],
      ]),
    [],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', font: '15px system-ui, sans-serif' }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <GroupNavigationStack id="main" navStack={navStack} current={current} onCurrentChange={setCurrent} persist />
      </div>

      <nav style={{ display: 'flex', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setCurrent(t.id)}
            style={{
              flex: 1, padding: '12px 0', border: 0, font: 'inherit', cursor: 'pointer',
              background: 'transparent',
              color: current === t.id ? '#0b6252' : '#6b7280',
              fontWeight: current === t.id ? 600 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
