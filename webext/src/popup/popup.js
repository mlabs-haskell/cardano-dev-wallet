import browser from "webextension-polyfill";

const findActiveTabAndSendMessage = async (msg) => {
  const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
  return browser.tabs.sendMessage(tab.id, msg);
}

export const handlePkFromMnemonic = async () => {
  const mnemonic = document.getElementById("pk-from-mnemonic")
  const pk = await findActiveTabAndSendMessage({ type: 'privateKeyFromMnemonic', data: mnemonic.value })
  mnemonic.value = pk
}

export const handlePkToAddress = async () => {
  const pk = document.getElementById("pk-to-address")
  const addr = await findActiveTabAndSendMessage({ type: 'privateKeysToAddress', data: pk.value })
  pk.value = addr
}

export const handlePaymentKeyFromEnveloe = async () => {
  const envelope = document.getElementById("payment-key-from-envelope")
  const paymentKey = await findActiveTabAndSendMessage({ type: 'paymentKeyFromEnvelope', data: envelope.value })
  envelope.value = paymentKey
}

export const stakePaymentKeyFromEnvelope = async () => {
  const envelope = document.getElementById("stake-key-from-envelope")
  const stakeKey = await findActiveTabAndSendMessage({ type: 'stakeKeyFromEnvelope', data: envelope.value })
  envelope.value = stakeKey
}

document.getElementById("btn-pk-from-mnemonic").addEventListener("click", handlePkFromMnemonic)
document.getElementById("btn-pk-to-address").addEventListener("click", handlePkToAddress)
document.getElementById("btn-payment-key-from-envelope").addEventListener("click", handlePaymentKeyFromEnveloe)
document.getElementById("btn-stake-key-from-envelope").addEventListener("click", stakePaymentKeyFromEnvelope)
