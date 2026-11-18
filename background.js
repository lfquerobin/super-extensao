importScripts("preferences.js", "i18n.js", "rules.js", "modules.js", "module-host.js");
importScripts("navigation-rules.js", "tab-guard.js");
// ====== デフォルト設定 ======
const DEFAULT_SETTINGS = {
  ...ClearRules.filterDefaults(),
  enabled: true,
  clearHistory: true,
  clearCache: false,
  clearCookies: false,
  clearDownloads: false,
  clearFormData: false,
  clearLocalStorage: false,
  excludedSites: [],
  excludedCacheSites: [],
  excludedLocalStorageSites: [],
  theme: SuperPreferences.theme.defaultValue,
  pendingSession: null,
  completedCleanupSession: null,
  pendingClearNotification: null,
  lastClearTime: null,
  lastClearTypeKeys: [],
  lastClearTypes: [],
  paused: false,
  pauseUntil: null,
  installDate: null,
  firstSuccessfulClearAt: null,
  successfulClearCount: 0,
  lastSuccessfulClearAt: null,
  lastClearErrorAt: null
};

const CLEAR_NOTIFICATION_PREFIX = "clear-done-";
const SETTINGS_WINDOW_IDS_KEY = "settingsWindowIds";
const SETTINGS_WINDOW = {
  width: 600,
  height: 760
};
let pendingSettingsWindowCreates = 0;
let clearQueue = Promise.resolve();
const pendingSessionClears = new Map();

function getTypeLabels() {
  const m = SuperI18n.t;
  return {
    history: m("browsingHistory"), cache: m("cache"), cookies: m("cookies"),
    downloads: m("downloadHistory"), formData: m("formData"),
    localStorage: m("localStorage")
  };
}

// ====== 削除対象の構築 ======
function buildDataToRemove(settings) {
  return {
    history: settings.clearHistory,
    cache: settings.clearCache,
    cookies: settings.clearCookies,
    downloads: settings.clearDownloads,
    formData: settings.clearFormData,
    localStorage: settings.clearLocalStorage
  };
}

function normalizeManualSettings(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return null;
  return {
    clearHistory: snapshot.clearHistory === undefined ? true : snapshot.clearHistory === true,
    clearCache: snapshot.clearCache === true,
    clearCookies: snapshot.clearCookies === true,
    clearDownloads: snapshot.clearDownloads === true,
    clearFormData: snapshot.clearFormData === true,
    clearLocalStorage: snapshot.clearLocalStorage === true,
    ...Object.fromEntries(Object.values(ClearRules.SITE_FILTERS).flatMap(filter => [
      ...[filter.excludeKey,filter.includeKey].filter(key => snapshot[key] !== undefined).map(key => [key,ClearRules.normalizeList(snapshot[key])]),
      ...(snapshot[filter.modeKey] === undefined ? [] : [[filter.modeKey,ClearRules.normalizeMode(snapshot[filter.modeKey])]])
    ]))
  };
}

const CLEANUP_REPORT_LIMIT = 20;
const CLEANUP_REPORT_AGE = 7 * 24 * 60 * 60 * 1000;
const CLEANUP_REPORT_ALARM = "cleanup-report-expiration";

function pruneCleanupReports(value) {
  const cutoff = Date.now() - CLEANUP_REPORT_AGE;
  return (Array.isArray(value) ? value : [])
    .filter(report => typeof report?.id === "string" && report.startedAt > cutoff)
    .slice(-CLEANUP_REPORT_LIMIT);
}

async function scheduleCleanupRetention(reports) {
  try {
    if (!reports.length) await chrome.alarms.clear(CLEANUP_REPORT_ALARM);
    else await chrome.alarms.create(CLEANUP_REPORT_ALARM, {
      when: Math.min(...reports.map(report => report.startedAt)) + CLEANUP_REPORT_AGE
    });
  } catch { /* Cleanup and worker startup also prune expired entries. */ }
}

async function finishCleanupReport(report, reports, update = {}) {
  const history = pruneCleanupReports([...reports, report]);
  await chrome.storage.local.set({cleanupReports: history, activeCleanupReport: null, ...update});
  await scheduleCleanupRetention(history);
}

