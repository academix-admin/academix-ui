// @academix-admin/domain-types — single source of truth for Academix domain types.
//
//   import type { Database } from '@academix-admin/domain-types/database';  // generated Supabase rows
//   import type { UserBalanceWire, GateStatus } from '@academix-admin/domain-types';
//
// Layers:
//   database.types.ts  generated from the live schema (`npm run gen:db`) — table Row/Insert/Update +
//                      function Args. jsonb-returning RPCs are opaque `Json` here (see responses.ts).
//   responses.ts       hand-authored RPC/Lambda wire contracts (the real response shapes).
//   enums.ts           shared status/result codes + feature keys.

export type { Database, Json } from './database.types';
export * from './responses';
export * from './enums';
