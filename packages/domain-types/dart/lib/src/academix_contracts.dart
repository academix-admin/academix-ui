// To parse this JSON data, do
//
//     final academixContracts = academixContractsFromJson(jsonString);

import 'dart:convert';

AcademixContracts academixContractsFromJson(String str) => AcademixContracts.fromJson(json.decode(str));

String academixContractsToJson(AcademixContracts data) => json.encode(data.toJson());


///SINGLE SOURCE for Academix RPC/Lambda wire contracts. Each key under `definitions` is a
///wire type (the key IS the generated type name — kept identical to academix-web's current
///`Backend*` interfaces so the generated types are drop-in). Author each shape from its
///function's RETURN builder. The root references the top-level ones so the generator emits
///every reachable type. Regenerate TS + Dart with `npm run gen`.
class AcademixContracts {
    BackendAchievementsData? backendAchievementsData;
    BackendAchievementsModel? backendAchievementsModel;
    BackendBuyPaymentWalletModel? backendBuyPaymentWalletModel;
    Map<String, BackendChallengeConfig>? backendChallengeConfigRoot;
    BackendDailyPerformance? backendDailyPerformance;
    BackendDailyStreaksModel? backendDailyStreaksModel;
    BackendFriendsModel? backendFriendsModel;
    BackendGiveBackModel? backendGiveBackModel;
    BackendMissionData? backendMissionData;
    BackendMissionModel? backendMissionModel;
    BackendPaymentCompletionData? backendPaymentCompletionData;
    BackendPaymentMethodModel? backendPaymentMethodModel;
    BackendPaymentProfileModel? backendPaymentProfileModel;
    BackendPoolMemberModel? backendPoolMemberModel;
    BackendPoolQuestion? backendPoolQuestion;
    BackendQuizHistory? backendQuizHistory;
    BackendRedeemCodeModel? backendRedeemCodeModel;
    BackendRewardClaimModel? backendRewardClaimModel;
    BackendRolesActivationData? backendRolesActivationData;
    BackendSellPaymentWalletModel? backendSellPaymentWalletModel;
    BackendTransactionModel? backendTransactionModel;
    BackendUserBalanceModel? backendUserBalanceModel;
    BackendUserData? backendUserData;
    BackendUserDisplayQuizTopicModel? backendUserDisplayQuizTopicModel;
    BackendUserEngagementModel? backendUserEngagementModel;
    GetUserBalanceResponse? getUserBalanceResponse;

    AcademixContracts({
        this.backendAchievementsData,
        this.backendAchievementsModel,
        this.backendBuyPaymentWalletModel,
        this.backendChallengeConfigRoot,
        this.backendDailyPerformance,
        this.backendDailyStreaksModel,
        this.backendFriendsModel,
        this.backendGiveBackModel,
        this.backendMissionData,
        this.backendMissionModel,
        this.backendPaymentCompletionData,
        this.backendPaymentMethodModel,
        this.backendPaymentProfileModel,
        this.backendPoolMemberModel,
        this.backendPoolQuestion,
        this.backendQuizHistory,
        this.backendRedeemCodeModel,
        this.backendRewardClaimModel,
        this.backendRolesActivationData,
        this.backendSellPaymentWalletModel,
        this.backendTransactionModel,
        this.backendUserBalanceModel,
        this.backendUserData,
        this.backendUserDisplayQuizTopicModel,
        this.backendUserEngagementModel,
        this.getUserBalanceResponse,
    });

    factory AcademixContracts.fromJson(Map<String, dynamic> json) => AcademixContracts(
        backendAchievementsData: json["backendAchievementsData"] == null ? null : BackendAchievementsData.fromJson(json["backendAchievementsData"]),
        backendAchievementsModel: json["backendAchievementsModel"] == null ? null : BackendAchievementsModel.fromJson(json["backendAchievementsModel"]),
        backendBuyPaymentWalletModel: json["backendBuyPaymentWalletModel"] == null ? null : BackendBuyPaymentWalletModel.fromJson(json["backendBuyPaymentWalletModel"]),
        backendChallengeConfigRoot: Map.from(json["backendChallengeConfigRoot"]!).map((k, v) => MapEntry<String, BackendChallengeConfig>(k, BackendChallengeConfig.fromJson(v))),
        backendDailyPerformance: json["backendDailyPerformance"] == null ? null : BackendDailyPerformance.fromJson(json["backendDailyPerformance"]),
        backendDailyStreaksModel: json["backendDailyStreaksModel"] == null ? null : BackendDailyStreaksModel.fromJson(json["backendDailyStreaksModel"]),
        backendFriendsModel: json["backendFriendsModel"] == null ? null : BackendFriendsModel.fromJson(json["backendFriendsModel"]),
        backendGiveBackModel: json["backendGiveBackModel"] == null ? null : BackendGiveBackModel.fromJson(json["backendGiveBackModel"]),
        backendMissionData: json["backendMissionData"] == null ? null : BackendMissionData.fromJson(json["backendMissionData"]),
        backendMissionModel: json["backendMissionModel"] == null ? null : BackendMissionModel.fromJson(json["backendMissionModel"]),
        backendPaymentCompletionData: json["backendPaymentCompletionData"] == null ? null : BackendPaymentCompletionData.fromJson(json["backendPaymentCompletionData"]),
        backendPaymentMethodModel: json["backendPaymentMethodModel"] == null ? null : BackendPaymentMethodModel.fromJson(json["backendPaymentMethodModel"]),
        backendPaymentProfileModel: json["backendPaymentProfileModel"] == null ? null : BackendPaymentProfileModel.fromJson(json["backendPaymentProfileModel"]),
        backendPoolMemberModel: json["backendPoolMemberModel"] == null ? null : BackendPoolMemberModel.fromJson(json["backendPoolMemberModel"]),
        backendPoolQuestion: json["backendPoolQuestion"] == null ? null : BackendPoolQuestion.fromJson(json["backendPoolQuestion"]),
        backendQuizHistory: json["backendQuizHistory"] == null ? null : BackendQuizHistory.fromJson(json["backendQuizHistory"]),
        backendRedeemCodeModel: json["backendRedeemCodeModel"] == null ? null : BackendRedeemCodeModel.fromJson(json["backendRedeemCodeModel"]),
        backendRewardClaimModel: json["backendRewardClaimModel"] == null ? null : BackendRewardClaimModel.fromJson(json["backendRewardClaimModel"]),
        backendRolesActivationData: json["backendRolesActivationData"] == null ? null : BackendRolesActivationData.fromJson(json["backendRolesActivationData"]),
        backendSellPaymentWalletModel: json["backendSellPaymentWalletModel"] == null ? null : BackendSellPaymentWalletModel.fromJson(json["backendSellPaymentWalletModel"]),
        backendTransactionModel: json["backendTransactionModel"] == null ? null : BackendTransactionModel.fromJson(json["backendTransactionModel"]),
        backendUserBalanceModel: json["backendUserBalanceModel"] == null ? null : BackendUserBalanceModel.fromJson(json["backendUserBalanceModel"]),
        backendUserData: json["backendUserData"] == null ? null : BackendUserData.fromJson(json["backendUserData"]),
        backendUserDisplayQuizTopicModel: json["backendUserDisplayQuizTopicModel"] == null ? null : BackendUserDisplayQuizTopicModel.fromJson(json["backendUserDisplayQuizTopicModel"]),
        backendUserEngagementModel: json["backendUserEngagementModel"] == null ? null : BackendUserEngagementModel.fromJson(json["backendUserEngagementModel"]),
        getUserBalanceResponse: json["getUserBalanceResponse"] == null ? null : GetUserBalanceResponse.fromJson(json["getUserBalanceResponse"]),
    );

    Map<String, dynamic> toJson() => {
        "backendAchievementsData": backendAchievementsData?.toJson(),
        "backendAchievementsModel": backendAchievementsModel?.toJson(),
        "backendBuyPaymentWalletModel": backendBuyPaymentWalletModel?.toJson(),
        "backendChallengeConfigRoot": Map.from(backendChallengeConfigRoot!).map((k, v) => MapEntry<String, dynamic>(k, v.toJson())),
        "backendDailyPerformance": backendDailyPerformance?.toJson(),
        "backendDailyStreaksModel": backendDailyStreaksModel?.toJson(),
        "backendFriendsModel": backendFriendsModel?.toJson(),
        "backendGiveBackModel": backendGiveBackModel?.toJson(),
        "backendMissionData": backendMissionData?.toJson(),
        "backendMissionModel": backendMissionModel?.toJson(),
        "backendPaymentCompletionData": backendPaymentCompletionData?.toJson(),
        "backendPaymentMethodModel": backendPaymentMethodModel?.toJson(),
        "backendPaymentProfileModel": backendPaymentProfileModel?.toJson(),
        "backendPoolMemberModel": backendPoolMemberModel?.toJson(),
        "backendPoolQuestion": backendPoolQuestion?.toJson(),
        "backendQuizHistory": backendQuizHistory?.toJson(),
        "backendRedeemCodeModel": backendRedeemCodeModel?.toJson(),
        "backendRewardClaimModel": backendRewardClaimModel?.toJson(),
        "backendRolesActivationData": backendRolesActivationData?.toJson(),
        "backendSellPaymentWalletModel": backendSellPaymentWalletModel?.toJson(),
        "backendTransactionModel": backendTransactionModel?.toJson(),
        "backendUserBalanceModel": backendUserBalanceModel?.toJson(),
        "backendUserData": backendUserData?.toJson(),
        "backendUserDisplayQuizTopicModel": backendUserDisplayQuizTopicModel?.toJson(),
        "backendUserEngagementModel": backendUserEngagementModel?.toJson(),
        "getUserBalanceResponse": getUserBalanceResponse?.toJson(),
    };
}


///get_user_achievements_count
class BackendAchievementsData {
    double achievementsCompleted;
    double achievementsCount;
    double achievementsFinished;
    double achievementsNotRewarded;

    BackendAchievementsData({
        required this.achievementsCompleted,
        required this.achievementsCount,
        required this.achievementsFinished,
        required this.achievementsNotRewarded,
    });

    factory BackendAchievementsData.fromJson(Map<String, dynamic> json) => BackendAchievementsData(
        achievementsCompleted: json["achievements_completed"]?.toDouble(),
        achievementsCount: json["achievements_count"]?.toDouble(),
        achievementsFinished: json["achievements_finished"]?.toDouble(),
        achievementsNotRewarded: json["achievements_not_rewarded"]?.toDouble(),
    );

    Map<String, dynamic> toJson() => {
        "achievements_completed": achievementsCompleted,
        "achievements_count": achievementsCount,
        "achievements_finished": achievementsFinished,
        "achievements_not_rewarded": achievementsNotRewarded,
    };
}


///fetch_user_achievements / claim_user_achievements achievement row
class BackendAchievementsModel {
    String achievementsDescription;
    String achievementsId;
    String? achievementsImage;
    BackendAchievementsProgressDetails? achievementsProgressDetails;
    AchievementsRequirement achievementsRequirement;
    String achievementsTitle;
    String achievementsType;
    BackendRewardDetails? rewardDetails;
    double sortCreatedId;

    BackendAchievementsModel({
        required this.achievementsDescription,
        required this.achievementsId,
        this.achievementsImage,
        this.achievementsProgressDetails,
        required this.achievementsRequirement,
        required this.achievementsTitle,
        required this.achievementsType,
        this.rewardDetails,
        required this.sortCreatedId,
    });

