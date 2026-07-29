/**
 * SINGLE SOURCE for Academix RPC/Lambda wire contracts. Each key under `definitions` is a
 * wire type (the key IS the generated type name — kept identical to academix-web's current
 * `Backend*` interfaces so the generated types are drop-in). Author each shape from its
 * function's RETURN builder. The root references the top-level ones so the generator emits
 * every reachable type. Regenerate TS + Dart with `npm run gen`.
 */
export interface AcademixContracts {
    backendAchievementsData?:          BackendAchievementsData;
    backendAchievementsModel?:         BackendAchievementsModel;
    backendBuyPaymentWalletModel?:     BackendBuyPaymentWalletModel;
    backendChallengeConfigRoot?:       { [key: string]: BackendChallengeConfig };
    backendDailyPerformance?:          BackendDailyPerformance;
    backendDailyStreaksModel?:         BackendDailyStreaksModel;
    backendFriendsModel?:              BackendFriendsModel;
    backendGiveBackModel?:             BackendGiveBackModel;
    backendMissionData?:               BackendMissionData;
    backendMissionModel?:              BackendMissionModel;
    backendPaymentCompletionData?:     BackendPaymentCompletionData;
    backendPaymentMethodModel?:        BackendPaymentMethodModel;
    backendPaymentProfileModel?:       BackendPaymentProfileModel;
    backendPoolMemberModel?:           BackendPoolMemberModel;
    backendPoolQuestion?:              BackendPoolQuestion;
    backendQuizHistory?:               BackendQuizHistory;
    backendRedeemCodeModel?:           BackendRedeemCodeModel;
    backendRewardClaimModel?:          BackendRewardClaimModel;
    backendRolesActivationData?:       BackendRolesActivationData;
    backendSellPaymentWalletModel?:    BackendSellPaymentWalletModel;
    backendTransactionModel?:          BackendTransactionModel;
    backendUserBalanceModel?:          BackendUserBalanceModel;
    backendUserData?:                  BackendUserData;
    backendUserDisplayQuizTopicModel?: BackendUserDisplayQuizTopicModel;
    backendUserEngagementModel?:       BackendUserEngagementModel;
    getUserBalanceResponse?:           GetUserBalanceResponse;
}

/**
 * get_user_achievements_count
 */
export interface BackendAchievementsData {
    achievements_completed:    number;
    achievements_count:        number;
    achievements_finished:     number;
    achievements_not_rewarded: number;
}

/**
 * fetch_user_achievements / claim_user_achievements achievement row
 */
export interface BackendAchievementsModel {
    achievements_description:       string;
    achievements_id:                string;
    achievements_image?:            null | string;
    achievements_progress_details?: BackendAchievementsProgressDetails | null;
    achievements_requirement:       AchievementsRequirement;
    achievements_title:             string;
    achievements_type:              string;
    reward_details?:                BackendRewardDetails | null;
    sort_created_id:                number;
}

export interface BackendAchievementsProgressDetails {
    achievements_progress_completed:   boolean;
    achievements_progress_count:       number;
    achievements_progress_created_at?: null | string;
    achievements_progress_id?:         null | string;
    achievements_progress_required:    number;
    achievements_progress_rewarded:    boolean;
    achievements_progress_updated_at?: null | string;
    redeem_code_details?:              BackendRewardRedeemCodeModel | null;
}

export interface BackendRewardRedeemCodeModel {
    redeem_code_expires?: null | string;
    redeem_code_id?:      null | string;
    redeem_code_value?:   null | string;
}

export interface AchievementsRequirement {
    count: number;
}

export interface BackendRewardDetails {
    reward_id:          string;
    reward_instruction: string;
    reward_limit:       number;
    reward_type:        string;
    reward_value:       number;
}

/**
 * fetch_top_up_wallets / fetch_user_top_up_wallet row
 */
export interface BackendBuyPaymentWalletModel {
    payment_wallet_buy_fee:       number;
    payment_wallet_buy_fee_flat:  number;
    payment_wallet_buy_min:       number;
    payment_wallet_buy_rate:      number;
    payment_wallet_buy_rate_type: string;
    payment_wallet_currency:      string;
    payment_wallet_id:            string;
    payment_wallet_identity:      string;
    payment_wallet_image?:        null | string;
    sort_created_id:              string;
}

