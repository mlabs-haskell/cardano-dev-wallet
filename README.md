# Cardano Dev Wallet

## Setup

To setup your dev environment you need to first build the cardano-transaction-library-api, this can be found in `cardano-transaction-library/`.

Go to that folder and run `npm i && npm run build` to build the purescript API with spago.

Once that is done, come back to the root folder. First run `npm i` to install all the dependencies, followed by `npm run build` to build the extension for all supported browsers.