    factory BackendAchievementsModel.fromJson(Map<String, dynamic> json) => BackendAchievementsModel(
        achievementsDescription: json["achievements_description"],
        achievementsId: json["achievements_id"],
        achievementsImage: json["achievements_image"],
        achievementsProgressDetails: json["achievements_progress_details"] == null ? null : BackendAchievementsProgressDetails.fromJson(json["achievements_progress_details"]),
        achievementsRequirement: AchievementsRequirement.fromJson(json["achievements_requirement"]),
        achievementsTitle: json["achievements_title"],
        achievementsType: json["achievements_type"],
        rewardDetails: json["reward_details"] == null ? null : BackendRewardDetails.fromJson(json["reward_details"]),
        sortCreatedId: json["sort_created_id"]?.toDouble(),
    );

    Map<String, dynamic> toJson() => {
        "achievements_description": achievementsDescription,
        "achievements_id": achievementsId,
        "achievements_image": achievementsImage,
        "achievements_progress_details": achievementsProgressDetails?.toJson(),
        "achievements_requirement": achievementsRequirement.toJson(),
        "achievements_title": achievementsTitle,
        "achievements_type": achievementsType,
        "reward_details": rewardDetails?.toJson(),
        "sort_created_id": sortCreatedId,
    };
}

class BackendAchievementsProgressDetails {
    bool achievementsProgressCompleted;
    double achievementsProgressCount;
    String? achievementsProgressCreatedAt;
    String? achievementsProgressId;
    double achievementsProgressRequired;
    bool achievementsProgressRewarded;
    String? achievementsProgressUpdatedAt;
    BackendRewardRedeemCodeModel? redeemCodeDetails;

    BackendAchievementsProgressDetails({
        required this.achievementsProgressCompleted,
        required this.achievementsProgressCount,
        this.achievementsProgressCreatedAt,
        this.achievementsProgressId,
        required this.achievementsProgressRequired,
        required this.achievementsProgressRewarded,
        this.achievementsProgressUpdatedAt,
        this.redeemCodeDetails,
    });

    factory BackendAchievementsProgressDetails.fromJson(Map<String, dynamic> json) => BackendAchievementsProgressDetails(
        achievementsProgressCompleted: json["achievements_progress_completed"],
        achievementsProgressCount: json["achievements_progress_count"]?.toDouble(),
        achievementsProgressCreatedAt: json["achievements_progress_created_at"],
        achievementsProgressId: json["achievements_progress_id"],
        achievementsProgressRequired: json["achievements_progress_required"]?.toDouble(),
        achievementsProgressRewarded: json["achievements_progress_rewarded"],
        achievementsProgressUpdatedAt: json["achievements_progress_updated_at"],
        redeemCodeDetails: json["redeem_code_details"] == null ? null : BackendRewardRedeemCodeModel.fromJson(json["redeem_code_details"]),
    );

    Map<String, dynamic> toJson() => {
        "achievements_progress_completed": achievementsProgressCompleted,
        "achievements_progress_count": achievementsProgressCount,
        "achievements_progress_created_at": achievementsProgressCreatedAt,
        "achievements_progress_id": achievementsProgressId,
        "achievements_progress_required": achievementsProgressRequired,
        "achievements_progress_rewarded": achievementsProgressRewarded,
        "achievements_progress_updated_at": achievementsProgressUpdatedAt,
        "redeem_code_details": redeemCodeDetails?.toJson(),
    };
}

class BackendRewardRedeemCodeModel {
    String? redeemCodeExpires;
    String? redeemCodeId;
    String? redeemCodeValue;

    BackendRewardRedeemCodeModel({
        this.redeemCodeExpires,
        this.redeemCodeId,
        this.redeemCodeValue,
    });

    factory BackendRewardRedeemCodeModel.fromJson(Map<String, dynamic> json) => BackendRewardRedeemCodeModel(
        redeemCodeExpires: json["redeem_code_expires"],
        redeemCodeId: json["redeem_code_id"],
        redeemCodeValue: json["redeem_code_value"],
    );

    Map<String, dynamic> toJson() => {
        "redeem_code_expires": redeemCodeExpires,
        "redeem_code_id": redeemCodeId,
        "redeem_code_value": redeemCodeValue,
    };
}

class AchievementsRequirement {
    double count;

    AchievementsRequirement({
        required this.count,
    });

    factory AchievementsRequirement.fromJson(Map<String, dynamic> json) => AchievementsRequirement(
        count: json["count"]?.toDouble(),
    );

    Map<String, dynamic> toJson() => {
        "count": count,
    };
}

class BackendRewardDetails {
    String rewardId;
    String rewardInstruction;
    double rewardLimit;
    String rewardType;
    double rewardValue;

    BackendRewardDetails({
        required this.rewardId,
        required this.rewardInstruction,
        required this.rewardLimit,
        required this.rewardType,
        required this.rewardValue,
    });

    factory BackendRewardDetails.fromJson(Map<String, dynamic> json) => BackendRewardDetails(
        rewardId: json["reward_id"],
        rewardInstruction: json["reward_instruction"],
        rewardLimit: json["reward_limit"]?.toDouble(),
        rewardType: json["reward_type"],
        rewardValue: json["reward_value"]?.toDouble(),
    );

    Map<String, dynamic> toJson() => {
        "reward_id": rewardId,
        "reward_instruction": rewardInstruction,
        "reward_limit": rewardLimit,
        "reward_type": rewardType,
        "reward_value": rewardValue,
    };
}


///fetch_top_up_wallets / fetch_user_top_up_wallet row
class BackendBuyPaymentWalletModel {
    double paymentWalletBuyFee;
    double paymentWalletBuyFeeFlat;
    double paymentWalletBuyMin;
    double paymentWalletBuyRate;
    String paymentWalletBuyRateType;
    String paymentWalletCurrency;
    String paymentWalletId;
    String paymentWalletIdentity;
    String? paymentWalletImage;
    String sortCreatedId;

    BackendBuyPaymentWalletModel({
        required this.paymentWalletBuyFee,
        required this.paymentWalletBuyFeeFlat,
        required this.paymentWalletBuyMin,
        required this.paymentWalletBuyRate,
        required this.paymentWalletBuyRateType,
        required this.paymentWalletCurrency,
        required this.paymentWalletId,
        required this.paymentWalletIdentity,
        this.paymentWalletImage,
        required this.sortCreatedId,
    });

    factory BackendBuyPaymentWalletModel.fromJson(Map<String, dynamic> json) => BackendBuyPaymentWalletModel(
        paymentWalletBuyFee: json["payment_wallet_buy_fee"]?.toDouble(),
        paymentWalletBuyFeeFlat: json["payment_wallet_buy_fee_flat"]?.toDouble(),
        paymentWalletBuyMin: json["payment_wallet_buy_min"]?.toDouble(),
        paymentWalletBuyRate: json["payment_wallet_buy_rate"]?.toDouble(),
        paymentWalletBuyRateType: json["payment_wallet_buy_rate_type"],
        paymentWalletCurrency: json["payment_wallet_currency"],
        paymentWalletId: json["payment_wallet_id"],
        paymentWalletIdentity: json["payment_wallet_identity"],
        paymentWalletImage: json["payment_wallet_image"],
        sortCreatedId: json["sort_created_id"],
    );

    Map<String, dynamic> toJson() => {
        "payment_wallet_buy_fee": paymentWalletBuyFee,
        "payment_wallet_buy_fee_flat": paymentWalletBuyFeeFlat,
        "payment_wallet_buy_min": paymentWalletBuyMin,
        "payment_wallet_buy_rate": paymentWalletBuyRate,
        "payment_wallet_buy_rate_type": paymentWalletBuyRateType,
        "payment_wallet_currency": paymentWalletCurrency,
        "payment_wallet_id": paymentWalletId,
        "payment_wallet_identity": paymentWalletIdentity,
        "payment_wallet_image": paymentWalletImage,
        "sort_created_id": sortCreatedId,
    };
}

class BackendChallengeConfig {
    List<BackendChallengeOption> challengeOptions;
    String gameModeChecker;
    String gameModeIdentity;

    BackendChallengeConfig({
        required this.challengeOptions,
        required this.gameModeChecker,
        required this.gameModeIdentity,
    });

    factory BackendChallengeConfig.fromJson(Map<String, dynamic> json) => BackendChallengeConfig(
        challengeOptions: List<BackendChallengeOption>.from(json["challenge_options"].map((x) => BackendChallengeOption.fromJson(x))),
        gameModeChecker: json["game_mode_checker"],
        gameModeIdentity: json["game_mode_identity"],
    );

    Map<String, dynamic> toJson() => {
        "challenge_options": List<dynamic>.from(challengeOptions.map((x) => x.toJson())),
        "game_mode_checker": gameModeChecker,
        "game_mode_identity": gameModeIdentity,
    };
}

class BackendChallengeOption {
    double challengeBotShare;
    double challengeCreatorShare;
    double challengeDevelopmentCharge;
    String challengeIdentity;
    double challengeMaxParticipants;
    double challengeMidShare;
    double challengeMinParticipants;
    double challengePrice;
    double challengeQuestionCount;
    double challengeReviewerShare;
    Map<String, double> challengeRoleShare;
    double challengeTopShare;

    BackendChallengeOption({
        required this.challengeBotShare,
        required this.challengeCreatorShare,
        required this.challengeDevelopmentCharge,
        required this.challengeIdentity,
        required this.challengeMaxParticipants,
        required this.challengeMidShare,
        required this.challengeMinParticipants,
        required this.challengePrice,
        required this.challengeQuestionCount,
        required this.challengeReviewerShare,
        required this.challengeRoleShare,
        required this.challengeTopShare,
    });

    factory BackendChallengeOption.fromJson(Map<String, dynamic> json) => BackendChallengeOption(
        challengeBotShare: json["challenge_bot_share"]?.toDouble(),
        challengeCreatorShare: json["challenge_creator_share"]?.toDouble(),
        challengeDevelopmentCharge: json["challenge_development_charge"]?.toDouble(),
        challengeIdentity: json["challenge_identity"],
        challengeMaxParticipants: json["challenge_max_participants"]?.toDouble(),
        challengeMidShare: json["challenge_mid_share"]?.toDouble(),
        challengeMinParticipants: json["challenge_min_participants"]?.toDouble(),
        challengePrice: json["challenge_price"]?.toDouble(),
        challengeQuestionCount: json["challenge_question_count"]?.toDouble(),
        challengeReviewerShare: json["challenge_reviewer_share"]?.toDouble(),
        challengeRoleShare: Map.from(json["challenge_role_share"]).map((k, v) => MapEntry<String, double>(k, v?.toDouble())),
        challengeTopShare: json["challenge_top_share"]?.toDouble(),
    );

    Map<String, dynamic> toJson() => {
        "challenge_bot_share": challengeBotShare,
        "challenge_creator_share": challengeCreatorShare,
        "challenge_development_charge": challengeDevelopmentCharge,
        "challenge_identity": challengeIdentity,
        "challenge_max_participants": challengeMaxParticipants,
        "challenge_mid_share": challengeMidShare,
        "challenge_min_participants": challengeMinParticipants,
        "challenge_price": challengePrice,
        "challenge_question_count": challengeQuestionCount,
        "challenge_reviewer_share": challengeReviewerShare,
        "challenge_role_share": Map.from(challengeRoleShare).map((k, v) => MapEntry<String, dynamic>(k, v)),
        "challenge_top_share": challengeTopShare,
    };
}


