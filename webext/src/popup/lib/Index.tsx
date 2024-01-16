import { render } from "preact";
import { Tabs } from "./Tabs";
import { OverridesTab } from "./OverridesTab";
import { NetworkTab } from "./NetworkTab";
import { AccountsTab } from "./AccountsTab";
import { HomeTab } from "./HomeTab";
import { LogsTab } from "./LogsTab";

function App() {
  return (
    <div class="column gap w-full">
      <Header />
      <Body />
    </div>
  );
}

function Header() {
  return (
    <div class="row">
      <Logo />
      <div class="grow-1"></div>
      <NetworkSelector />
    </div>
  );
}

function Logo() {
  return (
    <img
      src="./static/icon.svg"
      style={{
        width: "3em",
      }}
    />
  );
}

function NetworkSelector() {
  return <div class="column align-center">
    <label>
      <select>
        <option>mainnet</option>
        <option>preprod</option>
        <option>preview</option>
      </select>
    </label>
  </div>;
}

function Body() {
  return (
    <div class="column w-full">
      <Tabs
        tabs={{
          Home: <HomeTab />,
          Accounts: <AccountsTab />,
          Network: <NetworkTab />,
          Overrides: <OverridesTab />,
          Logs: <LogsTab />,
        }}
        defaultTab={"Accounts"}
      />
    </div>
  );
}

render(App(), document.getElementById("app")!);