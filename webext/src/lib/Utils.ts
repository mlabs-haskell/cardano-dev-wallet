import * as CSL from "@emurgo/cardano-serialization-lib-browser";
import { Paginate } from "./CIP30WalletApi";

function getAllPolicyIdAssetNames(
  value: CSL.Value
): [CSL.ScriptHash, CSL.AssetName][] {
  let ret: [CSL.ScriptHash, CSL.AssetName][] = [];
  let multiasset = value.multiasset() || CSL.MultiAsset.new();

  for (let i = 0; i < multiasset.keys().len(); i++) {
    let policyId = multiasset.keys().get(i);
    let assets = multiasset.get(policyId) || CSL.Assets.new();

    for (let j = 0; j < assets.keys().len(); j++) {
      let assetName = assets.keys().get(j);
      ret.push([policyId, assetName]);
    }
  }
  return ret;
}

export function getPureAdaUtxosAddingUpToTarget(
  utxos: CSL.TransactionUnspentOutput[],
  target: CSL.BigNum
): CSL.TransactionUnspentOutput[] | null {
  let ret: CSL.TransactionUnspentOutput[] = [];
  let sum = CSL.BigNum.zero();

  for (let utxo of utxos) {
    let multiasset = utxo.output().amount().multiasset();
    if (multiasset != null && multiasset.len() > 0) continue;

    let value = utxo.output().amount().coin();
    ret.push(utxo);
    sum.checked_add(value);

    if (sum.less_than(target)) {
      continue;
    }

    return ret;
  }
  return null;
}

export function getUtxosAddingUpToTarget(
  utxos: CSL.TransactionUnspentOutput[],
  target: CSL.Value
): CSL.TransactionUnspentOutput[] | null {
  let policyIdAssetNames = getAllPolicyIdAssetNames(target);

  let ret: CSL.TransactionUnspentOutput[] = [];
  let sum = CSL.Value.new(CSL.BigNum.zero());

  for (let utxo of utxos) {
    let value = utxo.output().amount();
    ret.push(utxo);
    sum.checked_add(value);

    if (sum.coin().less_than(target.coin())) {
      continue;
    }

    let sumAddsUpToTarget = true;
    for (let [policyId, assetName] of policyIdAssetNames) {
      let sumAsset =
        sum.multiasset()?.get_asset(policyId, assetName) || CSL.BigNum.zero();
      let targetAsset =
        target.multiasset()?.get_asset(policyId, assetName) ||
        CSL.BigNum.zero();
      if (sumAsset.less_than(targetAsset)) {
        sumAddsUpToTarget = false;
        break;
      }
    }
    if (sumAddsUpToTarget) {
      return ret;
    }
  }
  return null;
}

export function sumUtxos(utxos: CSL.TransactionUnspentOutput[]): CSL.Value {
  let sum = CSL.Value.new(CSL.BigNum.zero());
  for (let utxo of utxos) {
    sum.checked_add(utxo.output().amount());
  }
  return sum;
}

/**
 * Pretty much useless client side pagination.
 * Because we have the whole thing in memory wherever we use it.
 */
export function paginateClientSide<T>(x: T[], paginate?: Paginate): T[] {
  if (paginate == null) return x;
  let start = paginate.page * paginate.limit;
  let end = start + paginate.limit;
  return x.slice(start, end);
}