async function reconcileCleanupReports() {
  const {cleanupReports, activeCleanupReport} = await chrome.storage.local.get({
    cleanupReports: [], activeCleanupReport: null
  });
  const history = pruneCleanupReports(cleanupReports);
  if (activeCleanupReport?.status === "running" && Array.isArray(activeCleanupReport.items)) {
    const report = {...activeCleanupReport, status: "unknown", finishedAt: Date.now(),
      items: activeCleanupReport.items.map(item =>
        item.status === "running" ? {...item, status: "unknown"} : item)};
    await finishCleanupReport(report, history);
    return pruneCleanupReports([...history, report]);
  }
  if (!Array.isArray(cleanupReports) || history.length !== cleanupReports.length)
    await chrome.storage.local.set({cleanupReports: history});
  await scheduleCleanupRetention(history);
  return history;
}

async function removeCleanupStep(step) {
  if (step.type === "cookies") await chrome.browsingData.removeCookies(step.options);
  else await chrome.browsingData.remove(step.options, {[step.type]: true});
}

function makeUniqueId(prefix) {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getPendingSession(settings) {
  const pending = settings.pendingSession;
  if (pending && typeof pending.id === "string") {
    return {
      id: pending.id,
      markedAt: Number.isFinite(pending.markedAt) ? pending.markedAt : 0
    };
  }

  // 2.0.5以前の未完了フラグを次回の正常終了/起動で回収する。
  if (settings.pendingClear || settings.lastExitTime) {
    return {
      id: `legacy-${settings.lastExitTime || "pending"}`,
      markedAt: 0
    };
  }
  return null;
}

async function markSessionPending() {
  const pendingSession = {
    id: makeUniqueId("session"),
    markedAt: Date.now()
  };
  await chrome.storage.local.set({
    pendingSession,
    pendingClear: false,
    lastExitTime: null
  });
  return pendingSession;
}

function queueCleanup(task) {
  const operation = clearQueue.then(task);
  clearQueue = operation.catch(() => {});
  return operation;
}

function requestClear(trigger, options = {}) {
  return queueCleanup(async () => {
    try { return await performClear(trigger, options); }
    catch (error) {
      await reconcileCleanupReports().catch(() => {});
      throw error;
    }
  });
}

void SuperModuleHost.ready.then(() => {
  if (SuperModuleHost.isEnabled("cleanup")) return queueCleanup(reconcileCleanupReports);
}).catch(error => console.warn("Cleanup reports unavailable", error));

// ====== メイン削除処理 ======
async function performClear(
  trigger,
  { ignoreAutomationState = false, settingsSnapshot = null, expectedPlan, sessionId } = {}
) {
  await SuperModuleHost.ready;
  if (!SuperModuleHost.isEnabled('cleanup')) return {cleared:false};
  const storedSettings = await chrome.storage.local.get(DEFAULT_SETTINGS);
  if (sessionId && storedSettings.completedCleanupSession?.id === sessionId)
    return {cleared: true, startedAt: storedSettings.completedCleanupSession.startedAt};
  const manualSettings = expectedPlan === undefined ? normalizeManualSettings(settingsSnapshot) : null;
  const settings = manualSettings
    ? { ...storedSettings, ...manualSettings }
    : storedSettings;
  const startedAt = Date.now();

  // 最後のウィンドウ判定後に新しいウィンドウが開かれた場合は中止する。
  if (trigger === "exit") {
    const windows = await chrome.windows.getAll();
    if (windows.length > 0) return { cleared: false, startedAt };
  }

  // 一時停止チェック
  if (!ignoreAutomationState && settings.paused) {
    if (settings.pauseUntil) {
      const until = new Date(settings.pauseUntil);
      if (until > new Date()) return { cleared: false, startedAt };
      await chrome.storage.local.set({ paused: false, pauseUntil: null });
      chrome.action.setBadgeText({ text: "" });
    } else {
      return { cleared: false, startedAt };
    }
  }

  if (!ignoreAutomationState && !settings.enabled) {
    return { cleared: false, startedAt };
  }

  const dataToRemove = buildDataToRemove(settings);
  const targets = Object.keys(dataToRemove).filter(type => dataToRemove[type]);
  if (!targets.length && expectedPlan === undefined) return {cleared: false, startedAt};

  const reports = await reconcileCleanupReports();
  const report = {
    id: makeUniqueId("cleanup"), trigger, startedAt, status: "running",
    items: targets.map(type => ({type, status: "skipped"}))
  };
  let steps;
  try {
    steps = ClearRules.cleanupSteps(settings);
  } catch (error) {
    report.status = "blocked";
    report.finishedAt = Date.now();
    report.items = targets.map(type => ({type, status: "blocked"}));
    await finishCleanupReport(report, reports, {lastClearErrorAt: new Date().toISOString()});
    throw error;
  }
  if (expectedPlan !== undefined && ClearRules.cleanupPlanToken(steps) !== expectedPlan)
    throw Error("CleanupSettingsChanged");
  if (!steps.length) return {cleared: false, startedAt};

  const items = new Map(report.items.map(item => [item.type, item]));
  for (const step of steps) items.get(step.type).status = "pending";
  await chrome.storage.local.set({activeCleanupReport: report});
  if (expectedPlan !== undefined) {
    const latest = await chrome.storage.local.get(DEFAULT_SETTINGS);
    let latestPlan;
    try { latestPlan = ClearRules.cleanupPlanToken(ClearRules.cleanupSteps(latest)); }
    catch { /* Invalid rules also require a fresh confirmation. */ }
    if (latestPlan !== expectedPlan) {
      await chrome.storage.local.set({activeCleanupReport: null});
      throw Error("CleanupSettingsChanged");
    }
  }
  for (const step of steps) {
    const item = items.get(step.type);
    item.status = "running";
    if (step.options.excludeOrigins) item.scope = "exclude";
    else if (step.options.origins) item.scope = "include";
    await chrome.storage.local.set({activeCleanupReport: report});
    try {
      await removeCleanupStep(step);
      item.status = "completed";
    } catch {
      item.status = "failed";
    }
    await chrome.storage.local.set({activeCleanupReport: report});
  }

  report.finishedAt = Date.now();
  const now = new Date(report.finishedAt).toISOString();
  const clearedTypeKeys = report.items.filter(item => item.status === "completed").map(item => item.type);
  if (clearedTypeKeys.length !== steps.length) {
    report.status = clearedTypeKeys.length ? "partial" : "failed";
    await finishCleanupReport(report, reports, {lastClearErrorAt: now});
    throw Error("CleanupFailed");
  }
  report.status = "completed";
  const excludedCookies = steps.find(step => step.type === "cookies")?.options.excludeOrigins || [];
  report.protectedServices = Object.entries(ClearRules.PROTECTION_TEMPLATES)
    .filter(([, template]) => excludedCookies.includes("https://" + template.cookie))
    .map(([id]) => id);
  const clearedTypes = clearedTypeKeys.map((key) => getTypeLabels()[key]);

  const notificationReceipt = {
    id: makeUniqueId("receipt"),
    trigger,
    time: now,
    clearedTypeKeys
  };

  await finishCleanupReport(report, reports, {
    ...(sessionId ? {completedCleanupSession: {id: sessionId, startedAt}} : {}),
    lastClearTime: now,
    lastClearTypeKeys: clearedTypeKeys,
    lastClearTypes: clearedTypes,
    lastClearReason: trigger,
    firstSuccessfulClearAt: settings.firstSuccessfulClearAt || now,
    successfulClearCount: (settings.successfulClearCount || 0) + 1,
    lastSuccessfulClearAt: now,
    lastClearErrorAt: null,
    notifDismissed: null,
    pendingClearNotification: notificationReceipt
  });

  // 削除成功と通知/レビュー表示は別物。後者の失敗で削除を失敗扱いしない。
  void deliverPendingClearNotification(notificationReceipt);


  return { cleared: true, startedAt, notificationReceipt };
}

async function clearPendingSession(trigger, pendingSession) {
  if (!pendingSession) return { cleared: false, startedAt: Date.now() };
  if (pendingSessionClears.has(pendingSession.id)) {
    return pendingSessionClears.get(pendingSession.id);
  }

  const operation = requestClear(trigger, {sessionId: pendingSession.id}).then(async (result) => {
    if (!result.cleared) return result;

    const currentSettings = await chrome.storage.local.get({
      pendingSession: null,
      pendingClear: false,
      lastExitTime: null
    });
    const currentPending = getPendingSession(currentSettings);

    // 削除中に新しいウィンドウが開いた場合、新しい世代は次回用に残す。
    if (
      currentPending &&
      currentPending.id === pendingSession.id
    ) {
      await chrome.storage.local.set({
        pendingSession: null,
        pendingClear: false,
        lastExitTime: null
      });

      // storage.get() と set() の間に開かれたウィンドウの世代を
      // 上書きした可能性があるため、実際にウィンドウが残る場合は再アームする。
      const remainingWindows = await chrome.windows.getAll();
      if (remainingWindows.length > 0) await markSessionPending();
    }
    return result;
  });

  pendingSessionClears.set(pendingSession.id, operation);
  operation.then(
    () => pendingSessionClears.delete(pendingSession.id),
    () => pendingSessionClears.delete(pendingSession.id)
  );
  return operation;
}

// ====== デスクトップ通知 ======
async function showClearNotification(receipt, { deferred = false } = {}) {
  await SuperI18n.ready;
  const m = SuperI18n.t;
  const trigger = receipt.trigger;
  const clearedTypes = Array.isArray(receipt.clearedTypeKeys)
    ? receipt.clearedTypeKeys.map((key) => getTypeLabels()[key]).filter(Boolean)
    : (receipt.clearedTypes || []);
  const triggerLabel = {
    exit: m("desktopNotifExit"),
    startup: m("desktopNotifStartup"),
    manual: m("desktopNotifManual")
  }[trigger] || trigger;

  const completedAt = new Date(receipt.time || Date.now());
  const timeStr = completedAt.toLocaleString(SuperI18n.locale, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });
  const notificationId = CLEAR_NOTIFICATION_PREFIX + receipt.id;
  const isExitNotification = trigger === "exit";
  const clearedTypeText = clearedTypes.join(", ");
  const notificationOptions = {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: isExitNotification
      ? m(deferred ? "desktopNotifDeferredTitle" : "desktopNotifExitTitle")
      : m("desktopNotifTitle"),
    message: isExitNotification
      ? m(deferred ? "desktopNotifDeferredBody" : "desktopNotifExitBody", [timeStr])
      : trigger === "startup"
        ? m("desktopNotifRecoveryBody", [timeStr])
        : m("desktopNotifBody", [triggerLabel, timeStr, clearedTypeText]),
    priority: isExitNotification ? 2 : 1,
    requireInteraction: isExitNotification,
    buttons: [
      { title: m("desktopNotifSettings") }
    ]
  };

  if (clearedTypeText) {
    notificationOptions.contextMessage = m("desktopNotifContext", [clearedTypeText]);
  }

  await chrome.notifications.create(notificationId, notificationOptions);
}