///get_user_daily_performance -> daily_performance_details
class BackendDailyPerformance {
    double dailyPerformanceForEarning;
    double dailyPerformanceForQuiz;

    BackendDailyPerformance({
        required this.dailyPerformanceForEarning,
        required this.dailyPerformanceForQuiz,
    });

    factory BackendDailyPerformance.fromJson(Map<String, dynamic> json) => BackendDailyPerformance(
        dailyPerformanceForEarning: json["daily_performance_for_earning"]?.toDouble(),
        dailyPerformanceForQuiz: json["daily_performance_for_quiz"]?.toDouble(),
    );

    Map<String, dynamic> toJson() => {
        "daily_performance_for_earning": dailyPerformanceForEarning,
        "daily_performance_for_quiz": dailyPerformanceForQuiz,
    };
}


///claim_user_streaks / get_user_streaks -> daily_streaks_details
class BackendDailyStreaksModel {
    double dailyStreaksAwarded;
    double dailyStreaksCount;
    String? dailyStreaksCreatedAt;
    String dailyStreaksDate;
    double dailyStreaksDateNumber;
    double dailyStreaksMax;
    bool dailyStreaksReached;
    String dailyStreaksStatus;
    BackendRewardRedeemCodeModel? redeemCodeDetails;

    BackendDailyStreaksModel({
        required this.dailyStreaksAwarded,
        required this.dailyStreaksCount,
        this.dailyStreaksCreatedAt,
        required this.dailyStreaksDate,
        required this.dailyStreaksDateNumber,
        required this.dailyStreaksMax,
        required this.dailyStreaksReached,
        required this.dailyStreaksStatus,
        this.redeemCodeDetails,
    });

    factory BackendDailyStreaksModel.fromJson(Map<String, dynamic> json) => BackendDailyStreaksModel(
        dailyStreaksAwarded: json["daily_streaks_awarded"]?.toDouble(),
        dailyStreaksCount: json["daily_streaks_count"]?.toDouble(),
        dailyStreaksCreatedAt: json["daily_streaks_created_at"],
        dailyStreaksDate: json["daily_streaks_date"],
        dailyStreaksDateNumber: json["daily_streaks_date_number"]?.toDouble(),
        dailyStreaksMax: json["daily_streaks_max"]?.toDouble(),
        dailyStreaksReached: json["daily_streaks_reached"],
        dailyStreaksStatus: json["daily_streaks_status"],
        redeemCodeDetails: json["redeem_code_details"] == null ? null : BackendRewardRedeemCodeModel.fromJson(json["redeem_code_details"]),
    );

    Map<String, dynamic> toJson() => {
        "daily_streaks_awarded": dailyStreaksAwarded,
        "daily_streaks_count": dailyStreaksCount,
        "daily_streaks_created_at": dailyStreaksCreatedAt,
        "daily_streaks_date": dailyStreaksDate,
        "daily_streaks_date_number": dailyStreaksDateNumber,
        "daily_streaks_max": dailyStreaksMax,
        "daily_streaks_reached": dailyStreaksReached,
        "daily_streaks_status": dailyStreaksStatus,
        "redeem_code_details": redeemCodeDetails?.toJson(),
    };
}


///fetch_friends row
class BackendFriendsModel {
    String sortCreatedId;
    String usersCreatedAt;
    String usersId;
    String? usersImage;
    String usersNames;
    String usersReferredStatus;
    String usersUsername;

    BackendFriendsModel({
        required this.sortCreatedId,
        required this.usersCreatedAt,
        required this.usersId,
        this.usersImage,
        required this.usersNames,
        required this.usersReferredStatus,
        required this.usersUsername,
    });

    factory BackendFriendsModel.fromJson(Map<String, dynamic> json) => BackendFriendsModel(
        sortCreatedId: json["sort_created_id"],
        usersCreatedAt: json["users_created_at"],
        usersId: json["users_id"],
        usersImage: json["users_image"],
        usersNames: json["users_names"],
        usersReferredStatus: json["users_referred_status"],
        usersUsername: json["users_username"],
    );

    Map<String, dynamic> toJson() => {
        "sort_created_id": sortCreatedId,
        "users_created_at": usersCreatedAt,
        "users_id": usersId,
        "users_image": usersImage,
        "users_names": usersNames,
        "users_referred_status": usersReferredStatus,
        "users_username": usersUsername,
    };
}


///get_give_back_code / claim_giveback_code
class BackendGiveBackModel {
    BackendGiveBackCollectionDetails? givebackCollectionDetails;
    BackendGiveBackDetail givebackDetail;

    BackendGiveBackModel({
        this.givebackCollectionDetails,
        required this.givebackDetail,
    });

    factory BackendGiveBackModel.fromJson(Map<String, dynamic> json) => BackendGiveBackModel(
        givebackCollectionDetails: json["giveback_collection_details"] == null ? null : BackendGiveBackCollectionDetails.fromJson(json["giveback_collection_details"]),
        givebackDetail: BackendGiveBackDetail.fromJson(json["giveback_detail"]),
    );

    Map<String, dynamic> toJson() => {
        "giveback_collection_details": givebackCollectionDetails?.toJson(),
        "giveback_detail": givebackDetail.toJson(),
    };
}

class BackendGiveBackCollectionDetails {
    bool canClaim;
    bool hasClaimed;
    bool hasPassword;
    bool isSpent;
    String? redeemCodeValue;
    double remainingSlots;

    BackendGiveBackCollectionDetails({
        required this.canClaim,
        required this.hasClaimed,
        required this.hasPassword,
        required this.isSpent,
        this.redeemCodeValue,
        required this.remainingSlots,
    });

    factory BackendGiveBackCollectionDetails.fromJson(Map<String, dynamic> json) => BackendGiveBackCollectionDetails(
        canClaim: json["can_claim"],
        hasClaimed: json["has_claimed"],
        hasPassword: json["has_password"],
        isSpent: json["is_spent"],
        redeemCodeValue: json["redeem_code_value"],
        remainingSlots: json["remaining_slots"]?.toDouble(),
    );

    Map<String, dynamic> toJson() => {
        "can_claim": canClaim,
        "has_claimed": hasClaimed,
        "has_password": hasPassword,
        "is_spent": isSpent,
        "redeem_code_value": redeemCodeValue,
        "remaining_slots": remainingSlots,
    };
}

class BackendGiveBackDetail {
    double claimedCount;
    String givebackCode;
    String givebackId;
    String? givebackIdentifier;
    double givebackTotalAmount;
    double givebackTotalUsage;
    double givebackUnitAmount;
    bool redeemRuleBot;
    bool redeemRuleMid;
    bool redeemRuleRank1;
    bool redeemRuleRank2;
    bool redeemRuleRank3;
    bool redeemRuleTop;
    double remainingSlots;
    String sortCreatedId;

    BackendGiveBackDetail({
        required this.claimedCount,
        required this.givebackCode,
        required this.givebackId,
        this.givebackIdentifier,
        required this.givebackTotalAmount,
        required this.givebackTotalUsage,
        required this.givebackUnitAmount,
        required this.redeemRuleBot,
        required this.redeemRuleMid,
        required this.redeemRuleRank1,
        required this.redeemRuleRank2,
        required this.redeemRuleRank3,
        required this.redeemRuleTop,
        required this.remainingSlots,
        required this.sortCreatedId,
    });

    factory BackendGiveBackDetail.fromJson(Map<String, dynamic> json) => BackendGiveBackDetail(
        claimedCount: json["claimed_count"]?.toDouble(),
        givebackCode: json["giveback_code"],
        givebackId: json["giveback_id"],
        givebackIdentifier: json["giveback_identifier"],
        givebackTotalAmount: json["giveback_total_amount"]?.toDouble(),
        givebackTotalUsage: json["giveback_total_usage"]?.toDouble(),
        givebackUnitAmount: json["giveback_unit_amount"]?.toDouble(),
        redeemRuleBot: json["redeem_rule_bot"],
        redeemRuleMid: json["redeem_rule_mid"],
        redeemRuleRank1: json["redeem_rule_rank1"],
        redeemRuleRank2: json["redeem_rule_rank2"],
        redeemRuleRank3: json["redeem_rule_rank3"],
        redeemRuleTop: json["redeem_rule_top"],
        remainingSlots: json["remaining_slots"]?.toDouble(),
        sortCreatedId: json["sort_created_id"],
    );

    Map<String, dynamic> toJson() => {
        "claimed_count": claimedCount,
        "giveback_code": givebackCode,
        "giveback_id": givebackId,
        "giveback_identifier": givebackIdentifier,
        "giveback_total_amount": givebackTotalAmount,
        "giveback_total_usage": givebackTotalUsage,
        "giveback_unit_amount": givebackUnitAmount,
        "redeem_rule_bot": redeemRuleBot,
        "redeem_rule_mid": redeemRuleMid,
        "redeem_rule_rank1": redeemRuleRank1,
        "redeem_rule_rank2": redeemRuleRank2,
        "redeem_rule_rank3": redeemRuleRank3,
        "redeem_rule_top": redeemRuleTop,
        "remaining_slots": remainingSlots,
        "sort_created_id": sortCreatedId,
    };
}


///get_user_missions_count
class BackendMissionData {
    double missionCompleted;
    double missionCount;
    double missionFinished;
    double missionNotRewarded;

    BackendMissionData({
        required this.missionCompleted,
        required this.missionCount,
        required this.missionFinished,
        required this.missionNotRewarded,
    });

    factory BackendMissionData.fromJson(Map<String, dynamic> json) => BackendMissionData(
        missionCompleted: json["mission_completed"]?.toDouble(),
        missionCount: json["mission_count"]?.toDouble(),
        missionFinished: json["mission_finished"]?.toDouble(),
        missionNotRewarded: json["mission_not_rewarded"]?.toDouble(),
    );

    Map<String, dynamic> toJson() => {
        "mission_completed": missionCompleted,
        "mission_count": missionCount,
        "mission_finished": missionFinished,
        "mission_not_rewarded": missionNotRewarded,
    };
}


///fetch_user_missions / claim_user_mission mission row
class BackendMissionModel {
    String missionDescription;
    String missionId;
    String? missionImage;
    BackendMissionProgressDetails? missionProgressDetails;
    MissionRequirement missionRequirement;
    String missionTitle;
    String missionType;
    BackendRewardDetails? rewardDetails;
    double sortCreatedId;

    BackendMissionModel({
        required this.missionDescription,
        required this.missionId,
        this.missionImage,
        this.missionProgressDetails,
        required this.missionRequirement,
        required this.missionTitle,
        required this.missionType,
        this.rewardDetails,
        required this.sortCreatedId,
    });

    factory BackendMissionModel.fromJson(Map<String, dynamic> json) => BackendMissionModel(
        missionDescription: json["mission_description"],
        missionId: json["mission_id"],
        missionImage: json["mission_image"],
        missionProgressDetails: json["mission_progress_details"] == null ? null : BackendMissionProgressDetails.fromJson(json["mission_progress_details"]),
        missionRequirement: MissionRequirement.fromJson(json["mission_requirement"]),
        missionTitle: json["mission_title"],
        missionType: json["mission_type"],
        rewardDetails: json["reward_details"] == null ? null : BackendRewardDetails.fromJson(json["reward_details"]),
        sortCreatedId: json["sort_created_id"]?.toDouble(),
    );

