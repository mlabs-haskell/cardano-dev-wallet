import * as State from "./State";
import { Wallet } from "../../lib/Wallet";
import { networkNameToId } from "../../lib/CIP30";
import { useState } from "preact/hooks";

export function AccountsTab() {
  let wallets = State.wallets.value;
  let accounts = State.accounts.value;

  let [adding, setAdding] = useState(false);

  return (
    <div class="flex column pad">
      <div class="row">
        <h2>Wallets</h2>
        <div class="grow-1" />
        <button
          onClick={() => {
            setAdding(true);
          }}
          disabled={adding}
        >
          New Wallet
        </button>
      </div>

      {adding && <WalletAddForm onClose={() => setAdding(false)} />}

      {[...wallets].map(([walletId, wallet]) => {
        return (
          <WalletCard
            key={walletId}
            walletId={walletId}
            wallet={wallet}
            accounts={accounts}
          />
        );
      })}
    </div>
  );
}

interface WalletCardProps {
  walletId: string;
  wallet: State.WalletDef;
  accounts: Map<string, State.AccountDef>;
}

function WalletCard({ walletId, wallet, accounts }: WalletCardProps) {
  let [adding, setAdding] = useState(false);

  let ourAccounts = [...accounts].filter(([_, ac]) => ac.walletId == walletId);
  let name = wallet.name || "Unnamed";
  let pubKey = wallet.wallet.rootKey.to_public().to_bech32();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5em",
        alignItems: "stretch",
      }}
      class="surface pad-s"
    >
      <div class="h3">{name}</div>
      <div>{pubKey}</div>
      <div />
      <div class="row">
        <div class="h4">Accounts</div>
        <button
          class="size-s secondary"
          onClick={() => {
            setAdding(true);
          }}
          disabled={adding}
        >
          Add Account
        </button>
      </div>

      {adding && (
        <AccountAddForm walletId={walletId} onClose={() => setAdding(false)} />
      )}

      {[...ourAccounts].map(([accountId, account]) => {
        return (
          <AccountCard
            key={accountId}
            accountId={accountId}
            accountDef={account}
          />
        );
      })}

      {ourAccounts.length == 0 && <div class="alert">empty</div>}
    </div>
  );
}

interface WalletAddFormProps {
  onClose: () => void;
}
function WalletAddForm({ onClose }: WalletAddFormProps) {
  let [name, setName] = useState("");
  let [keyOrMnemonics, setKeyOrMnemonics] = useState("");
  let [error, setError] = useState(false);

  const onSubmit = async () => {
    let network = State.networkActive.value;
    let networkId = networkNameToId(network);

    let wallet;
    try {
      if (keyOrMnemonics.indexOf(" ") == -1) {
        wallet = new Wallet({
          networkId,
          privateKey: keyOrMnemonics,
        });
      } else {
        wallet = new Wallet({
          networkId,
          mnemonics: keyOrMnemonics.split(" "),
        });
      }
      await State.walletsAdd(name, wallet);
      onClose();
    } catch (e) {
      setError(true);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5em",
        alignItems: "stretch",
      }}
      class="surface pad-s"
    >
      <label>
        Name:
        <input
          type="text"
          value={name}
          onInput={(ev) => setName(ev.currentTarget.value)}
        />
      </label>
      <label
        class={error ? "error" : ""}
      >
        Key or Mnemonics
        <input
          type="text"
          value={keyOrMnemonics}
          onInput={(ev) => setKeyOrMnemonics(ev.currentTarget.value)}
        />
        {error && <div class="error">Invalid value. Please check. </div>}
      </label>
      <div />
      <div class="row">
        <button onClick={onSubmit}>Save</button>
        <button class="secondary" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

interface AccountCardProps {
  accountId: string;
  accountDef: State.AccountDef;
}

function AccountCard({ accountDef }: AccountCardProps) {
  let accountIdx = accountDef.accountIdx;
  let name = accountDef.name || "Unnamed";
  let derivation = `m(1852'/1815'/${accountIdx}')`;
  let pubkey = accountDef.account.baseAddress.to_address().to_bech32();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5em",
        alignItems: "stretch",
      }}
      class="alert pad-s"
    >
      <div class="row">
        <div class="h3">{name}</div>
        <div>{derivation}</div>
      </div>
      <div>{pubkey}</div>
    </div>
  );
}

interface AccountAddFormProps {
  walletId: string;
  onClose: () => void;
}
function AccountAddForm({ walletId, onClose }: AccountAddFormProps) {
  let [name, setName] = useState("");
  let [accountIdx, setAccountIdx] = useState(0);

  const onSubmit = async () => {
    await State.accountsAdd({ name, walletId, accountIdx });
    onClose();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5em",
        alignItems: "stretch",
      }}
      class="surface pad-s"
    >
      <label>
        Name:
        <input
          type="text"
          value={name}
          onInput={(ev) => setName(ev.currentTarget.value)}
        />
      </label>
      <label>
        Account Index
        <input
          type="text"
          value={accountIdx}
          onInput={(ev) => setAccountIdx(parseInt(ev.currentTarget.value))}
        />
      </label>
      <div />
      <div class="row">
        <button onClick={onSubmit}>Save</button>
        <button class="secondary" onClick={() => onClose()}>
          Cancel
        </button>
      </div>
    </div>
  );
}
