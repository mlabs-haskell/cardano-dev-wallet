import { CIP30WalletApi } from "./CIP30WalletApi.js";
import WalletIcon from "./BlockFrost/Icon.js";

/**
 * CIP30 wallet interface.
 */
class CIP30WalletEntrypoint {
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

  async enable(): Promise<CIP30WalletApi> {
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

export { CIP30WalletEntrypoint };
