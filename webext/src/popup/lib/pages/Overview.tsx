import { useEffect, useRef, useState } from "preact/hooks";
import { WalletApiInternal, networkNameToId } from "../../../lib/CIP30";
import * as State from "../State";
import {
  bindInput,
  bindInputNum,
  currencySymbol,
  lovelaceToAda,
} from "../utils";
import { Big } from "big.js";
import { createRef } from "preact";

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
    </>
  );
}

function Balance({ api }: { api: WalletApiInternal }) {
  let network = State.networkActive.value;
  let networkId = networkNameToId(network);

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
    overrides.balance = value;
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
            currencySymbol={currencySymbol(networkId)}
            onEdit={() => setOverrideEditing(true)}
            onReset={onOverrideReset}
          />
        ) : (
          <BalanceEditing
            balance={balance!}
            override={override}
            currencySymbol={currencySymbol(networkId)}
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
      {balance != null && (
        <div class="buttons">
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
      )}
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
            (editable && setBalance)
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
  let [utxos, setUtxos] = useState([]);
}
