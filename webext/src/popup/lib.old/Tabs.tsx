import { VNode } from "preact";
import { useState } from "preact/hooks";

interface TabsProps {
  tabs: {
    [name: string]: VNode;
  };
  defaultTab?: string;
}
export function Tabs({ tabs, defaultTab }: TabsProps) {
  let [selected, setSelected] = useState(defaultTab || Object.keys(tabs)[0]);
  return (
    <div class="tabs">
      <div class="tab-buttons pad-m">
        {...Object.keys(tabs).map((name) => (
          <a
            href=""
            class={"tab-button " + (selected == name ? "-selected" : "")}
            onClick={(ev) => {
              ev.preventDefault();
              setSelected(name);
            }}
          >
            {name}
          </a>
        ))}
      </div>
      <div class="tabs-body">
        {...Object.entries(tabs).map(([name, body]) => (
          <div class={"tab " + (selected == name ? "-selected" : "")}>{body}</div>
        ))}
      </div>
    </div>
  );
}
