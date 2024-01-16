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
  const accountActiveId = signal(
    await STATE.accountsActiveGet(networkActive.value),
  );
  const backends = signal(await STATE.backendsGet(networkActive.value));
  const backendActiveId = signal(
    await STATE.backendsActiveGet(networkActive.value),
  );

  return {
    networkActive,
    rootKeys,
    accounts,
    accountActiveId,
    backends,
    backendActiveId,
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

  let idsToDelete = []
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

  await accountsDeleteByWallet(accountId);
  await STATE.accountsDelete(networkActive, accountId);

  internalState.value.accounts.value = await STATE.accountsGet(networkActive);
}

interface ActiveAccountDef {
  walletId: string;
  walletDef: WalletDef;
  accountId: string;
  accountDef: AccountDef;
}

const accountActiveId = internalState.value.accountActiveId;

const accountActive = computed<ActiveAccountDef | null>(() => {
  let activeAccountId = internalState.value.accountActiveId.value;
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

async function accountActiveSet(acId: string) {
  await STATE.accountsActiveSet(networkActive.value, acId);
  internalState.value.accountActiveId.value = acId;
}

export type { WalletDef, AccountDef, AccountNew, ActiveAccountDef };
export {
  networkActive,
  networkActiveSet,
  wallets,
  walletsAdd,
  walletsRename,
  walletsDelete,
  accounts,
  accountsAdd,
  accountsRename,
  accountsDelete,
  accountActiveId,
  accountActive,
  accountActiveSet,
};
