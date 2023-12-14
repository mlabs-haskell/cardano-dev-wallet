import { APIErrorCode } from "../ErrorTypes";
import {
  NetworkId,
  Paginate,
  CIP30WalletApiExtension,
  CIP30WalletApiTyped,
} from "../CIP30WalletApiTyped";
import * as CSL from "@emurgo/cardano-serialization-lib-browser";
import * as Utils from "../Utils";
import { BlockFrostHelper } from "./BlockFrostHelper";
import { Wallet } from "../Wallet";

class BlockFrostCIP30WalletApi implements CIP30WalletApiTyped {
  wallet: Wallet;
  networkId: NetworkId;
  blockfrost: BlockFrostHelper;

  constructor(projectId: string, networkId: NetworkId, wallet: Wallet) {
    BlockFrostCIP30WalletApi.validateProjectId(projectId, networkId);

    this.blockfrost = new BlockFrostHelper(projectId);
    this.wallet = wallet;
    this.networkId = networkId;
  }

  static validateProjectId(projectId: string, networkId: NetworkId) {
    let networkIdFromProjectId =
      BlockFrostHelper.getNetworkIdFromProjectId(projectId);
    if (networkIdFromProjectId != networkId) {
      throw {
        code: APIErrorCode.InternalError,
        info: `Network ID ${networkId} doesn't match the network ID in the project ID ${projectId}`,
      };
    }
  }

  _getBaseAddress(): CSL.BaseAddress {
    return this.wallet.account(0).baseAddress(0);
  }

  _getAddress(): CSL.Address {
    return this._getBaseAddress().to_address();
  }

  async getNetworkId(): Promise<NetworkId> {
    return this.networkId;
  }

  async getExtensions(): Promise<CIP30WalletApiExtension[]> {
    return [];
  }

  async getUtxos(
    amount?: CSL.Value,
    paginate?: Paginate
  ): Promise<CSL.TransactionUnspentOutput[] | null> {
    let address = this._getAddress();

    let utxos = await this.blockfrost.addressesUtxos(address);

    if (amount != null) {
      let res = Utils.getUtxosAddingUpToTarget(utxos, amount);
      if (res == null) return null;
      utxos = res;
    }

    return Utils.paginateClientSide(utxos, paginate);
  }

  async getBalance(): Promise<CSL.Value> {
    let address = this._getAddress();
    let utxos = await this.blockfrost.addressesUtxos(address);
    return Utils.sumUtxos(utxos);
  }

  async getCollateral(params?: {
    amount: CSL.BigNum;
  }): Promise<CSL.TransactionUnspentOutput[] | null> {
    const fiveAda = CSL.BigNum.from_str("5000000");

    let address = this._getAddress();

    let target = params?.amount || null;

    if (target == null || target.compare(fiveAda) > 1) {
      target = fiveAda;
    }

    let utxos = await this.blockfrost.addressesUtxos(address);

    return Utils.getPureAdaUtxosAddingUpToTarget(utxos, target);
  }

  async getChangeAddress(): Promise<CSL.Address> {
    return this._getAddress();
  }

  async getUsedAddresses(paginate?: Paginate): Promise<CSL.Address[]> {
    return [this._getAddress()];
  }

  async getUnusedAddresses(): Promise<CSL.Address[]> {
    return [];
  }

  async getRewardAddresses(): Promise<CSL.Address[]> {
    return [];
  }

  async signTx(
    tx: CSL.Transaction,
    partialSign?: boolean
  ): Promise<CSL.Transaction> {
    let vkeys = CSL.Vkeywitnesses.new();
    tx.witness_set().set_vkeys(vkeys);
    let vkey = CSL.Vkey.new(this.wallet.account(0).publicKey().to_raw_key());
    let pkey = this.wallet.account(0);

    let sig = pkey.accountKey.to_raw_key().sign(tx.body().to_bytes());
    vkeys.add(CSL.Vkeywitness.new(vkey, sig));

    return tx;
  }

  async submitTx(tx: string): Promise<string> {
    return this.blockfrost.submitTx(tx);
  }
}

export { BlockFrostCIP30WalletApi };
