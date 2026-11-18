"use strict";
const $ = id => document.getElementById(id);
const TOGGLES = ["enabled", "clearHistory", "clearCache", "clearCookies", "clearDownloads", "clearFormData", "clearLocalStorage"];
const DEFAULTS = {...ClearRules.filterDefaults(),enabled:true, clearHistory:true, clearCache:false, clearCookies:false, clearDownloads:false, clearFormData:false, clearLocalStorage:false, excludedSites:[], excludedCacheSites:[], excludedLocalStorageSites:[], paused:false, pauseUntil:null};
const PRESETS = {
  safe: {clearHistory:true, clearCache:false, clearCookies:false, clearDownloads:false, clearFormData:false, clearLocalStorage:false},
  standard: {clearHistory:true, clearCache:true, clearCookies:false, clearDownloads:false, clearFormData:false, clearLocalStorage:false},
  strong: {clearHistory:true, clearCache:true, clearCookies:true, clearDownloads:true, clearFormData:true, clearLocalStorage:true}
};
const LABELS = {history:SuperI18n.text("histórico"), cache:SuperI18n.text("cache"), cookies:SuperI18n.text("cookies"), downloads:SuperI18n.text("histórico de downloads"), formData:SuperI18n.text("formulários"), localStorage:SuperI18n.text("armazenamento local")};
let bookmarkImporter;
const domainEditors = [];
let mutationQueue = Promise.resolve();

