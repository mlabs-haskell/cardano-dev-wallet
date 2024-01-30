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

export { HeirarchialStore, type Store, WebStorage, WebextStorage }
