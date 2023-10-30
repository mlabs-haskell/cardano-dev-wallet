import browser from "webextension-polyfill"
import('wallet-lib').then(api => {
  const handleMessage = async (msg, _sender) => {
    console.log("Received %s", msg.type, msg.data)

    switch (msg.type) {

      case 'privateKeyFromMnemonic':
        const pk = await api.privateKeyFromMnemonic(msg.data)
        return pk.to_bech32();

      case 'privateKeysToAddress':
        const addr = await api.privateKeysToAddress(msg.data, null, 1) // No stake key passed in for now, 1 is mainnet id
        return addr;

      case 'paymentKeyFromEnvelope':
        const paymentKey = await api.paymentKeyFromEnvelope(msg.data)
        return paymentKey;

      case 'stakeKeyFromEnvelope':
        const stakeKey = await api.stakeKeyFromEnvelope(msg.data)
        return stakeKey;

      default:
        console.error('Unsupported msg type')
        throw new Error('Unsupported msg type')
    }
  }

  browser.runtime.onMessage.addListener(handleMessage)
})
