import * as CSL from "@emurgo/cardano-serialization-lib-browser";
import { Network } from "./Network";

interface Backend {
  getUtxos(address: CSL.Address): Promise<CSL.TransactionUnspentOutput[]>;
  getNetwork(): Network;
  submitTx(tx: string): Promise<string>;
}

export { Backend };
