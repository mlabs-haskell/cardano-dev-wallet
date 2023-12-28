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
} from ".";

class WalletApi {
  constructor(private api: WalletApiInternal) {}

  async getNetworkId(): Promise<NetworkId> {
    return this.api.getNetworkId();
  }

  async getExtensions(): Promise<WalletApiExtension[]> {
    return this.api.getExtensions();
  }

  async getUtxos(
    amount?: CborHexStr,
    paginate?: Paginate
  ): Promise<CborHexStr[] | null> {
    return this.api
      .getUtxos(amount ? CSL.Value.from_hex(amount) : undefined, paginate)
      .then((utxos) =>
        utxos == null ? null : utxos.map((utxo) => utxo.to_hex())
      );
  }

  async getBalance(): Promise<CborHexStr> {
    return this.api.getBalance().then((balance) => balance.to_hex());
  }

  async getCollateral(params?: {
    amount: CborHexStr;
  }): Promise<CborHexStr[] | null> {
    return this.api
      .getCollateral(
        params == undefined
          ? undefined
          : { amount: CSL.BigNum.from_hex(params.amount) }
      )
      .then((collateral) =>
        collateral == null ? null : collateral.map((c) => c.to_hex())
      );
  }

  async getUsedAddresses(paginate?: Paginate): Promise<AddressHexStr[]> {
    return this.api
      .getUsedAddresses(paginate)
      .then((addresses) => addresses.map((address) => address.to_hex()));
  }

  async getUnusedAddresses(): Promise<AddressHexStr[]> {
    return this.api
      .getUnusedAddresses()
      .then((addresses) => addresses.map((address) => address.to_hex()));
  }

  async getChangeAddress(): Promise<AddressHexStr> {
    return this.api.getChangeAddress().then((address) => address.to_hex());
  }

  async getRewardAddresses(): Promise<AddressHexStr[]> {
    return this.api
      .getRewardAddresses()
      .then((addresses) => addresses.map((address) => address.to_hex()));
  }

  async signTx(
    tx: CborHexStr,
    partialSign: boolean = false
  ): Promise<CborHexStr> {
    return this.api
      .signTx(CSL.Transaction.from_hex(tx), partialSign)
      .then((signedTx) => signedTx.to_hex());
  }

  async signData(
    addr: AddressInputStr,
    payload: HexStr
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
    return this.api.signData(addrParsed, payload);
  }

  async submitTx(tx: CborHexStr): Promise<string> {
    return this.api.submitTx(tx);
  }
}

export { WalletApi };