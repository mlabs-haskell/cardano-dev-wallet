import { useEffect, useState } from "preact/hooks";
import { WalletApiInternal, networkNameToId } from "../../../lib/CIP30";
import * as State from "../State";
import { bindInputNum, lovelaceToAda } from "../utils";

import { CSLIterator } from "../../../lib/CSLIterator";
import * as CSL from "@emurgo/cardano-serialization-lib-browser";

export default function Page() {
  let activeAccount = State.accountsActive.value;
  let api = State.API.value;

  return (
    <>
      <section class="row">
        {activeAccount != null && <ActiveAccount account={activeAccount} />}
        {activeAccount == null && <div>No Account</div>}
      </section>
      {api == "NO_ACCOUNT" && <div></div>}
      {api instanceof WalletApiInternal && <NetworkData api={api} />}
    </>
  );
}

function ActiveAccount({ account }: { account: State.ActiveAccountDef }) {
  let accountIdx = account.accountDef.accountIdx;
  let derivation = "m(1852'/1815'/" + accountIdx + "')";
  let address = account.accountDef.account.baseAddress.to_address().to_bech32();
  let idx1 = address.indexOf("1");
  address =
    address.slice(0, idx1 + 6) +
    "..." +
    address.slice(address.length - 6, address.length);
  return (
    <article class="item">
      <h1 class="L3">{account.walletDef.name}</h1>
      <div>{derivation}</div>
      <div class="label-mono-sub">{address}</div>
    </article>
  );
}

function NetworkData({ api }: { api: WalletApiInternal }) {
  return (
    <>
      <Balance api={api} />
      <div class="superrow">
        <UTxOs api={api} />
        <Collateral api={api} />
        <Logs />
      </div>
    </>
  );
}

function Balance({ api }: { api: WalletApiInternal }) {
  let [balance, setBalance] = useState<string | null>(null);
  useEffect(() => {
    api.getBalance().then((balance) => {
      let balanceAda = lovelaceToAda(balance.coin());
      setBalance(balanceAda.toString());
    });
  }, [api]);

  let override = State.overrides.value.balance;

  let [overrideEditing, setOverrideEditing] = useState(false);
  const onOverrideSave = async (value: string) => {
    let overrides = State.overrides?.value || {};
    if (value != balance) {
      overrides.balance = value;
    } else {
      overrides.balance = null;
    }
    await State.overridesSet(overrides);
    setOverrideEditing(false);
  };

  const onOverrideReset = async () => {
    let overrides = State.overrides?.value || {};
    overrides.balance = null;
    await State.overridesSet(overrides);
  };

  return (
    <>
      <section class="item">
        {!overrideEditing ? (
          <BalanceNotEditing
            balance={balance}
            override={override}
            currencySymbol={State.adaSymbol.value}
            onEdit={() => setOverrideEditing(true)}
            onReset={onOverrideReset}
          />
        ) : (
          <BalanceEditing
            balance={balance!}
            override={override}
            currencySymbol={State.adaSymbol.value}
            onSave={onOverrideSave}
            onCancel={() => setOverrideEditing(false)}
          />
        )}
      </section>
    </>
  );
}

function BalanceNotEditing({
  balance,
  override,
  currencySymbol,
  onEdit,
  onReset,
}: {
  balance: string | null;
  override?: string | null;
  currencySymbol: string;
  onEdit: () => void;
  onReset: () => void;
}) {
  let balanceDisplay = balance == null ? "..." : balance;
  return (
    <>
      <div class="row">
        {override == null ? (
          <>
            <BalanceComponent
              title="Balance"
              balance={balanceDisplay}
              currencySymbol={currencySymbol}
            />
          </>
        ) : (
          <>
            <BalanceComponent
              title="Balance"
              balance={override}
              currencySymbol={currencySymbol}
            />
            <BalanceComponent
              title="Original"
              balance={balanceDisplay}
              currencySymbol={currencySymbol}
              small
            />
          </>
        )}
      </div>
      <div class={(balance == null ? "hidden" : "") + " buttons"}>
        {override == null ? (
          <>
            <button class="button" onClick={onEdit}>
              Override <span class="icon -edit" />
            </button>
          </>
        ) : (
          <>
            <button class="button" onClick={onEdit}>
              Edit Override <span class="icon -edit" />
            </button>
            <button class="button -secondary" onClick={onReset}>
              Reset <span class="icon -close" />
            </button>
          </>
        )}
      </div>
    </>
  );
}

