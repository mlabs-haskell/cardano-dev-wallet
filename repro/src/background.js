// import browser from "webextension-polyfill"
import('wallet-lib').then(api => {
  // so that it doesn't get tree shaked away
  // console.log(browser);
  console.log(api)
})
