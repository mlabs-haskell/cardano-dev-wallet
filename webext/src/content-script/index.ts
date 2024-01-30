import * as CIP30 from "../lib/CIP30";
import { HeirarchialStore, State, WebextRemoteStorage } from "../lib/CIP30/State";

declare global {
  interface Window {
    cardano?: any;
  }
}

if (window.cardano == null) {
  window.cardano = {};
}

let store = new WebextRemoteStorage("cdw.storage");
store.initClient();

let state = new State(new HeirarchialStore(store));

window.cardano.DevWallet = new CIP30.CIP30Entrypoint(state);
window.cardano.nami = new CIP30.CIP30Entrypoint(state);
console.log("Injected into nami and DevWallet", window.cardano)