function BalanceEditing({
  balance,
  override,
  currencySymbol,
  onSave,
  onCancel,
}: {
  balance: string;
  override?: string | null;
  currencySymbol: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  let [input, setInput] = useState(override == null ? balance : override);
  return (
    <>
      <div class="row">
        <BalanceComponent
          title="Balance"
          balance={input}
          setBalance={setInput}
          currencySymbol={currencySymbol}
          editable
        />
        <BalanceComponent
          title="Original"
          balance={balance}
          currencySymbol={currencySymbol}
          small
        />
      </div>
      <div class="buttons">
        <>
          <button class="button" onClick={() => onSave(input)}>
            Save <span class="icon -save" />
          </button>
          <button class="button -secondary" onClick={onCancel}>
            Cancel <span class="icon -close" />
          </button>
        </>
      </div>
    </>
  );
}

function BalanceComponent({
  title,
  balance,
  setBalance,
  currencySymbol,
  small,
  editable,
}: {
  title: string;
  balance: string;
  setBalance?: (val: string) => void;
  currencySymbol: string;
  small?: boolean;
  editable?: boolean;
}) {
  return (
    <article class="item">
      <h1 class={!small ? "label" : "label-sub"}>{title}</h1>
      <div class={!small ? "currency" : "currency -small"}>
        <input
          class="-amount"
          value={balance}
          onInput={
            editable && setBalance
              ? bindInputNum(balance, setBalance)
              : undefined
          }
          readonly={!editable}
          style={{ width: balance.length + 1.1 + "ex" }}
        />
        <div class="-unit">{currencySymbol}</div>
      </div>
    </article>
  );
}

function UTxOs({ api }: { api: WalletApiInternal }) {
  let [utxos, setUtxos] = useState<UtxoDef[] | null>(null);

  useEffect(() => {
    api.getUtxos().then((utxos) => {
      if (utxos == null) return;
      let utxosParsed = utxos?.map(parseUtxo);
      setUtxos(utxosParsed);
    });
  }, [api]);

  return <UtxoList title="UTxOs" utxos={utxos} />;
}

function Collateral({ api }: { api: WalletApiInternal }) {
  let [utxos, setUtxos] = useState<UtxoDef[] | null>(null);

  useEffect(() => {
    api
      .getCollateral({ amount: CSL.BigNum.zero(), _all: true })
      .then((utxos) => {
        if (utxos == null) {
          setUtxos([]);
          return;
        }
        let utxosParsed = utxos?.map(parseUtxo);
        setUtxos(utxosParsed);
      });
  }, [api]);

  return <UtxoList title="Collateral" utxos={utxos} />;
}

interface UtxoDef {
  hidden: boolean;
  txHashHex: string;
  txIdx: number;
  amount: string;
  tokens: {
    policyId: string;
    assetName: string;
    amount: string;
  }[];
}

function parseUtxo(u: CSL.TransactionUnspentOutput): UtxoDef {
  let input = u.input();
  let txHashHex = input.transaction_id().to_hex();
  let txIdx = input.index();

  let txAmount = u.output().amount();
  let amount = lovelaceToAda(txAmount.coin()).toString();

  let tokens = [];
  let multiasset = txAmount.multiasset();
  for (let policyId of new CSLIterator(multiasset?.keys())) {
    let asset = multiasset!.get(policyId);
    for (let assetName of new CSLIterator(asset?.keys())) {
      let assetAmount = asset!.get(assetName)!.to_str();
      tokens.push({
        policyId: policyId.to_hex(),
        assetName: assetName.to_hex(),
        amount: assetAmount,
      });
    }
  }

  return {
    hidden: false,
    txHashHex,
    txIdx,
    amount,
    tokens,
  };
}

function UtxoList({
  title,
  utxos,
}: {
  title: string;
  utxos: UtxoDef[] | null;
}) {
  return (
    <section class="column">
      <h2 class="L3">{title}</h2>
      {utxos == null && <div class="L2">...</div>}
      {utxos != null &&
        utxos.map((utxo) => {
          let txHash =
            utxo.txHashHex.slice(0, 6) +
            "..." +
            utxo.txHashHex.slice(utxo.txHashHex.length - 6);
          return (
            <article class="column">
              <div class="item">
                <div class="label-mono">
                  {txHash} #{utxo.txIdx}
                </div>
                <div class="currency -small">
                  <h3 class="-amount">{utxo.amount}</h3>
                  <h3 class="-unit">{State.adaSymbol.value}</h3>
                </div>
              </div>
              {utxo.tokens.map((token) => {
                <div class="item">
                  <div>{token.assetName}</div>
                  <div class="currency -xsmall">
                    <h3 class="-amount">{token.amount}</h3>
                    <h3 class="-unit">units</h3>
                  </div>
                </div>;
              })}
            </article>
          );
        })}
    </section>
  );
}

function Logs() {
  return <section class="column">
    <div class="row">
      <h2 class="L3">Logs</h2>
      <button class="button" onClick={() => State.logsClear()}>Clear <span class="icon -close" /></button>
    </div>
    {State.logs.value.map(log => <div class="mono color-secondary">{log}</div>)}
  </section>
}
