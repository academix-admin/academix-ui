# @academix/search-viewer

A batteries-included **search & selection UI** for React — a debounced search
controller plus a sheet-based results viewer that handles local filtering *and*
async, cursor-paginated queries, with loading / empty / error states built in.

- 🔎 Debounced search with request cancellation (`AbortSignal`)
- 🌐 Local (`onInitialData`) **or** remote (`queryData`) data sources
- 📄 Cursor pagination, de-duplication, online/offline result tagging
- 🧾 First-class loading / no-result / error views
- 🧰 `useSearchController()` to open/close and track state from anywhere
- 📱 Presented in a gesture-driven sheet (via `@academix/modal-sheet`)
- Single & multi-select (`SearchViewer`, `MultipleSearchViewer`, `EachViewer`)

## Install

```bash
npm install @academix/search-viewer
# peer deps (modal-sheet is a direct dependency and installs automatically)
npm install react react-dom motion
```

> Depends on `@academix/modal-sheet` (installed for you) and shares your app's
> `motion` peer.

## Usage

Drive it with the controller hook, then render the viewer:

```tsx
'use client';
import { SearchViewer, useSearchController, type SearchResult } from '@academix/search-viewer';

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
