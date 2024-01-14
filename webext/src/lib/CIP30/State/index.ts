import { NetworkName } from "../Network";
import { HeirarchialStore } from "./Store";

export * from "./Types";
export * from "./Store";

import { Account, Backend, Overrides, RootKey } from "./Types";

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

  async _getCurrentNetworkStore() {
    let activeNetwork = await this.activeNetworkGet();
    return this.rootStore.withPrefix(activeNetwork);
  }

  async _recordsGet<T>(key: string): Promise<Record<number, T>> {
    let store = await this._getCurrentNetworkStore();
    let records = await store.get(key);
    if (records == null) return {};
    return records;
  }

  async _recordsAdd<T>(key: string, value: T): Promise<number> {
    let store = await this._getCurrentNetworkStore();
    let id = await store.get(key + "/nextId");
    if (id == null) id = 0;
    let records = await store.get(key);
    if (records == null) records = {};
    records[id] = value;
    await store.set(key, records);
    await store.set(key + "/nextId", id + 1);
    return id;
  }

  async _recordsUpdate<T>(key: string, id: number, value: T) {
    let store = await this._getCurrentNetworkStore();
    let records = await store.get(key);
    records[id] = value;
    await store.set(key, records);
  }

  async _recordsDelete(key: string, id: number) {
    let store = await this._getCurrentNetworkStore();
    let records = await store.get(key);
    delete records[id];
    await store.set(key, records);
  }

  async rootKeysGet(): Promise<Record<number, RootKey>> {
    return this._recordsGet("rootKeys");
  }

  async rootKeysAdd(rootKey: RootKey): Promise<number> {
    return this._recordsAdd("rootKeys", rootKey);
  }

  async rootKeysUpdate(id: number, rootKey: RootKey) {
    return this._recordsUpdate("rootKeys", id, rootKey);
  }

  async rootKeysDelete(id: number) {
    return this._recordsDelete("rootKeys", id);
  }

  async accountsGet(): Promise<Record<number, Account>> {
    return this._recordsGet("accounts");
  }

  async accountsAdd(account: Account): Promise<number> {
    return this._recordsAdd("accounts", account);
  }

  async accountsUpdate(id: number, account: Account) {
    return this._recordsUpdate("accounts", id, account);
  }

  async accountsDelete(id: number) {
    return this._recordsDelete("accounts", id);
  }

  async accountsGetActive(): Promise<number | null> {
    let store = await this._getCurrentNetworkStore();
    let id = store.get("accounts/activeId");
    if (id == null) return null;
    return id;
  }

  async accountsSetActive(id: number) {
    let store = await this._getCurrentNetworkStore();
    await store.set("accounts/activeId", id);
  }

  async backendsGet(): Promise<Record<number, Backend>> {
    return this._recordsGet("backends");
  }

  async backendsAdd(backend: Backend): Promise<number> {
    return this._recordsAdd("backends", backend);
  }

  async backendsUpdate(id: number, backend: Backend) {
    return this._recordsUpdate("backends", id, backend);
  }

  async backendsDelete(id: number) {
    return this._recordsDelete("backends", id);
  }

  async backendsGetActive(): Promise<number | null> {
    let store = await this._getCurrentNetworkStore();
    let id = store.get("backends/activeId");
    if (id == null) return null;
    return id;
  }

  async backendsSetActive(id: number) {
    let store = await this._getCurrentNetworkStore();
    await store.set("backends/activeId", id);
  }

  async overridesGet(): Promise<Overrides> {
    let store = await this._getCurrentNetworkStore();
    let overrides = store.get("overrides");
    if (overrides == null)
      return {
        balance: null,
        hiddenUtxos: [],
        hiddenCollateral: [],
      };
    return overrides;
  }

  async overridesSet(overrides: Overrides) {
    let store = await this._getCurrentNetworkStore();
    await store.set("overrides", overrides);
  }

  async callLogsGet(): Promise<string[]> {
    let store = await this._getCurrentNetworkStore();
    let logs = await store.get("callLogs");
    if (logs == null) return [];
    return logs;
  }

  async callLogsPush(idx: number | null, log: string): Promise<number> {
    let store = await this._getCurrentNetworkStore();
    let logs: string[] | null = await store.get("callLogs");
    if (logs == null) logs = [];
    if (idx == null) idx = logs.length;
    logs.push("[" + idx + "] " + log);
    await store.set("callLogs", logs);
    return idx;
  }

  async callLogsClear() {
    let store = await this._getCurrentNetworkStore();
    await store.set("callLogs", []);
  }
}

export { State };
