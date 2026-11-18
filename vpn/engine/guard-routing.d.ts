import type { StoredWebsiteFilterList } from "../runtime/vpn/WebsiteFilter";
export declare function directTrafficRules(config: StoredWebsiteFilterList | undefined, templates: chrome.declarativeNetRequest.Rule[]): chrome.declarativeNetRequest.Rule[];
