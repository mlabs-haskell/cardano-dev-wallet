import * as bip39 from "bip39";
import * as CardanoWasm from "@emurgo/cardano-serialization-lib-browser";

function harden(num) {
  return 0x80000000 + num;
}

function attachHandler(btnId, inputId, outputId, handler) {
  const btn = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  const output = document.getElementById(outputId);
  btn.addEventListener(
    "click",
    () => (output.innerText = handler(input.value))
  );
}

function pkFromMnemonic(mnemonic) {
  const entropy = bip39.mnemonicToEntropy(mnemonic);
  const rootKey = CardanoWasm.Bip32PrivateKey.from_bip39_entropy(
    Buffer.from(entropy, "hex"),
    Buffer.from("") // password
  );
  return rootKey.to_bech32();
}

function pkToAddresses(privateKey) {
  const rootKey = CardanoWasm.Bip32PrivateKey.from_bech32(privateKey);
  const accountKey = rootKey
    .derive(harden(1852))
    .derive(harden(1815))
    .derive(harden(0));

  const utxoPubkey = accountKey.derive(0).derive(0).to_public();
  const stakeKey = accountKey.derive(2).derive(0).to_public();

  const baseAddr = CardanoWasm.BaseAddress.new(
    CardanoWasm.NetworkInfo.mainnet().network_id(),
    CardanoWasm.StakeCredential.from_keyhash(utxoPubkey.to_raw_key().hash()),
    CardanoWasm.StakeCredential.from_keyhash(stakeKey.to_raw_key().hash())
  );

  return [
    `Payment Address:\n${utxoPubkey.to_bech32()}`,
    `Stake Address:\n${stakeKey.to_bech32()}`,
    `Base Address:\n${baseAddr.to_address().to_bech32()}`,
  ].join("\n\n");
}

attachHandler("btn", "mnemonic", "output", pkFromMnemonic);

const mnemonic = bip39.generateMnemonic();
document.getElementById("pk-from-mnemonic").value = mnemonic;
