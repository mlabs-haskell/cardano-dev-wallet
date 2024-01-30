class HeirarchialStore {
  prefix: string[]
  backend: Store;

  constructor(backend: Store, prefix: string[] = []) {
    this.prefix = prefix;
    this.backend = backend;
  }

  get(key: string): Promise<any> {
    key = [...this.prefix, key].join("/");
    return this.backend.get(key);
  }

  set(key: string, value: any): Promise<void> {
    key = [...this.prefix, key].join("/");
    return this.backend.set(key, value);
  }

  withPrefix(...prefix: string[]): HeirarchialStore {
    return new HeirarchialStore(this.backend, [...this.prefix, ...prefix]);
  }
}


interface Store {
  set(key: string, value: any): Promise<void>;
  get(key: string): Promise<any>;
}

class WebextStorage implements Store {
  async set(key: string, value: any): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }

  async get(key: string): Promise<any> {
    return (await chrome.storage.local.get(key))[key];
  }
}

class WebStorage implements Store {
  async set(key: string, value: any): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async get(key: string): Promise<any> {
    let val = localStorage.getItem(key);
    if (val == null) return null;
    return JSON.parse(val);
  }
}

class WebextRemoteStorage implements Store {
  id: string;

  promisesGet: { [key: string]: (val: string) => void }
  promisesSet: { [key: string]: () => void }

  constructor(id: string) {
    this.id = id;
    this.promisesGet = {};
    this.promisesSet = {};
  }

  initClient() {
    window.addEventListener('message', (ev) => {
      let data = ev.data;
      if (data.id != this.id) { return; }
      if (data.type != 'response') { return; }
      if (data.method == 'get') {
        let key = data.key;
        let value = data.value;
        let resolve = this.promisesGet[key];
        if (!resolve) return;
        resolve(value);
      } else if (data.method == 'set') {
        let key = data.key;
        let resolve = this.promisesSet[key];
        if (!resolve) return;
        resolve();
      }
    });
  }

  static initServer(id: string, base: Store) {
    window.addEventListener('message', async (ev) => {
      let data = ev.data;
      if (data.id != id) { return; }
      if (data.type != 'request') { return; }
      if (data.method == 'get') {
        let key = data.key;
        let value = await base.get(key);
        ev.source?.postMessage({
          id,
          type: 'response',
          method: 'get',
          key,
          value,
        });
      } else if (data.method == 'set') {
        let key = data.key;
        let value = data.value;
        await base.set(key, value);
        ev.source?.postMessage({
          id,
          type: 'response',
          method: 'set',
          key,
          value,
        });
      }
    });
  }

  async set(key: string, value: any): Promise<void> {
    let p = new Promise<void>((resolve) => {
      this.promisesSet[key] = resolve;
    });
    window.postMessage({
      id: this.id,
      type: 'request',
      method: 'set',
      key,
      value
    });
    return p;
  }

  async get(key: string): Promise<any> {
    let p = new Promise<string>((resolve) => {
      this.promisesGet[key] = resolve;
    });
    window.postMessage({
      id: this.id,
      type: 'request',
      method: 'get',
      key,
    });
    return p;
  }
}

export { HeirarchialStore, type Store, WebStorage, WebextStorage, WebextRemoteStorage }
