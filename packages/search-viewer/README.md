# @academix-admin/search-viewer

A batteries-included **search & selection UI** for React — a debounced search
controller plus a sheet-based results viewer that handles local filtering *and*
async, cursor-paginated queries, with loading / empty / error states built in.

- 🔎 Debounced search with request cancellation (`AbortSignal`)
- 🌐 Local (`onInitialData`) **or** remote (`queryData`) data sources
- 📄 Cursor pagination, de-duplication, online/offline result tagging
- 🧾 First-class loading / no-result / error views
- 🧰 `useSearchController()` to open/close and track state from anywhere
- 📱 Presented in a gesture-driven sheet (via `@academix-admin/modal-sheet`)
- Single & multi-select (`SearchViewer`, `MultipleSearchViewer`, `EachViewer`)

## Install

```bash
npm install @academix-admin/search-viewer
# peer deps (modal-sheet is a direct dependency and installs automatically)
npm install react react-dom motion
```

> Depends on `@academix-admin/modal-sheet` (installed for you) and shares your app's
> `motion` peer.

## Usage

Drive it with the controller hook, then render the viewer:

```tsx
'use client';
import { SearchViewer, useSearchController, type SearchResult } from '@academix-admin/search-viewer';

type Friend = { id: string; name: string };
type Cursor = { page: number };

export default function FriendSearch() {
  const [searchId, search, isOpen, searchState] = useSearchController();

  return (
    <>
      <button onClick={search.open}>Search friends</button>

      <SearchViewer<Friend, Cursor>
        isOpen={isOpen}
        onClose={search.close}
        searchState={searchState}
        debounceMs={300}
        searchProp={{ text: 'Search friends', textColor: '#111' }}
        // Remote, cursor-paginated source with cancellation:
        queryData={async (cursor, text, signal) => {
          const res = await fetch(
            `/api/friends?q=${text}&page=${cursor?.page ?? 0}`,
            { signal },
          );
          const json = await res.json();
          return { data: json.items, nextCursor: json.next, hasMore: json.hasMore };
        }}
        onRemoveDuplicateBy={(f) => f.id}
      >
        {({ results }: { results: SearchResult<Friend>[] }) =>
          results.map((r) => <div key={r.data.id}>{r.data.name}</div>)
        }
      </SearchViewer>
    </>
  );
}
```

For a purely local list, provide `onInitialData` instead of `queryData`:

```tsx
<SearchViewer<Friend>
  isOpen={isOpen}
  onClose={search.close}
  onInitialData={(text) =>
    allFriends.filter((f) => f.name.toLowerCase().includes(text.toLowerCase()))
  }
  localDataDeps={[allFriends]}
>
  {/* render results */}
</SearchViewer>
```

## Composable sections: `Row` / `Column`

For sectioned results (e.g. one horizontally-scrolling shelf per topic/category), compose
`Row`s inside a `Column` as `SearchViewer`'s `children`. Today's flat `children` usage is,
unchanged, an implicit `Column` with no `Row`s — `Column`'s default layout is identical to
that existing vertical flow.

```tsx
<SearchViewer isOpen={isOpen} onClose={search.close} searchProp={{ text: 'Search', textColor: '#111' }}>
  <Column>
    <h3>Trending</h3>
    <Row queryData={fetchTrending} onRemoveDuplicateBy={(f) => f.id}>
      {({ results }) => results.map((r) => <FriendCard key={r.data.id} friend={r.data} />)}
    </Row>

    <h3>Nearby</h3>
    <Row queryData={fetchNearby} onRemoveDuplicateBy={(f) => f.id}>
      {({ results }) => results.map((r) => <FriendCard key={r.data.id} friend={r.data} />)}
    </Row>
  </Column>
</SearchViewer>
```

Each `Row` is independently paginating (triggers `queryData` for its next page as it's
scrolled horizontally near its end) and reads the live search text automatically — no
`containerRef` or manual wiring needed. `Column` collects every `Row`'s state and reports
one cumulative state up to `SearchViewer`, so `loadingProp` / `noResultProp` / `errorProp`
react automatically: no result from ANY row → the outer no-result view; any row still
loading (and none have data yet) → the outer loading view; and so on. `Column`s can also
nest inside each other — an inner `Column` reports up exactly like a `Row` would.

## `useSearchController(initialState?)`

Returns a tuple `[searchId, operations, isOpen, searchState]`:

| Element | Type | Description |
|---------|------|-------------|
| `searchId` | `string` | Stable unique id for this search instance. |
| `operations` | `{ open, close, toggle, setSearchState }` | Imperative controls. |
| `isOpen` | `boolean` | Whether the viewer is open. |
| `searchState` | `SearchState` | Current lifecycle state. |

## Key `SearchViewer` props

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` / `onClose` | `boolean` / `() => void` | **Required.** Open state + close handler. |
| `queryData` | `(cursor, text, signal?) => Promise<QueryResult<T, C>>` | Async, cursor-paginated source. |
| `onInitialData` | `(text: string) => T[]` | Synchronous local source. |
| `localDataDeps` | `DependencyList` | Recompute local data when these change. |
| `debounceMs` | `number` | Debounce for input → query. |
| `onRemoveDuplicateBy` | `(item: T) => any` | Key selector for de-duplication. |
| `onResult` | `(results: SearchResult<T>[]) => void` | Observe result changes. |
| `searchProp` | `SearchProps` | Search bar text, icons, colors, styling. |
| `loadingProp` / `noResultProp` / `errorProp` | — | Custom state views. |
| `layoutProp` | `LayoutProps` | Sheet/header layout + theming. |
| `childrenDirection` | `'vertical' \| 'horizontal'` | Result flow direction. |
| `unmountOnClose` | `boolean` | Unmount contents when closed. |
| `zIndex` / `maxHeight` / `minHeight` | — | Presentation sizing. |

`MultipleSearchViewer` and `EachViewer` build on the same engine for multi-select
and composed layouts. Types (`SearchResult`, `SearchViewerProps`, …) are exported.

## License

MIT © Academix