async function deliverPendingClearNotification(receipt, options = {}) {
  if (!receipt || typeof receipt.id !== "string") return false;

  try {
    await showClearNotification(receipt, options);
    const { pendingClearNotification = null } = await chrome.storage.local.get({
      pendingClearNotification: null
    });
    if (pendingClearNotification && pendingClearNotification.id === receipt.id) {
      await chrome.storage.local.set({
        pendingClearNotification: null,
        lastNotificationErrorAt: null
      });
    }
    return true;
  } catch (error) {
    await chrome.storage.local.set({ lastNotificationErrorAt: new Date().toISOString() });
    console.error("Auto Clear History: failed to show completion notification", error);
    return false;
  }
}

async function rememberSettingsWindowId(windowId) {
  if (typeof windowId !== "number") return;
  const data = await chrome.storage.local.get({ [SETTINGS_WINDOW_IDS_KEY]: [] });
  const ids = data[SETTINGS_WINDOW_IDS_KEY].filter((id) => typeof id === "number");
  if (!ids.includes(windowId)) ids.push(windowId);
  await chrome.storage.local.set({ [SETTINGS_WINDOW_IDS_KEY]: ids });
}

async function forgetSettingsWindowId(windowId) {
  const data = await chrome.storage.local.get({ [SETTINGS_WINDOW_IDS_KEY]: [] });
  const ids = data[SETTINGS_WINDOW_IDS_KEY].filter((id) => typeof id === "number");
  const nextIds = ids.filter((id) => id !== windowId);
  if (nextIds.length !== ids.length) {
    await chrome.storage.local.set({ [SETTINGS_WINDOW_IDS_KEY]: nextIds });
    return true;
  }
  return false;
}

