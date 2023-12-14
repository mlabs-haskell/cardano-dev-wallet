// Error Types

export type PaginateError = {
  maxSize: number;
};

export type APIError = {
  code: APIErrorCode;
  info: string;
};

export type DataSignError = {
  code: DataSignErrorCode;
  info: string;
};

export type TxSendError = {
  code: TxSendErrorCode;
  info: string;
};

export type TxSignError = {
  code: TxSignErrorCode;
  info: string;
};

export enum APIErrorCode {
  InvalidRequest = -1,
  InternalError = -2,
  Refused = -3,
  AccountChange = -4,
}

export enum DataSignErrorCode {
  ProofGeneration = 1,
  AddressNotPK = 2,
  UserDeclined = 3,
}

export enum TxSendErrorCode {
  Refused = 1,
  Failure = 2,
}

export enum TxSignErrorCode {
  ProofGeneration = 1,
  UserDeclined = 2,
}
