# Cardano Dev Wallet

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
