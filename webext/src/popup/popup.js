import browser from "webextension-polyfill";

console.log("popup")
console.log(document.getElementById("btn-pk-from-mnemonic"))

export const handlePkFromMnemonic = async () => {
  const mnemonic = document.getElementById("pk-from-mnemonic")
  const pk = await browser.runtime.sendMessage({ type: 'privateKeyFromMnemonic', data: mnemonic.value })
  console.log("Popup: ", pk);
  mnemonic.value = pk
}

export const handlePkToAddress = async () => {
  const pk = document.getElementById("pk-to-address")
  const addr = await browser.runtime.sendMessage({ type: 'privateKeysToAddress', data: pk.value })
  pk.value = addr
}

export const handlePaymentKeyFromEnveloe = async () => {
  const envelope = document.getElementById("payment-key-from-envelope")
  const paymentKey = await browser.runtime.sendMessage({ type: 'paymentKeyFromEnvelope', data: envelope.value })
  envelope.value = paymentKey
}

export const stakePaymentKeyFromEnvelope = async () => {
  const envelope = document.getElementById("stake-key-from-envelope")
  const stakeKey = await browser.runtime.sendMessage({ type: 'stakeKeyFromEnvelope', data: envelope.value })
  envelope.value = stakeKey
}

document.getElementById("btn-pk-from-mnemonic").addEventListener("click", handlePkFromMnemonic)
document.getElementById("btn-pk-to-address").addEventListener("click", handlePkToAddress)
document.getElementById("btn-payment-key-from-envelope").addEventListener("click", handlePaymentKeyFromEnveloe)
document.getElementById("btn-stake-key-from-envelope").addEventListener("click", stakePaymentKeyFromEnvelope)