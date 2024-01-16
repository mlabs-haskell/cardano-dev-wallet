import { signal, computed } from "@preact/signals";
import * as InternalState from "../../lib/CIP30/State";
import { NetworkName, networkNameToId } from "../../lib/CIP30";
import { Wallet, Account } from "../../lib/Wallet";

const STORE = new InternalState.HeirarchialStore(
  new InternalState.WebStorage(),
);
const STATE = new InternalState.State(STORE);

async function loadInternalState() {
  const networkActive = signal(await STATE.networkActiveGet());
  const rootKeys = signal(await STATE.rootKeysGet(networkActive.value));
  const accounts = signal(await STATE.accountsGet(networkActive.value));
  const accountsActiveId = signal(
    await STATE.accountsActiveGet(networkActive.value),
  );
  const backends = signal(await STATE.backendsGet(networkActive.value));
  const backendsActiveId = signal(
    await STATE.backendsActiveGet(networkActive.value),
  );

  return {
    networkActive,
    rootKeys,
    accounts,
    accountsActiveId,
    backends,
    backendsActiveId,
  };
}

const internalState = signal(await loadInternalState());

async function networkActiveSet(network: NetworkName) {
  await STATE.networkActiveSet(network);
  internalState.value = await loadInternalState();
}

interface WalletDef {
  name: string;
  wallet: Wallet;
}

interface AccountDef {
  name: string;
  walletId: string;
  accountIdx: number;
  account: Account;
}

const networkActive = internalState.value.networkActive;

const wallets = computed(() => {
  let networkActive = internalState.value.networkActive.value;
  let networkId = networkNameToId(networkActive);

  // keyId -> WalletDef
  let wallets = new Map<string, WalletDef>();

  for (let [keyId, rootKey] of Object.entries(
    internalState.value.rootKeys.value,
  )) {
    let name = rootKey.name;
    let wallet = new Wallet({
      networkId: networkId,
      privateKey: rootKey.keyBech32,
    });
    wallets.set(keyId, { name, wallet });
  }

  return wallets;
});

async function walletsAdd(name: string, wallet: Wallet) {
  let networkActive = internalState.value.networkActive.value;

  let rootKey: InternalState.RootKey = {
    name,
    keyBech32: wallet.rootKey.to_bech32(),
  };
  await STATE.rootKeysAdd(networkActive, rootKey);

  internalState.value.rootKeys.value = await STATE.rootKeysGet(networkActive);
}

async function walletsRename(walletId: string, name: string) {
  let networkActive = internalState.value.networkActive.value;
  let rootKeys = await STATE.rootKeysGet(networkActive);

  let rootKey = rootKeys[walletId];
  rootKey.name = name;

  await STATE.rootKeysUpdate(networkActive, walletId, rootKey);

  internalState.value.rootKeys.value = await STATE.rootKeysGet(networkActive);
}

async function walletsDelete(walletId: string) {
  let networkActive = internalState.value.networkActive.value;

  await accountsDeleteByWallet(walletId);
  await STATE.rootKeysDelete(networkActive, walletId);

  internalState.value.rootKeys.value = await STATE.rootKeysGet(networkActive);
}

const accounts = computed(() => {
  let accounts = new Map<string, AccountDef>();

  for (let [acId, account] of Object.entries(
    internalState.value.accounts.value,
  )) {
    let walletDef = wallets.value.get(account.keyId)!;
    if (walletDef == null) console.log(account);
    let wallet = walletDef.wallet;

    let accountDef: AccountDef = {
      name: account.name,
      walletId: account.keyId,
      accountIdx: account.accountIdx,
      account: wallet.account(account.accountIdx, 0),
    };
    accounts.set(acId, accountDef);
  }
  return accounts;
});

interface AccountNew {
  name: string;
  walletId: string;
  accountIdx: number;
}

