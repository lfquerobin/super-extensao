import {UiActions, UiButton, UiAsyncState} from "../../ui";
import {confirmAction} from "../../../../../ui/confirmation";
import { t } from "../../locales/ui";
import React from "react";
import { UiContext } from "../../contexts/ui";
import { exportStore, importStore, resetStore } from "../../db/action";
import { useKeyPress } from "../../hooks";
import Logo from "../shared/Logo";
import Background from "./Background";
import "./Settings.sass";
import System from "./System";
import Widgets from "./Widgets";

const Settings: React.FC = () => {
  const { toggleSettings } = React.useContext(UiContext);
  const [importError, setImportError] = React.useState("");
  const [importing, setImporting] = React.useState(false);
  const importRevision = React.useRef(0), fileInput = React.useRef<HTMLInputElement>();
  React.useEffect(() => () => {importRevision.current++; fileInput.current?.remove();}, []);

  const handleReset = async () => {
    if (
      await confirmAction(document,
        t("Are you sure you want to delete all of your Tabliss settings? This cannot be undone."),
      )
    )
      resetStore();
  };

  const handleExport = () => {
    const json = exportStore();
    const url = URL.createObjectURL(
      new Blob([json], { type: "application/json" }),
    );

    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    a.href = url;
    a.download = "tabliss.json";
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleImport = () => {
    if (importing) return;
    const revision = ++importRevision.current;
    fileInput.current?.remove();
    const input = document.createElement("input");
    fileInput.current = input;
    input.type = "file"; input.accept = ".json,application/json"; input.style.display = "none";
    input.addEventListener("cancel", () => input.remove(), {once: true});
    input.addEventListener("change", async () => {
      const file = input.files?.[0]; input.remove();
      if (!file || revision !== importRevision.current) return;
      setImporting(true); setImportError("");
      try {
        const contents = await file.text();
        if (revision !== importRevision.current) return;
        importStore(JSON.parse(contents));
      } catch (error) {
        if (revision === importRevision.current) setImportError(t("Invalid import file: ") + String(error instanceof Error ? error.message : error));
      } finally {if (revision === importRevision.current) setImporting(false);}
    }, {once: true});
    document.body.appendChild(input); input.click();
  };

  useKeyPress(toggleSettings, ["Escape"]);

  return (
    <div className="Settings">
      <a onClick={toggleSettings} className="fullscreen" />

      <div className="plane">
        <Logo />

        <Background />

        <Widgets />

        <System />

        <UiActions className="settings-data-actions">
          <UiButton disabled={importing} onClick={handleImport}>{t("Import")}</UiButton>
          <UiButton onClick={handleExport}>{t("export")}</UiButton>
          <UiButton className="ui-button-danger" disabled={importing} onClick={handleReset}>{t("reset")}</UiButton>
        </UiActions>
        <UiAsyncState kind={importError ? "error" : importing ? "loading" : ""} text={importError || t("Loading...")} retry={importError ? t("Try again") : ""} onRetry={handleImport} />

      </div>
    </div>
  );
};

export default React.memo(Settings);
