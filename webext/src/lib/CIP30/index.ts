export * from "./Backend";
export * from "./ErrorTypes";
export * from "./Network";
export * from "./Types";
export * from "./WalletApi";
export * from "./WalletApiInternal";

import { Wallet } from "../Wallet";
import { Backend } from "./Backend";
import { WalletApi } from "./WalletApi";

import WalletIcon from "./Icon";
import { WalletApiInternal } from "./WalletApiInternal";
import { State } from "./State";
import { APIError, APIErrorCode } from "./ErrorTypes";
import { networkNameToId } from "./Network";
import { BlockFrostBackend } from "./Backends/Blockfrost";
import { OgmiosKupoBackend } from "./Backends/OgmiosKupo";

/**
 * CIP30 Entrypoint.
 */
class CIP30Entrypoint {
  apiVersion: string = "1";
  supportedExtensions = [];
  name: string = "Cardano Dev Wallet";
  icon: string = WalletIcon;

  state: State;

  constructor(state: State) {
    this.state = state;
  }

  async isEnabled(): Promise<boolean> {
    return true;
  }

  async enable(): Promise<WalletApi> {
    // Fetch active network
    let networkName = await this.state.activeNetworkGet();
    let networkId = networkNameToId(networkName);

    // Fetch active account
    let accountId = await this.state.accountsGetActive(networkName);
    if (accountId == null) {
      let err: APIError = {
        code: APIErrorCode.Refused,
        info: "Please configure the active account in the extension",
      };
      throw err;
    }
    let accounts = await this.state.accountsGet(networkName);
    let accountInfo = accounts[accountId];
    let keys = await this.state.rootKeysGet(networkName);
    let keyInfo = keys[accountInfo.keyId];

    let wallet = new Wallet({ networkId, privateKey: keyInfo.keyBech32 });
    let account = wallet.account(accountInfo.accountIdx, 0);

    // Fetch active backend
    let backendId = await this.state.backendsGetActive(networkName);
    if (backendId == null) {
      let err: APIError = {
        code: APIErrorCode.Refused,
        info: "Please configure the active backend in the extension",
      };
      throw err;
    }
    let backends = await this.state.backendsGet(networkName);
    let backendInfo = backends[backendId];
    let backend: Backend;
    if (backendInfo.type == "blockfrost") {
      backend = new BlockFrostBackend(backendInfo.projectId);
    } else if (backendInfo.type == "ogmios_kupo") {
      backend = new OgmiosKupoBackend(backendInfo);
    } else {
      throw new Error("Unreachable");
    }

    // Construct api
    let apiInternal = new WalletApiInternal(account, backend, networkId, this.state);
    let api = new WalletApi(apiInternal, this.state, accountId, networkName);

    return api;
  }
}

export { CIP30Entrypoint };