    Map<String, dynamic> toJson() => {
        "mission_description": missionDescription,
        "mission_id": missionId,
        "mission_image": missionImage,
        "mission_progress_details": missionProgressDetails?.toJson(),
        "mission_requirement": missionRequirement.toJson(),
        "mission_title": missionTitle,
        "mission_type": missionType,
        "reward_details": rewardDetails?.toJson(),
        "sort_created_id": sortCreatedId,
    };
}

class BackendMissionProgressDetails {
    bool missionProgressCompleted;
    double missionProgressCount;
    String? missionProgressCreatedAt;
    String? missionProgressId;
    double missionProgressRequired;
    bool missionProgressRewarded;
    String? missionProgressUpdatedAt;
    BackendRewardRedeemCodeModel? redeemCodeDetails;

    BackendMissionProgressDetails({
        required this.missionProgressCompleted,
        required this.missionProgressCount,
        this.missionProgressCreatedAt,
        this.missionProgressId,
        required this.missionProgressRequired,
        required this.missionProgressRewarded,
        this.missionProgressUpdatedAt,
        this.redeemCodeDetails,
    });

    factory BackendMissionProgressDetails.fromJson(Map<String, dynamic> json) => BackendMissionProgressDetails(
        missionProgressCompleted: json["mission_progress_completed"],
        missionProgressCount: json["mission_progress_count"]?.toDouble(),
        missionProgressCreatedAt: json["mission_progress_created_at"],
        missionProgressId: json["mission_progress_id"],
        missionProgressRequired: json["mission_progress_required"]?.toDouble(),
        missionProgressRewarded: json["mission_progress_rewarded"],
        missionProgressUpdatedAt: json["mission_progress_updated_at"],
        redeemCodeDetails: json["redeem_code_details"] == null ? null : BackendRewardRedeemCodeModel.fromJson(json["redeem_code_details"]),
    );

    Map<String, dynamic> toJson() => {
        "mission_progress_completed": missionProgressCompleted,
        "mission_progress_count": missionProgressCount,
        "mission_progress_created_at": missionProgressCreatedAt,
        "mission_progress_id": missionProgressId,
        "mission_progress_required": missionProgressRequired,
        "mission_progress_rewarded": missionProgressRewarded,
        "mission_progress_updated_at": missionProgressUpdatedAt,
        "redeem_code_details": redeemCodeDetails?.toJson(),
    };
}

class MissionRequirement {
    double count;

    MissionRequirement({
        required this.count,
    });

    factory MissionRequirement.fromJson(Map<String, dynamic> json) => MissionRequirement(
        count: json["count"]?.toDouble(),
    );

    Map<String, dynamic> toJson() => {
        "count": count,
    };
}


///make_payment completion payload (top-up/withdraw instructions)
class BackendPaymentCompletionData {
    String? account;
    double? amount;
    String? bank;
    String? code;
    String? expire;
    String? link;
    String? note;
    String? reference;

    BackendPaymentCompletionData({
        this.account,
        this.amount,
        this.bank,
        this.code,
        this.expire,
        this.link,
        this.note,
        this.reference,
    });

    factory BackendPaymentCompletionData.fromJson(Map<String, dynamic> json) => BackendPaymentCompletionData(
        account: json["account"],
        amount: json["amount"]?.toDouble(),
        bank: json["bank"],
        code: json["code"],
        expire: json["expire"],
        link: json["link"],
        note: json["note"],
        reference: json["reference"],
    );

    Map<String, dynamic> toJson() => {
        "account": account,
        "amount": amount,
        "bank": bank,
        "code": code,
        "expire": expire,
        "link": link,
        "note": note,
        "reference": reference,
    };
}


///fetch_top_up_methods / fetch_withdraw_methods row
class BackendPaymentMethodModel {
    String countryId;
    String countryIdentity;
    String countryPhoneCode;
    double countryPhoneDigit;
    bool paymentMethodBuyActive;
    bool paymentMethodBuyMultiple;
    String paymentMethodChecker;
    String paymentMethodId;
    String paymentMethodIdentity;
    String? paymentMethodImage;
    List<BackendPaymentNetworkModel> paymentMethodNetwork;
    bool paymentMethodSellActive;
    bool paymentMethodSellMultiple;
    String paymentWalletId;
    String sortCreatedId;

    BackendPaymentMethodModel({
        required this.countryId,
        required this.countryIdentity,
        required this.countryPhoneCode,
        required this.countryPhoneDigit,
        required this.paymentMethodBuyActive,
        required this.paymentMethodBuyMultiple,
        required this.paymentMethodChecker,
        required this.paymentMethodId,
        required this.paymentMethodIdentity,
        this.paymentMethodImage,
        required this.paymentMethodNetwork,
        required this.paymentMethodSellActive,
        required this.paymentMethodSellMultiple,
        required this.paymentWalletId,
        required this.sortCreatedId,
    });

    factory BackendPaymentMethodModel.fromJson(Map<String, dynamic> json) => BackendPaymentMethodModel(
        countryId: json["country_id"],
        countryIdentity: json["country_identity"],
        countryPhoneCode: json["country_phone_code"],
        countryPhoneDigit: json["country_phone_digit"]?.toDouble(),
        paymentMethodBuyActive: json["payment_method_buy_active"],
        paymentMethodBuyMultiple: json["payment_method_buy_multiple"],
        paymentMethodChecker: json["payment_method_checker"],
        paymentMethodId: json["payment_method_id"],
        paymentMethodIdentity: json["payment_method_identity"],
        paymentMethodImage: json["payment_method_image"],
        paymentMethodNetwork: List<BackendPaymentNetworkModel>.from(json["payment_method_network"].map((x) => BackendPaymentNetworkModel.fromJson(x))),
        paymentMethodSellActive: json["payment_method_sell_active"],
        paymentMethodSellMultiple: json["payment_method_sell_multiple"],
        paymentWalletId: json["payment_wallet_id"],
        sortCreatedId: json["sort_created_id"],
    );

    Map<String, dynamic> toJson() => {
        "country_id": countryId,
        "country_identity": countryIdentity,
        "country_phone_code": countryPhoneCode,
        "country_phone_digit": countryPhoneDigit,
        "payment_method_buy_active": paymentMethodBuyActive,
        "payment_method_buy_multiple": paymentMethodBuyMultiple,
        "payment_method_checker": paymentMethodChecker,
        "payment_method_id": paymentMethodId,
        "payment_method_identity": paymentMethodIdentity,
        "payment_method_image": paymentMethodImage,
        "payment_method_network": List<dynamic>.from(paymentMethodNetwork.map((x) => x.toJson())),
        "payment_method_sell_active": paymentMethodSellActive,
        "payment_method_sell_multiple": paymentMethodSellMultiple,
        "payment_wallet_id": paymentWalletId,
        "sort_created_id": sortCreatedId,
    };
}

class BackendPaymentNetworkModel {
    bool active;
    String identity;
    String? image;

    BackendPaymentNetworkModel({
        required this.active,
        required this.identity,
        this.image,
    });

    factory BackendPaymentNetworkModel.fromJson(Map<String, dynamic> json) => BackendPaymentNetworkModel(
        active: json["active"],
        identity: json["identity"],
        image: json["image"],
    );

    Map<String, dynamic> toJson() => {
        "active": active,
        "identity": identity,
        "image": image,
    };
}


///fetch_top_up_profiles / fetch_withdraw_profiles row
class BackendPaymentProfileModel {
    BackendPaymentDetails? paymentDetails;
    String paymentMethodId;
    String paymentProfileId;
    String sortCreatedId;
    String usersId;

    BackendPaymentProfileModel({
        this.paymentDetails,
        required this.paymentMethodId,
        required this.paymentProfileId,
        required this.sortCreatedId,
        required this.usersId,
    });

    factory BackendPaymentProfileModel.fromJson(Map<String, dynamic> json) => BackendPaymentProfileModel(
        paymentDetails: json["payment_details"] == null ? null : BackendPaymentDetails.fromJson(json["payment_details"]),
        paymentMethodId: json["payment_method_id"],
        paymentProfileId: json["payment_profile_id"],
        sortCreatedId: json["sort_created_id"],
        usersId: json["users_id"],
    );

    Map<String, dynamic> toJson() => {
        "payment_details": paymentDetails?.toJson(),
        "payment_method_id": paymentMethodId,
        "payment_profile_id": paymentProfileId,
        "sort_created_id": sortCreatedId,
        "users_id": usersId,
    };
}


///payment profile detail fields (all optional/nullable)
class BackendPaymentDetails {
    String? accountNumber;
    String? bankName;
    String? country;
    bool? directDebit;
    bool? eNaira;
    String? email;
    String? fullname;
    String? network;
    bool? opay;
    String? phone;
    bool? privateAccount;

    BackendPaymentDetails({
        this.accountNumber,
        this.bankName,
        this.country,
        this.directDebit,
        this.eNaira,
        this.email,
        this.fullname,
        this.network,
        this.opay,
        this.phone,
        this.privateAccount,
    });

    factory BackendPaymentDetails.fromJson(Map<String, dynamic> json) => BackendPaymentDetails(
        accountNumber: json["account_number"],
        bankName: json["bank_name"],
        country: json["country"],
        directDebit: json["direct_debit"],
        eNaira: json["e_naira"],
        email: json["email"],
        fullname: json["fullname"],
        network: json["network"],
        opay: json["opay"],
        phone: json["phone"],
        privateAccount: json["private_account"],
    );

    Map<String, dynamic> toJson() => {
        "account_number": accountNumber,
        "bank_name": bankName,
        "country": country,
        "direct_debit": directDebit,
        "e_naira": eNaira,
        "email": email,
        "fullname": fullname,
        "network": network,
        "opay": opay,
        "phone": phone,
        "private_account": privateAccount,
    };
}


///fetch_pool_members row
class BackendPoolMemberModel {
    double challengeQuestionCount;
    double poolsCompletedQuestionTrackerSize;
    double poolsCompletedQuestionTrackerTime;
    String poolsId;
    String poolsMembersCreatedAt;
    String poolsMembersId;
    bool poolsMembersIsUser;
    double? poolsMembersPaidAmount;
    double poolsMembersPoints;
    double poolsMembersPrice;
    double poolsMembersRank;
    String sortCreatedId;
    BackendPoolUserDetails usersDetails;

    BackendPoolMemberModel({
        required this.challengeQuestionCount,
        required this.poolsCompletedQuestionTrackerSize,
        required this.poolsCompletedQuestionTrackerTime,
        required this.poolsId,
        required this.poolsMembersCreatedAt,
        required this.poolsMembersId,
        required this.poolsMembersIsUser,
        this.poolsMembersPaidAmount,
        required this.poolsMembersPoints,
        required this.poolsMembersPrice,
        required this.poolsMembersRank,
        required this.sortCreatedId,
        required this.usersDetails,
    });

