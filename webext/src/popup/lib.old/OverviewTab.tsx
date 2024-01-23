import { useEffect, useState } from "preact/hooks";
import { NetworkId, WalletApiInternal, networkNameToId } from "../../lib/CIP30";
import * as State from "./State";
import {
  BigNum,
  TransactionUnspentOutput,
} from "@emurgo/cardano-serialization-lib-browser";
import { Big } from "big.js";

export function OverviewTab() {
  let api = State.API.value;

  return (
    <div class="column pad-s">
      <div class="column surface gap-0 div-y">
        <div class="row pad-s">
          <h3>Overview</h3>
          <div class="grow-1" />
        </div>

        {api == "NO_BACKEND" && (
          <div class="alert">
            Please configure the active backend in the "Network" tab.
          </div>
        )}
        {api == "NO_ACCOUNT" && (
          <div class="alert">
            Please configure the active account in the "Accounts" tab.
          </div>
        )}

        {typeof api != "string" && <AccountInfo api={api} />}
      </div>
    </div>
  );
}

function AccountInfo({ api }: { api: WalletApiInternal }) {
  let [balance, setBalance] = useState<Big | null>(null);
  let [utxos, setUtxos] = useState<TransactionUnspentOutput[] | null>(null);
  let activeAccount = State.accountsActive.value;
  let overrides = State.overrides;

  useEffect(() => {
    setBalance(null);
    setUtxos(null);

    api.getBalance().then((balance) => {
      setBalance(lovelaceToAda(balance.coin()));
    });

    api.getUtxos().then((utxos) => {
      setUtxos(utxos);
    });
  }, [api]);

  let networkId = networkNameToId(State.networkActive.value);
  let currencySymbol = networkId == NetworkId.Mainnet ? "₳" : "t₳";
  let balanceDisplay =
    balance == null
      ? "Loading"
      : [balance.toString(), currencySymbol].join(" ");

  let utxosDisplay = utxos?.map((utxo) => {
    let input = utxo.input();
    let txId = input.transaction_id().to_hex();
    let txIdx = input.index();

    let output = utxo.output();
    let coinRaw = output.amount().coin();
    let coin = [lovelaceToAda(coinRaw).toString(), currencySymbol].join(" ");

    return {
      txId,
      txIdx,
      coin,
    };
  });

  return (
    <div class="surface pad-s column gap-xl">
      <div class="column gap-s">
        <div class="h3">{activeAccount?.accountDef.name}</div>
        <div>{activeAccount?.accountDef.account.baseAddress.to_address().to_bech32()}</div>
      </div>
      <hr class="unpad" />
      <label>
        <div class="h2">Balance</div>
        <span class="h2">{balanceDisplay}</span>
        <span>{overrides.value?.balance || "No Overrides active"}</span>
      </label>
      <hr class="unpad" />
      <div class="column">
        <h3>UTXOs</h3>
        {utxosDisplay == null ? (
          <div class="alert">Loading utxos</div>
        ) : (
          utxosDisplay.map((utxo) => (
            <label>
              {utxo.txId} #{utxo.txIdx}
              <h2>{utxo.coin}</h2>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

function lovelaceToAda(lovelace: BigNum) {
  let lovelaceJs = new Big(lovelace.to_str());
  return lovelaceJs.div("1e6");
}
