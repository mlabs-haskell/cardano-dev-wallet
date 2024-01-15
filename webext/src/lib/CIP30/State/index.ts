import { NetworkName } from "../Network";
import { HeirarchialStore } from "./Store";

export * from "./Types";
export * from "./Store";

import { Account, Backend, Overrides, RootKey } from "./Types";

type Record<T> = { [key: string]: T };

class State {
  rootStore: HeirarchialStore;
  constructor(store: HeirarchialStore) {
    this.rootStore = store;
  }

  async activeNetworkGet(): Promise<NetworkName> {
    let activeNetwork: NetworkName | null =
      await this.rootStore.get("activeNetwork");
    if (activeNetwork == null) {
      return NetworkName.Mainnet;
    }
    return activeNetwork;
  }

  async activeNetworkSet(network: NetworkName) {
    await this.rootStore.set("activeNetwork", network);
  }

  async _getNetworkSubStore(network: NetworkName) {
    return this.rootStore.withPrefix(network);
  }

  async _recordsGet<T>(network: NetworkName, key: string): Promise<Record<T>> {
    let store = await this._getNetworkSubStore(network);
    let records = await store.get(key);
    if (records == null) return {};
    return records;
  }

  async _recordsAdd<T>(
    network: NetworkName,
    key: string,
    value: T,
  ): Promise<string> {
    let store = await this._getNetworkSubStore(network);
    let id: number | null = await store.get(key + "/nextId");
    if (id == null) id = 0;
    let records = await store.get(key);
    if (records == null) records = {};
    records[id] = value;
    await store.set(key, records);
    await store.set(key + "/nextId", id + 1);
    return id.toString();
  }

  async _recordsUpdate<T>(
    network: NetworkName,
    key: string,
    id: string,
    value: T,
  ) {
    let store = await this._getNetworkSubStore(network);
    let records = await store.get(key);
    records[id] = value;
    await store.set(key, records);
  }

  async _recordsDelete(network: NetworkName, key: string, id: string) {
    let store = await this._getNetworkSubStore(network);
    let records = await store.get(key);
    delete records[id];
    await store.set(key, records);
  }

  async rootKeysGet(network: NetworkName): Promise<Record<RootKey>> {
    return this._recordsGet(network, "rootKeys");
  }

  async rootKeysAdd(network: NetworkName, rootKey: RootKey): Promise<string> {
    return this._recordsAdd(network, "rootKeys", rootKey);
  }

  async rootKeysUpdate(network: NetworkName, id: string, rootKey: RootKey) {
    return this._recordsUpdate(network, "rootKeys", id, rootKey);
  }

  async rootKeysDelete(network: NetworkName, id: string) {
    return this._recordsDelete(network, "rootKeys", id);
  }

  async accountsGet(network: NetworkName): Promise<Record<Account>> {
    return this._recordsGet(network, "accounts");
  }

  async accountsAdd(network: NetworkName, account: Account): Promise<string> {
    return this._recordsAdd(network, "accounts", account);
  }

  async accountsUpdate(network: NetworkName, id: string, account: Account) {
    return this._recordsUpdate(network, "accounts", id, account);
  }

  async accountsDelete(network: NetworkName, id: string) {
    return this._recordsDelete(network, "accounts", id);
  }

  async accountsGetActive(network: NetworkName): Promise<string | null> {
    let store = await this._getNetworkSubStore(network);
    let id = store.get("accounts/activeId");
    if (id == null) return null;
    return id;
  }

  async accountsSetActive(network: NetworkName, id: string) {
    let store = await this._getNetworkSubStore(network);
    await store.set("accounts/activeId", id);
  }

  async backendsGet(network: NetworkName): Promise<Record<Backend>> {
    return this._recordsGet(network, "backends");
  }

  async backendsAdd(network: NetworkName, backend: Backend): Promise<string> {
    return this._recordsAdd(network, "backends", backend);
  }

  async backendsUpdate(network: NetworkName, id: string, backend: Backend) {
    return this._recordsUpdate(network, "backends", id, backend);
  }

  async backendsDelete(network: NetworkName, id: string) {
    return this._recordsDelete(network, "backends", id);
  }

  async backendsGetActive(network: NetworkName): Promise<string | null> {
    let store = await this._getNetworkSubStore(network);
    let id = store.get("backends/activeId");
    if (id == null) return null;
    return id;
  }

  async backendsSetActive(network: NetworkName, id: string) {
    let store = await this._getNetworkSubStore(network);
    await store.set("backends/activeId", id);
  }

  async overridesGet(network: NetworkName): Promise<Overrides> {
    let store = await this._getNetworkSubStore(network);
    let overrides = store.get("overrides");
    if (overrides == null)
      return {
        balance: null,
        hiddenUtxos: [],
        hiddenCollateral: [],
      };
    return overrides;
  }

  async overridesSet(network: NetworkName, overrides: Overrides) {
    let store = await this._getNetworkSubStore(network);
    await store.set("overrides", overrides);
  }

  async callLogsGet(network: NetworkName): Promise<string[]> {
    let store = await this._getNetworkSubStore(network);
    let logs = await store.get("callLogs");
    if (logs == null) return [];
    return logs;
  }

  async callLogsPush(
    network: NetworkName,
    idx: number | null,
    log: string,
  ): Promise<number> {
    let store = await this._getNetworkSubStore(network);
    let logs: string[] | null = await store.get("callLogs");
    if (logs == null) logs = [];
    if (idx == null) idx = logs.length;
    logs.push("[" + idx + "] " + log);
    await store.set("callLogs", logs);
    return idx;
  }

  async callLogsClear(network: NetworkName) {
    let store = await this._getNetworkSubStore(network);
    await store.set("callLogs", []);
  }
}

export { State };
