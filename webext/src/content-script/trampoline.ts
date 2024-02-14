import { RemoteLoggerServer } from "../lib/Web/Logger";
import { WebextRemoteStorage, WebextStorage } from "../lib/Web/Storage";
import { WebextBridgeServer } from "../lib/Web/WebextBridge";

let url = chrome.runtime.getURL("content-script/index.js");
let script = document.createElement("script");
script.src = url;
script.type = "module";

let bridge = new WebextBridgeServer("cdw-contentscript-bridge");
bridge.start()

WebextRemoteStorage.initServer(bridge, new WebextStorage());

new RemoteLoggerServer(bridge).start();

document.head.appendChild(script);