export interface BackendChallengeConfig {
    challenge_options:  BackendChallengeOption[];
    game_mode_checker:  string;
    game_mode_identity: string;
}

export interface BackendChallengeOption {
    challenge_bot_share:          number;
    challenge_creator_share:      number;
    challenge_development_charge: number;
    challenge_identity:           string;
    challenge_max_participants:   number;
    challenge_mid_share:          number;
    challenge_min_participants:   number;
    challenge_price:              number;
    challenge_question_count:     number;
    challenge_reviewer_share:     number;
    challenge_role_share:         { [key: string]: number };
    challenge_top_share:          number;
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

/**
 * fetch_friends row
 */
export interface BackendFriendsModel {
    sort_created_id:       string;
    users_created_at:      string;
    users_id:              string;
    users_image?:          null | string;
    users_names:           string;
    users_referred_status: string;
    users_username:        string;
}

/**
 * get_give_back_code / claim_giveback_code
 */
export interface BackendGiveBackModel {
    giveback_collection_details?: BackendGiveBackCollectionDetails | null;
    giveback_detail:              BackendGiveBackDetail;
}

export interface BackendGiveBackCollectionDetails {
    can_claim:          boolean;
    has_claimed:        boolean;
    has_password:       boolean;
    is_spent:           boolean;
    redeem_code_value?: null | string;
    remaining_slots:    number;
}

export interface BackendGiveBackDetail {
    claimed_count:         number;
    giveback_code:         string;
    giveback_id:           string;
    giveback_identifier?:  null | string;
    giveback_total_amount: number;
    giveback_total_usage:  number;
    giveback_unit_amount:  number;
    redeem_rule_bot:       boolean;
    redeem_rule_mid:       boolean;
    redeem_rule_rank1:     boolean;
    redeem_rule_rank2:     boolean;
    redeem_rule_rank3:     boolean;
    redeem_rule_top:       boolean;
    remaining_slots:       number;
    sort_created_id:       string;
}

/**
 * get_user_missions_count
 */
export interface BackendMissionData {
    mission_completed:    number;
    mission_count:        number;
    mission_finished:     number;
    mission_not_rewarded: number;
}

/**
 * fetch_user_missions / claim_user_mission mission row
 */
export interface BackendMissionModel {
    mission_description:       string;
    mission_id:                string;
    mission_image?:            null | string;
    mission_progress_details?: BackendMissionProgressDetails | null;
    mission_requirement:       MissionRequirement;
    mission_title:             string;
    mission_type:              string;
    reward_details?:           BackendRewardDetails | null;
    sort_created_id:           number;
}

export interface BackendMissionProgressDetails {
    mission_progress_completed:   boolean;
    mission_progress_count:       number;
    mission_progress_created_at?: null | string;
    mission_progress_id?:         null | string;
    mission_progress_required:    number;
    mission_progress_rewarded:    boolean;
    mission_progress_updated_at?: null | string;
    redeem_code_details?:         BackendRewardRedeemCodeModel | null;
}

export interface MissionRequirement {
    count: number;
}

/**
 * make_payment completion payload (top-up/withdraw instructions)
 */
export interface BackendPaymentCompletionData {
    account?:   null | string;
    amount?:    number | null;
    bank?:      null | string;
    code?:      null | string;
    expire?:    null | string;
    link?:      null | string;
    note?:      null | string;
    reference?: null | string;
}

/**
 * fetch_top_up_methods / fetch_withdraw_methods row
 */
export interface BackendPaymentMethodModel {
    country_id:                   string;
    country_identity:             string;
    country_phone_code:           string;
    country_phone_digit:          number;
    payment_method_buy_active:    boolean;
    payment_method_buy_multiple:  boolean;
    payment_method_checker:       string;
    payment_method_id:            string;
    payment_method_identity:      string;
    payment_method_image?:        null | string;
    payment_method_network:       BackendPaymentNetworkModel[];
    payment_method_sell_active:   boolean;
    payment_method_sell_multiple: boolean;
    payment_wallet_id:            string;
    sort_created_id:              string;
}

export interface BackendPaymentNetworkModel {
    active:   boolean;
    identity: string;
    image?:   null | string;
}

/**
 * fetch_top_up_profiles / fetch_withdraw_profiles row
 */
export interface BackendPaymentProfileModel {
    payment_details?:   BackendPaymentDetails | null;
    payment_method_id:  string;
    payment_profile_id: string;
    sort_created_id:    string;
    users_id:           string;
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
 * fetch_pool_members row
 */
export interface BackendPoolMemberModel {
    challenge_question_count:              number;
    pools_completed_question_tracker_size: number;
    pools_completed_question_tracker_time: number;
    pools_id:                              string;
    pools_members_created_at:              string;
    pools_members_id:                      string;
    pools_members_is_user:                 boolean;
    pools_members_paid_amount?:            number | null;
    pools_members_points:                  number;
    pools_members_price:                   number;
    pools_members_rank:                    number;
    sort_created_id:                       string;
    users_details:                         BackendPoolUserDetails;
}

/**
 * pool-member users_details (distinct from the transaction BackendUserDetails)
 */
export interface BackendPoolUserDetails {
    roles_details:  BackendUserRoleDetails;
    users_id:       string;
    users_image?:   null | string;
    users_names:    string;
    users_username: string;
}

export interface BackendUserRoleDetails {
    roles_id:       string;
    roles_identity: string;
    roles_level:    number;
}

/**
 * authorized_quiz_pool_questions / question-display pool question
 */
export interface BackendPoolQuestion {
    options_data:       BackendOptionModel[];
    options_selected?:  string[] | null;
    pools_question_id:  string;
    question_data:      BackendQuestionModel;
    question_status?:   null | string;
    question_time?:     number | null;
    question_time_data: BackendPoolTimeModel;
    question_type_data: BackendPoolTypeModel;
}

export interface BackendOptionModel {
    options_id:       string;
    options_identity: string;
    options_image?:   null | string;
    options_max?:     number | null;
    options_min?:     number | null;
    options_selected: boolean;
    options_unit?:    null | string;
}

export interface BackendQuestionModel {
    questions_id:     string;
    questions_image?: null | string;
    questions_text:   string;
}

export interface BackendPoolTimeModel {
    question_time_id:    string;
    question_time_value: number;
}

export interface BackendPoolTypeModel {
    question_type_id:             string;
    question_type_identity:       string;
    question_type_local_identity: string;
}

/**
 * fetch_user_quiz_history row
 */
export interface BackendQuizHistory {
    challenge_question_count:              number;
    pools_completed_question_tracker_size: number;
    pools_completed_question_tracker_time: number;
    pools_duration:                        number;
    pools_id:                              string;
    pools_members_created_at:              string;
    pools_members_paid_amount:             number;
    pools_members_points:                  number;
    pools_members_rank:                    number;
    sort_created_id:                       string;
    topics_identity:                       string;
    topics_image?:                         null | string;
}

/**
 * get_users_redeem_code / get_code_data redeem code
 */
export interface BackendRedeemCodeModel {
    redeem_code_amount:   number;
    redeem_code_expires?: null | string;
    redeem_code_id:       string;
    redeem_code_value:    string;
    redeem_rule_bot:      boolean;
    redeem_rule_mid:      boolean;
    redeem_rule_rank1:    boolean;
    redeem_rule_rank2:    boolean;
    redeem_rule_rank3:    boolean;
    redeem_rule_top:      boolean;
    sort_created_id:      string;
}

/**
 * claim_user_achievements / claim_user_mission reward_claim_details
 */
export interface BackendRewardClaimModel {
    reward_claim_amount:       number;
    reward_claim_redeem_code?: BackendRewardRedeemCodeModel | null;
}

/**
 * create_or_get_academix_profile / roles activation
 */
export interface BackendRolesActivationData {
    roles_activation_activated: boolean;
    roles_activation_amount:    number;
    roles_activation_is_fresh?: boolean;
    transaction_id?:            null | string;
}

/**
 * fetch_withdraw_wallets / fetch_user_withdraw_wallets row
 */
export interface BackendSellPaymentWalletModel {
    payment_wallet_currency:       string;
    payment_wallet_id:             string;
    payment_wallet_identity:       string;
    payment_wallet_image?:         null | string;
    payment_wallet_sell_fee:       number;
    payment_wallet_sell_fee_flat:  number;
    payment_wallet_sell_min:       number;
    payment_wallet_sell_rate:      number;
    payment_wallet_sell_rate_type: string;
    sort_created_id:               string;
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
 * public.get_user_balance -> user_balance_details
 */
export interface BackendUserBalanceModel {
    users_balance_amount:     number;
    users_balance_updated_at: string;
    users_id:                 string;
}

/**
 * get_user_record — the signed-in user profile
 */
export interface BackendUserData {
    country_id:              string;
    country_table?:          BackendCountryData | null;
    language_id:             string;
    language_table?:         BackendLanguageData | null;
    roles_table?:            BackendRoleData | null;
    transaction_id?:         null | string;
    users_created_at:        string;
    users_dob:               string;
    users_email:             string;
    users_id:                string;
    users_image?:            null | string;
    users_names:             string;
    users_phone?:            null | string;
    users_referred_details?: BackendReferredUserData | null;
    users_referred_id?:      null | string;
    users_roles_access?:     any;
    users_sex:               string;
    users_username:          string;
    users_verified:          boolean;
}

export interface BackendCountryData {
    country_id:           string;
    country_identity:     string;
    country_image:        string;
    country_two_iso_code: string;
}

export interface BackendLanguageData {
    language_code:     string;
    language_id:       string;
    language_identity: string;
}

export interface BackendRoleData {
    roles_checker: string;
    roles_id:      string;
    roles_level:   number;
}

export interface BackendReferredUserData {
    users_image?:          null | string;
    users_names:           string;
    users_referred_id:     string;
    users_referred_status: string;
    users_username:        string;
}

/**
 * fetch_available_quizzes / fetch_public_quizzes / get_active_quiz /
 * get_public_auth_quiz_pool topic
 */
export interface BackendUserDisplayQuizTopicModel {
    creator_details:       CreatorDetails;
    creator_is_followed:   boolean;
    pools_details?:        BackendQuizPool | null;
    sort_created_id:       string;
    sort_updated_id:       string;
    topic_is_personalised: boolean;
    topics_created_at:     string;
    topics_description?:   null | string;
    topics_id:             string;
    topics_identity:       string;
    topics_image?:         null | string;
    topics_sponsorship?:   null | string;
    topics_updated_at:     string;
}

export interface CreatorDetails {
    users_id:       string;
    users_image?:   null | string;
    users_names:    string;
    users_username: string;
}

export interface BackendQuizPool {
    challenge_details?:      BackendChallengeModel | null;
    pools_allow_submission?: boolean | null;
    pools_auth:              string;
    pools_code?:             null | string;
    pools_completed_at?:     null | string;
    pools_duration?:         number | null;
    pools_graded_at?:        null | string;
    pools_id:                string;
    pools_job?:              null | string;
    pools_job_end_at?:       null | string;
    pools_locale:            string;
    pools_members_count:     number;
    pools_ranked_at?:        null | string;
    pools_rewarded_at?:      null | string;
    pools_starting_at?:      null | string;
    pools_status:            string;
    pools_visible:           boolean;
    question_tracker_count:  number;
    sort_created_id:         string;
    sort_updated_id:         string;
}

export interface BackendChallengeModel {
    challenge_bot_share:          number;
    challenge_development_charge: number;
    challenge_id:                 string;
    challenge_identity:           string;
    challenge_max_participants:   number;
    challenge_mid_share:          number;
    challenge_min_participants:   number;
    challenge_price:              number;
    challenge_question_count:     number;
    challenge_top_share:          number;
    challenge_waiting_time?:      number | null;
    game_mode_details?:           BackendGameModeModel | null;
}

export interface BackendGameModeModel {
    game_mode_checker:  string;
    game_mode_id:       string;
    game_mode_identity: string;
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
