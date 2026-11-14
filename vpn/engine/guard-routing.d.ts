import type { StoredWebsiteFilterList } from "../../vendor/proton-source/source/js/vpn/WebsiteFilter";
export declare function directTrafficRules(config: StoredWebsiteFilterList | undefined, templates: chrome.declarativeNetRequest.Rule[]): chrome.declarativeNetRequest.Rule[];
