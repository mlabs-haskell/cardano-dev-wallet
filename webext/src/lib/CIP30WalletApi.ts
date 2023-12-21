export enum NetworkId {
  Mainnet = 1,
  Testnet = 0,
}

/**
 * A hex-encoded string representing a CBOR encoded value.
 */
export type CborHexStr = string;

/** A hex-encoded string representing an address. */
export type AddressHexStr = string;

/** A hex-encoded string or a Bech32 string representing an address. */
export type AddressInputStr = string;

/** A hex-encoded string of the corresponding bytes. */
export type Bytes = string;
export type PaymentAddress = string;
export type DRepID = string;

/**
 * `page` is zero indexed.
 */
export type Paginate = { page: number; limit: number };

export type CIP30WalletApiExtension = { cip: number };

export interface Cip30DataSignature {
  key: Bytes;
  signature: Bytes;
}

export interface CIP30WalletApi {
  getNetworkId(): Promise<NetworkId>;

  getUtxos(
    amount?: CborHexStr,
    paginate?: Paginate
  ): Promise<CborHexStr[] | null>;

  getBalance(): Promise<CborHexStr>;

  getCollateral(params?: { amount: CborHexStr }): Promise<CborHexStr[] | null>;

  getExtensions(): Promise<CIP30WalletApiExtension[]>;

  getUsedAddresses(paginate?: Paginate): Promise<AddressHexStr[]>;

  getUnusedAddresses(): Promise<AddressHexStr[]>;

  getChangeAddress(): Promise<AddressHexStr>;

  getRewardAddresses(): Promise<AddressHexStr[]>;

  signTx(tx: CborHexStr, partialSign?: boolean): Promise<CborHexStr>;

  signData(
    addr: PaymentAddress | DRepID | Bytes,
    payload: Bytes
  ): Promise<Cip30DataSignature>;

  submitTx(tx: CborHexStr): Promise<string>;
}