async function openSettingsPopup() {
  pendingSettingsWindowCreates += 1;
  setTimeout(() => {
    pendingSettingsWindowCreates = Math.max(0, pendingSettingsWindowCreates - 1);
  }, 3000);

  try {
    const settingsWindow = await chrome.windows.create({
      url: chrome.runtime.getURL("popup.html"),
      type: "popup",
      width: SETTINGS_WINDOW.width,
      height: SETTINGS_WINDOW.height,
      focused: true
    });
    await rememberSettingsWindowId(settingsWindow.id);
  } catch (error) {
    pendingSettingsWindowCreates = Math.max(0, pendingSettingsWindowCreates - 1);
    throw error;
  }
}

async function handleClearNotificationAction(notificationId) {
  if (notificationId === "super-vpn-privacy") {
    await chrome.tabs.create({url: chrome.runtime.getURL("vpn-blocked.html")});
    await chrome.notifications.clear(notificationId);
    return;
  }
  if (!notificationId.startsWith(CLEAR_NOTIFICATION_PREFIX)) return;
  await openSettingsPopup();
  await chrome.notifications.clear(notificationId);
}

SuperModuleHost.listen("cleanup", chrome.notifications.onClicked, (notificationId) => {
  handleClearNotificationAction(notificationId).catch((err) => {
    console.error("Auto Clear History: failed to open settings from notification", err);
  });
});

