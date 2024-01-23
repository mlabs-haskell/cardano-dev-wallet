import { render } from "preact";
import { useState } from "preact/hooks";

import * as State from "./State";

import OverviewPage from "./pages/Overview";
import { NetworkName } from "../../lib/CIP30";

function App() {
  let [navActive, setNavActive] = useState("Overview");

  const pages = {
    Overview: OverviewPage,
    Accounts: "Accounts",
    Network: "Network",
  };

  let navItems = Object.keys(pages);

  let activePage = pages[navActive];
  return (
    <>
      <Header navItems={navItems} navActive={navActive} />
      {activePage()}
    </>
  );
}

function Header({
  navItems,
  navActive,
}: {
  navItems: string[];
  navActive: string;
}) {
  return (
    <div class="header">
      <HeaderLeft />
      <HeaderNav navItems={navItems} navActive={navActive} />
    </div>
  );
}

function HeaderLeft() {
  let networkActive = State.networkActive.value;
  return (
    <div class="header-left">
      <div class="logo">
        <img src="static/logo.png" />
        <div class="logo-text-box">
          <div class="logo-title">Cardano</div>
          <div class="logo-subtitle">
            <span class="color-action">Dev</span> Wallet
          </div>
        </div>
      </div>
      <div class="network-selector">
        {[NetworkName.Mainnet, NetworkName.Preprod, NetworkName.Preview].map(
          (network) => (
            <button
              class={
                "button L4" + (network == networkActive ? "" : " -secondary")
              }
              onClick={() => State.networkActiveSet(network)}
            >
              {network}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

function HeaderNav({
  navItems,
  navActive,
}: {
  navItems: string[];
  navActive: string;
}) {
  return (
    <nav class="header-nav">
      {navItems.map((nav) => (
        <a class={"nav-item " + (navActive == nav ? "-active" : "")}>{nav}</a>
      ))}
    </nav>
  );
}

render(<App />, document.getElementById("app")!);
