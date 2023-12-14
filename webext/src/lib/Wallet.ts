import * as bip39 from "bip39";
import * as CSL from "@emurgo/cardano-serialization-lib-browser";

export class Wallet {
  rootKey: CSL.Bip32PrivateKey;
  networkId: any;

  constructor(
    params: { networkId: number } & (
      | { mnemonics: string[] }
      | { privateKey: string }
    )
  ) {
    this.networkId = params.networkId;
    if ("mnemonics" in params) {
      const entropy = bip39.mnemonicToEntropy(params.mnemonics.join(" "));
      this.rootKey = CSL.Bip32PrivateKey.from_bip39_entropy(
        Buffer.from(entropy, "hex"),
        Buffer.from("") // password
      );
    } else {
      this.rootKey = CSL.Bip32PrivateKey.from_bech32(params.privateKey);
    }
  }

  account(account: number): Account {
    let accountKey = this.rootKey
      .derive(harden(1852))
      .derive(harden(1815))
      .derive(harden(account));
    return new Account(this.networkId, accountKey);
  }
}

export class Account {
  accountKey: CSL.Bip32PrivateKey;
  networkId: number;

  constructor(networkId: number, accountKey: CSL.Bip32PrivateKey) {
    this.accountKey = accountKey;
    this.networkId = networkId;
  }

  baseAddress(index: number): CSL.BaseAddress {
    const utxoPubkey = this.accountKey.derive(0).derive(index).to_public();
    const stakeKey = this.accountKey.derive(2).derive(index).to_public();

    const baseAddr = CSL.BaseAddress.new(
      this.networkId,
      CSL.StakeCredential.from_keyhash(utxoPubkey.to_raw_key().hash()),
      CSL.StakeCredential.from_keyhash(stakeKey.to_raw_key().hash())
    );

    return baseAddr;
  }

  publicKey(): CSL.Bip32PublicKey {
    return this.accountKey.to_public();
  }
}

function harden(num: number): number {
  return 0x80000000 + num;
}
