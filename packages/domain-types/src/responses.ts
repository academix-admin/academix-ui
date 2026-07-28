// RPC / Lambda WIRE CONTRACTS — the exact JSON shapes functions return to clients.
//
// These are NOT table rows: most RPCs `RETURN jsonb` (opaque `Json` in database.types.ts) built with
// jsonb_build_object, often nesting a `*_details` object under a `status`/`error` envelope, plus
// computed fields that exist in no table. Today each shape is hand-mirrored as a `Backend*` interface
// inside academix-web's 27 model files (and again in the Flutter app). This module consolidates them
// into ONE definition, verified against the function bodies, so web + lambda + desktop share it and
// Dart models generate from it.
//
// Convention: `<Domain>Wire` = the inner details object (snake_case, matches jsonb_build_object keys).
// The web class model wraps it (camelCase + behavior). Verified against the deployed function's
// RETURN builder — cite the source function in a comment.

import type { ResultEnvelope } from './enums';

// ── wallet ─────────────────────────────────────────────────────────────────────────────────────
// public.get_user_balance → jsonb_build_object('users_id', 'users_balance_amount', 'users_balance_updated_at')
export interface UserBalanceWire {
  users_id: string;
  users_balance_amount: number;
  users_balance_updated_at: string;
}
export type GetUserBalanceResponse = ResultEnvelope & { user_balance_details: UserBalanceWire | null };

// NOTE (migration): remaining wire contracts (transactions, engagement, achievements, missions,
// streaks, quiz-topic/pool, payment method/profile/wallet, redeem/giveback, roles, profile, …) are
// added here one domain at a time — each lifted from its RPC/Lambda RETURN builder and cross-checked
// against the current academix-web `Backend*` interface before that model is thinned to import from here.
