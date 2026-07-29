/**
 * SINGLE SOURCE for Academix RPC/Lambda wire contracts. Each key under `definitions` is a
 * wire type (the key IS the generated type name — kept identical to academix-web's current
 * `Backend*` interfaces so the generated types are drop-in). Author each shape from its
 * function's RETURN builder. The root references the top-level ones so the generator emits
 * every reachable type. Regenerate TS + Dart with `npm run gen`.
 */
export interface AcademixContracts {
    backendDailyPerformance?:    BackendDailyPerformance;
    backendDailyStreaksModel?:   BackendDailyStreaksModel;
    backendTransactionModel?:    BackendTransactionModel;
    backendUserBalanceModel?:    BackendUserBalanceModel;
    backendUserEngagementModel?: BackendUserEngagementModel;
    getUserBalanceResponse?:     GetUserBalanceResponse;
}

/**
 * get_user_daily_performance -> daily_performance_details
 */
export interface BackendDailyPerformance {
    daily_performance_for_earning: number;
    daily_performance_for_quiz:    number;
}

/**
 * claim_user_streaks / get_user_streaks -> daily_streaks_details
 */
export interface BackendDailyStreaksModel {
    daily_streaks_awarded:     number;
    daily_streaks_count:       number;
    daily_streaks_created_at?: null | string;
    daily_streaks_date:        string;
    daily_streaks_date_number: number;
    daily_streaks_max:         number;
    daily_streaks_reached:     boolean;
    daily_streaks_status:      string;
    redeem_code_details?:      BackendRewardRedeemCodeModel | null;
}

export interface BackendRewardRedeemCodeModel {
    redeem_code_expires?: null | string;
    redeem_code_id?:      null | string;
    redeem_code_value?:   null | string;
}

/**
 * fetch_user_transactions / fetch_user_transaction_by_id transaction row
 */
export interface BackendTransactionModel {
    payment_profile_receiver_details?: BackendPaymentProfileDetails | null;
    payment_profile_sender_details?:   BackendPaymentProfileDetails | null;
    pools_id?:                         null | string;
    sort_created_id:                   string;
    transaction_created_at:            string;
    transaction_fee:                   number;
    transaction_id:                    string;
    transaction_receiver_amount:       number;
    transaction_receiver_rate:         number;
    transaction_receiver_status:       string;
    transaction_sender_amount:         number;
    transaction_sender_rate:           number;
    transaction_sender_reference:      string;
    transaction_sender_status:         string;
    transaction_type:                  string;
}

export interface BackendPaymentProfileDetails {
    payment_method_details: BackendPaymentMethodDetails;
    payment_wallet_details: BackendPaymentWalletDetails;
    users_details:          BackendUserDetails;
}

export interface BackendPaymentMethodDetails {
    payment_method_checker:  string;
    payment_method_id:       string;
    payment_method_identity: string;
}

export interface BackendPaymentWalletDetails {
    payment_wallet_currency: string;
    payment_wallet_id:       string;
    payment_wallet_identity: string;
}

export interface BackendUserDetails {
    payment_details?: BackendPaymentDetails | null;
    users_id?:        null | string;
    users_names:      string;
}

/**
 * payment profile detail fields (all optional/nullable)
 */
export interface BackendPaymentDetails {
    account_number?:  null | string;
    bank_name?:       null | string;
    country?:         null | string;
    direct_debit?:    boolean | null;
    e_naira?:         boolean | null;
    email?:           null | string;
    fullname?:        null | string;
    network?:         null | string;
    opay?:            boolean | null;
    phone?:           null | string;
    private_account?: boolean | null;
}

/**
 * public.get_user_balance -> user_balance_details
 */
export interface BackendUserBalanceModel {
    users_balance_amount:     number;
    users_balance_updated_at: string;
    users_id:                 string;
}

/**
 * get_user_engagement -> user_engagement_details
 */
export interface BackendUserEngagementModel {
    user_engagement_progress_points_details: BackendHomeEngagementProgress;
    user_engagement_progress_questions:      number;
    user_engagement_progress_quiz_count:     number;
    user_engagement_progress_time:           number;
    user_engagement_progress_win_count:      number;
    user_engagement_total_questions:         number;
    user_engagement_total_time:              number;
}

export interface BackendHomeEngagementProgress {
    current_points:                  number;
    current_progress_percent:        number;
    engagement_levels_id:            number;
    engagement_levels_identity:      string;
    next_engagement_levels_id:       number;
    next_engagement_levels_identity: string;
    points_to_next_level:            number;
}

/**
 * public.get_user_balance response envelope
 */
export interface GetUserBalanceResponse {
    error?:               null | string;
    status:               null | string;
    user_balance_details: BackendUserBalanceModel | null;
}
