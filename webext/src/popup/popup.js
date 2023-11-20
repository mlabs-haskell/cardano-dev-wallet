import * as bip39 from "bip39";
import * as CardanoWasm from "@emurgo/cardano-serialization-lib-browser";

function harden(num) {
  return 0x80000000 + num;
}

function el(tag, attrs, children) {
  let elem = document.createElement(tag);
  elem = Object.assign(elem, attrs);
  elem.replaceChildren(...children);
  return elem;
}

function attachHandler(btnId, inputId, outputId, handler) {
  const btn = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  const output = document.getElementById(outputId);
  btn.addEventListener("click", () =>
    output.replaceChildren(handler(input.value))
  );
}

function deriveAddress(rootKey, account, index) {
  const accountKey = rootKey
    .derive(harden(1852))
    .derive(harden(1815))
    .derive(harden(account));

  const utxoPubkey = accountKey.derive(0).derive(index).to_public();
  const stakeKey = accountKey.derive(2).derive(index).to_public();

  const baseAddr = CardanoWasm.BaseAddress.new(
    CardanoWasm.NetworkInfo.mainnet().network_id(),
    CardanoWasm.StakeCredential.from_keyhash(utxoPubkey.to_raw_key().hash()),
    CardanoWasm.StakeCredential.from_keyhash(stakeKey.to_raw_key().hash())
  );

  return baseAddr;
}

function convert(mnemonicOrPk) {
  let rootKey;
  mnemonicOrPk = mnemonicOrPk.trim();

  try {
    if (mnemonicOrPk.indexOf(" ") === -1) {
      // no space => private key
      rootKey = CardanoWasm.Bip32PrivateKey.from_bech32(mnemonicOrPk);
    } else {
      const entropy = bip39.mnemonicToEntropy(mnemonicOrPk);
      rootKey = CardanoWasm.Bip32PrivateKey.from_bip39_entropy(
        Buffer.from(entropy, "hex"),
        Buffer.from("") // password
      );
    }
  } catch (e) {
    let msg = e.toString();
    return el("div", { className: "alert error" }, [
      el("div", { className: "h5" }, "Error"),
      el("div", { className: "" }, [msg]),
    ]);
  }

  let accounts = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ].map(([account, index]) => [
    `Account ${account}, Index ${index}`,
    deriveAddress(rootKey, account, index),
  ]);

  return el(
    "div",
    { className: "column" },
    accounts.map(([label, addr]) =>
      el("div", { className: "alert" }, [
        el("div", { className: "h5" }, label),
        el("div", { className: "" }, [addr.to_address().to_bech32()]),
      ])
    )
  );
}

attachHandler("btn", "mnemonicOrPk", "output", convert);

if (Math.random() < 0.5) {
  const mnemonic = bip39.generateMnemonic(256);
  document.getElementById("mnemonicOrPk").value = mnemonic;
} else {
  const mnemonic = bip39.generateMnemonic(256);
  const entropy = bip39.mnemonicToEntropy(mnemonic);
  const rootKey = CardanoWasm.Bip32PrivateKey.from_bip39_entropy(
    Buffer.from(entropy, "hex"),
    Buffer.from("") // password
  );
  const privateKey = rootKey.to_bech32();
  document.getElementById("mnemonicOrPk").value = privateKey;
}
