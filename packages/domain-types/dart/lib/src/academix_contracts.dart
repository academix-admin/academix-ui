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
    BackendDailyPerformance? backendDailyPerformance;
    BackendDailyStreaksModel? backendDailyStreaksModel;
    BackendFriendsModel? backendFriendsModel;
    BackendGiveBackModel? backendGiveBackModel;
    BackendMissionData? backendMissionData;
    BackendMissionModel? backendMissionModel;
    BackendPaymentCompletionData? backendPaymentCompletionData;
    BackendQuizHistory? backendQuizHistory;
    BackendRedeemCodeModel? backendRedeemCodeModel;
    BackendRewardClaimModel? backendRewardClaimModel;
    BackendRolesActivationData? backendRolesActivationData;
    BackendTransactionModel? backendTransactionModel;
    BackendUserBalanceModel? backendUserBalanceModel;
    BackendUserEngagementModel? backendUserEngagementModel;
    GetUserBalanceResponse? getUserBalanceResponse;

    AcademixContracts({
        this.backendAchievementsData,
        this.backendAchievementsModel,
        this.backendDailyPerformance,
        this.backendDailyStreaksModel,
        this.backendFriendsModel,
        this.backendGiveBackModel,
        this.backendMissionData,
        this.backendMissionModel,
        this.backendPaymentCompletionData,
        this.backendQuizHistory,
        this.backendRedeemCodeModel,
        this.backendRewardClaimModel,
        this.backendRolesActivationData,
        this.backendTransactionModel,
        this.backendUserBalanceModel,
        this.backendUserEngagementModel,
        this.getUserBalanceResponse,
    });

    factory AcademixContracts.fromJson(Map<String, dynamic> json) => AcademixContracts(
        backendAchievementsData: json["backendAchievementsData"] == null ? null : BackendAchievementsData.fromJson(json["backendAchievementsData"]),
        backendAchievementsModel: json["backendAchievementsModel"] == null ? null : BackendAchievementsModel.fromJson(json["backendAchievementsModel"]),
        backendDailyPerformance: json["backendDailyPerformance"] == null ? null : BackendDailyPerformance.fromJson(json["backendDailyPerformance"]),
        backendDailyStreaksModel: json["backendDailyStreaksModel"] == null ? null : BackendDailyStreaksModel.fromJson(json["backendDailyStreaksModel"]),
        backendFriendsModel: json["backendFriendsModel"] == null ? null : BackendFriendsModel.fromJson(json["backendFriendsModel"]),
        backendGiveBackModel: json["backendGiveBackModel"] == null ? null : BackendGiveBackModel.fromJson(json["backendGiveBackModel"]),
        backendMissionData: json["backendMissionData"] == null ? null : BackendMissionData.fromJson(json["backendMissionData"]),
        backendMissionModel: json["backendMissionModel"] == null ? null : BackendMissionModel.fromJson(json["backendMissionModel"]),
        backendPaymentCompletionData: json["backendPaymentCompletionData"] == null ? null : BackendPaymentCompletionData.fromJson(json["backendPaymentCompletionData"]),
        backendQuizHistory: json["backendQuizHistory"] == null ? null : BackendQuizHistory.fromJson(json["backendQuizHistory"]),
        backendRedeemCodeModel: json["backendRedeemCodeModel"] == null ? null : BackendRedeemCodeModel.fromJson(json["backendRedeemCodeModel"]),
        backendRewardClaimModel: json["backendRewardClaimModel"] == null ? null : BackendRewardClaimModel.fromJson(json["backendRewardClaimModel"]),
        backendRolesActivationData: json["backendRolesActivationData"] == null ? null : BackendRolesActivationData.fromJson(json["backendRolesActivationData"]),
        backendTransactionModel: json["backendTransactionModel"] == null ? null : BackendTransactionModel.fromJson(json["backendTransactionModel"]),
        backendUserBalanceModel: json["backendUserBalanceModel"] == null ? null : BackendUserBalanceModel.fromJson(json["backendUserBalanceModel"]),
        backendUserEngagementModel: json["backendUserEngagementModel"] == null ? null : BackendUserEngagementModel.fromJson(json["backendUserEngagementModel"]),
        getUserBalanceResponse: json["getUserBalanceResponse"] == null ? null : GetUserBalanceResponse.fromJson(json["getUserBalanceResponse"]),
    );

    Map<String, dynamic> toJson() => {
        "backendAchievementsData": backendAchievementsData?.toJson(),
        "backendAchievementsModel": backendAchievementsModel?.toJson(),
        "backendDailyPerformance": backendDailyPerformance?.toJson(),
        "backendDailyStreaksModel": backendDailyStreaksModel?.toJson(),
        "backendFriendsModel": backendFriendsModel?.toJson(),
        "backendGiveBackModel": backendGiveBackModel?.toJson(),
        "backendMissionData": backendMissionData?.toJson(),
        "backendMissionModel": backendMissionModel?.toJson(),
        "backendPaymentCompletionData": backendPaymentCompletionData?.toJson(),
        "backendQuizHistory": backendQuizHistory?.toJson(),
        "backendRedeemCodeModel": backendRedeemCodeModel?.toJson(),
        "backendRewardClaimModel": backendRewardClaimModel?.toJson(),
        "backendRolesActivationData": backendRolesActivationData?.toJson(),
        "backendTransactionModel": backendTransactionModel?.toJson(),
        "backendUserBalanceModel": backendUserBalanceModel?.toJson(),
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
