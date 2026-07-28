// RPC / Lambda WIRE CONTRACTS — the exact JSON shapes functions return to clients.
//
// GENERATED from `contracts/contracts.schema.json` (the single, language-neutral source of truth) via
// `npm run gen` (quicktype). The SAME schema also generates the Flutter/Dart models
// (academix-app/lib/domain/academix_contracts.dart), so web + mobile can never drift — `npm run
// verify` (regen + git diff) enforces it in CI.
//
// Do NOT edit generated/contracts.ts by hand. Add/adjust a contract in contracts/contracts.schema.json
// (each key under `definitions` becomes a type; author it from the function's RETURN builder), then
// re-run `npm run gen`. These replace the ~60 hand-mirrored `Backend*` interfaces in academix-web.
export * from './generated/contracts';
