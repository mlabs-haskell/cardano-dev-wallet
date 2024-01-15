import * as CSL from "@emurgo/cardano-serialization-lib-browser";

import {
  WalletApiExtension,
  CborHexStr,
  AddressHexStr,
  Paginate,
  HexStr,
  DataSignature,
  AddressInputStr,
  NetworkId,
  WalletApiInternal,
  APIError,
  APIErrorCode,
  NetworkName,
} from ".";
import { State } from "./State";

function jsonReplacerCSL(_key: string, value: any) {
  if (value.to_json != undefined) {
    return value.to_json();
  }
  return value;
}

class WalletApi {
  api: WalletApiInternal;
  state: State;
  network: NetworkName;
  accountId: string;

  constructor(api: WalletApiInternal, state: State, accountId: string, network: NetworkName) {
    this.api = api;
    this.state = state;
    this.network = network;
    this.accountId = accountId;
  }

  async ensureAccountNotChanged() {
    let activeNetwork = await this.state.activeNetworkGet();
    if (activeNetwork != this.network) {
      let err: APIError = {
        code: APIErrorCode.AccountChange,
        info: "Account was changed by the user. Please reconnect to the Wallet",
      };
      throw err;
    }

    let activeAccountId = await this.state.accountsGetActive(activeNetwork);
    if (activeAccountId != this.accountId) {
      let err: APIError = {
        code: APIErrorCode.AccountChange,
        info: "Account was changed by the user. Please reconnect to the Wallet",
      };
      throw err;
    }
  }

  async logCall(fn: string, params: readonly any[] = []): Promise<number> {
    let activeNetwork = await this.state.activeNetworkGet();
    let log =
      fn +
      "(" +
      params.map((p) => JSON.stringify(p, jsonReplacerCSL)).join(", ") +
      ")";
    return this.state.callLogsPush(activeNetwork, null, log);
  }

  async logReturn(idx: number, value: any) {
    let activeNetwork = await this.state.activeNetworkGet();
    let log = "=> " + JSON.stringify(value, jsonReplacerCSL);
    await this.state.callLogsPush(activeNetwork, idx, log);
  }

  async logError(idx: number, error: any) {
    let activeNetwork = await this.state.activeNetworkGet();
    let log = "=> " + JSON.stringify(error, jsonReplacerCSL);
    await this.state.callLogsPush(activeNetwork, idx, log);
  }

  async wrapCall<T extends unknown[], U>(
    fnName: string,
    fn: (...args: T) => Promise<U>,
    args: T = [] as unknown[] as T,
  ) {
    let idx = await this.logCall(fnName, args);
    try {
      await this.ensureAccountNotChanged();

      let ret = await fn(...args);
      this.logReturn(idx, ret);
      return ret;
    } catch (e) {
      this.logError(idx, e);
      throw e;
    }
  }

  async getNetworkId(): Promise<NetworkId> {
    return this.wrapCall("getNetworkId", this.api.getNetworkId);
  }

  async getExtensions(): Promise<WalletApiExtension[]> {
    return this.wrapCall("getExtensions", this.api.getExtensions);
  }

  async getUtxos(
    amount?: CborHexStr,
    paginate?: Paginate,
  ): Promise<CborHexStr[] | null> {
    let params: [CSL.Value | undefined, Paginate | undefined] = [
      amount == null ? amount : CSL.Value.from_hex(amount),
      paginate,
    ];
    let utxos = await this.wrapCall("getUtxos", this.api.getUtxos, params);
    if (utxos == null) return null;
    return utxos.map((utxo) => utxo.to_hex());
  }

  async getBalance(): Promise<CborHexStr> {
    let balance = await this.wrapCall("getBalance", this.api.getBalance);
    return balance.to_hex();
  }

  async getCollateral(params?: {
    amount: CborHexStr;
  }): Promise<CborHexStr[] | null> {
    let paramsTyped: [params?: { amount: CSL.BigNum }] = [];
    if (params != null) {
      let amount = CSL.BigNum.from_hex(params.amount);

      paramsTyped.push({
        amount,
      });
    }

    let collaterals = await this.wrapCall(
      "getCollateral",
      this.api.getCollateral,
      paramsTyped,
    );
    return collaterals == null ? null : collaterals.map((c) => c.to_hex());
  }

  async getUsedAddresses(paginate?: Paginate): Promise<AddressHexStr[]> {
    return this.wrapCall("getUsedAddresses", this.api.getUsedAddresses, [
      paginate,
    ]).then((addresses) => addresses.map((address) => address.to_hex()));
  }

  async getUnusedAddresses(): Promise<AddressHexStr[]> {
    return this.wrapCall(
      "getUnusedAddresses",
      this.api.getUnusedAddresses,
    ).then((addresses) => addresses.map((address) => address.to_hex()));
  }

  async getChangeAddress(): Promise<AddressHexStr> {
    return this.wrapCall("getChangeAddress", this.api.getChangeAddress).then(
      (address) => address.to_hex(),
    );
  }

  async getRewardAddresses(): Promise<AddressHexStr[]> {
    return this.wrapCall(
      "getRewardAddresses",
      this.api.getRewardAddresses,
    ).then((addresses) => addresses.map((address) => address.to_hex()));
  }

  async signTx(
    tx: CborHexStr,
    partialSign: boolean = false,
  ): Promise<CborHexStr> {
    return this.wrapCall("signTx", this.api.signTx, [
      CSL.Transaction.from_hex(tx),
      partialSign,
    ]).then((signedTx) => signedTx.to_hex());
  }

  async signData(
    addr: AddressInputStr,
    payload: HexStr,
  ): Promise<DataSignature> {
    let addrParsed: CSL.Address | null = null;
    try {
      addrParsed = CSL.Address.from_bech32(addr);
    } catch (e) {
      // not a bech32 address, try hex
    }
    if (addrParsed == null) {
      addrParsed = CSL.Address.from_hex(addr);
    }
    return this.wrapCall("signData", this.api.signData, [addrParsed, payload]);
  }

  async submitTx(tx: CborHexStr): Promise<string> {
    return this.wrapCall("submitTx", this.api.submitTx, [tx]);
  }
}

export { WalletApi };
