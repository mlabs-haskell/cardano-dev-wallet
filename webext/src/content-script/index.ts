import * as CIP30 from "../lib/CIP30";
import { RemoteLogger } from "../lib/Web/Logger";
import { WebextRemoteStorage } from "../lib/Web/Storage";
import { WebextBridgeClient } from "../lib/Web/WebextBridge";

declare global {
  interface Window {
    cardano?: any;
  }
}

if (window.cardano == null) {
  window.cardano = {};
}

let bridge = new WebextBridgeClient("cdw-contentscript-bridge");
bridge.start()

let store = new WebextRemoteStorage(bridge);

let logger = new RemoteLogger(bridge);

window.cardano.DevWallet = new CIP30.CIP30Entrypoint(store, logger);
window.cardano.nami = new CIP30.CIP30Entrypoint(store, logger);
console.log("Injected into nami and DevWallet", window.cardano)
