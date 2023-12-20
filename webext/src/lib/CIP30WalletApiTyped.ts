import * as CSL from "@emurgo/cardano-serialization-lib-browser";
import {
  CborHexStr,
  NetworkId,
  Paginate,
  CIP30WalletApiExtension,
} from "./CIP30WalletApi";

interface CIP30WalletApiTyped {
  getNetworkId(): Promise<NetworkId>;
  getUtxos(
    amount?: CSL.Value,
    paginate?: Paginate
  ): Promise<CSL.TransactionUnspentOutput[] | null>;
  getBalance(): Promise<CSL.Value>;

  getCollateral(params?: {
    amount: CSL.BigNum;
  }): Promise<CSL.TransactionUnspentOutput[] | null>;

  getExtensions(): Promise<CIP30WalletApiExtension[]>;

  getUsedAddresses(paginate?: Paginate): Promise<CSL.Address[]>;

  getUnusedAddresses(): Promise<CSL.Address[]>;

  getChangeAddress(): Promise<CSL.Address>;

  getRewardAddresses(): Promise<CSL.Address[]>;

  signTx(tx: CSL.Transaction, partialSign: boolean): Promise<CSL.Transaction>;

  submitTx(tx: CborHexStr): Promise<string>;
}

export { NetworkId, Paginate, CIP30WalletApiExtension, CIP30WalletApiTyped };