SuperModuleHost.listen("cleanup", chrome.notifications.onButtonClicked, (notificationId, buttonIndex) => {
  if (buttonIndex !== 0) return;
  handleClearNotificationAction(notificationId).catch((err) => {
    console.error("Auto Clear History: failed to open settings from notification button", err);
  });
});

// ====== ウィンドウ閉じ検知（ベストエフォート） ======
async function handleWindowRemoved(windowId) {
  const wasExtensionWindow = await forgetSettingsWindowId(windowId);
  // セッション世代を先に捕まえる。getAll()の後に新規ウィンドウが
  // 開いてその新世代を読むと、稼働中のセッションを削除してしまうため。
  const state = await chrome.storage.local.get({
    pendingSession: null,
    pendingClear: false,
    lastExitTime: null
  });
  let pendingSession = getPendingSession(state);

  const windows = await chrome.windows.getAll();
  if (windows.length > 0) return;

  // 通知から開いた拡張自身のウィンドだけを閉じた場合は再削除しない。
  if (wasExtensionWindow && !pendingSession) return;
  if (!pendingSession) pendingSession = await markSessionPending();

  // Chromeプロセスが先に終了した場合は、pendingSessionを
  // 残したままにし、次回起動直後に同じ削除を再試行する。
  await clearPendingSession("exit", pendingSession);
}

SuperModuleHost.listen("cleanup", chrome.windows.onRemoved, (windowId) => {
  handleWindowRemoved(windowId).catch(async (error) => {
    await chrome.storage.local.set({ lastClearErrorAt: new Date().toISOString() });
    console.error("Auto Clear History: exit clear failed", error);
  });
});

// ====== 起動時フォールバック ======
async function handleStartup() {
  const settings = await chrome.storage.local.get({
    ...DEFAULT_SETTINGS,
    pendingClear: false,
    lastExitTime: null
  });

  if (settings.paused) {
    await chrome.action.setBadgeText({ text: "||" });
    await chrome.action.setBadgeBackgroundColor({ color: "#ff9800" });
  }

  // 終了中にOS通知まで到達できなかった場合は、次回起動時に再表示する。
  if (settings.pendingClearNotification) {
    await deliverPendingClearNotification(settings.pendingClearNotification, { deferred: true });
  }

  const pendingSession = getPendingSession(settings);
  try {
    if (pendingSession) await clearPendingSession("startup", pendingSession);
  } finally {
    // onCreatedと削除完了が競合しても、現セッション用の新世代を必ず残す。
    await markSessionPending();
  }

}

SuperModuleHost.listen("cleanup", chrome.runtime.onStartup, () => {
  handleStartup().catch(async (error) => {
    await chrome.storage.local.set({ lastClearErrorAt: new Date().toISOString() });
    console.error("Auto Clear History: startup clear failed", error);
  });
});

// ====== ウィンドウ作成時: 現セッションの未完了世代を保存 ======
async function handleWindowCreated(createdWindow) {
  if (createdWindow.type === "popup" && pendingSettingsWindowCreates > 0) {
    pendingSettingsWindowCreates -= 1;
    return;
  }

  await markSessionPending();
}

SuperModuleHost.listen("cleanup", chrome.windows.onCreated, (createdWindow) => {
  handleWindowCreated(createdWindow).catch((error) => {
    console.error("Auto Clear History: failed to mark active session", error);
  });
});