async function accountsAdd({ walletId, name, accountIdx }: AccountNew) {
  let networkActive = internalState.value.networkActive.value;

  let account: InternalState.Account = {
    keyId: walletId,
    name,
    accountIdx: accountIdx,
  };
  await STATE.accountsAdd(networkActive, account);

  internalState.value.accounts.value = await STATE.accountsGet(networkActive);
}

async function accountsDeleteByWallet(walletId: string) {
  let networkActive = internalState.value.networkActive.value;

  let idsToDelete = [];
  for (let [id, ac] of Object.entries(internalState.value.accounts.value)) {
    if (ac.keyId == walletId) idsToDelete.push(id);
  }
  for (let id of idsToDelete) {
    await STATE.accountsDelete(networkActive, id);
  }

  internalState.value.accounts.value = await STATE.accountsGet(networkActive);
}

async function accountsRename(accountId: string, name: string) {
  let networkActive = internalState.value.networkActive.value;
  let accounts = await STATE.accountsGet(networkActive);

  let account = accounts[accountId];
  account.name = name;

  await STATE.accountsUpdate(networkActive, accountId, account);

  internalState.value.accounts.value = await STATE.accountsGet(networkActive);
}

async function accountsDelete(accountId: string) {
  let networkActive = internalState.value.networkActive.value;

  await STATE.accountsDelete(networkActive, accountId);

  internalState.value.accounts.value = await STATE.accountsGet(networkActive);
}

interface ActiveAccountDef {
  walletId: string;
  walletDef: WalletDef;
  accountId: string;
  accountDef: AccountDef;
}

const accountsActiveId = internalState.value.accountsActiveId;

const accountsActive = computed<ActiveAccountDef | null>(() => {
  let activeAccountId = internalState.value.accountsActiveId.value;
  if (activeAccountId == null) return null;

  let accountDef = accounts.value.get(activeAccountId);
  if (accountDef == null) return null;

  let walletId = accountDef.walletId;
  let walletDef = wallets.value.get(walletId)!;
  if (walletDef == null) return null;

  let activeAccountDef: ActiveAccountDef = {
    walletId,
    walletDef,
    accountId: activeAccountId,
    accountDef,
  };
  return activeAccountDef;
});

async function accountsActiveSet(acId: string) {
  await STATE.accountsActiveSet(networkActive.value, acId);
  internalState.value.accountsActiveId.value = acId;
}

type BackendDef = InternalState.Backend;

const backends = internalState.value.backends;

async function backendsAdd(backend: BackendDef) {
  let networkActive = internalState.value.networkActive.value;
  await STATE.backendsAdd(networkActive, backend);
  internalState.value.backends.value = await STATE.backendsGet(networkActive);
}

async function backendsRename(backendId: string, name: string) {
  let networkActive = internalState.value.networkActive.value;
  let backends = await STATE.backendsGet(networkActive);

  let backend = backends[backendId];
  backend.name = name;

  await STATE.backendsUpdate(networkActive, backendId, backend);

  internalState.value.backends.value = await STATE.backendsGet(networkActive);
}

async function backendsDelete(backendId: string) {
  let networkActive = internalState.value.networkActive.value;

  await STATE.backendsDelete(networkActive, backendId);

  internalState.value.backends.value = await STATE.backendsGet(networkActive);
}

const backendsActiveId = internalState.value.backendsActiveId;

async function backendsActiveSet(backendId: string) {
  await STATE.backendsActiveSet(networkActive.value, backendId);
  internalState.value.backendsActiveId.value = backendId;
}

export type { WalletDef, AccountDef, AccountNew, ActiveAccountDef, BackendDef };
export {
  networkActive,
  networkActiveSet,
  // Wallets
  wallets,
  walletsAdd,
  walletsRename,
  walletsDelete,
  // Accounts
  accounts,
  accountsAdd,
  accountsRename,
  accountsDelete,
  accountsActiveId,
  accountsActive,
  accountsActiveSet,
  // Backends
  backends,
  backendsRename,
  backendsAdd,
  backendsDelete,
  backendsActiveId,
  backendsActiveSet,
};
