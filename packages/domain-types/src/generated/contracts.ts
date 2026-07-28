/**
 * SINGLE SOURCE for Academix RPC/Lambda wire contracts. Every response + nested wire type
 * is a key under `definitions` (the key IS the generated type name). The root just
 * references them all so the generator emits every type. Author each shape from its
 * function's RETURN builder; regenerate TS + Dart from here.
 */
export interface AcademixContracts {
    getUserBalanceResponse?: GetUserBalanceResponse;
}

export interface GetUserBalanceResponse {
    error?:               null | string;
    status:               null | string;
    user_balance_details: UserBalanceWire | null;
}

/**
 * public.get_user_balance RETURN builder
 */
export interface UserBalanceWire {
    users_balance_amount:     number;
    users_balance_updated_at: string;
    users_id:                 string;
}
