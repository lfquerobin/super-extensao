import { UiField, UiInput, UiStack, UiNote, UiActions, UiAsyncState } from "../../../ui";
import React from "react";
import { t } from "../../../locales/ui";
import { Provider, storedKey, saveProviderKey, watchProviderKeys, errorMessage } from "./provider";
export function useProviderRevision(): number {
  const [revision, setRevision] = React.useState(0);
  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const stop = watchProviderKeys(() => {
      clearTimeout(timer);
      timer = setTimeout(() => setRevision(value => value + 1), 300);
    });
    return () => {clearTimeout(timer); stop();};
  }, []);
  return revision;
}
export function ProviderAccess({ provider }: { provider: Provider }) {
  const [failed, setFailed] = React.useState(false), [loadFailed, setLoadFailed] = React.useState(false), [reload, setReload] = React.useState(0);
  const [key, setKey] = React.useState(""), [status, setStatus] = React.useState(""), [loading, setLoading] = React.useState(true), [saving, setSaving] = React.useState(false);
  const generation = React.useRef(0), revision = React.useRef(0);
  React.useEffect(() => {
    const current = ++generation.current;
    setLoading(true); setLoadFailed(false); setSaving(false); setFailed(false); setStatus("");
    storedKey(provider).then(value => {
      if (generation.current === current) {setKey(value); setLoading(false);}
    }).catch(error => {
      if (generation.current === current) {setLoadFailed(true); setFailed(true); setStatus(errorMessage(error)); setLoading(false);}
    });
    return () => { generation.current++; };
  }, [provider, reload]);
  const save = async (value: string) => {
    const current = generation.current, change = ++revision.current;
    setSaving(true); setFailed(false); setStatus(t("Saving…"));
    try {
      await saveProviderKey(provider, value);
      if (generation.current === current && revision.current === change) {setSaving(false); setStatus(t("Saved. The background will retry automatically."));}
    } catch (error) {
      if (generation.current === current && revision.current === change) {setSaving(false); setFailed(true); setStatus(errorMessage(error));}
    }
  };
  return <UiStack className="provider-access">
    <UiField>{provider === "unsplash" ? t("Unsplash Access Key") : t("GIPHY API key")}
      <UiInput type="password" autoComplete="off" value={key} disabled={loading || loadFailed} onChange={event => {
        const value = event.target.value; setKey(value); void save(value);
      }} />
    </UiField>
    <UiNote className="info">{t("Saved only on this device; not included in exported settings.")}</UiNote>
    <UiActions>
      <a href={provider === "unsplash" ? "https://unsplash.com/documentation" : "https://developers.giphy.com/docs/api/"} target="_blank" rel="noopener noreferrer">{t("How to get an API key")}</a>
    </UiActions>
    <UiAsyncState kind={saving ? "loading" : status ? failed ? "error" : "success" : ""} text={status}
      retry={failed ? t("Try again") : undefined} onRetry={() => loadFailed ? setReload(value => value + 1) : void save(key)} />
  </UiStack>;
}
export function ProviderStatus({ error, retry }: { error: unknown; retry: () => void }) {
  if (!error) return null;
  return <div className="background-provider-status"><UiAsyncState kind="error" text={errorMessage(error)} retry={t("Try again")} onRetry={retry} /></div>;
}