    factory BackendPoolMemberModel.fromJson(Map<String, dynamic> json) => BackendPoolMemberModel(
        challengeQuestionCount: json["challenge_question_count"]?.toDouble(),
        poolsCompletedQuestionTrackerSize: json["pools_completed_question_tracker_size"]?.toDouble(),
        poolsCompletedQuestionTrackerTime: json["pools_completed_question_tracker_time"]?.toDouble(),
        poolsId: json["pools_id"],
        poolsMembersCreatedAt: json["pools_members_created_at"],
        poolsMembersId: json["pools_members_id"],
        poolsMembersIsUser: json["pools_members_is_user"],
        poolsMembersPaidAmount: json["pools_members_paid_amount"]?.toDouble(),
        poolsMembersPoints: json["pools_members_points"]?.toDouble(),
        poolsMembersPrice: json["pools_members_price"]?.toDouble(),
        poolsMembersRank: json["pools_members_rank"]?.toDouble(),
        sortCreatedId: json["sort_created_id"],
        usersDetails: BackendPoolUserDetails.fromJson(json["users_details"]),
    );

    Map<String, dynamic> toJson() => {
        "challenge_question_count": challengeQuestionCount,
        "pools_completed_question_tracker_size": poolsCompletedQuestionTrackerSize,
        "pools_completed_question_tracker_time": poolsCompletedQuestionTrackerTime,
        "pools_id": poolsId,
        "pools_members_created_at": poolsMembersCreatedAt,
        "pools_members_id": poolsMembersId,
        "pools_members_is_user": poolsMembersIsUser,
        "pools_members_paid_amount": poolsMembersPaidAmount,
        "pools_members_points": poolsMembersPoints,
        "pools_members_price": poolsMembersPrice,
        "pools_members_rank": poolsMembersRank,
        "sort_created_id": sortCreatedId,
        "users_details": usersDetails.toJson(),
    };
}


///pool-member users_details (distinct from the transaction BackendUserDetails)
class BackendPoolUserDetails {
    BackendUserRoleDetails rolesDetails;
    String usersId;
    String? usersImage;
    String usersNames;
    String usersUsername;

    BackendPoolUserDetails({
        required this.rolesDetails,
        required this.usersId,
        this.usersImage,
        required this.usersNames,
        required this.usersUsername,
    });

    factory BackendPoolUserDetails.fromJson(Map<String, dynamic> json) => BackendPoolUserDetails(
        rolesDetails: BackendUserRoleDetails.fromJson(json["roles_details"]),
        usersId: json["users_id"],
        usersImage: json["users_image"],
        usersNames: json["users_names"],
        usersUsername: json["users_username"],
    );

    Map<String, dynamic> toJson() => {
        "roles_details": rolesDetails.toJson(),
        "users_id": usersId,
        "users_image": usersImage,
        "users_names": usersNames,
        "users_username": usersUsername,
    };
}

class BackendUserRoleDetails {
    String rolesId;
    String rolesIdentity;
    double rolesLevel;

    BackendUserRoleDetails({
        required this.rolesId,
        required this.rolesIdentity,
        required this.rolesLevel,
    });

    factory BackendUserRoleDetails.fromJson(Map<String, dynamic> json) => BackendUserRoleDetails(
        rolesId: json["roles_id"],
        rolesIdentity: json["roles_identity"],
        rolesLevel: json["roles_level"]?.toDouble(),
    );

    Map<String, dynamic> toJson() => {
        "roles_id": rolesId,
        "roles_identity": rolesIdentity,
        "roles_level": rolesLevel,
    };
}


///authorized_quiz_pool_questions / question-display pool question
class BackendPoolQuestion {
    List<BackendOptionModel> optionsData;
    List<String>? optionsSelected;
    String poolsQuestionId;
    BackendQuestionModel questionData;
    String? questionStatus;
    double? questionTime;
    BackendPoolTimeModel questionTimeData;
    BackendPoolTypeModel questionTypeData;

    BackendPoolQuestion({
        required this.optionsData,
        this.optionsSelected,
        required this.poolsQuestionId,
        required this.questionData,
        this.questionStatus,
        this.questionTime,
        required this.questionTimeData,
        required this.questionTypeData,
    });

    factory BackendPoolQuestion.fromJson(Map<String, dynamic> json) => BackendPoolQuestion(
        optionsData: List<BackendOptionModel>.from(json["options_data"].map((x) => BackendOptionModel.fromJson(x))),
        optionsSelected: json["options_selected"] == null ? [] : List<String>.from(json["options_selected"]!.map((x) => x)),
        poolsQuestionId: json["pools_question_id"],
        questionData: BackendQuestionModel.fromJson(json["question_data"]),
        questionStatus: json["question_status"],
        questionTime: json["question_time"]?.toDouble(),
        questionTimeData: BackendPoolTimeModel.fromJson(json["question_time_data"]),
        questionTypeData: BackendPoolTypeModel.fromJson(json["question_type_data"]),
    );

    Map<String, dynamic> toJson() => {
        "options_data": List<dynamic>.from(optionsData.map((x) => x.toJson())),
        "options_selected": optionsSelected == null ? [] : List<dynamic>.from(optionsSelected!.map((x) => x)),
        "pools_question_id": poolsQuestionId,
        "question_data": questionData.toJson(),
        "question_status": questionStatus,
        "question_time": questionTime,
        "question_time_data": questionTimeData.toJson(),
        "question_type_data": questionTypeData.toJson(),
    };
}

class BackendOptionModel {
    String optionsId;
    String optionsIdentity;
    String? optionsImage;
    double? optionsMax;
    double? optionsMin;
    bool optionsSelected;
    String? optionsUnit;

    BackendOptionModel({
        required this.optionsId,
        required this.optionsIdentity,
        this.optionsImage,
        this.optionsMax,
        this.optionsMin,
        required this.optionsSelected,
        this.optionsUnit,
    });

    factory BackendOptionModel.fromJson(Map<String, dynamic> json) => BackendOptionModel(
        optionsId: json["options_id"],
        optionsIdentity: json["options_identity"],
        optionsImage: json["options_image"],
        optionsMax: json["options_max"]?.toDouble(),
        optionsMin: json["options_min"]?.toDouble(),
        optionsSelected: json["options_selected"],
        optionsUnit: json["options_unit"],
    );

    Map<String, dynamic> toJson() => {
        "options_id": optionsId,
        "options_identity": optionsIdentity,
        "options_image": optionsImage,
        "options_max": optionsMax,
        "options_min": optionsMin,
        "options_selected": optionsSelected,
        "options_unit": optionsUnit,
    };
}

class BackendQuestionModel {
    String questionsId;
    String? questionsImage;
    String questionsText;

    BackendQuestionModel({
        required this.questionsId,
        this.questionsImage,
        required this.questionsText,
    });

    factory BackendQuestionModel.fromJson(Map<String, dynamic> json) => BackendQuestionModel(
        questionsId: json["questions_id"],
        questionsImage: json["questions_image"],
        questionsText: json["questions_text"],
    );

    Map<String, dynamic> toJson() => {
        "questions_id": questionsId,
        "questions_image": questionsImage,
        "questions_text": questionsText,
    };
}

class BackendPoolTimeModel {
    String questionTimeId;
    double questionTimeValue;

    BackendPoolTimeModel({
        required this.questionTimeId,
        required this.questionTimeValue,
    });

    factory BackendPoolTimeModel.fromJson(Map<String, dynamic> json) => BackendPoolTimeModel(
        questionTimeId: json["question_time_id"],
        questionTimeValue: json["question_time_value"]?.toDouble(),
    );

    Map<String, dynamic> toJson() => {
        "question_time_id": questionTimeId,
        "question_time_value": questionTimeValue,
    };
}

class BackendPoolTypeModel {
    String questionTypeId;
    String questionTypeIdentity;
    String questionTypeLocalIdentity;

    BackendPoolTypeModel({
        required this.questionTypeId,
        required this.questionTypeIdentity,
        required this.questionTypeLocalIdentity,
    });

    factory BackendPoolTypeModel.fromJson(Map<String, dynamic> json) => BackendPoolTypeModel(
        questionTypeId: json["question_type_id"],
        questionTypeIdentity: json["question_type_identity"],
        questionTypeLocalIdentity: json["question_type_local_identity"],
    );

    Map<String, dynamic> toJson() => {
        "question_type_id": questionTypeId,
        "question_type_identity": questionTypeIdentity,
        "question_type_local_identity": questionTypeLocalIdentity,
    };
}


///fetch_user_quiz_history row
class BackendQuizHistory {
    double challengeQuestionCount;
    double poolsCompletedQuestionTrackerSize;
    double poolsCompletedQuestionTrackerTime;
    double poolsDuration;
    String poolsId;
    String poolsMembersCreatedAt;
    double poolsMembersPaidAmount;
    double poolsMembersPoints;
    double poolsMembersRank;
    String sortCreatedId;
    String topicsIdentity;
    String? topicsImage;

    BackendQuizHistory({
        required this.challengeQuestionCount,
        required this.poolsCompletedQuestionTrackerSize,
        required this.poolsCompletedQuestionTrackerTime,
        required this.poolsDuration,
        required this.poolsId,
        required this.poolsMembersCreatedAt,
        required this.poolsMembersPaidAmount,
        required this.poolsMembersPoints,
        required this.poolsMembersRank,
        required this.sortCreatedId,
        required this.topicsIdentity,
        this.topicsImage,
    });

    factory BackendQuizHistory.fromJson(Map<String, dynamic> json) => BackendQuizHistory(
        challengeQuestionCount: json["challenge_question_count"]?.toDouble(),
        poolsCompletedQuestionTrackerSize: json["pools_completed_question_tracker_size"]?.toDouble(),
        poolsCompletedQuestionTrackerTime: json["pools_completed_question_tracker_time"]?.toDouble(),
        poolsDuration: json["pools_duration"]?.toDouble(),
        poolsId: json["pools_id"],
        poolsMembersCreatedAt: json["pools_members_created_at"],
        poolsMembersPaidAmount: json["pools_members_paid_amount"]?.toDouble(),
        poolsMembersPoints: json["pools_members_points"]?.toDouble(),
        poolsMembersRank: json["pools_members_rank"]?.toDouble(),
        sortCreatedId: json["sort_created_id"],
        topicsIdentity: json["topics_identity"],
        topicsImage: json["topics_image"],
    );

    Map<String, dynamic> toJson() => {
        "challenge_question_count": challengeQuestionCount,
        "pools_completed_question_tracker_size": poolsCompletedQuestionTrackerSize,
        "pools_completed_question_tracker_time": poolsCompletedQuestionTrackerTime,
        "pools_duration": poolsDuration,
        "pools_id": poolsId,
        "pools_members_created_at": poolsMembersCreatedAt,
        "pools_members_paid_amount": poolsMembersPaidAmount,
        "pools_members_points": poolsMembersPoints,
        "pools_members_rank": poolsMembersRank,
        "sort_created_id": sortCreatedId,
        "topics_identity": topicsIdentity,
        "topics_image": topicsImage,
    };
}


///get_users_redeem_code / get_code_data redeem code
class BackendRedeemCodeModel {
    double redeemCodeAmount;
    String? redeemCodeExpires;
    String redeemCodeId;
    String redeemCodeValue;
    bool redeemRuleBot;
    bool redeemRuleMid;
    bool redeemRuleRank1;
    bool redeemRuleRank2;
    bool redeemRuleRank3;
    bool redeemRuleTop;
    String sortCreatedId;

