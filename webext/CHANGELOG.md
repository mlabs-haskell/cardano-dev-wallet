# 1.2.0
* Fix SundaeSwap hanging (#17)

  SundaeSwap and many other dApps seem to be not happy if the API object
  returned by `wallet.enable()` is not a plain object.

  They could be doing something like `Object.keys(api)` which trips up due to
  the presence of internal methods present in the dev wallet, or they
  could be doing something like `apiCopy = {...api}`.

  Not sure of the exact mechanism, but returning a plain object seems to
  fix this.

# 1.1.0

* Fix bugs in the Ogmios/Kupo backend:
  * UTxO index was incorrect.
  * Tokens were missing from the UTxO list.
* Allow specifying custom endpoint for blockfrost.
* Auto activate newly created accounts and backends if there's none active.
* Inject the wallet before any script in the page is run.
* Add seperators in UTxO list, wallets list and network backends list.
