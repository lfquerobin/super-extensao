import type {StoredWebsiteFilterList} from "../../vendor/proton-source/source/js/vpn/WebsiteFilter";

// Keep exact hosts exact: DNR requestDomains would also match their subdomains.
export function directTrafficRules(
  config: StoredWebsiteFilterList | undefined,
  templates: chrome.declarativeNetRequest.Rule[],
): chrome.declarativeNetRequest.Rule[] {
  if (!config || config.blockDirectOnFailure !== false || config.enabled === false) return [];
  const mode = config.mode || "exclude";
  const domains = config.value.filter(item => (item.mode || "exclude") === mode);
  if (mode === "include") domains.push(
    {domain: "protonvpn.net", withSubDomains: true},
    {domain: "protonvpn.com", withSubDomains: true},
  );
  if (domains.length > 1000) throw new Error("VpnInvalidRoutingRules");
  let id = 881000;
  const resourceTypes = templates[0]!.condition.resourceTypes;
  const rules: chrome.declarativeNetRequest.Rule[] = mode === "include" ? [{
    id: id++, priority: 10004, action: {type: "allow"},
    condition: {regexFilter: "^(https?|wss?)://", resourceTypes},
  }] : [];
  for (const item of domains) {
    if (!/^[a-z0-9.\-\[\]:]+$/i.test(item.domain)) throw new Error("VpnInvalidRoutingRules");
    const host = item.domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const suffix = (item.withSubDomains ? "([a-z0-9-]+\\.)*" : "") + host + "(:[0-9]+)?(/|$)";
    if (mode === "exclude") {
      rules.push({id: id++, priority: 10004, action: {type: "allow"},
        condition: {regexFilter: "^(https?|wss?)://" + suffix, resourceTypes}});
    } else {
      for (const template of templates) {
        rules.push({...template, id: id++, priority: template.action.type === "block" ? 10005 : 10006,
          condition: {...template.condition, regexFilter: (template.action.type === "block" ? "^(https?|wss?)://" : "^https?://") + suffix + (template.id === 880005 ? ".*" : "")}});
      }
    }
  }
  return rules;
}