    BackendRedeemCodeModel({
        required this.redeemCodeAmount,
        this.redeemCodeExpires,
        required this.redeemCodeId,
        required this.redeemCodeValue,
        required this.redeemRuleBot,
        required this.redeemRuleMid,
        required this.redeemRuleRank1,
        required this.redeemRuleRank2,
        required this.redeemRuleRank3,
        required this.redeemRuleTop,
        required this.sortCreatedId,
    });

    factory BackendRedeemCodeModel.fromJson(Map<String, dynamic> json) => BackendRedeemCodeModel(
        redeemCodeAmount: json["redeem_code_amount"]?.toDouble(),
        redeemCodeExpires: json["redeem_code_expires"],
        redeemCodeId: json["redeem_code_id"],
        redeemCodeValue: json["redeem_code_value"],
        redeemRuleBot: json["redeem_rule_bot"],
        redeemRuleMid: json["redeem_rule_mid"],
        redeemRuleRank1: json["redeem_rule_rank1"],
        redeemRuleRank2: json["redeem_rule_rank2"],
        redeemRuleRank3: json["redeem_rule_rank3"],
        redeemRuleTop: json["redeem_rule_top"],
        sortCreatedId: json["sort_created_id"],
    );

    Map<String, dynamic> toJson() => {
        "redeem_code_amount": redeemCodeAmount,
        "redeem_code_expires": redeemCodeExpires,
        "redeem_code_id": redeemCodeId,
        "redeem_code_value": redeemCodeValue,
        "redeem_rule_bot": redeemRuleBot,
        "redeem_rule_mid": redeemRuleMid,
        "redeem_rule_rank1": redeemRuleRank1,
        "redeem_rule_rank2": redeemRuleRank2,
        "redeem_rule_rank3": redeemRuleRank3,
        "redeem_rule_top": redeemRuleTop,
        "sort_created_id": sortCreatedId,
    };
}


///claim_user_achievements / claim_user_mission reward_claim_details
class BackendRewardClaimModel {
    double rewardClaimAmount;
    BackendRewardRedeemCodeModel? rewardClaimRedeemCode;

    BackendRewardClaimModel({
        required this.rewardClaimAmount,
        this.rewardClaimRedeemCode,
    });

    factory BackendRewardClaimModel.fromJson(Map<String, dynamic> json) => BackendRewardClaimModel(
        rewardClaimAmount: json["reward_claim_amount"]?.toDouble(),
        rewardClaimRedeemCode: json["reward_claim_redeem_code"] == null ? null : BackendRewardRedeemCodeModel.fromJson(json["reward_claim_redeem_code"]),
    );

    Map<String, dynamic> toJson() => {
        "reward_claim_amount": rewardClaimAmount,
        "reward_claim_redeem_code": rewardClaimRedeemCode?.toJson(),
    };
}


///create_or_get_academix_profile / roles activation
class BackendRolesActivationData {
    bool rolesActivationActivated;
    double rolesActivationAmount;
    bool? rolesActivationIsFresh;
    String? transactionId;

    BackendRolesActivationData({
        required this.rolesActivationActivated,
        required this.rolesActivationAmount,
        this.rolesActivationIsFresh,
        this.transactionId,
    });

    factory BackendRolesActivationData.fromJson(Map<String, dynamic> json) => BackendRolesActivationData(
        rolesActivationActivated: json["roles_activation_activated"],
        rolesActivationAmount: json["roles_activation_amount"]?.toDouble(),
        rolesActivationIsFresh: json["roles_activation_is_fresh"],
        transactionId: json["transaction_id"],
    );

    Map<String, dynamic> toJson() => {
        "roles_activation_activated": rolesActivationActivated,
        "roles_activation_amount": rolesActivationAmount,
        "roles_activation_is_fresh": rolesActivationIsFresh,
        "transaction_id": transactionId,
    };
}


///fetch_withdraw_wallets / fetch_user_withdraw_wallets row
class BackendSellPaymentWalletModel {
    String paymentWalletCurrency;
    String paymentWalletId;
    String paymentWalletIdentity;
    String? paymentWalletImage;
    double paymentWalletSellFee;
    double paymentWalletSellFeeFlat;
    double paymentWalletSellMin;
    double paymentWalletSellRate;
    String paymentWalletSellRateType;
    String sortCreatedId;

    BackendSellPaymentWalletModel({
        required this.paymentWalletCurrency,
        required this.paymentWalletId,
        required this.paymentWalletIdentity,
        this.paymentWalletImage,
        required this.paymentWalletSellFee,
        required this.paymentWalletSellFeeFlat,
        required this.paymentWalletSellMin,
        required this.paymentWalletSellRate,
        required this.paymentWalletSellRateType,
        required this.sortCreatedId,
    });

    factory BackendSellPaymentWalletModel.fromJson(Map<String, dynamic> json) => BackendSellPaymentWalletModel(
        paymentWalletCurrency: json["payment_wallet_currency"],
        paymentWalletId: json["payment_wallet_id"],
        paymentWalletIdentity: json["payment_wallet_identity"],
        paymentWalletImage: json["payment_wallet_image"],
        paymentWalletSellFee: json["payment_wallet_sell_fee"]?.toDouble(),
        paymentWalletSellFeeFlat: json["payment_wallet_sell_fee_flat"]?.toDouble(),
        paymentWalletSellMin: json["payment_wallet_sell_min"]?.toDouble(),
        paymentWalletSellRate: json["payment_wallet_sell_rate"]?.toDouble(),
        paymentWalletSellRateType: json["payment_wallet_sell_rate_type"],
        sortCreatedId: json["sort_created_id"],
    );

    Map<String, dynamic> toJson() => {
        "payment_wallet_currency": paymentWalletCurrency,
        "payment_wallet_id": paymentWalletId,
        "payment_wallet_identity": paymentWalletIdentity,
        "payment_wallet_image": paymentWalletImage,
        "payment_wallet_sell_fee": paymentWalletSellFee,
        "payment_wallet_sell_fee_flat": paymentWalletSellFeeFlat,
        "payment_wallet_sell_min": paymentWalletSellMin,
        "payment_wallet_sell_rate": paymentWalletSellRate,
        "payment_wallet_sell_rate_type": paymentWalletSellRateType,
        "sort_created_id": sortCreatedId,
    };
}


///fetch_user_transactions / fetch_user_transaction_by_id transaction row
class BackendTransactionModel {
    BackendPaymentProfileDetails? paymentProfileReceiverDetails;
    BackendPaymentProfileDetails? paymentProfileSenderDetails;
    String? poolsId;
    String sortCreatedId;
    String transactionCreatedAt;
    double transactionFee;
    String transactionId;
    double transactionReceiverAmount;
    double transactionReceiverRate;
    String transactionReceiverStatus;
    double transactionSenderAmount;
    double transactionSenderRate;
    String transactionSenderReference;
    String transactionSenderStatus;
    String transactionType;

    BackendTransactionModel({
        this.paymentProfileReceiverDetails,
        this.paymentProfileSenderDetails,
        this.poolsId,
        required this.sortCreatedId,
        required this.transactionCreatedAt,
        required this.transactionFee,
        required this.transactionId,
        required this.transactionReceiverAmount,
        required this.transactionReceiverRate,
        required this.transactionReceiverStatus,
        required this.transactionSenderAmount,
        required this.transactionSenderRate,
        required this.transactionSenderReference,
        required this.transactionSenderStatus,
        required this.transactionType,
    });

    factory BackendTransactionModel.fromJson(Map<String, dynamic> json) => BackendTransactionModel(
        paymentProfileReceiverDetails: json["payment_profile_receiver_details"] == null ? null : BackendPaymentProfileDetails.fromJson(json["payment_profile_receiver_details"]),
        paymentProfileSenderDetails: json["payment_profile_sender_details"] == null ? null : BackendPaymentProfileDetails.fromJson(json["payment_profile_sender_details"]),
        poolsId: json["pools_id"],
        sortCreatedId: json["sort_created_id"],
        transactionCreatedAt: json["transaction_created_at"],
        transactionFee: json["transaction_fee"]?.toDouble(),
        transactionId: json["transaction_id"],
        transactionReceiverAmount: json["transaction_receiver_amount"]?.toDouble(),
        transactionReceiverRate: json["transaction_receiver_rate"]?.toDouble(),
        transactionReceiverStatus: json["transaction_receiver_status"],
        transactionSenderAmount: json["transaction_sender_amount"]?.toDouble(),
        transactionSenderRate: json["transaction_sender_rate"]?.toDouble(),
        transactionSenderReference: json["transaction_sender_reference"],
        transactionSenderStatus: json["transaction_sender_status"],
        transactionType: json["transaction_type"],
    );

    Map<String, dynamic> toJson() => {
        "payment_profile_receiver_details": paymentProfileReceiverDetails?.toJson(),
        "payment_profile_sender_details": paymentProfileSenderDetails?.toJson(),
        "pools_id": poolsId,
        "sort_created_id": sortCreatedId,
        "transaction_created_at": transactionCreatedAt,
        "transaction_fee": transactionFee,
        "transaction_id": transactionId,
        "transaction_receiver_amount": transactionReceiverAmount,
        "transaction_receiver_rate": transactionReceiverRate,
        "transaction_receiver_status": transactionReceiverStatus,
        "transaction_sender_amount": transactionSenderAmount,
        "transaction_sender_rate": transactionSenderRate,
        "transaction_sender_reference": transactionSenderReference,
        "transaction_sender_status": transactionSenderStatus,
        "transaction_type": transactionType,
    };
}

class BackendPaymentProfileDetails {
    BackendPaymentMethodDetails paymentMethodDetails;
    BackendPaymentWalletDetails paymentWalletDetails;
    BackendUserDetails usersDetails;

    BackendPaymentProfileDetails({
        required this.paymentMethodDetails,
        required this.paymentWalletDetails,
        required this.usersDetails,
    });

    factory BackendPaymentProfileDetails.fromJson(Map<String, dynamic> json) => BackendPaymentProfileDetails(
        paymentMethodDetails: BackendPaymentMethodDetails.fromJson(json["payment_method_details"]),
        paymentWalletDetails: BackendPaymentWalletDetails.fromJson(json["payment_wallet_details"]),
        usersDetails: BackendUserDetails.fromJson(json["users_details"]),
    );

    Map<String, dynamic> toJson() => {
        "payment_method_details": paymentMethodDetails.toJson(),
        "payment_wallet_details": paymentWalletDetails.toJson(),
        "users_details": usersDetails.toJson(),
    };
}

class BackendPaymentMethodDetails {
    String paymentMethodChecker;
    String paymentMethodId;
    String paymentMethodIdentity;

    BackendPaymentMethodDetails({
        required this.paymentMethodChecker,
        required this.paymentMethodId,
        required this.paymentMethodIdentity,
    });

    factory BackendPaymentMethodDetails.fromJson(Map<String, dynamic> json) => BackendPaymentMethodDetails(
        paymentMethodChecker: json["payment_method_checker"],
        paymentMethodId: json["payment_method_id"],
        paymentMethodIdentity: json["payment_method_identity"],
    );

    Map<String, dynamic> toJson() => {
        "payment_method_checker": paymentMethodChecker,
        "payment_method_id": paymentMethodId,
        "payment_method_identity": paymentMethodIdentity,
    };
}

