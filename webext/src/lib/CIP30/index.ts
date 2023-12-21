export * from "./Backend";
export * from "./ErrorTypes";
export * from "./Network";
export * from "./Types";
export * from "./WalletApi";
export * from "./WalletApiInternal";

import WalletIcon from "./Icon.js";
import { WalletApi } from "./WalletApi";

/**
 * CIP30 Entrypoint.
 */
export class CIP30Entrypoint {
  apiVersion: string = "1";
  supportedExtensions = [];
  name: string = "Cardano Dev Wallet";
  icon: string = WalletIcon;
  #storage: Storage;

  constructor() {
    this.#storage = new Storage();
  }

  async isEnabled(): Promise<boolean> {
    throw new Error("Not implemented");
  }

  async enable(): Promise<WalletApi> {
    throw new Error("Not implemented");
  }
}

class Storage {
  getAccounts() {
    for (let [key, val] of Object.entries(localStorage)) {
      if (key.startsWith("account/")) {
        // TODO
      }
    }
  }
}
