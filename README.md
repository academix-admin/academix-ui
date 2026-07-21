# Academix UI

Open-source React libraries extracted from the Academix codebase, published
under the `@academix` scope.

| Package | Description |
| --- | --- |
| [`@academix/navigation-stack`](./packages/navigation-stack) | Client-side navigation stack — transitions, swipe-back, scroll restoration, nested stacks, DI and a request/response bus. |
| [`@academix/state-stack`](./packages/state-stack) | Framework-agnostic cross-tab state — IndexedDB persistence, BroadcastChannel sync, undo/redo, atoms and route-scoped demand state. |
| [`@academix/scroll-date-picker`](./packages/scroll-date-picker) | iOS-style wheel/scroll date picker with magnifier, quick-date shortcuts and theming. Zero deps beyond React. |
| [`@academix/modal-sheet`](./packages/modal-sheet) | Gesture-driven bottom sheet built on Motion — snap detents, keyboard avoidance, compound `Sheet.*` API. |
| [`@academix/search-viewer`](./packages/search-viewer) | Debounced search & selection UI — local + async cursor-paginated sources, loading/empty/error states. |

## Repo layout

```
academix-ui/
├── packages/
│   ├── navigation-stack/   # @academix/navigation-stack
│   └── state-stack/        # @academix/state-stack
├── package.json            # npm workspaces root
├── tsconfig.base.json      # shared TS config
└── .changeset/             # versioning & release
```

## Develop

```bash
npm install          # install all workspaces
npm run build        # build every package (tsup → ESM + CJS + d.ts)
npm run typecheck    # type-check every package
```

Each package builds with [`tsup`](https://tsup.egoist.dev/) to dual ESM/CJS with
generated type declarations, `react`/`react-dom` as peer dependencies, and the
`"use client"` directive preserved for React Server Components.

## Release

Versioning and publishing use [Changesets](https://github.com/changesets/changesets):

```bash
npx changeset            # record intended version bumps
npx changeset version    # apply bumps + update changelogs
npm run release          # build all, then changeset publish
```

Publishing requires an `NPM_TOKEN` with access to the `@academix` org (the root
`.npmrc` reads it from the environment). Packages are published with
`--access public`.

## License

MIT © Academix