class BackendPaymentWalletDetails {
    String paymentWalletCurrency;
    String paymentWalletId;
    String paymentWalletIdentity;

    BackendPaymentWalletDetails({
        required this.paymentWalletCurrency,
        required this.paymentWalletId,
        required this.paymentWalletIdentity,
    });

    factory BackendPaymentWalletDetails.fromJson(Map<String, dynamic> json) => BackendPaymentWalletDetails(
        paymentWalletCurrency: json["payment_wallet_currency"],
        paymentWalletId: json["payment_wallet_id"],
        paymentWalletIdentity: json["payment_wallet_identity"],
    );

    Map<String, dynamic> toJson() => {
        "payment_wallet_currency": paymentWalletCurrency,
        "payment_wallet_id": paymentWalletId,
        "payment_wallet_identity": paymentWalletIdentity,
    };
}

class BackendUserDetails {
    BackendPaymentDetails? paymentDetails;
    String? usersId;
    String usersNames;

    BackendUserDetails({
        this.paymentDetails,
        this.usersId,
        required this.usersNames,
    });

    factory BackendUserDetails.fromJson(Map<String, dynamic> json) => BackendUserDetails(
        paymentDetails: json["payment_details"] == null ? null : BackendPaymentDetails.fromJson(json["payment_details"]),
        usersId: json["users_id"],
        usersNames: json["users_names"],
    );

    Map<String, dynamic> toJson() => {
        "payment_details": paymentDetails?.toJson(),
        "users_id": usersId,
        "users_names": usersNames,
    };
}


///public.get_user_balance -> user_balance_details
class BackendUserBalanceModel {
    double usersBalanceAmount;
    String usersBalanceUpdatedAt;
    String usersId;

    BackendUserBalanceModel({
        required this.usersBalanceAmount,
        required this.usersBalanceUpdatedAt,
        required this.usersId,
    });

    factory BackendUserBalanceModel.fromJson(Map<String, dynamic> json) => BackendUserBalanceModel(
        usersBalanceAmount: json["users_balance_amount"]?.toDouble(),
        usersBalanceUpdatedAt: json["users_balance_updated_at"],
        usersId: json["users_id"],
    );

    Map<String, dynamic> toJson() => {
        "users_balance_amount": usersBalanceAmount,
        "users_balance_updated_at": usersBalanceUpdatedAt,
        "users_id": usersId,
    };
}


///get_user_record — the signed-in user profile
class BackendUserData {
    String countryId;
    BackendCountryData? countryTable;
    String languageId;
    BackendLanguageData? languageTable;
    BackendRoleData? rolesTable;
    String? transactionId;
    String usersCreatedAt;
    String usersDob;
    String usersEmail;
    String usersId;
    String? usersImage;
    String usersNames;
    String? usersPhone;
    BackendReferredUserData? usersReferredDetails;
    String? usersReferredId;
    dynamic usersRolesAccess;
    String usersSex;
    String usersUsername;
    bool usersVerified;

    BackendUserData({
        required this.countryId,
        this.countryTable,
        required this.languageId,
        this.languageTable,
        this.rolesTable,
        this.transactionId,
        required this.usersCreatedAt,
        required this.usersDob,
        required this.usersEmail,
        required this.usersId,
        this.usersImage,
        required this.usersNames,
        this.usersPhone,
        this.usersReferredDetails,
        this.usersReferredId,
        this.usersRolesAccess,
        required this.usersSex,
        required this.usersUsername,
        required this.usersVerified,
    });

    factory BackendUserData.fromJson(Map<String, dynamic> json) => BackendUserData(
        countryId: json["country_id"],
        countryTable: json["country_table"] == null ? null : BackendCountryData.fromJson(json["country_table"]),
        languageId: json["language_id"],
        languageTable: json["language_table"] == null ? null : BackendLanguageData.fromJson(json["language_table"]),
        rolesTable: json["roles_table"] == null ? null : BackendRoleData.fromJson(json["roles_table"]),
        transactionId: json["transaction_id"],
        usersCreatedAt: json["users_created_at"],
        usersDob: json["users_dob"],
        usersEmail: json["users_email"],
        usersId: json["users_id"],
        usersImage: json["users_image"],
        usersNames: json["users_names"],
        usersPhone: json["users_phone"],
        usersReferredDetails: json["users_referred_details"] == null ? null : BackendReferredUserData.fromJson(json["users_referred_details"]),
        usersReferredId: json["users_referred_id"],
        usersRolesAccess: json["users_roles_access"],
        usersSex: json["users_sex"],
        usersUsername: json["users_username"],
        usersVerified: json["users_verified"],
    );

    Map<String, dynamic> toJson() => {
        "country_id": countryId,
        "country_table": countryTable?.toJson(),
        "language_id": languageId,
        "language_table": languageTable?.toJson(),
        "roles_table": rolesTable?.toJson(),
        "transaction_id": transactionId,
        "users_created_at": usersCreatedAt,
        "users_dob": usersDob,
        "users_email": usersEmail,
        "users_id": usersId,
        "users_image": usersImage,
        "users_names": usersNames,
        "users_phone": usersPhone,
        "users_referred_details": usersReferredDetails?.toJson(),
        "users_referred_id": usersReferredId,
        "users_roles_access": usersRolesAccess,
        "users_sex": usersSex,
        "users_username": usersUsername,
        "users_verified": usersVerified,
    };
}

class BackendCountryData {
    String countryId;
    String countryIdentity;
    String countryImage;
    String countryTwoIsoCode;

    BackendCountryData({
        required this.countryId,
        required this.countryIdentity,
        required this.countryImage,
        required this.countryTwoIsoCode,
    });

    factory BackendCountryData.fromJson(Map<String, dynamic> json) => BackendCountryData(
        countryId: json["country_id"],
        countryIdentity: json["country_identity"],
        countryImage: json["country_image"],
        countryTwoIsoCode: json["country_two_iso_code"],
    );

    Map<String, dynamic> toJson() => {
        "country_id": countryId,
        "country_identity": countryIdentity,
        "country_image": countryImage,
        "country_two_iso_code": countryTwoIsoCode,
    };
}

class BackendLanguageData {
    String languageCode;
    String languageId;
    String languageIdentity;

    BackendLanguageData({
        required this.languageCode,
        required this.languageId,
        required this.languageIdentity,
    });

    factory BackendLanguageData.fromJson(Map<String, dynamic> json) => BackendLanguageData(
        languageCode: json["language_code"],
        languageId: json["language_id"],
        languageIdentity: json["language_identity"],
    );

    Map<String, dynamic> toJson() => {
        "language_code": languageCode,
        "language_id": languageId,
        "language_identity": languageIdentity,
    };
}

class BackendRoleData {
    String rolesChecker;
    String rolesId;
    double rolesLevel;

    BackendRoleData({
        required this.rolesChecker,
        required this.rolesId,
        required this.rolesLevel,
    });

    factory BackendRoleData.fromJson(Map<String, dynamic> json) => BackendRoleData(
        rolesChecker: json["roles_checker"],
        rolesId: json["roles_id"],
        rolesLevel: json["roles_level"]?.toDouble(),
    );

    Map<String, dynamic> toJson() => {
        "roles_checker": rolesChecker,
        "roles_id": rolesId,
        "roles_level": rolesLevel,
    };
}

class BackendReferredUserData {
    String? usersImage;
    String usersNames;
    String usersReferredId;
    String usersReferredStatus;
    String usersUsername;

    BackendReferredUserData({
        this.usersImage,
        required this.usersNames,
        required this.usersReferredId,
        required this.usersReferredStatus,
        required this.usersUsername,
    });

    factory BackendReferredUserData.fromJson(Map<String, dynamic> json) => BackendReferredUserData(
        usersImage: json["users_image"],
        usersNames: json["users_names"],
        usersReferredId: json["users_referred_id"],
        usersReferredStatus: json["users_referred_status"],
        usersUsername: json["users_username"],
    );

    Map<String, dynamic> toJson() => {
        "users_image": usersImage,
        "users_names": usersNames,
        "users_referred_id": usersReferredId,
        "users_referred_status": usersReferredStatus,
        "users_username": usersUsername,
    };
}


///fetch_available_quizzes / fetch_public_quizzes / get_active_quiz /
///get_public_auth_quiz_pool topic
class BackendUserDisplayQuizTopicModel {
    CreatorDetails creatorDetails;
    bool creatorIsFollowed;
    BackendQuizPool? poolsDetails;
    String sortCreatedId;
    String sortUpdatedId;
    bool topicIsPersonalised;
    String topicsCreatedAt;
    String? topicsDescription;
    String topicsId;
    String topicsIdentity;
    String? topicsImage;
    String? topicsSponsorship;
    String topicsUpdatedAt;

    BackendUserDisplayQuizTopicModel({
        required this.creatorDetails,
        required this.creatorIsFollowed,
        this.poolsDetails,
        required this.sortCreatedId,
        required this.sortUpdatedId,
        required this.topicIsPersonalised,
        required this.topicsCreatedAt,
        this.topicsDescription,
        required this.topicsId,
        required this.topicsIdentity,
        this.topicsImage,
        this.topicsSponsorship,
        required this.topicsUpdatedAt,
    });

    factory BackendUserDisplayQuizTopicModel.fromJson(Map<String, dynamic> json) => BackendUserDisplayQuizTopicModel(
        creatorDetails: CreatorDetails.fromJson(json["creator_details"]),
        creatorIsFollowed: json["creator_is_followed"],
        poolsDetails: json["pools_details"] == null ? null : BackendQuizPool.fromJson(json["pools_details"]),
        sortCreatedId: json["sort_created_id"],
        sortUpdatedId: json["sort_updated_id"],
        topicIsPersonalised: json["topic_is_personalised"],
        topicsCreatedAt: json["topics_created_at"],
        topicsDescription: json["topics_description"],
        topicsId: json["topics_id"],
        topicsIdentity: json["topics_identity"],
        topicsImage: json["topics_image"],
        topicsSponsorship: json["topics_sponsorship"],
        topicsUpdatedAt: json["topics_updated_at"],
    );

    Map<String, dynamic> toJson() => {
        "creator_details": creatorDetails.toJson(),
        "creator_is_followed": creatorIsFollowed,
        "pools_details": poolsDetails?.toJson(),
        "sort_created_id": sortCreatedId,
        "sort_updated_id": sortUpdatedId,
        "topic_is_personalised": topicIsPersonalised,
        "topics_created_at": topicsCreatedAt,
        "topics_description": topicsDescription,
        "topics_id": topicsId,
        "topics_identity": topicsIdentity,
        "topics_image": topicsImage,
        "topics_sponsorship": topicsSponsorship,
        "topics_updated_at": topicsUpdatedAt,
    };
}

class CreatorDetails {
    String usersId;
    String? usersImage;
    String usersNames;
    String usersUsername;

    CreatorDetails({
        required this.usersId,
        this.usersImage,
        required this.usersNames,
        required this.usersUsername,
    });

    factory CreatorDetails.fromJson(Map<String, dynamic> json) => CreatorDetails(
        usersId: json["users_id"],
        usersImage: json["users_image"],
        usersNames: json["users_names"],
        usersUsername: json["users_username"],
    );

