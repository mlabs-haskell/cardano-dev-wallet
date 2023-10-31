// var __esm = (fn, res) => function __init() {
//   return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
// };

// I guess this is what the above cryptic code translates to.
var __esm = (fn, res) => function __init() {
  if (fn) {
    let actualFn = fn[Object.getOwnPropertyNames(fn)[0]];
    res = actualFn(fn = 0);
  }
  return res;
};

var init_Ctl_Internal_QueryM4 = async () => {
}

var init_Ctl_Internal12 = __esm({
  async "../wallet-lib/output/Ctl.Internal.QueryM/index.js"() {
    //..
    await init_Ctl_Internal_QueryM4();
  }
})

var init_Ctl_Internal_Contract2 = __esm({
  async "../wallet-lib/output/Ctl.Internal.Contract.QueryHandle/index.js"() {
    //..
    await init_Ctl_Internal12();

  }
})

var init_Ctl_Internal_Contract3 = __esm({
  async "../wallet-lib/output/Ctl.Internal.Contract.Monad/index.js"() {
    //..
    await init_Ctl_Internal_Contract2();

  }
})

var init_Contract2 = __esm({
  async "../wallet-lib/output/Contract.Monad/index.js"() {
    //..
    await init_Ctl_Internal_Contract3();

  }
})

var init_Contract3 = __esm({
  async "../wallet-lib/output/Contract.Address/index.js"() {
    //..
    await init_Contract2();

  }
})

var init_Contract4 = __esm({
  async "../wallet-lib/output/Contract.Config/index.js"() {
    //..
    await init_Contract3();
  }
})

var init_Api = __esm({
  async "../wallet-lib/output/Api/index.js"() {
    //..
    await init_Contract4();
  }
})

init_Api();
