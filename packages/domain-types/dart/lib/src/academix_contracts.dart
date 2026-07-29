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
    BackendDailyPerformance? backendDailyPerformance;
    BackendDailyStreaksModel? backendDailyStreaksModel;
    BackendTransactionModel? backendTransactionModel;
    BackendUserBalanceModel? backendUserBalanceModel;
    BackendUserEngagementModel? backendUserEngagementModel;
    GetUserBalanceResponse? getUserBalanceResponse;

    AcademixContracts({
        this.backendDailyPerformance,
        this.backendDailyStreaksModel,
        this.backendTransactionModel,
        this.backendUserBalanceModel,
        this.backendUserEngagementModel,
        this.getUserBalanceResponse,
    });

    factory AcademixContracts.fromJson(Map<String, dynamic> json) => AcademixContracts(
        backendDailyPerformance: json["backendDailyPerformance"] == null ? null : BackendDailyPerformance.fromJson(json["backendDailyPerformance"]),
        backendDailyStreaksModel: json["backendDailyStreaksModel"] == null ? null : BackendDailyStreaksModel.fromJson(json["backendDailyStreaksModel"]),
        backendTransactionModel: json["backendTransactionModel"] == null ? null : BackendTransactionModel.fromJson(json["backendTransactionModel"]),
        backendUserBalanceModel: json["backendUserBalanceModel"] == null ? null : BackendUserBalanceModel.fromJson(json["backendUserBalanceModel"]),
        backendUserEngagementModel: json["backendUserEngagementModel"] == null ? null : BackendUserEngagementModel.fromJson(json["backendUserEngagementModel"]),
        getUserBalanceResponse: json["getUserBalanceResponse"] == null ? null : GetUserBalanceResponse.fromJson(json["getUserBalanceResponse"]),
    );

    Map<String, dynamic> toJson() => {
        "backendDailyPerformance": backendDailyPerformance?.toJson(),
        "backendDailyStreaksModel": backendDailyStreaksModel?.toJson(),
        "backendTransactionModel": backendTransactionModel?.toJson(),
        "backendUserBalanceModel": backendUserBalanceModel?.toJson(),
        "backendUserEngagementModel": backendUserEngagementModel?.toJson(),
        "getUserBalanceResponse": getUserBalanceResponse?.toJson(),
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
