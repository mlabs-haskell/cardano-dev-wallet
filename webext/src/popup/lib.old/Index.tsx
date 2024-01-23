import { render } from "preact";
import { Tabs } from "./Tabs";
import { OverridesTab } from "./OverridesTab";
import { NetworkTab } from "./NetworkTab";
import { AccountsTab } from "./AccountsTab";
import { OverviewTab } from "./OverviewTab";
import { LogsTab } from "./LogsTab";

function App() {
  return (
    <div class="column gap w-full">
      <Body />
    </div>
  );
}

function Body() {
  return (
    <div class="column w-full">
      <Tabs
        tabs={{
          Overview: <OverviewTab />,
          Accounts: <AccountsTab />,
          Network: <NetworkTab />,
          Logs: <LogsTab />,
          Overrides: <OverridesTab />,
        }}
        defaultTab={"Network"}
      />
    </div>
  );
}

render(App(), document.getElementById("app")!);
