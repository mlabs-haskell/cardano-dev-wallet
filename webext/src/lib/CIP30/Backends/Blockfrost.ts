import * as CIP30 from "..";
import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
import * as CSL from "@emurgo/cardano-serialization-lib-browser";

class BlockFrostBackend implements CIP30.Backend {
  projectId: string;
  blockfrost: BlockFrostAPI;

  constructor(projectId: string) {
    this.projectId = projectId;
    this.blockfrost = new BlockFrostAPI({ projectId: projectId });
  }

  getNetwork(): CIP30.Network {
    if (this.projectId.startsWith("mainnet")) {
      return CIP30.MAINNET;
    } else if (this.projectId.startsWith("preview")) {
      return CIP30.PREVIEW;
    } else if (this.projectId.startsWith("preprod")) {
      return CIP30.PREVIEW;
    } else {
      let err: CIP30.APIError = {
        code: CIP30.APIErrorCode.InternalError,
        info: "Can't determine network because the project ID doesn't start with any of the recognized network IDs: mainnet, preview, preprod",
      };
      throw err;
    }
  }

  async getUtxos(
    address: CSL.Address
  ): Promise<CSL.TransactionUnspentOutput[]> {
    let utxos = await this.blockfrost.addressesUtxosAll(address.to_bech32());
    let values: CSL.TransactionUnspentOutput[] = [];
    for (let utxo of utxos) {
      let value = amountToValue(utxo.amount);
      const txIn = CSL.TransactionInput.new(
        CSL.TransactionHash.from_hex(utxo.tx_hash),
        utxo.output_index
      );
      const txOut = CSL.TransactionOutput.new(
        CSL.Address.from_bech32(utxo.address),
        value
      );
      let utxo_ = CSL.TransactionUnspentOutput.new(txIn, txOut);
      values.push(utxo_);
    }
    return values;
  }

  async submitTx(tx: string): Promise<string> {
    return this.blockfrost.txSubmit(tx);
  }
}

function amountToValue(
  amount: {
    unit: string;
    quantity: string;
  }[]
): CSL.Value {
  let value = CSL.Value.new(CSL.BigNum.zero());
  for (let item of amount) {
    if (item.unit.toLowerCase() == "lovelace") {
      value.set_coin(CSL.BigNum.from_str(item.quantity));
      continue;
    }

    // policyId is always 28 bytes, which when hex encoded is 56 characters.
    let policyId = item.unit.slice(0, 56);
    let assetName = item.unit.slice(56);

    let policyIdWasm = CSL.ScriptHash.from_hex(policyId);
    let assetNameWasm = CSL.AssetName.from_hex(assetName);

    let multiasset = value.multiasset();

    if (multiasset == null) {
      multiasset = CSL.MultiAsset.new();
      value.set_multiasset(multiasset);
    }

    multiasset.set_asset(
      policyIdWasm,
      assetNameWasm,
      CSL.BigNum.from_str(item.quantity)
    );
  }
  return value;
}

export { BlockFrostBackend };
