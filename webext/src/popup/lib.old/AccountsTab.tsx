import * as State from "./State";
import { Wallet } from "../../lib/Wallet";
import { networkNameToId } from "../../lib/CIP30";
import { useState } from "preact/hooks";

export function AccountsTab() {
  let wallets = State.wallets.value;
  let accounts = State.accounts.value;

  let [adding, setAdding] = useState(false);

  return (
    <div class="column pad-s">
      <div class="column surface div-y gap-0">
        <div class="column gap-0">
          <div class="row pad-s">
            <h1>Wallets</h1>
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
        </div>

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
  let [renaming, setRenaming] = useState(false);
  let [name, setName] = useState(wallet.name || "Unnamed");
  let [deleting, setDeleting] = useState(false);

  let ourAccounts = [...accounts].filter(([_, ac]) => ac.walletId == walletId);
  let pubKey = wallet.wallet.rootKey.to_public().to_bech32();

  const onRenameStart = () => setRenaming(true);
  const onRename = async () => {
    await State.walletsRename(walletId, name);
    setRenaming(false);
  };

  const onDeleteStart = () => setDeleting(true);
  const onDeleteCancel = () => setDeleting(false);
  const onDelete = async () => {
    await State.walletsDelete(walletId);
    setRenaming(false);
  };

  return (
    <div class="column pad-s pad-bottom-l gap-m">
      <div class="column gap-s">
        <div class="row">
          {!renaming ? (
            <h2>{name}</h2>
          ) : (
            <div class="row">
              <input
                value={name}
                onInput={(ev) => setName(ev.currentTarget.value)}
              />
              <button class="size-s" onClick={onRename}>
                Save
              </button>
            </div>
          )}
          <div class="grow-1" />
          <button class="secondary size-s" onClick={onRenameStart}>
            Rename
          </button>
          <button class="error secondary size-s" onClick={onDeleteStart}>
            Delete
          </button>
        </div>
        {deleting && (
          <div class="alert error">
            <div class="row">
              <p>Are you sure to delete?</p>
              <button class="size-s" onClick={onDelete}>
                Delete
              </button>
              <button class="secondary size-s" onClick={onDeleteCancel}>
                Cancel
              </button>
            </div>
          </div>
        )}
        <div>{pubKey}</div>
      </div>
      <div class="column gap-l">
        <div class="column">
          <div class="row">
            <h4>Accounts</h4>
            <div class="grow-1" />
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
            <AccountAddForm
              walletId={walletId}
              onClose={() => setAdding(false)}
            />
          )}
        </div>
        <div class="column gap-l">
          {[...ourAccounts].map(([accountId, account]) => {
            return (
              <AccountCard
                key={accountId}
                accountId={accountId}
                accountDef={account}
              />
            );
          })}

          {ourAccounts.length == 0 && <div>empty</div>}
        </div>
      </div>
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
    keyOrMnemonics = keyOrMnemonics.trim();

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
      <label class={error ? "error" : ""}>
        Key or Mnemonics
        <textarea
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

function AccountCard({ accountId, accountDef }: AccountCardProps) {
  let accountIdx = accountDef.accountIdx;

  let [renaming, setRenaming] = useState(false);
  let [name, setName] = useState(accountDef.name || "Unnamed");
  let [deleting, setDeleting] = useState(false);

  let isActive = accountId == State.accountsActiveId.value;

  const onRenameStart = () => setRenaming(true);
  const onRenameCancel = () => {
    setName(accountDef.name || "Unnamed");
    setRenaming(false);
  };
  const onRename = async () => {
    await State.accountsRename(accountId, name);
    setRenaming(false);
  };

  const onDeleteStart = () => setDeleting(true);
  const onDeleteCancel = () => setDeleting(false);
  const onDelete = async () => {
    await State.accountsDelete(accountId);
    setRenaming(false);
  };

  const makeActive = async () => {
    await State.accountsActiveSet(accountId);
  };

  let derivation = `m(1852'/1815'/${accountIdx}')`;
  let pubkey = accountDef.account.baseAddress.to_address().to_bech32();

  return (
    <div class="column gap-xs">
      <div class="row">
        {!renaming ? (
          <>
            <div class="h5">{name}</div>
            {isActive && <span class="color-green">Active</span>}
            <div class="grow-1" />
            {!isActive && (
              <button class="secondary size-s" onClick={makeActive}>
                Set Active
              </button>
            )}
            <button class="secondary size-s" onClick={onRenameStart}>
              Rename
            </button>
            <button class="error secondary size-s" onClick={onDeleteStart}>
              Delete
            </button>
          </>
        ) : (
          <div class="row">
            <input
              value={name}
              onInput={(ev) => setName(ev.currentTarget.value)}
            />
            <button class="size-s" onClick={onRename}>
              Save
            </button>
            <button class="size-s secondary" onClick={onRenameCancel}>
              Cancel
            </button>
          </div>
        )}
      </div>
      {deleting && (
        <div class="alert error">
          <div class="row">
            <p>Are you sure to delete?</p>
            <button class="size-s" onClick={onDelete}>
              Delete
            </button>
            <button class="secondary size-s" onClick={onDeleteCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <div>{derivation}</div>
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
    <div class="column gap-s">
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
