import { UiButton, UiField, UiInput, UiStack, UiNote, UiActions, UiAsyncState } from "../../../ui";
import React from "react";
import { t } from "../../../locales/ui";
import { Provider, storedKey, saveProviderKey, watchProviderKeys, errorMessage } from "./provider";
export function useProviderRevision(): number {
  const [revision, setRevision] = React.useState(0);
  React.useEffect(() => watchProviderKeys(() => setRevision(value => value + 1)), []);
  return revision;
}
export function ProviderAccess({ provider }: { provider: Provider }) {
  const [failed, setFailed] = React.useState(false);
  const [key, setKey] = React.useState(""), [status, setStatus] = React.useState(""), [saving, setSaving] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    storedKey(provider).then(value => { if (active) setKey(value); }).catch(error => { if (active) {setFailed(true); setStatus(errorMessage(error));} });
    return () => { active = false; };
  }, [provider]);
  return <UiStack className="provider-access">
    <UiField>{provider === "unsplash" ? t("Unsplash Access Key") : t("GIPHY API key")}
      <UiInput type="password" autoComplete="off" value={key} onChange={event => { setKey(event.target.value); setStatus(""); }} />
    </UiField>
    <UiNote className="info">{t("Saved only on this device; not included in exported settings.")}</UiNote>
    <UiActions>
    <UiButton disabled={saving} onClick={async () => {
      setSaving(true); setFailed(false);
      try { await saveProviderKey(provider, key); setStatus(t("Saved. The background will retry automatically.")); }
      catch (error) { setFailed(true); setStatus(errorMessage(error)); }
      finally { setSaving(false); }
    }}>{t("Save API key")}</UiButton>
    <a href={provider === "unsplash" ? "https://unsplash.com/documentation" : "https://developers.giphy.com/docs/api/"} target="_blank" rel="noopener noreferrer">{t("How to get an API key")}</a>
    </UiActions>
    <UiAsyncState kind={status ? failed ? "error" : "success" : ""} text={status} />
  </UiStack>;
}
export function ProviderStatus({ error, retry }: { error: unknown; retry: () => void }) {
  if (!error) return null;
  return <div className="background-provider-status"><UiAsyncState kind="error" text={errorMessage(error)} retry={t("Try again")} onRetry={retry} /></div>;
}
