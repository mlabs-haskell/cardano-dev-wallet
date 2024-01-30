import { WebextRemoteStorage, WebextStorage } from "../lib/CIP30/State";

let url = chrome.runtime.getURL("content-script/index.js");
let script = document.createElement("script");
script.src = url;
script.type = "module";

WebextRemoteStorage.initServer("cdw.storage", new WebextStorage());

document.body.appendChild(script);
