// Shared status / result codes returned by RPCs + Lambdas (the `status` field on most responses).
// These are the string unions clients switch on. Kept here so DB, web, lambda, and (generated) Dart
// all agree on one taxonomy instead of re-declaring literals. Grow this as functions are inventoried.

/** Region/feature gate result surfaced by public.gate_check (region_block_status + get_feature_status). */
export type GateStatus = 'Region.blocked' | 'Feature.unavailable';

/** Feature-flag checker keys (public.features_table.features_checker). */
export type FeatureKey =
  | 'Features.sign_in' | 'Features.sign_up' | 'Features.sign_up_email' | 'Features.sign_up_phone'
  | 'Features.email_recovery' | 'Features.phone_recovery'
  | 'Features.top_up' | 'Features.withdraw' | 'Features.buy_in' | 'Features.payment'
  | 'Features.quiz_taking' | 'Features.code_search' | 'Features.login_pin' | 'Features.pool_auth'
  | 'Features.academix_quiz_payment'
  | 'Features.submit_topic' | 'Features.submit_category' | 'Features.submit_group' | 'Features.submit_question';

/** Every RPC/Lambda response carries `status` (a domain result code) + `error`. Concrete result unions
 *  live beside each response type in responses.ts; this is the common envelope shape. */
export interface ResultEnvelope<TStatus extends string = string> {
  status: TStatus | null;
  error?: string | null;
}