// ====== インストール時 ======
SuperModuleHost.listen("cleanup", chrome.runtime.onInstalled, async () => {
  const existing = await chrome.storage.local.get(null);
  const toSet = {};
  for (const [key, val] of Object.entries(DEFAULT_SETTINGS)) {
    if (!(key in existing)) toSet[key] = val;
  }
  if (!existing.installDate) {
    toSet.installDate = new Date().toISOString();
  }
  // Chrome 144以降は拡張APIからパスワードを削除できない。
  toSet.clearPasswords = false;
  if (Object.keys(toSet).length > 0) {
    await chrome.storage.local.set(toSet);
  }
  await markSessionPending();
});

// ====== ポップアップからの操作 ======
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!['pause','resume','clearNow','recordCleanupLogin'].includes(msg?.action)) return;
  void SuperModuleHost.ready.then(() => {
    if (!SuperModuleHost.isEnabled('cleanup')) {sendResponse({ok:false,error:'ModuleDisabled'});return;}
    handleCleanupMessage(msg,sender,sendResponse);
  }).catch(() => sendResponse({ok:false,error:'ModuleUnavailable'}));
  return true;
});
function handleCleanupMessage(msg, sender, sendResponse) {
  if (msg.action === "pause") {
    handlePause(msg.duration)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }
  if (msg.action === "resume") {
    handleResume()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }
  if (msg.action === "recordCleanupLogin") {
    queueCleanup(async () => {
      const {cleanupReports, activeCleanupReport} = await chrome.storage.local.get({cleanupReports: [], activeCleanupReport: null});
      const history = pruneCleanupReports(cleanupReports);
      const latest = history.at(-1);
      if (activeCleanupReport || latest?.id !== msg.reportId || latest.status !== "completed" ||
          !latest.protectedServices?.includes(msg.service) || !["kept", "signedOut"].includes(msg.outcome))
        throw Error("CleanupReportChanged");
      const report = {...latest, loginChecks: {...latest.loginChecks, [msg.service]: msg.outcome}};
      await chrome.storage.local.set({cleanupReports: [...history.slice(0, -1), report]});
    }).then(() => sendResponse({ok: true}), error => sendResponse({ok: false, error: error.message}));
    return true;
  }
  if (msg.action === "clearNow") {
    let settingsSnapshot;
    try { settingsSnapshot = normalizeManualSettings(msg.settings); }
    catch (error) {
      sendResponse({ ok: false, error: String(error) });
      return false;
    }
    if (!settingsSnapshot) {
      sendResponse({ ok: false, error: "Missing confirmed settings" });
      return false;
    }
    requestClear("manual", { ignoreAutomationState: true, settingsSnapshot, expectedPlan: msg.expectedPlan })
      .then((result) => sendResponse({ ok: true, cleared: result.cleared }))
      .catch((error) => sendResponse({ ok: false, error: error.message || String(error) }));
    return true;
  }
}

async function handlePause(durationMinutes) {
  let pauseUntil = null;
  await chrome.alarms.clear("pause-resume");
  if (durationMinutes > 0) {
    pauseUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    chrome.alarms.create("pause-resume", { delayInMinutes: durationMinutes });
  }
  await chrome.storage.local.set({ paused: true, pauseUntil });
  chrome.action.setBadgeText({ text: "||" });
  chrome.action.setBadgeBackgroundColor({ color: "#ff9800" });
}

async function handleResume() {
  await chrome.alarms.clear("pause-resume");
  await chrome.storage.local.set({ paused: false, pauseUntil: null });
  chrome.action.setBadgeText({ text: "" });
}

SuperModuleHost.listen("cleanup", chrome.alarms.onAlarm, async (alarm) => {
  if (alarm.name === CLEANUP_REPORT_ALARM) await queueCleanup(reconcileCleanupReports);
  if (alarm.name === "pause-resume") {
    await chrome.storage.local.set({ paused: false, pauseUntil: null });
    chrome.action.setBadgeText({ text: "" });
  }
});

SuperModuleHost.onStop('cleanup', async () => {await clearQueue;});

// Motor de sincronizacao isolado em superSync: e super-sync.
importScripts("sync/js/background-script.js");

// The host owns the VPN status overlay; cleanup pause badges remain independent.
importScripts("vpn/engine/routing.js", "vpn-indicator.js");

// Proton VPN has its own message channel and storage namespace.
importScripts("vpn/js/service.js");
