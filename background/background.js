const browser = require("webextension-polyfill")

import("../output/Api/index.js").then(api => {
  const handleMessage = async (msg, sender, cb) => {
    console.log("Received %s", msg.type)

    switch (msg.type) {

      case 'privateKeyFromMnemonic':
        const pk = await api.privateKeyFromMnemonic(msg.data)
        return cb(pk)

      case 'privateKeysToAddress':
        const addr = await api.privateKeysToAddress(msg.data, null, 1) // No stake key passed in for now, 1 is mainnet id
        return cb(addr)

      case 'paymentKeyFromEnvelope':
        const paymentKey = await api.paymentKeyFromEnvelope(msg.data)
        return cb(paymentKey)

      case 'stakeKeyFromEnvelope':
        const stakeKey = await api.stakeFromEnvelope(msg.data)
        return cb(stakeKey)

      default:
        console.error('Unsupported msg type')
        throw new Error('Unsupported msg type')
    }
  }
  browser.runtime.onMessage.addListener(handleMessage)
})
