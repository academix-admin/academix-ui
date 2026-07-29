// To parse this JSON data, do
//
//     final academixContracts = academixContractsFromJson(jsonString);

import 'dart:convert';

AcademixContracts academixContractsFromJson(String str) => AcademixContracts.fromJson(json.decode(str));

String academixContractsToJson(AcademixContracts data) => json.encode(data.toJson());


///SINGLE SOURCE for Academix RPC/Lambda wire contracts. Every response + nested wire type
///is a key under `definitions` (the key IS the generated type name). The root just
///references them all so the generator emits every type. Author each shape from its
///function's RETURN builder; regenerate TS + Dart from here.
class AcademixContracts {
    GetUserBalanceResponse? getUserBalanceResponse;

    AcademixContracts({
        this.getUserBalanceResponse,
    });

    factory AcademixContracts.fromJson(Map<String, dynamic> json) => AcademixContracts(
        getUserBalanceResponse: json["getUserBalanceResponse"] == null ? null : GetUserBalanceResponse.fromJson(json["getUserBalanceResponse"]),
    );

    Map<String, dynamic> toJson() => {
        "getUserBalanceResponse": getUserBalanceResponse?.toJson(),
    };
}

class GetUserBalanceResponse {
    String? error;
    String? status;
    UserBalanceWire? userBalanceDetails;

    GetUserBalanceResponse({
        this.error,
        required this.status,
        required this.userBalanceDetails,
    });

    factory GetUserBalanceResponse.fromJson(Map<String, dynamic> json) => GetUserBalanceResponse(
        error: json["error"],
        status: json["status"],
        userBalanceDetails: json["user_balance_details"] == null ? null : UserBalanceWire.fromJson(json["user_balance_details"]),
    );

    Map<String, dynamic> toJson() => {
        "error": error,
        "status": status,
        "user_balance_details": userBalanceDetails?.toJson(),
    };
}


///public.get_user_balance RETURN builder
class UserBalanceWire {
    double usersBalanceAmount;
    String usersBalanceUpdatedAt;
    String usersId;

    UserBalanceWire({
        required this.usersBalanceAmount,
        required this.usersBalanceUpdatedAt,
        required this.usersId,
    });

    factory UserBalanceWire.fromJson(Map<String, dynamic> json) => UserBalanceWire(
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