    Map<String, dynamic> toJson() => {
        "users_id": usersId,
        "users_image": usersImage,
        "users_names": usersNames,
        "users_username": usersUsername,
    };
}

class BackendQuizPool {
    BackendChallengeModel? challengeDetails;
    bool? poolsAllowSubmission;
    String poolsAuth;
    String? poolsCode;
    String? poolsCompletedAt;
    double? poolsDuration;
    String? poolsGradedAt;
    String poolsId;
    String? poolsJob;
    String? poolsJobEndAt;
    String poolsLocale;
    double poolsMembersCount;
    String? poolsRankedAt;
    String? poolsRewardedAt;
    String? poolsStartingAt;
    String poolsStatus;
    bool poolsVisible;
    double questionTrackerCount;
    String sortCreatedId;
    String sortUpdatedId;

    BackendQuizPool({
        this.challengeDetails,
        this.poolsAllowSubmission,
        required this.poolsAuth,
        this.poolsCode,
        this.poolsCompletedAt,
        this.poolsDuration,
        this.poolsGradedAt,
        required this.poolsId,
        this.poolsJob,
        this.poolsJobEndAt,
        required this.poolsLocale,
        required this.poolsMembersCount,
        this.poolsRankedAt,
        this.poolsRewardedAt,
        this.poolsStartingAt,
        required this.poolsStatus,
        required this.poolsVisible,
        required this.questionTrackerCount,
        required this.sortCreatedId,
        required this.sortUpdatedId,
    });

    factory BackendQuizPool.fromJson(Map<String, dynamic> json) => BackendQuizPool(
        challengeDetails: json["challenge_details"] == null ? null : BackendChallengeModel.fromJson(json["challenge_details"]),
        poolsAllowSubmission: json["pools_allow_submission"],
        poolsAuth: json["pools_auth"],
        poolsCode: json["pools_code"],
        poolsCompletedAt: json["pools_completed_at"],
        poolsDuration: json["pools_duration"]?.toDouble(),
        poolsGradedAt: json["pools_graded_at"],
        poolsId: json["pools_id"],
        poolsJob: json["pools_job"],
        poolsJobEndAt: json["pools_job_end_at"],
        poolsLocale: json["pools_locale"],
        poolsMembersCount: json["pools_members_count"]?.toDouble(),
        poolsRankedAt: json["pools_ranked_at"],
        poolsRewardedAt: json["pools_rewarded_at"],
        poolsStartingAt: json["pools_starting_at"],
        poolsStatus: json["pools_status"],
        poolsVisible: json["pools_visible"],
        questionTrackerCount: json["question_tracker_count"]?.toDouble(),
        sortCreatedId: json["sort_created_id"],
        sortUpdatedId: json["sort_updated_id"],
    );

    Map<String, dynamic> toJson() => {
        "challenge_details": challengeDetails?.toJson(),
        "pools_allow_submission": poolsAllowSubmission,
        "pools_auth": poolsAuth,
        "pools_code": poolsCode,
        "pools_completed_at": poolsCompletedAt,
        "pools_duration": poolsDuration,
        "pools_graded_at": poolsGradedAt,
        "pools_id": poolsId,
        "pools_job": poolsJob,
        "pools_job_end_at": poolsJobEndAt,
        "pools_locale": poolsLocale,
        "pools_members_count": poolsMembersCount,
        "pools_ranked_at": poolsRankedAt,
        "pools_rewarded_at": poolsRewardedAt,
        "pools_starting_at": poolsStartingAt,
        "pools_status": poolsStatus,
        "pools_visible": poolsVisible,
        "question_tracker_count": questionTrackerCount,
        "sort_created_id": sortCreatedId,
        "sort_updated_id": sortUpdatedId,
    };
}

class BackendChallengeModel {
    double challengeBotShare;
    double challengeDevelopmentCharge;
    String challengeId;
    String challengeIdentity;
    double challengeMaxParticipants;
    double challengeMidShare;
    double challengeMinParticipants;
    double challengePrice;
    double challengeQuestionCount;
    double challengeTopShare;
    double? challengeWaitingTime;
    BackendGameModeModel? gameModeDetails;

    BackendChallengeModel({
        required this.challengeBotShare,
        required this.challengeDevelopmentCharge,
        required this.challengeId,
        required this.challengeIdentity,
        required this.challengeMaxParticipants,
        required this.challengeMidShare,
        required this.challengeMinParticipants,
        required this.challengePrice,
        required this.challengeQuestionCount,
        required this.challengeTopShare,
        this.challengeWaitingTime,
        this.gameModeDetails,
    });

    factory BackendChallengeModel.fromJson(Map<String, dynamic> json) => BackendChallengeModel(
        challengeBotShare: json["challenge_bot_share"]?.toDouble(),
        challengeDevelopmentCharge: json["challenge_development_charge"]?.toDouble(),
        challengeId: json["challenge_id"],
        challengeIdentity: json["challenge_identity"],
        challengeMaxParticipants: json["challenge_max_participants"]?.toDouble(),
        challengeMidShare: json["challenge_mid_share"]?.toDouble(),
        challengeMinParticipants: json["challenge_min_participants"]?.toDouble(),
        challengePrice: json["challenge_price"]?.toDouble(),
        challengeQuestionCount: json["challenge_question_count"]?.toDouble(),
        challengeTopShare: json["challenge_top_share"]?.toDouble(),
        challengeWaitingTime: json["challenge_waiting_time"]?.toDouble(),
        gameModeDetails: json["game_mode_details"] == null ? null : BackendGameModeModel.fromJson(json["game_mode_details"]),
    );

    Map<String, dynamic> toJson() => {
        "challenge_bot_share": challengeBotShare,
        "challenge_development_charge": challengeDevelopmentCharge,
        "challenge_id": challengeId,
        "challenge_identity": challengeIdentity,
        "challenge_max_participants": challengeMaxParticipants,
        "challenge_mid_share": challengeMidShare,
        "challenge_min_participants": challengeMinParticipants,
        "challenge_price": challengePrice,
        "challenge_question_count": challengeQuestionCount,
        "challenge_top_share": challengeTopShare,
        "challenge_waiting_time": challengeWaitingTime,
        "game_mode_details": gameModeDetails?.toJson(),
    };
}

class BackendGameModeModel {
    String gameModeChecker;
    String gameModeId;
    String gameModeIdentity;

    BackendGameModeModel({
        required this.gameModeChecker,
        required this.gameModeId,
        required this.gameModeIdentity,
    });

    factory BackendGameModeModel.fromJson(Map<String, dynamic> json) => BackendGameModeModel(
        gameModeChecker: json["game_mode_checker"],
        gameModeId: json["game_mode_id"],
        gameModeIdentity: json["game_mode_identity"],
    );

    Map<String, dynamic> toJson() => {
        "game_mode_checker": gameModeChecker,
        "game_mode_id": gameModeId,
        "game_mode_identity": gameModeIdentity,
    };
}


///get_user_engagement -> user_engagement_details
class BackendUserEngagementModel {
    BackendHomeEngagementProgress userEngagementProgressPointsDetails;
    double userEngagementProgressQuestions;
    double userEngagementProgressQuizCount;
    double userEngagementProgressTime;
    double userEngagementProgressWinCount;
    double userEngagementTotalQuestions;
    double userEngagementTotalTime;

    BackendUserEngagementModel({
        required this.userEngagementProgressPointsDetails,
        required this.userEngagementProgressQuestions,
        required this.userEngagementProgressQuizCount,
        required this.userEngagementProgressTime,
        required this.userEngagementProgressWinCount,
        required this.userEngagementTotalQuestions,
        required this.userEngagementTotalTime,
    });

    factory BackendUserEngagementModel.fromJson(Map<String, dynamic> json) => BackendUserEngagementModel(
        userEngagementProgressPointsDetails: BackendHomeEngagementProgress.fromJson(json["user_engagement_progress_points_details"]),
        userEngagementProgressQuestions: json["user_engagement_progress_questions"]?.toDouble(),
        userEngagementProgressQuizCount: json["user_engagement_progress_quiz_count"]?.toDouble(),
        userEngagementProgressTime: json["user_engagement_progress_time"]?.toDouble(),
        userEngagementProgressWinCount: json["user_engagement_progress_win_count"]?.toDouble(),
        userEngagementTotalQuestions: json["user_engagement_total_questions"]?.toDouble(),
        userEngagementTotalTime: json["user_engagement_total_time"]?.toDouble(),
    );

    Map<String, dynamic> toJson() => {
        "user_engagement_progress_points_details": userEngagementProgressPointsDetails.toJson(),
        "user_engagement_progress_questions": userEngagementProgressQuestions,
        "user_engagement_progress_quiz_count": userEngagementProgressQuizCount,
        "user_engagement_progress_time": userEngagementProgressTime,
        "user_engagement_progress_win_count": userEngagementProgressWinCount,
        "user_engagement_total_questions": userEngagementTotalQuestions,
        "user_engagement_total_time": userEngagementTotalTime,
    };
}

class BackendHomeEngagementProgress {
    double currentPoints;
    double currentProgressPercent;
    double engagementLevelsId;
    String engagementLevelsIdentity;
    double nextEngagementLevelsId;
    String nextEngagementLevelsIdentity;
    double pointsToNextLevel;

    BackendHomeEngagementProgress({
        required this.currentPoints,
        required this.currentProgressPercent,
        required this.engagementLevelsId,
        required this.engagementLevelsIdentity,
        required this.nextEngagementLevelsId,
        required this.nextEngagementLevelsIdentity,
        required this.pointsToNextLevel,
    });

    factory BackendHomeEngagementProgress.fromJson(Map<String, dynamic> json) => BackendHomeEngagementProgress(
        currentPoints: json["current_points"]?.toDouble(),
        currentProgressPercent: json["current_progress_percent"]?.toDouble(),
        engagementLevelsId: json["engagement_levels_id"]?.toDouble(),
        engagementLevelsIdentity: json["engagement_levels_identity"],
        nextEngagementLevelsId: json["next_engagement_levels_id"]?.toDouble(),
        nextEngagementLevelsIdentity: json["next_engagement_levels_identity"],
        pointsToNextLevel: json["points_to_next_level"]?.toDouble(),
    );

    Map<String, dynamic> toJson() => {
        "current_points": currentPoints,
        "current_progress_percent": currentProgressPercent,
        "engagement_levels_id": engagementLevelsId,
        "engagement_levels_identity": engagementLevelsIdentity,
        "next_engagement_levels_id": nextEngagementLevelsId,
        "next_engagement_levels_identity": nextEngagementLevelsIdentity,
        "points_to_next_level": pointsToNextLevel,
    };
}


///public.get_user_balance response envelope
class GetUserBalanceResponse {
    String? error;
    String? status;
    BackendUserBalanceModel? userBalanceDetails;

    GetUserBalanceResponse({
        this.error,
        required this.status,
        required this.userBalanceDetails,
    });

    factory GetUserBalanceResponse.fromJson(Map<String, dynamic> json) => GetUserBalanceResponse(
        error: json["error"],
        status: json["status"],
        userBalanceDetails: json["user_balance_details"] == null ? null : BackendUserBalanceModel.fromJson(json["user_balance_details"]),
    );

    Map<String, dynamic> toJson() => {
        "error": error,
        "status": status,
        "user_balance_details": userBalanceDetails?.toJson(),
    };
}
