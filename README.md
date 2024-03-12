# Cardano Dev Wallet 

A browser extension that implements [CIP-30](https://cips.cardano.org/cip/CIP-30/) Cardano wallet connector with a UI that is more convenient for developers than mainstream user-oriented wallets.

- Uses Blockfrost or Ogmios+Kupo as backend 
- Works with custom Cardano networks (Kupo+Ogmios)
- Allows to inspect CIP-30 method logs
- Allows to load private keys or mnemonics

[![Mozilla Add-on Users](https://img.shields.io/amo/users/cardano-dev-wallet?logo=firefox&label=Install%20for%20Firefox)](https://addons.mozilla.org/en-US/firefox/addon/cardano-dev-wallet/) [![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/afnjoihjkimddgemefealgkefejaigme?logo=chrome&label=Install%20for%20Chrome)](https://chromewebstore.google.com/detail/cardano-dev-wallet/afnjoihjkimddgemefealgkefejaigme)

## User Guide

See [guide/Readme.md](guide/Readme.md)

## Workflow

`cd webext` before issuing any of the commands below.

### Develop UI
- Run: `node build.js`
- Open `http://localhost:8000/` in the browser.
- This will run the extension as a simple webpage.
  - No webextension features will be available, like connecting to a dApp.
  - Just for faster feedback cycles when tweaking the UI.

### Develop WebExtension
- Run: `node build.js --run`
- Chrome will launch with the extension loaded.
- Configure the network and accounts to start developing.
- Any changes to the source code will auto build & reload the extension.

### Bundling
- Run: `node build.js --bundle`

### More Options
- Run: `node build.js --help` to see all the available options.

## Plutip

See [plutip/README.md](plutip/README.md) to see how to configure Plutip for use with the extension.

## Devloper Notes

See [DevNotes.md](DevNotes.md)
