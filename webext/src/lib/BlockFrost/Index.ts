import { APIErrorCode, TxSignError, TxSignErrorCode } from "../ErrorTypes";
import {
  NetworkId,
  Paginate,
  CIP30WalletApiExtension,
  CIP30WalletApiTyped,
} from "../CIP30WalletApiTyped";
import * as CSL from "@emurgo/cardano-serialization-lib-browser";
import * as CMS from "@emurgo/cardano-message-signing-browser";
import * as Utils from "../Utils";
import { BlockFrostHelper } from "./BlockFrostHelper";
import { Wallet } from "../Wallet";
import { Bytes, Cip30DataSignature } from "../CIP30WalletApi";

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
    return this.wallet.account(0, 0).baseAddress;
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
    partialSign: boolean
  ): Promise<CSL.Transaction> {
    tx = cloneTx(tx);

    let txBody = tx.body();
    let txHash = CSL.hash_transaction(txBody);

    let account = this.wallet.account(0, 0);
    let paymentKeyHash = account.paymentKey.to_public().hash();
    let stakingKeyHash = account.paymentKey.to_public().hash();

    let requiredKeyHashes = await Utils.getRequiredKeyHashes(
      tx,
      (await this.getUtxos())!,
      paymentKeyHash
    );

    let requiredKeyHashesSet = new Set(requiredKeyHashes);

    let witnesses: CSL.Vkeywitness[] = [];
    for (let keyhash of requiredKeyHashesSet) {
      if (keyhash == paymentKeyHash) {
        let witness = CSL.make_vkey_witness(txHash, account.paymentKey);
        witnesses.push(witness);
      } else if (keyhash == stakingKeyHash) {
        let witness = CSL.make_vkey_witness(txHash, account.stakingKey);
        witnesses.push(witness);
      } else {
        if (partialSign == false) {
          throw {
            code: TxSignErrorCode.ProofGeneration,
            info: `Unknown keyhash ${keyhash.to_hex()}`,
          };
        }
      }
    }

    if (witnesses.length > 0) {
      if (tx.witness_set().vkeys() == null) {
        tx.witness_set().set_vkeys(CSL.Vkeywitnesses.new());
      }
      for (let witness of witnesses) {
        tx.witness_set().vkeys()!.add(witness);
      }
    }

    return tx;
  }

  async signData(
    addr: CSL.Address,
    payload: Bytes
  ): Promise<Cip30DataSignature> {
    let account = this.wallet.account(0, 0);
    let paymentKey = account.paymentKey;
    let stakingKey = account.stakingKey;
    let keyToSign: CSL.PrivateKey;

    let paymentAddressFns = [
      CSL.BaseAddress,
      CSL.EnterpriseAddress,
      CSL.PointerAddress,
    ];

    let addressStakeCred: CSL.StakeCredential | null = null;
    for (let fn of paymentAddressFns) {
      let addrDowncasted = fn.from_address(addr);
      if (addrDowncasted != null) {
        addressStakeCred = addrDowncasted.payment_cred();
        break;
      }
    }

    if (addressStakeCred == null) {
      let addrDowncasted = CSL.RewardAddress.from_address(addr);
      if (addrDowncasted != null) {
        addressStakeCred = account.baseAddress.stake_cred();
      }
    }

    if (addressStakeCred == null) {
      throw new Error(
        "This should be unreachable unless CSL adds a new address type"
      );
    }

    let addressKeyhash = addressStakeCred.to_keyhash()!;

    if (addressKeyhash == paymentKey.to_public().hash()) {
      keyToSign = paymentKey;
    } else if (addressKeyhash == stakingKey.to_public().hash()) {
      keyToSign = stakingKey;
    } else {
      let err: TxSignError = {
        code: TxSignErrorCode.ProofGeneration,
        info: "We don't own the keyhash: " + addressKeyhash.to_hex(),
      };
      throw err;
    }

    // Headers:
    // alg (1): EdDSA (-8)
    // kid (4): ignore, nami doesn't set it
    // "address": raw bytes of address
    //
    // Don't hash payload
    // Don't use External AAD

    let protectedHeaders = CMS.HeaderMap.new();
    protectedHeaders.set_algorithm_id(
      CMS.Label.from_algorithm_id(-8) // CMS.AlgorithmId.EdDSA
    );
    protectedHeaders.set_header(
      CMS.Label.new_text("address"),
      CMS.CBORValue.from_bytes(addr.to_bytes())
    );
    let protectedHeadersWrapped = CMS.ProtectedHeaderMap.new(protectedHeaders);

    let unprotectedHeaders = CMS.HeaderMap.new();

    let headers = CMS.Headers.new(protectedHeadersWrapped, unprotectedHeaders);

    let builder = CMS.COSESign1Builder.new(
      headers,
      Buffer.from(payload, "hex"),
      false
    );
    let toSign = builder.make_data_to_sign().to_bytes();
    keyToSign.sign(toSign);

    let coseSign1 = builder.build(keyToSign.sign(toSign).to_bytes());

    let coseKey = CMS.COSEKey.new(CMS.Label.from_key_type(CMS.KeyType.OKP));
    coseKey.set_algorithm_id(
      CMS.Label.from_algorithm_id(-8) // CMS.AlgorithmId.EdDSA
    );
    coseKey.set_header(
      CMS.Label.new_int(CMS.Int.new_negative(CMS.BigNum.from_str("1"))),
      CMS.CBORValue.new_int(CMS.Int.new_i32(6)) // CMS.CurveType.Ed25519
    ); // crv (-1) set to Ed25519 (6)
    coseKey.set_header(
      CMS.Label.new_int(CMS.Int.new_negative(CMS.BigNum.from_str("2"))),
      CMS.CBORValue.from_bytes(keyToSign.to_public().as_bytes())
    ); // x (-2) set to public key

    return {
      signature: Buffer.from(coseSign1.to_bytes()).toString("hex"),
      key: Buffer.from(coseKey.to_bytes()).toString("hex"),
    };
  }

  async submitTx(tx: string): Promise<string> {
    return this.blockfrost.submitTx(tx);
  }
}

function cloneTx(tx: CSL.Transaction): CSL.Transaction {
  return CSL.Transaction.from_bytes(tx.to_bytes());
}

export { BlockFrostCIP30WalletApi };