let lastNotice;
function showError(error, tab) {
  lastNotice = {literal: error?.message || String(error), kind: "error", tab};
  renderNotice();
}
function renderNotice() {
  const notice = lastNotice?.tab && lastNotice.tab !== document.body.dataset.activeTab ? undefined : lastNotice;
  const message = notice?.key ? SuperI18n.t(notice.key, notice.values) : notice ? SuperI18n.text(notice.literal) : "";
  const error = $("error");
  error.hidden = notice?.kind !== "error";
  error.textContent = error.hidden ? "" : message;
  if (!error.hidden) SuperAsyncState.applyStatePresentation(error, "error");
  SuperAsyncState.renderAsyncState($("popupStatus"), notice && error.hidden ? {
    kind: notice.kind, text: message, ...(notice.kind === "loading" ? {progress:null} : {})
  } : {});
}
function notify(message, kind = "success", tab) { lastNotice = {literal:message, kind, tab}; renderNotice(); }
function notifyMessage(key, values, kind = "success", tab) { lastNotice = {key, values, kind, tab}; renderNotice(); }
function handle(action, tab) {
  return (...args) => Promise.resolve().then(() => action(...args)).catch(error => showError(error, tab));
}
function serializeMutation(action) {
  const result = mutationQueue.catch(() => {}).then(action);
  mutationQueue = result.catch(() => {});
  return result;
}
const EXCEPTION_LISTS = {
  cookies: {key:"excludedSites", tab:"exceptions", prefix:""},
  cache: {key:"excludedCacheSites", tab:"cache", prefix:"cache"},
  localStorage: {key:"excludedLocalStorageSites", tab:"local-storage", prefix:"localStorage"}
};
const currentModes = Object.fromEntries(Object.keys(EXCEPTION_LISTS).map(type => [type,'exclude']));
const listRevisions = {};
const pendingModes = new Set();
const unavailableFilters = new Set();
const clearingLists = new Set();
function filterTarget(type, mode = currentModes[type]) {
  const filter = ClearRules.SITE_FILTERS[type];
  if (!filter) throw Error('Invalid cleanup filter');
  mode = ClearRules.normalizeMode(mode);
  return {...filter,mode,key:mode === 'include' ? filter.includeKey : filter.excludeKey};
}
const importScope = () => importType() + '/' + currentModes[importType()];
function scopeTarget(scope) {
  const [type,mode] = scope.split('/');
  return {type,...filterTarget(type,mode)};
}
function modeHelp(mode, count) {
  return SuperI18n.t(mode === 'include' ? count ? 'uiCleanupIncludeHelp' : 'uiCleanupIncludeEmpty' : 'uiCleanupExcludeHelp');
}
const listElement = (type, name) => $(EXCEPTION_LISTS[type].prefix ? EXCEPTION_LISTS[type].prefix + name[0].toUpperCase() + name.slice(1) : name);
const importType = () => Object.hasOwn(EXCEPTION_LISTS, $("importTarget").value) ? $("importTarget").value : "cookies";
const CLEANUP_TABS = ["cleanup", "exceptions", "cache", "local-storage", "bookmarks"];
const NAV_TABS = [...CLEANUP_TABS, "autoplay", "tabs", "sync", "vpn", "modules"];
let lastCleanupTab = "cleanup";
function activateTab(tab, persist = true) {
  if (!NAV_TABS.includes(tab)) tab = "cleanup";
  const module = CLEANUP_TABS.includes(tab) ? 'cleanup' : tab;
  if (module !== 'modules' && globalThis.SuperModulesUI && !SuperModulesUI.isEnabled(module)) tab = 'modules';
  document.body.dataset.activeTab = tab;
  const isCleanup = CLEANUP_TABS.includes(tab);
  if (isCleanup) lastCleanupTab = tab;
  $("cleanupSubmenu").hidden = !isCleanup;
  $("cleanupActions").hidden = tab !== "cleanup";
  $("cleanupFooter").hidden = tab !== "cleanup";
  if (tab !== "cleanup") $("cleanupHistory").open = false;
  $("syncSubmenu").hidden = tab !== "sync";
  $("vpnSubmenu").hidden = tab !== "vpn";
  $("section-cleanup").classList.toggle("active", isCleanup);
  $("section-cleanup").setAttribute("aria-pressed", String(isCleanup));
  for (const name of NAV_TABS) {
    $("panel-" + name).hidden = name !== tab;
    $("tab-" + name).classList.toggle("active", name === tab);
    $("tab-" + name).setAttribute("aria-pressed", String(name === tab));
  }
  renderNotice();
  if (persist) chrome.storage.local.set({popupView:{tab, lastCleanupTab}}).catch(showError);
  document.dispatchEvent(new CustomEvent("super-extension:panel-selected", {detail:tab}));
}
function refreshPresets() {
  document.querySelectorAll("[data-preset]").forEach(button => {
    const active = Object.entries(PRESETS[button.dataset.preset]).every(([key, value]) => $(key).checked === value);
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}
const CLEANUP_STATUS = {
  completed: "uiCleanupCompleted", partial: "uiCleanupPartial", failed: "uiCleanupFailed",
  blocked: "uiCleanupBlocked", unknown: "uiCleanupUnknown", running: "uiCleanupRunning",
  pending: "uiCleanupPending", skipped: "uiCleanupSkipped"
};
const cleanupStatus = state => SuperI18n.t(CLEANUP_STATUS[state] || CLEANUP_STATUS.unknown);
const cleanupTrigger = trigger => SuperI18n.text(({manual: "Manual", exit: "Ao fechar", startup: "Recuperação na abertura"})[trigger] || "Automática");
const cleanupTime = report => new Date(report.finishedAt || report.startedAt).toLocaleString(SuperI18n.locale);

function renderCleanupItems(container, report) {
  container.replaceChildren(...report.items.map(item => {
    const row = document.createElement("li");
    const scope = item.scope === "exclude" ? "uiCleanupReportExclude" : item.scope === "include" ? "uiCleanupReportInclude" : null;
    row.textContent = `${SuperI18n.text(LABELS[item.type] || item.type)} · ${cleanupStatus(item.status)}`;
    if (scope && item.status === "completed") row.append(" · ", SuperI18n.t(scope));
    return row;
  }));
}

let reportRevision = 0;
async function refreshReport() {
  const revision = ++reportRevision;
  const data = await chrome.storage.local.get(["lastClearTime", "lastClearReason", "lastClearTypeKeys", "lastClearTypes", "lastClearErrorAt", "activeCleanupReport", "cleanupReports"]);
  if (revision !== reportRevision) return;
  const reports = (Array.isArray(data.cleanupReports) ? data.cleanupReports : [])
    .filter(report => report?.startedAt > Date.now() - 7 * 86400000 && Array.isArray(report.items));
  const latest = data.activeCleanupReport || reports.at(-1);
  const older = data.activeCleanupReport ? reports : reports.slice(0, -1);
  $("cleanupHistory").hidden = !older.length;
  if (!older.length) $("cleanupHistory").open = false;
  $("cleanupHistoryItems").replaceChildren(...older.reverse().map(report => {
    const entry = document.createElement("details");
    const title = document.createElement("summary");
    const list = document.createElement("ul");
    title.textContent = `${cleanupTime(report)} · ${cleanupStatus(report.status)} · ${cleanupTrigger(report.trigger)}`;
    list.className = "cleanup-results";
    renderCleanupItems(list, report);
    entry.append(title, list);
    return entry;
  }));
  $("reportItems").hidden = !latest?.items.length;
  if (latest) {
    const presentation = {completed: "success", partial: "warning", failed: "error", blocked: "error", unknown: "warning", running: "loading"};
    SuperAsyncState.applyStatePresentation($("reportState"), presentation[latest.status]);
    $("reportTitle").textContent = cleanupStatus(latest.status);
    $("reportDetail").textContent = `${cleanupTime(latest)} · ${cleanupTrigger(latest.trigger)}`;
    renderCleanupItems($("reportItems"), latest);
    return;
  }
  if (data.lastClearErrorAt && (!data.lastClearTime || Date.parse(data.lastClearErrorAt) > Date.parse(data.lastClearTime))) {
    SuperAsyncState.applyStatePresentation($("reportState"), "error");
    $("reportTitle").textContent = SuperI18n.text("A última tentativa não foi concluída");
    $("reportDetail").textContent = SuperI18n.text("Confira as configurações. Uma limpeza automática pendente será tentada na próxima abertura.");
  } else if (data.lastClearTime) {
    SuperAsyncState.applyStatePresentation($("reportState"), "success");
    const reason = {manual:SuperI18n.text("Manual"), exit:SuperI18n.text("Ao fechar"), startup:SuperI18n.text("Recuperação na abertura")}[data.lastClearReason] || SuperI18n.text("Automática");
    $("reportTitle").textContent = new Date(data.lastClearTime).toLocaleString(SuperI18n.locale);
    const labels = data.lastClearTypeKeys?.map(key => SuperI18n.text(LABELS[key])).filter(Boolean) || data.lastClearTypes?.map(value=>SuperI18n.text(value)) || [];
    $("reportDetail").textContent = `${reason} · ${labels.join(", ")}`;
  } else {
    SuperAsyncState.applyStatePresentation($("reportState"), "empty");
    $("reportTitle").textContent = SuperI18n.text("Nenhuma limpeza registrada");
    $("reportDetail").textContent = SuperI18n.text("Por padrão, somente o histórico será apagado.");
  }
}
async function refreshPause() {
  const {paused, pauseUntil} = await chrome.storage.local.get(DEFAULTS);
  const active = paused && (!pauseUntil || Date.parse(pauseUntil) > Date.now());
  $("pauseRow").hidden = !active;
  $("pauseStatus").textContent = pauseUntil ? SuperI18n.t("uiPausedUntil",{time:new Date(pauseUntil).toLocaleString(SuperI18n.locale)}) : SuperI18n.text("Pausada até você retomar");
}
async function message(payload) {
  const response = await chrome.runtime.sendMessage(payload);
  if (!response?.ok) {
    const translated = {CleanupSettingsChanged: "uiCleanupSettingsChanged", CleanupFailed: "uiCleanupSeeReport"}[response?.error];
    throw Error(translated ? SuperI18n.t(translated) : response?.error || SuperI18n.text("O serviço de limpeza não respondeu."));
  }
  return response;
}
async function refreshList(type) {
  if (!type) { await Promise.all(Object.keys(EXCEPTION_LISTS).map(refreshList)); return; }
  const revision = listRevisions[type] = (listRevisions[type] || 0) + 1;
  try {
  const filter = ClearRules.SITE_FILTERS[type];
  const data = await chrome.storage.local.get({[filter.modeKey]:'exclude',[filter.excludeKey]:[],[filter.includeKey]:[]});
  if (revision !== listRevisions[type] || pendingModes.has(type)) return;
  const mode = ClearRules.normalizeMode(data[filter.modeKey]);
  const {key} = filterTarget(type,mode);
  const sites = ClearRules.normalizeList(data[key]);
  currentModes[type] = mode;
  listElement(type,'listMode').value = mode;
  listElement(type,'listModeHelp').textContent = modeHelp(mode,sites.length);
  listElement(type,'listModeHelp').classList.toggle('ui-notice-warning',mode === 'include' && !sites.length);
  if (importType() === type) {
    $('importMode').value = mode;
    $('importModeHelp').textContent = modeHelp(mode,sites.length);
  }
  const list = listElement(type, "domainList");
  SuperDomainList.renderDomainList(list, sites.map(domain => ({domain})), {
    removeLabel: domain => SuperI18n.t("uiRemoveDomain", {domain}),
    onRemove: handle(async (domain, remove) => {
      remove.disabled = true;
      await serializeMutation(async () => {
        const latest = await chrome.storage.local.get({[key]:[]});
        await chrome.storage.local.set({[key]:ClearRules.normalizeList(latest[key]).filter(site => site !== domain)});
      });
      await refreshList(type); await refreshPreview();
      notifyMessage("uiCleanupDomainRemoved", undefined, "success", EXCEPTION_LISTS[type].tab);
    }, EXCEPTION_LISTS[type].tab),
  });
  listElement(type,"listCount").textContent = SuperI18n.t(sites.length===1?"uiDomainsOne":"uiDomainsMany",{count:sites.length});
  listElement(type,"emptyList").hidden = sites.length > 0;
  listElement(type,'clearExclusions').hidden = mode !== 'exclude';
  listElement(type,'clearExclusions').disabled = !sites.length || clearingLists.has(type);
  unavailableFilters.delete(type);
  listElement(type,'filterEditor').disabled = false;
  listElement(type,'filterRetry').hidden = true;
  if (importType() === type) $('importMode').disabled = false;
  } catch (error) {
    if (revision === listRevisions[type]) {
      unavailableFilters.add(type);
      listElement(type,'filterEditor').disabled = true;
      listElement(type,'filterRetry').hidden = false;
      if (importType() === type) $('importMode').disabled = true;
      bookmarkImporter?.render();
    }
    throw error;
  }

}
async function addDomains(values, type = "cookies", mode = currentModes[type]) {
  const {key} = filterTarget(type,mode);
  return serializeMutation(async () => {
    const data = await chrome.storage.local.get({[key]:[]});
    const before = ClearRules.normalizeList(data[key]);
    const after = ClearRules.normalizeList([...before, ...values]);
    await chrome.storage.local.set({[key]:after});
    return after.length - before.length;
  });
}
async function clearExclusions(type) {
  if (clearingLists.has(type) || pendingModes.has(type) || unavailableFilters.has(type) || currentModes[type] !== 'exclude') return;
  const filter = ClearRules.SITE_FILTERS[type];
  clearingLists.add(type);
  listElement(type,'clearExclusions').disabled = true;
  try {
    const before = await chrome.storage.local.get({[filter.excludeKey]:[]});
    const sites = ClearRules.normalizeList(before[filter.excludeKey]);
    if (!sites.length) return;
    const label = type === 'cookies' ? 'Cookies' : SuperI18n.t(type === 'cache' ? 'cache' : 'uiLocalstorage3d640');
    if (!await SuperConfirmation.confirmAction(document, SuperI18n.t('uiCleanupClearListConfirm',{type:label}),
      {locale:SuperI18n.locale,confirmLabel:SuperI18n.t('uiCleanupClearList')})) return;
    const cleared = await serializeMutation(async () => {
      const latest = await chrome.storage.local.get({[filter.modeKey]:'exclude',[filter.excludeKey]:[]});
      if (ClearRules.normalizeMode(latest[filter.modeKey]) !== 'exclude' ||
          JSON.stringify(ClearRules.normalizeList(latest[filter.excludeKey])) !== JSON.stringify(sites)) return false;
      await chrome.storage.local.set({[filter.excludeKey]:[]});
      return true;
    });
    notifyMessage(cleared ? 'uiCleanupListCleared' : 'uiCleanupListChanged',undefined,cleared ? 'success' : 'warning', EXCEPTION_LISTS[type].tab);
  } finally {
    clearingLists.delete(type);
    await refreshList(type);
    await refreshPreview();
  }
}
async function changeListMode(type, mode, tab) {
  if (pendingModes.has(type)) return;
  mode = ClearRules.normalizeMode(mode);
  const previous = currentModes[type];
  currentModes[type] = mode;
  pendingModes.add(type);
  listRevisions[type] = (listRevisions[type] || 0) + 1;
  listElement(type,'filterEditor').disabled = true;
  $('importMode').disabled = true;
  bookmarkImporter?.render();
  try {
    await serializeMutation(() => chrome.storage.local.set({[ClearRules.SITE_FILTERS[type].modeKey]:mode}));
    notifyMessage('uiCleanupModeSaved', undefined, 'success', tab);
  } catch (error) {
    currentModes[type] = previous;
    throw error;
  } finally {
    pendingModes.delete(type);
    await refreshList(type);
    await refreshPreview();
  }
}
async function refreshPreview() {
  if (!pendingModes.has(importType())) await refreshList(importType());
  if (bookmarkImporter) await bookmarkImporter.refresh();
}
async function refreshLanguage(){
  $("language").value=SuperI18n.locale;
  SuperI18n.apply();renderNotice();
  bookmarkImporter?.render();
  await Promise.all([refreshReport(),refreshPause(),refreshList(),refreshPreview()]);
}
async function init() {
  await SuperI18n.ready;
  await globalThis.SuperModulesUI?.ready;
  $("language").addEventListener("change",handle(()=>SuperPreferences.locale.set($("language").value)));
  SuperI18n.watch(()=>{refreshLanguage().catch(showError);});
  $("language").value=SuperI18n.locale;
  const settings = await chrome.storage.local.get({...DEFAULTS, popupView:null});
  for (const key of TOGGLES) $(key).checked = settings[key] === true;
  const stopTheme = SuperPreferences.bindTheme(document.documentElement, theme => {
    $("theme").value = theme;
  });
  window.addEventListener("unload", stopTheme, { once: true });
  const savedView = settings.popupView;
  if (CLEANUP_TABS.includes(savedView?.lastCleanupTab)) lastCleanupTab = savedView.lastCleanupTab;
  activateTab(location.hash === "#modules" ? "modules" : location.hash === "#vpn" ? "vpn" : savedView?.tab, false);
  refreshPresets();
  $("theme").addEventListener("change", handle(() => SuperPreferences.theme.set($("theme").value)));
  document.querySelectorAll("[data-tab]").forEach(button => button.addEventListener("click", () => activateTab(button.dataset.tab)));
  $("section-cleanup").addEventListener("click", () => activateTab(lastCleanupTab));
  for (const key of TOGGLES) $(key).addEventListener("change", handle(async () => {
    if (key === "clearCookies" && $(key).checked && !await SuperConfirmation.confirmAction(document, SuperI18n.text("Apagar cookies pode desconectar suas contas. Cada lista de exceções protege apenas o tipo correspondente. Ativar exclusão de cookies?"))) {
      $(key).checked = false; return;
    }
    await serializeMutation(() => chrome.storage.local.set({[key]:$(key).checked}));
    refreshPresets();
  }));
  document.querySelectorAll("[data-preset]").forEach(button => button.addEventListener("click", handle(async () => {
    const preset = PRESETS[button.dataset.preset];
    if (preset.clearCookies && !await SuperConfirmation.confirmAction(document, SuperI18n.text("O modo Forte apaga todos os tipos selecionáveis, inclusive cookies e armazenamento local. As exceções de cada tipo serão respeitadas. Aplicar?"))) return;
    await serializeMutation(() => chrome.storage.local.set(preset));
    Object.entries(preset).forEach(([key, value]) => { $(key).checked = value; });
    refreshPresets(); notify(SuperI18n.text("Modo de limpeza salvo."));
  })));
  $("pauseToggle").addEventListener("click", () => {
    $("pauseMenu").hidden = !$("pauseMenu").hidden;
    $("pauseToggle").setAttribute("aria-expanded", String(!$("pauseMenu").hidden));
  });
  document.querySelectorAll("[data-duration]").forEach(button => button.addEventListener("click", handle(async () => {
    let duration = Number(button.dataset.duration);
    if (button.dataset.duration === "today") {
      const now = new Date();
      duration = Math.max(1, Math.ceil((new Date(now.getFullYear(), now.getMonth(), now.getDate()+1) - now) / 60000));
    }
    await message({action:"pause", duration});
    $("pauseMenu").hidden = true; $("pauseToggle").setAttribute("aria-expanded", "false");
    await refreshPause();
  })));
  $("resume").addEventListener("click", handle(async () => { await message({action:"resume"}); await refreshPause(); }));
  for (const type of Object.keys(EXCEPTION_LISTS)) {
    const {tab} = EXCEPTION_LISTS[type];
    listElement(type,'clearExclusions').addEventListener('click',handle(() => clearExclusions(type), tab));
    listElement(type,'filterRetry').addEventListener('click',handle(async () => {
      await refreshList(type); await refreshPreview();
      notifyMessage('uiCleanupListReady', undefined, 'success', tab);
    }, tab));
    listElement(type,'listMode').addEventListener('change',handle(event => changeListMode(type, event.target.value, tab), tab));
    domainEditors.push(SuperDomainEditor.bindDomainEditor(listElement(type,"domainForm"), {
      normalize: ClearRules.normalizeDomain,
      onError: error => showError(error, tab),
      async onAdd(domain) {
        const count = await addDomains([domain], type);
        await refreshList(type); await refreshPreview();
        notifyMessage(count ? "uiCleanupDomainAdded" : "uiThisdomainisalreadyin3da47", undefined, "success", tab);
      },
    }));
    listElement(type,"goImport").addEventListener("click", handle(async () => {
      $("importTarget").value = type;
      activateTab("bookmarks");
      await refreshPreview();
    }, "bookmarks"));
  }
  bookmarkImporter = SuperBookmarkImporter.createBookmarkImporter({
    browser: chrome, locale: () => SuperI18n.locale, normalize: ClearRules.normalizeDomain,
    scope: importScope,
    disabled: () => pendingModes.has(importType()) || unavailableFilters.has(importType()),
    async existing(scope) {
      const {key} = scopeTarget(scope);
      return ClearRules.normalizeList((await chrome.storage.local.get({[key]:[]}))[key]);
    },
    async import(domains, scope) {
      const {type,mode} = scopeTarget(scope);
      const count = await addDomains(domains, type,mode);
      await refreshList();
      notifyMessage(count === 1 ? "uiImportedOne" : "uiImportedMany", {count}, "success", "bookmarks");
    },
  });
  bookmarkImporter.attach(document.querySelector("#panel-bookmarks [data-bookmark-importer]"));
  $('importMode').addEventListener('change',handle(event => changeListMode(importType(), event.target.value, "bookmarks"), "bookmarks"));
  $("importTarget").addEventListener("change", handle(refreshPreview, "bookmarks"));
  window.addEventListener("unload", () => {bookmarkImporter.dispose(); domainEditors.forEach(dispose => dispose());}, {once: true});
  $("clearNow").addEventListener("click", handle(async () => {
    await mutationQueue;
    const snapshot = await chrome.storage.local.get(DEFAULTS);
    if (!Object.keys(LABELS).some(type => snapshot[{history:"clearHistory", cache:"clearCache", cookies:"clearCookies", downloads:"clearDownloads", formData:"clearFormData", localStorage:"clearLocalStorage"}[type]])) {
      notify(SuperI18n.text("Escolha pelo menos um tipo de dado na aba Limpeza.")); return;
    }
    const steps = ClearRules.cleanupSteps(snapshot);
    if (!steps.length) {notifyMessage("uiCleanupNoTargets", undefined, "warning"); return;}
    const description = steps.map(({type, options}) => {
      const scope = options.origins ? SuperI18n.t("uiCleanupPreviewInclude", {origins: options.origins.join(", ")})
        : options.excludeOrigins ? SuperI18n.t("uiCleanupPreviewExclude", {origins: options.excludeOrigins.join(", ")})
        : SuperI18n.t("uiCleanupPreviewAll");
      return `${SuperI18n.text(LABELS[type])} · ${scope}`;
    });
    if (steps.some(step => step.type === "cookies")) description.push(SuperI18n.t("uiCleanupConfirm"));
    if (!await SuperConfirmation.confirmAction(document, description.join("\n\n"), {
      title: SuperI18n.t("uiCleanupPreviewTitle"), confirmLabel: SuperI18n.t("uiClearnow139b3")
    })) return;
    $("clearNow").disabled = true;
    notify(SuperI18n.text("Limpando…"), "loading");
    try {
      const response = await message({action:"clearNow", settings:snapshot, expectedPlan:ClearRules.cleanupPlanToken(steps)});
      if (!response.cleared) throw new Error(SuperI18n.text("A limpeza não foi executada."));
      notify(SuperI18n.text("Limpeza concluída."));
    } finally { $("clearNow").disabled = false; await refreshReport(); }
  }));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    for (const type of Object.keys(EXCEPTION_LISTS)) if (Object.values(ClearRules.SITE_FILTERS[type]).some(key => changes[key])) {
      const selectedImport = importType() === type;
      const tab = selectedImport && document.body.dataset.activeTab === "bookmarks" ? "bookmarks" : EXCEPTION_LISTS[type].tab;
      (selectedImport ? refreshPreview() : refreshList(type)).catch(error => showError(error, tab));
    }
    if (changes.lastClearTime || changes.lastClearErrorAt || changes.activeCleanupReport || changes.cleanupReports) refreshReport().catch(showError);
    if (changes.paused || changes.pauseUntil) refreshPause().catch(showError);
  });
  await refreshReport(); await refreshPause(); await refreshList();
}
init().catch(showError);
