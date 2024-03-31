# 1.1.0

* Fix bugs in the Ogmios/Kupo backend:
  * UTxO index was incorrect.
  * Tokens were missing from the UTxO list.
* Auto activate newly created accounts and backends if there's none active.
* Inject the wallet before any script in the page is run.
